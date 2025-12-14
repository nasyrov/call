"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import {
  recordings,
  transcriptions,
  transcriptSegments,
} from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

const recordingIdSchema = z.object({
  recordingId: z.string().uuid(),
});

export const getTranscript = authenticatedProcedure
  .input(recordingIdSchema)
  .handler(async ({ ctx, input }) => {
    // Get the recording to find the meeting ID
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
      throw new Error("Not authorized to view this transcript");
    }

    // Get the transcription for this meeting
    const transcription = await db.query.transcriptions.findFirst({
      where: eq(transcriptions.meetingId, recording.meetingId),
    });

    if (!transcription) {
      return {
        status: "not_found" as const,
        segments: [],
      };
    }

    // Get all segments ordered by start time
    const segments = await db.query.transcriptSegments.findMany({
      where: eq(transcriptSegments.transcriptionId, transcription.id),
      orderBy: (segments, { asc }) => [asc(segments.startTime)],
    });

    return {
      status: transcription.status,
      error: transcription.error,
      segments: segments.map((segment) => ({
        id: segment.id,
        speakerName: segment.speakerName,
        content: segment.content,
        startTime: segment.startTime,
        endTime: segment.endTime,
      })),
    };
  });
