import Link from "next/link";
import { Calendar, Clock, Play } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface RecordingCardProps {
  id: string;
  meetingTitle: string;
  duration: number | null;
  createdAt: Date;
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

export function RecordingCard({
  id,
  meetingTitle,
  duration,
  createdAt,
}: RecordingCardProps) {
  return (
    <Link href={`/recordings/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="size-4" />
            {meetingTitle}
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
    </Link>
  );
}
