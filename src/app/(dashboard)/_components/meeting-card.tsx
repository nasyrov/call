import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { AvatarStack } from "./avatar-stack";

interface Participant {
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface MeetingCardProps {
  id: string;
  title: string;
  scheduledAt: Date | null;
  endedAt?: Date | null;
  owner: {
    id: string;
    name: string;
    image: string | null;
  };
  participants: Participant[];
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MeetingCard({
  id,
  title,
  scheduledAt,
  endedAt,
  owner,
  participants,
}: MeetingCardProps) {
  const allUsers = [owner, ...participants.map((p) => p.user)];
  const displayDate = endedAt ?? scheduledAt;

  return (
    <Link href={`/meetings/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          {displayDate && (
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDate(displayDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {formatTime(displayDate)}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <AvatarStack users={allUsers} />
        </CardContent>
      </Card>
    </Link>
  );
}
