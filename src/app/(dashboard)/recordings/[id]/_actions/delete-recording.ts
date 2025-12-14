"use server";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import { recordings } from "~/server/db/schema";
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
  recordingId: z.string().uuid(),
});

export const deleteRecording = authenticatedProcedure
  .input(deleteRecordingSchema)
  .handler(async ({ ctx, input }) => {
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, input.recordingId),
      with: {
        meeting: true,
      },
    });

    if (!recording) {
      throw new Error("Recording not found");
    }

    if (recording.meeting.ownerId !== ctx.user.id) {
      throw new Error("Not authorized to delete this recording");
    }

    // Delete file from S3 if it exists
    if (recording.filePath) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: recording.filePath,
          }),
        );
      } catch (error) {
        console.error("Failed to delete file from S3:", error);
      }
    }

    // Delete recording from database
    await db.delete(recordings).where(eq(recordings.id, input.recordingId));

    return { success: true };
  });
