"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Clock, Loader2 } from "lucide-react";

import type { TranscriptionData } from "~/server/db/schema/recordings";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";

interface AudioTrack {
  id: string;
  participantName: string;
  transcription: TranscriptionData | null;
}

interface TranscriptsListProps {
  audioTracks: AudioTrack[];
}

interface TimelineSegment {
  participantName: string;
  text: string;
  start: number;
  end: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TranscriptsList({ audioTracks }: TranscriptsListProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { timeline, pendingTracks, processingTracks } = useMemo(() => {
    const segments: TimelineSegment[] = [];
    const pending: string[] = [];
    const processing: string[] = [];

    for (const track of audioTracks) {
      const status = track.transcription?.status;

      if (!status || status === "pending") {
        pending.push(track.participantName);
      } else if (status === "processing") {
        processing.push(track.participantName);
      } else if (status === "completed" && track.transcription?.segments) {
        for (const segment of track.transcription.segments) {
          segments.push({
            participantName: track.participantName,
            text: segment.text,
            start: segment.start,
            end: segment.end,
          });
        }
      }
    }

    segments.sort((a, b) => a.start - b.start);

    return {
      timeline: segments,
      pendingTracks: pending,
      processingTracks: processing,
    };
  }, [audioTracks]);

  if (audioTracks.length === 0) {
    return null;
  }

  const hasTimeline = timeline.length > 0;
  const isProcessing = processingTracks.length > 0;
  const isPending = pendingTracks.length > 0 && !isProcessing;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcript</CardTitle>
        <CardDescription>Meeting conversation timeline</CardDescription>
      </CardHeader>
      <CardContent>
        {(isPending || isProcessing) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {processingTracks.map((name) => (
              <Badge key={name} variant="secondary">
                <Loader2 className="mr-1 size-3 animate-spin" />
                {name} - Processing
              </Badge>
            ))}
            {pendingTracks.map((name) => (
              <Badge key={name} variant="secondary">
                <Clock className="mr-1 size-3" />
                {name} - Pending
              </Badge>
            ))}
          </div>
        )}

        {!hasTimeline && !isProcessing && !isPending && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <AlertCircle className="size-4" />
            No transcript available
          </div>
        )}

        {hasTimeline && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors">
              <span className="text-muted-foreground text-sm">
                {timeline.length} segments from{" "}
                {
                  audioTracks.filter(
                    (t) => t.transcription?.status === "completed",
                  ).length
                }{" "}
                participants
              </span>
              <ChevronDown
                className={cn(
                  "size-5 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/30 mt-2 max-h-96 space-y-3 overflow-y-auto rounded-lg border p-4">
                {timeline.map((segment, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      {formatTime(segment.start)}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium">
                        {segment.participantName}:
                      </span>{" "}
                      <span className="text-sm">{segment.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
