import type { WebhookEvent } from "livekit-server-sdk";
import { and, eq } from "drizzle-orm";
import { EncodedFileOutput, EncodedFileType, S3Upload } from "livekit-server-sdk";

import { env } from "~/env";
import { db } from "~/server/db";
import { participantAudioTracks, recordings, users } from "~/server/db/schema";
import { egressClient } from "~/server/livekit";

export async function handleParticipantJoined(event: WebhookEvent) {
  const room = event.room;
  const participant = event.participant;

  console.log("participant_joined event:", {
    room: room?.name,
    participantIdentity: participant?.identity,
    participantName: participant?.name,
  });

  if (!room?.name || !participant?.identity) return;

  // Check if recording exists for this meeting
  const recording = await db.query.recordings.findFirst({
    where: eq(recordings.meetingId, room.name),
  });

  if (!recording) {
    console.log(`No recording found for meeting: ${room.name}, skipping participant egress`);
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
      `Audio track already exists for participant: ${participant.identity}, skipping`,
    );
    return;
  }

  // Look up participant name from database if not provided
  let participantName = participant.name || null;
  if (!participantName) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, participant.identity),
      columns: { name: true },
    });
    participantName = user?.name ?? participant.identity;
  }

  // Start participant egress with OGG audio output
  const s3Upload = new S3Upload({
    accessKey: env.S3_ACCESS_KEY,
    secret: env.S3_SECRET_KEY,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_INTERNAL_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
  });

  const fileOutput = new EncodedFileOutput({
    filepath: `recordings/${room.name}/audio/{publisher_identity}-{time}.ogg`,
    output: { case: "s3", value: s3Upload },
    fileType: EncodedFileType.OGG,
  });

  try {
    const startTime = Date.now();
    const egress = await egressClient.startParticipantEgress(
      room.name,
      participant.identity,
      { file: fileOutput },
    );
    console.log(
      `Started participant egress for: ${participant.identity} (took ${Date.now() - startTime}ms)`,
    );

    // Save audio track record
    await db.insert(participantAudioTracks).values({
      recordingId: recording.id,
      participantIdentity: participant.identity,
      participantName,
      trackSid: null, // Participant egress doesn't target a specific track
      egressId: egress.egressId,
      status: "recording",
    });
  } catch (error) {
    console.error(
      `Failed to start participant egress for ${participant.identity}:`,
      error,
    );
  }
}
