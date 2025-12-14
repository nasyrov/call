"use client";

import {
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

import { MeetingControls } from "./meeting-controls";

interface VideoConferenceProps {
  meetingId: string;
  meetingTitle: string;
  isHost: boolean;
}

export function VideoConference({
  meetingId,
  meetingTitle,
  isHost,
}: VideoConferenceProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-lg font-semibold">{meetingTitle}</h1>
      </div>

      <div className="flex-1 p-4">
        <GridLayout tracks={tracks} className="h-full">
          <ParticipantTile />
        </GridLayout>
      </div>

      <RoomAudioRenderer />

      <MeetingControls meetingId={meetingId} isHost={isHost} />
    </div>
  );
}
