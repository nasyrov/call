"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { DeviceSetup } from "./_components/device-setup";

export default function LobbyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = (settings: {
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => {
    setIsJoining(true);
    // Store settings in session storage for the room page to use
    sessionStorage.setItem(
      `meeting-${params.id}-settings`,
      JSON.stringify(settings),
    );
    router.push(`/meetings/${params.id}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold">Ready to join?</h1>
        <p className="text-muted-foreground">
          Set up your camera and microphone before joining
        </p>
      </div>
      <DeviceSetup onJoin={handleJoin} isJoining={isJoining} />
    </div>
  );
}
