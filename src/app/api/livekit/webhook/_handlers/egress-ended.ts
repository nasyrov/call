import type { WebhookEvent } from "livekit-server-sdk";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { participantAudioTracks, recordings } from "~/server/db/schema";
import { queueTranscriptionJob } from "~/server/queue/transcription";

export async function handleEgressEnded(event: WebhookEvent) {
  const egress = event.egressInfo;
  if (!egress) return;

  const fileResult = egress.fileResults?.[0];
  const isError = !!egress.error;

  if (isError) {
    console.error(`Egress failed: ${egress.egressId}`, egress.error);
  }

  const updateData = {
    status: isError ? ("failed" as const) : ("ready" as const),
    filePath: fileResult?.filename ?? null,
    fileSize: fileResult?.size ? Number(fileResult.size) : null,
    duration: fileResult?.duration
      ? Math.floor(Number(fileResult.duration) / 1_000_000_000)
      : null,
  };

  // Try to update recording (room composite)
  const recording = await db.query.recordings.findFirst({
    where: eq(recordings.egressId, egress.egressId),
    with: {
      meeting: true,
    },
  });

  if (recording) {
    await db
      .update(recordings)
      .set(updateData)
      .where(eq(recordings.id, recording.id));

    console.log(
      `Updated room composite recording: ${recording.id} (status: ${updateData.status})`,
    );
    return;
  }

  // Try to update participant audio track
  const audioTrack = await db.query.participantAudioTracks.findFirst({
    where: eq(participantAudioTracks.egressId, egress.egressId),
    with: {
      recording: {
        with: {
          meeting: true,
        },
      },
    },
  });

  if (audioTrack) {
    await db
      .update(participantAudioTracks)
      .set(updateData)
      .where(eq(participantAudioTracks.id, audioTrack.id));

    console.log(
      `Updated audio track: ${audioTrack.id} (status: ${updateData.status})`,
    );

    // If audio track is ready, queue transcription
    if (!isError && fileResult?.filename) {
      try {
        await queueTranscriptionJob({
          audioTrackId: audioTrack.id,
          meetingId: audioTrack.recording.meetingId,
          recordingId: audioTrack.recordingId,
          participantIdentity: audioTrack.participantIdentity,
          participantName: audioTrack.participantName,
          filePath: fileResult.filename,
        });

        console.log(
          `Queued transcription job for audio track: ${audioTrack.id}`,
        );
      } catch (error) {
        console.error(
          `Failed to queue transcription for ${audioTrack.id}:`,
          error,
        );
      }
    }
  }
}
