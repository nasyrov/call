"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Mic, MicOff, Video, VideoOff } from "lucide-react";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface DeviceSetupProps {
  onJoin: (settings: { audioEnabled: boolean; videoEnabled: boolean }) => void;
  isJoining: boolean;
}

export function DeviceSetup({ onJoin, isJoining }: DeviceSetupProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [hasAudio, setHasAudio] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    async function getDevices() {
      let mediaStream: MediaStream | null = null;

      // Try to get both audio and video
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
      } catch {
        // Try audio only
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          setHasVideo(false);
          setVideoEnabled(false);
        } catch {
          // Try video only
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: true,
            });
            setHasAudio(false);
            setAudioEnabled(false);
          } catch {
            // No devices available or permission denied
            setHasAudio(false);
            setHasVideo(false);
            setAudioEnabled(false);
            setVideoEnabled(false);
            setPermissionDenied(true);
          }
        }
      }

      if (mediaStream) {
        // Get device list after permissions granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        const videoInputs = devices.filter((d) => d.kind === "videoinput");

        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);

        if (audioInputs[0]) setSelectedAudioDevice(audioInputs[0].deviceId);
        if (videoInputs[0]) setSelectedVideoDevice(videoInputs[0].deviceId);

        streamRef.current = mediaStream;
        setStream(mediaStream);
      }
    }

    void getDevices();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
      });
    }
  }, [audioEnabled, stream]);

  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = videoEnabled;
      });
    }
  }, [videoEnabled, stream]);

  const handleJoin = () => {
    // Stop preview stream before joining
    stream?.getTracks().forEach((track) => track.stop());
    onJoin({ audioEnabled, videoEnabled });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {permissionDenied && (
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="size-4" />
          <AlertDescription>
            No camera or microphone found. You can still join the meeting but
            won&apos;t be able to share audio or video.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full max-w-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-muted relative aspect-video">
            {videoEnabled && hasVideo ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <VideoOff className="text-muted-foreground size-16" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          variant={audioEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={() => setAudioEnabled(!audioEnabled)}
          disabled={!hasAudio}
        >
          {audioEnabled ? (
            <Mic className="mr-2 size-5" />
          ) : (
            <MicOff className="mr-2 size-5" />
          )}
          {audioEnabled ? "Mute" : "Unmute"}
        </Button>

        <Button
          variant={videoEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={() => setVideoEnabled(!videoEnabled)}
          disabled={!hasVideo}
        >
          {videoEnabled ? (
            <Video className="mr-2 size-5" />
          ) : (
            <VideoOff className="mr-2 size-5" />
          )}
          {videoEnabled ? "Stop Video" : "Start Video"}
        </Button>
      </div>

      {(hasAudio || hasVideo) && (
        <div className="flex flex-wrap justify-center gap-4">
          {hasAudio && (
            <Select
              value={selectedAudioDevice}
              onValueChange={setSelectedAudioDevice}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {audioDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label ||
                      `Microphone ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasVideo && (
            <Select
              value={selectedVideoDevice}
              onValueChange={setSelectedVideoDevice}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {videoDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <Button size="lg" onClick={handleJoin} disabled={isJoining}>
        {isJoining ? "Joining..." : "Join Meeting"}
      </Button>
    </div>
  );
}
