import type { WebhookEvent } from "livekit-server-sdk";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";

export async function handleRoomFinished(event: WebhookEvent) {
  const room = event.room;
  if (!room?.name) return;

  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, room.name),
  });

  if (!meeting) {
    console.log(`Meeting not found for room: ${room.name}`);
    return;
  }

  console.log(`Room finished for meeting: ${meeting.id}`);

  // Transcription jobs are queued in egress-ended handler when each audio track is ready
  // This handler can be used for any final cleanup or notifications if needed
}
