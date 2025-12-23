"use client";

import { ChevronDown, Loader2, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";

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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function TranscriptionStatusBadge({
  status,
}: {
  status: TranscriptionData["status"] | null;
}) {
  if (!status) {
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 size-3" />
        Pending
      </Badge>
    );
  }

  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 size-3" />
          Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary">
          <Loader2 className="mr-1 size-3 animate-spin" />
          Processing
        </Badge>
      );
    case "completed":
      return <Badge variant="default">Completed</Badge>;
    case "failed":
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 size-3" />
          Failed
        </Badge>
      );
  }
}

function TranscriptItem({ track }: { track: AudioTrack }) {
  const [isOpen, setIsOpen] = useState(false);
  const transcription = track.transcription;
  const isCompleted = transcription?.status === "completed";
  const hasSegments =
    isCompleted && transcription.segments && transcription.segments.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors",
          isCompleted
            ? "hover:bg-muted/50 cursor-pointer"
            : "cursor-default opacity-75",
        )}
        disabled={!isCompleted}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium">{track.participantName}</span>
          <TranscriptionStatusBadge status={transcription?.status ?? null} />
        </div>
        {isCompleted && (
          <ChevronDown
            className={cn(
              "size-5 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-lg border bg-muted/30 p-4">
          {transcription?.error && (
            <p className="text-destructive mb-2 text-sm">
              Error: {transcription.error}
            </p>
          )}
          {hasSegments ? (
            <div className="space-y-2">
              {transcription.segments.map((segment, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {formatTime(segment.start)}
                  </span>
                  <p className="text-sm">{segment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No transcript segments available.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TranscriptsList({ audioTracks }: TranscriptsListProps) {
  if (audioTracks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcripts</CardTitle>
        <CardDescription>
          Click on a participant to view their transcript
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {audioTracks.map((track) => (
          <TranscriptItem key={track.id} track={track} />
        ))}
      </CardContent>
    </Card>
  );
}
