"use server";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

const recordingIdSchema = z.object({
  recordingId: z.string().uuid(),
});

export const getRecordingUrl = authenticatedProcedure
  .input(recordingIdSchema)
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
      throw new Error("Not authorized to view this recording");
    }

    if (recording.status !== "ready" || !recording.filePath) {
      throw new Error("Recording is not ready");
    }

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: recording.filePath,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      url: signedUrl,
      duration: recording.duration,
      title: recording.meeting.title,
    };
  });
