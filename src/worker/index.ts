import type { Readable } from "stream";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";

import type { TranscriptionData } from "~/server/db/schema/recordings";
import type { TranscriptionJobData } from "~/server/queue/transcription";
import { env } from "~/env";
import { db } from "~/server/db";
import { participantAudioTracks } from "~/server/db/schema";
import { transcribeAudio } from "~/server/speechkit";

const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as ArrayBuffer));
  }
  return Buffer.concat(chunks);
}

async function processTranscription(job: TranscriptionJobData): Promise<void> {
  const { audioTrackId, filePath } = job;

  console.log(`Processing transcription for audio track: ${audioTrackId}`);

  // Update status to processing
  await db
    .update(participantAudioTracks)
    .set({
      transcription: {
        status: "processing",
        segments: [],
      } satisfies TranscriptionData,
    })
    .where(eq(participantAudioTracks.id, audioTrackId));

  try {
    // Download audio file from S3
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: filePath,
    });

    const response = await s3Client.send(command);
    const audioBuffer = await streamToBuffer(response.Body as Readable);

    console.log(
      `Downloaded audio file: ${filePath} (${audioBuffer.length} bytes)`,
    );

    // Transcribe audio
    const result = await transcribeAudio(audioBuffer);

    console.log(`Transcription completed: ${result.segments.length} segments`);

    // Update database with transcription result
    await db
      .update(participantAudioTracks)
      .set({
        transcription: {
          status: "completed",
          segments: result.segments,
        } satisfies TranscriptionData,
      })
      .where(eq(participantAudioTracks.id, audioTrackId));

    console.log(`Saved transcription for audio track: ${audioTrackId}`);
  } catch (error) {
    console.error(`Transcription failed for ${audioTrackId}:`, error);

    // Update status to failed
    await db
      .update(participantAudioTracks)
      .set({
        transcription: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          segments: [],
        } satisfies TranscriptionData,
      })
      .where(eq(participantAudioTracks.id, audioTrackId));

    throw error;
  }
}

const worker = new Worker<TranscriptionJobData>(
  "transcription",
  async (job) => {
    await processTranscription(job.data);
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log("Transcription worker started");
