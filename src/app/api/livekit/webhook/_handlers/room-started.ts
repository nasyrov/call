import type { WebhookEvent } from "livekit-server-sdk";
import { eq } from "drizzle-orm";
import {
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from "livekit-server-sdk";

import { env } from "~/env";
import { db } from "~/server/db";
import { meetings, recordings } from "~/server/db/schema";
import { egressClient } from "~/server/livekit";

export async function handleRoomStarted(event: WebhookEvent) {
  const room = event.room;
  if (!room?.name) return;

  // Check if meeting exists
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, room.name),
  });

  if (!meeting) {
    console.log(`Meeting not found for room: ${room.name}`);
    return;
  }

  // Check if recording already exists for this meeting
  const existingRecording = await db.query.recordings.findFirst({
    where: eq(recordings.meetingId, meeting.id),
  });

  if (existingRecording) {
    console.log(`Recording already exists for meeting: ${meeting.id}`);
    return;
  }

  // Start room composite egress automatically
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
    output: { case: "s3", value: s3Upload },
    fileType: EncodedFileType.MP4,
  });

  try {
    const egress = await egressClient.startRoomCompositeEgress(meeting.id, {
      file: fileOutput,
    });

    await db.insert(recordings).values({
      meetingId: meeting.id,
      egressId: egress.egressId,
      status: "recording",
    });

    console.log(
      `Auto-started room composite recording for meeting: ${meeting.id}`,
    );
  } catch (error) {
    console.error(
      `Failed to start recording for meeting ${meeting.id}:`,
      error,
    );
  }
}
