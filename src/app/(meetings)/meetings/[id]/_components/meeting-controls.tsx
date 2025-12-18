"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useDisconnectButton,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import {
  Check,
  Copy,
  LogOut,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { useServerActionMutation } from "~/hooks/use-server-action";
import { endMeeting } from "../_actions/end-meeting";

interface MeetingControlsProps {
  meetingId: string;
  isHost: boolean;
}

export function MeetingControls({ meetingId, isHost }: MeetingControlsProps) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { buttonProps: disconnectProps } = useDisconnectButton({});

  const [copied, setCopied] = useState(false);

  const isMicEnabled = localParticipant?.isMicrophoneEnabled ?? false;
  const isCameraEnabled = localParticipant?.isCameraEnabled ?? false;
  const isScreenSharing = localParticipant?.isScreenShareEnabled ?? false;

  const { mutateAsync: endMeetingMutation } = useServerActionMutation(
    endMeeting,
    {
      onError: (error) => {
        toast.error(error.message ?? "Failed to end meeting");
      },
    },
  );

  const toggleMic = async () => {
    try {
      await localParticipant?.setMicrophoneEnabled(!isMicEnabled);
    } catch {
      toast.error("No microphone found");
    }
  };

  const toggleCamera = async () => {
    try {
      await localParticipant?.setCameraEnabled(!isCameraEnabled);
    } catch {
      toast.error("No camera found");
    }
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant?.setScreenShareEnabled(!isScreenSharing);
    } catch {
      toast.error("Failed to share screen");
    }
  };

  const handleLeave = () => {
    disconnectProps.onClick?.({} as React.MouseEvent<HTMLButtonElement>);
    router.push("/");
  };

  const handleEndMeeting = async () => {
    await endMeetingMutation({ meetingId });
    disconnectProps.onClick?.({} as React.MouseEvent<HTMLButtonElement>);
    router.push("/");
  };

  const copyMeetingLink = async () => {
    const link = `${window.location.origin}/meetings/${room.name}/lobby`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Meeting link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center gap-2 border-t p-4">
      <Button
        variant={isMicEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={() => void toggleMic()}
        title={isMicEnabled ? "Mute" : "Unmute"}
      >
        {isMicEnabled ? (
          <Mic className="size-5" />
        ) : (
          <MicOff className="size-5" />
        )}
      </Button>

      <Button
        variant={isCameraEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={() => void toggleCamera()}
        title={isCameraEnabled ? "Stop video" : "Start video"}
      >
        {isCameraEnabled ? (
          <Video className="size-5" />
        ) : (
          <VideoOff className="size-5" />
        )}
      </Button>

      <Button
        variant={isScreenSharing ? "default" : "secondary"}
        size="icon"
        onClick={() => void toggleScreenShare()}
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
      >
        <Monitor className="size-5" />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={() => void copyMeetingLink()}
        title="Copy meeting link"
      >
        {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleLeave}
        title="Leave meeting"
      >
        <LogOut className="size-5" />
      </Button>

      {isHost && (
        <Button
          variant="destructive"
          size="icon"
          onClick={() => void handleEndMeeting()}
          title="End meeting for everyone"
        >
          <PhoneOff className="size-5" />
        </Button>
      )}
    </div>
  );
}
