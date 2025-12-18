"use server";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  meetings,
  participantAudioTracks,
  recordings,
} from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const deleteRecordingSchema = z.object({
  meetingId: z.string().uuid(),
});

export const deleteRecording = authenticatedProcedure
  .input(deleteRecordingSchema)
  .handler(async ({ ctx, input }) => {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, input.meetingId),
    });

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.ownerId !== ctx.user.id) {
      throw new Error("Not authorized to delete this recording");
    }

    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.meetingId, input.meetingId),
    });

    if (!recording) {
      throw new Error("Recording not found");
    }

    // Get audio tracks
    const audioTracks = await db.query.participantAudioTracks.findMany({
      where: eq(participantAudioTracks.recordingId, recording.id),
    });

    // Delete all files from S3
    const filesToDelete = [
      recording.filePath,
      ...audioTracks.map((t) => t.filePath),
    ].filter(Boolean);

    for (const filePath of filesToDelete) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: filePath!,
          }),
        );
      } catch (error) {
        console.error(`Failed to delete file from S3: ${filePath}`, error);
      }
    }

    // Delete recording (cascade deletes audio tracks)
    await db.delete(recordings).where(eq(recordings.id, recording.id));

    return { success: true };
  });
