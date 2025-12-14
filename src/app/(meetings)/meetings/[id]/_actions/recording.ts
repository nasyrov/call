"use server";

import { eq } from "drizzle-orm";
import {
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from "livekit-server-sdk";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import { meetings, recordings } from "~/server/db/schema";
import { egressClient } from "~/server/livekit";
import { authenticatedProcedure } from "~/server/procedures";

const meetingIdSchema = z.object({
  meetingId: z.string().uuid(),
});

export const startRecording = authenticatedProcedure
  .input(meetingIdSchema)
  .handler(async ({ ctx, input }) => {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, input.meetingId),
    });

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.ownerId !== ctx.user.id) {
      throw new Error("Only the host can start recording");
    }

    // Configure S3 output (use internal endpoint for Docker network access)
    const s3Upload = new S3Upload({
      accessKey: env.S3_ACCESS_KEY,
      secret: env.S3_SECRET_KEY,
      bucket: env.S3_BUCKET,
      endpoint: env.S3_INTERNAL_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: true,
    });

    const fileOutput = new EncodedFileOutput({
      filepath: `recordings/${meeting.id}/{room_name}-{time}.mp4`,
      output: {
        case: "s3",
        value: s3Upload,
      },
      fileType: EncodedFileType.MP4,
    });

    // Start room composite egress
    const egress = await egressClient.startRoomCompositeEgress(meeting.id, {
      file: fileOutput,
    });

    // Store recording metadata
    await db.insert(recordings).values({
      meetingId: meeting.id,
      egressId: egress.egressId,
      status: "recording",
    });

    return { egressId: egress.egressId };
  });

export const stopRecording = authenticatedProcedure
  .input(meetingIdSchema)
  .handler(async ({ ctx, input }) => {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, input.meetingId),
    });

    if (!meeting || meeting.ownerId !== ctx.user.id) {
      throw new Error("Not authorized");
    }

    // Find active recording
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.meetingId, input.meetingId),
      orderBy: (recordings, { desc }) => [desc(recordings.createdAt)],
    });

    if (recording?.status !== "recording") {
      throw new Error("No active recording found");
    }

    // Stop egress
    await egressClient.stopEgress(recording.egressId);

    // Update recording status
    await db
      .update(recordings)
      .set({ status: "processing" })
      .where(eq(recordings.id, recording.id));

    return { success: true };
  });
