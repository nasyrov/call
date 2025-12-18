"use server";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import {
  meetingParticipants,
  promptRuns,
  recordings,
} from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

const getPromptRunsSchema = z.object({
  meetingId: z.string().uuid(),
});

export const getPromptRuns = authenticatedProcedure
  .input(getPromptRunsSchema)
  .handler(async ({ ctx, input }) => {
    // Check if user is a participant of the meeting
    const participant = await db.query.meetingParticipants.findFirst({
      where: and(
        eq(meetingParticipants.meetingId, input.meetingId),
        eq(meetingParticipants.userId, ctx.user.id),
      ),
    });

    if (!participant) {
      throw new Error("Not authorized to access this meeting");
    }

    // Get the recording
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.meetingId, input.meetingId),
    });

    if (!recording) {
      return [];
    }

    // Get all prompt runs for this recording
    const runs = await db.query.promptRuns.findMany({
      where: eq(promptRuns.recordingId, recording.id),
      orderBy: [desc(promptRuns.createdAt)],
    });

    return runs.map((run) => ({
      id: run.id,
      promptId: run.promptId,
      promptTitle: run.promptTitle,
      participantName: run.participantName,
      result: run.result,
      error: run.error,
      status: run.status,
      createdAt: run.createdAt,
    }));
  });
