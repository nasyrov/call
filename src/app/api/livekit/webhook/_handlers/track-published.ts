import type { WebhookEvent } from "livekit-server-sdk";
import { and, eq } from "drizzle-orm";
import { DirectFileOutput, S3Upload, TrackSource } from "livekit-server-sdk";

import { env } from "~/env";
import { db } from "~/server/db";
import { participantAudioTracks, recordings, users } from "~/server/db/schema";
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

  // START EGRESS IMMEDIATELY - before any DB queries
  // The track may disappear quickly, so we need to start recording ASAP
  const filepath = `recordings/${room.name}/audio/{publisher_identity}-{time}.ogg`;

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

  let egress;
  try {
    egress = await egressClient.startTrackEgress(
      room.name,
      fileOutput,
      track.sid,
    );
    console.log(
      `Started audio track egress for participant: ${participant.identity}`,
    );
  } catch (error) {
    console.error(
      `Failed to start audio track egress for ${participant.identity}:`,
      error,
    );
    return;
  }

  // Now do DB operations (egress is already running)
  const recording = await db.query.recordings.findFirst({
    where: eq(recordings.meetingId, room.name),
  });

  if (!recording) {
    console.log(
      `No recording found for meeting: ${room.name}, stopping egress`,
    );
    await egressClient.stopEgress(egress.egressId).catch(() => undefined);
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
      `Audio track already exists for participant: ${participant.identity}, stopping duplicate egress`,
    );
    await egressClient.stopEgress(egress.egressId).catch(() => undefined);
    return;
  }

  // Look up participant name from database if not provided by webhook
  let participantName = participant.name || null;
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
}
