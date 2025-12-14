"use client";

import "@livekit/components-styles";

import { LiveKitRoom } from "@livekit/components-react";

import { VideoConference } from "./video-conference";

interface RoomProviderProps {
  token: string;
  serverUrl: string;
  meetingId: string;
  meetingTitle: string;
  isHost: boolean;
}

export function RoomProvider({
  token,
  serverUrl,
  meetingId,
  meetingTitle,
  isHost,
}: RoomProviderProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={true}
      audio={true}
      data-lk-theme="default"
      className="h-full"
    >
      <VideoConference
        meetingId={meetingId}
        meetingTitle={meetingTitle}
        isHost={isHost}
      />
    </LiveKitRoom>
  );
}
