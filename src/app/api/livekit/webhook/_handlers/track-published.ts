import type { WebhookEvent } from "livekit-server-sdk";
import { and, eq } from "drizzle-orm";
import { DirectFileOutput, S3Upload, TrackSource } from "livekit-server-sdk";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  meetings,
  participantAudioTracks,
  recordings,
  users,
} from "~/server/db/schema";
import { egressClient } from "~/server/livekit";

export async function handleTrackPublished(event: WebhookEvent) {
  const room = event.room;
  const participant = event.participant;
  const track = event.track;

  console.log("track_published event:", {
    room: room?.name,
    participantIdentity: participant?.identity,
    participantName: participant?.name,
    trackSid: track?.sid,
    trackSource: track?.source,
  });

  if (!room?.name || !participant || !track) return;

  // Only process audio tracks from microphone
  if (track.source !== TrackSource.MICROPHONE) {
    console.log(`Skipping non-microphone track: ${track.source}`);
    return;
  }

  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, room.name),
  });

  if (!meeting) {
    console.log(`Meeting not found for room: ${room.name}`);
    return;
  }

  // Find the room composite recording
  const recording = await db.query.recordings.findFirst({
    where: eq(recordings.meetingId, meeting.id),
  });

  if (!recording) {
    console.log(`No recording found for meeting: ${meeting.id}`);
    return;
  }

  // Check if we already have an audio track for this participant
  const existingTrack = await db.query.participantAudioTracks.findFirst({
    where: and(
      eq(participantAudioTracks.recordingId, recording.id),
      eq(participantAudioTracks.participantIdentity, participant.identity),
    ),
  });

  if (existingTrack) {
    console.log(
      `Audio track already exists for participant: ${participant.identity}`,
    );
    return;
  }

  // Start track egress for this audio track
  const filepath = `recordings/${meeting.id}/audio/{publisher_identity}-{time}.ogg`;

  const s3Upload = new S3Upload({
    accessKey: env.S3_ACCESS_KEY,
    secret: env.S3_SECRET_KEY,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_INTERNAL_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
  });

  const fileOutput = new DirectFileOutput({
    filepath,
    output: { case: "s3", value: s3Upload },
  });

  try {
    const egress = await egressClient.startTrackEgress(
      room.name,
      fileOutput,
      track.sid,
    );

    // Look up participant name from database if not provided by webhook
    let participantName = participant.name;
    if (!participantName) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, participant.identity),
        columns: { name: true },
      });
      participantName = user?.name ?? participant.identity;
    }

    await db.insert(participantAudioTracks).values({
      recordingId: recording.id,
      participantIdentity: participant.identity,
      participantName,
      trackSid: track.sid,
      egressId: egress.egressId,
      status: "recording",
    });

    console.log(
      `Started audio track egress for participant: ${participant.identity}`,
    );
  } catch (error) {
    console.error(
      `Failed to start audio track egress for ${participant.identity}:`,
      error,
    );
  }
}
