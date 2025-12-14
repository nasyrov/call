import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { meetingParticipants, meetings } from "~/server/db/schema";

export default async function PersonalRoomPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if there's an active personal room meeting
  let meeting = await db.query.meetings.findFirst({
    where: and(
      eq(meetings.ownerId, session.user.id),
      eq(meetings.isPersonalRoom, true),
      eq(meetings.status, "active"),
    ),
  });

  // If no active meeting, create one
  if (!meeting) {
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        title: `${session.user.name}'s Personal Room`,
        ownerId: session.user.id,
        isPersonalRoom: true,
        status: "active",
        startedAt: new Date(),
      })
      .returning();

    if (!newMeeting) {
      throw new Error("Failed to create personal room");
    }

    await db.insert(meetingParticipants).values({
      meetingId: newMeeting.id,
      userId: session.user.id,
      role: "host",
      joinedAt: new Date(),
    });

    meeting = newMeeting;
  }

  // Redirect to the lobby
  redirect(`/meetings/${meeting.id}/lobby`);
}
