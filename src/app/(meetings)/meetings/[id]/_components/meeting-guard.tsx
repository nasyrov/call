"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { RoomProvider } from "./room-provider";

interface MeetingGuardProps {
  token: string;
  serverUrl: string;
  meetingId: string;
  meetingTitle: string;
  isHost: boolean;
}

export function MeetingGuard({
  token,
  serverUrl,
  meetingId,
  meetingTitle,
  isHost,
}: MeetingGuardProps) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const settings = sessionStorage.getItem(`meeting-${params.id}-settings`);

    if (!settings) {
      // Redirect to lobby if device settings haven't been configured
      router.replace(`/meetings/${params.id}/lobby`);
    } else {
      setIsReady(true);
    }
  }, [params.id, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <RoomProvider
      token={token}
      serverUrl={serverUrl}
      meetingId={meetingId}
      meetingTitle={meetingTitle}
      isHost={isHost}
    />
  );
}
