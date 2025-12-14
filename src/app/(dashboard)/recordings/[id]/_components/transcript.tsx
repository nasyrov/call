"use client";

import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useServerActionQuery } from "~/hooks/use-server-action";
import { getTranscript } from "../_actions/get-transcript";

interface TranscriptProps {
  recordingId: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function Transcript({ recordingId }: TranscriptProps) {
  const { data, isPending, error } = useServerActionQuery(getTranscript, {
    queryKey: ["transcript", recordingId],
    input: { recordingId },
  });

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.status === "not_found") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No transcript available for this recording.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.status === "in_progress") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Transcript
            <Loader2 className="size-4 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.segments.length > 0 ? (
            <div className="space-y-3">
              {data.segments.map((segment) => (
                <div key={segment.id} className="text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{segment.speakerName}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatTime(segment.startTime)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    {segment.content}
                  </p>
                </div>
              ))}
              <p className="text-muted-foreground mt-4 text-xs">
                Transcription in progress...
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Transcription in progress...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (data.status === "failed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            Transcription failed: {data.error ?? "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No speech detected in this recording.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.segments.map((segment) => (
            <div key={segment.id} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{segment.speakerName}</span>
                <span className="text-muted-foreground text-xs">
                  {formatTime(segment.startTime)}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5">{segment.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
