import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { env } from "~/env";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";
import { generateToken } from "~/server/livekit";
import { MeetingGuard } from "./_components/meeting-guard";

export const metadata: Metadata = {
  title: "Meeting",
};

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, id),
  });

  if (!meeting) {
    notFound();
  }

  if (meeting.status === "ended" || meeting.status === "cancelled") {
    redirect("/");
  }

  const isHost = meeting.ownerId === session.user.id;

  // Generate token server-side
  const token = await generateToken({
    roomName: meeting.id,
    participantIdentity: session.user.id,
    participantName: session.user.name,
    isHost,
  });

  return (
    <MeetingGuard
      token={token}
      serverUrl={env.NEXT_PUBLIC_LIVEKIT_URL}
      meetingId={meeting.id}
      meetingTitle={meeting.title}
      isHost={isHost}
    />
  );
}
