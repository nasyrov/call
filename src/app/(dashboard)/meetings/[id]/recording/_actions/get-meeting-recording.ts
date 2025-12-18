"use server";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  meetingParticipants,
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

const getMeetingRecordingSchema = z.object({
  meetingId: z.string().uuid(),
});

export const getMeetingRecording = authenticatedProcedure
  .input(getMeetingRecordingSchema)
  .handler(async ({ ctx, input }) => {
    // Check if user is a participant of the meeting
    const participant = await db.query.meetingParticipants.findFirst({
      where: and(
        eq(meetingParticipants.meetingId, input.meetingId),
        eq(meetingParticipants.userId, ctx.user.id),
      ),
    });

    if (!participant) {
      throw new Error("Not authorized to view this meeting");
    }

    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, input.meetingId),
    });

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Find room composite recording
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.meetingId, input.meetingId),
    });

    // Get audio tracks with transcriptions
    const audioTracks = recording
      ? await db.query.participantAudioTracks.findMany({
          where: eq(participantAudioTracks.recordingId, recording.id),
          orderBy: (tracks, { asc }) => [asc(tracks.createdAt)],
        })
      : [];

    if (!recording) {
      return {
        title: meeting.title,
        endedAt: meeting.endedAt,
        recording: null,
        recordingStatus: null,
        audioTracks,
      };
    }

    if (recording.status !== "ready" || !recording.filePath) {
      return {
        title: meeting.title,
        endedAt: meeting.endedAt,
        recording: null,
        recordingStatus: recording.status,
        audioTracks,
      };
    }

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: recording.filePath,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return {
      title: meeting.title,
      endedAt: meeting.endedAt,
      recording: {
        id: recording.id,
        url: signedUrl,
        duration: recording.duration,
      },
      recordingStatus: recording.status,
      audioTracks,
    };
  });
