import Link from "next/link";
import { Calendar, Clock, Loader2, Play } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type RecordingStatus = "recording" | "processing" | "ready" | "failed";

interface RecordingCardProps {
  id: string;
  meetingTitle: string;
  duration: number | null;
  createdAt: Date;
  status: RecordingStatus;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: RecordingStatus }) {
  if (status === "ready") return null;

  if (status === "recording" || status === "processing") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        {status === "recording" ? "Recording" : "Processing"}
      </Badge>
    );
  }

  if (status === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }

  return null;
}

export function RecordingCard({
  id,
  meetingTitle,
  duration,
  createdAt,
  status,
}: RecordingCardProps) {
  const isReady = status === "ready";

  const cardContent = (
    <Card
      className={isReady ? "hover:bg-muted/50 transition-colors" : "opacity-75"}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <span className="flex items-center gap-2">
            <Play className="size-4" />
            {meetingTitle}
          </span>
          <StatusBadge status={status} />
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formatDate(createdAt)}
          </span>
          {duration && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatDuration(duration)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );

  if (!isReady) {
    return cardContent;
  }

  return <Link href={`/recordings/${id}`}>{cardContent}</Link>;
}
