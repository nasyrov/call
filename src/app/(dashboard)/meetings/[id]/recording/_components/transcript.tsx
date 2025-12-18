"use client";

import { Loader2 } from "lucide-react";

import type { TranscriptionData } from "~/server/db/schema/recordings";

interface AudioTrackWithTranscription {
  id: string;
  participantName: string;
  transcription: TranscriptionData | null;
}

interface TranscriptProps {
  audioTracks: AudioTrackWithTranscription[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function Transcript({ audioTracks }: TranscriptProps) {
  // Collect all segments with speaker info
  const allSegments: Array<{
    speakerName: string;
    text: string;
    start: number;
    end: number;
  }> = [];

  let hasProcessing = false;
  let hasFailed = false;
  let hasPending = false;

  for (const track of audioTracks) {
    if (!track.transcription) {
      hasPending = true;
      continue;
    }

    if (track.transcription.status === "processing") {
      hasProcessing = true;
    } else if (track.transcription.status === "failed") {
      hasFailed = true;
    } else if (track.transcription.status === "completed") {
      for (const segment of track.transcription.segments) {
        allSegments.push({
          speakerName: track.participantName,
          text: segment.text,
          start: segment.start,
          end: segment.end,
        });
      }
    }
  }

  // Sort by start time
  allSegments.sort((a, b) => a.start - b.start);

  if (audioTracks.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">No audio tracks recorded</p>
      </div>
    );
  }

  if (hasProcessing || hasPending) {
    return (
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-muted-foreground">
            Transcription in progress...
          </span>
        </div>
        {allSegments.length > 0 && (
          <div className="mt-4 space-y-4">
            {allSegments.map((segment, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  {segment.speakerName && (
                    <span className="font-medium">{segment.speakerName}</span>
                  )}
                  {segment.start > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {formatTime(segment.start)}
                    </span>
                  )}
                </div>
                <p className="text-sm">{segment.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (hasFailed && allSegments.length === 0) {
    return (
      <div className="border-destructive/20 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">Transcription failed</p>
      </div>
    );
  }

  if (allSegments.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">No speech detected</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 font-semibold">Transcript</h3>
      <div className="space-y-4">
        {allSegments.map((segment, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              {segment.speakerName && (
                <span className="font-medium">{segment.speakerName}</span>
              )}
              {segment.start > 0 && (
                <span className="text-muted-foreground text-xs">
                  {formatTime(segment.start)}
                </span>
              )}
            </div>
            <p className="text-sm">{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
