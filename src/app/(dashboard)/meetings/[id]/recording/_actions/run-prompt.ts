"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import {
  meetingParticipants,
  participantAudioTracks,
  promptRuns,
  recordings,
} from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";
import { getPromptById } from "~/server/prompts";
import { chat } from "~/server/yandex-gpt";

const runPromptSchema = z.object({
  meetingId: z.string().uuid(),
  audioTrackId: z.string().uuid(),
  promptId: z.string(),
});

export const runPrompt = authenticatedProcedure
  .input(runPromptSchema)
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
      throw new Error("Recording not found");
    }

    // Get the audio track with transcription
    const audioTrack = await db.query.participantAudioTracks.findFirst({
      where: and(
        eq(participantAudioTracks.id, input.audioTrackId),
        eq(participantAudioTracks.recordingId, recording.id),
      ),
    });

    if (!audioTrack) {
      throw new Error("Audio track not found");
    }

    if (audioTrack.transcription?.status !== "completed") {
      throw new Error("Transcription not available");
    }

    // Get the prompt
    const prompt = getPromptById(input.promptId);
    if (!prompt) {
      throw new Error("Prompt not found");
    }

    // Build transcript text from segments
    const transcriptText = audioTrack.transcription.segments
      .map((s) => s.text)
      .join(" ");

    if (!transcriptText.trim()) {
      throw new Error("No transcript content available");
    }

    // Create the prompt run record
    const [promptRun] = await db
      .insert(promptRuns)
      .values({
        recordingId: recording.id,
        audioTrackId: audioTrack.id,
        userId: ctx.user.id,
        promptId: prompt.id,
        promptTitle: prompt.title,
        promptText: prompt.prompt,
        participantName: audioTrack.participantName,
        transcript: transcriptText,
        status: "processing",
      })
      .returning();

    if (!promptRun) {
      throw new Error("Failed to create prompt run");
    }

    try {
      // Call Yandex GPT
      const result = await chat(
        prompt.prompt,
        `Here is the transcript:\n\n${transcriptText}`,
        { temperature: 0.3, maxTokens: 2000 },
      );

      // Update the prompt run with the result
      await db
        .update(promptRuns)
        .set({
          result,
          status: "completed",
        })
        .where(eq(promptRuns.id, promptRun.id));

      return {
        id: promptRun.id,
        result,
        status: "completed" as const,
      };
    } catch (error) {
      // Update the prompt run with the error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await db
        .update(promptRuns)
        .set({
          error: errorMessage,
          status: "failed",
        })
        .where(eq(promptRuns.id, promptRun.id));

      throw new Error(`Failed to run prompt: ${errorMessage}`);
    }
  });
