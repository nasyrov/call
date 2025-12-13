"use client";

import { CalendarClock } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useServerActionQuery } from "~/hooks/use-server-action";
import { getUpcomingMeeting } from "../_actions/meetings";
import { Clock } from "./clock";

function UpcomingMeetingBadge() {
  const { data, isPending } = useServerActionQuery(getUpcomingMeeting, {
    queryKey: ["upcoming-meeting"],
    input: undefined,
  });

  if (isPending) {
    return <Skeleton className="h-6 w-48" />;
  }

  if (!data) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <CalendarClock className="size-3.5" />
        No upcoming meetings
      </Badge>
    );
  }

  const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `in ${days} day${days > 1 ? "s" : ""}`;
    }
    if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    }
    if (minutes > 0) {
      return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    return "starting soon";
  };

  return (
    <Badge variant="secondary" className="gap-1.5">
      <CalendarClock className="size-3.5" />
      {scheduledAt
        ? `${data.title} ${formatRelativeTime(scheduledAt)}`
        : data.title}
    </Badge>
  );
}

export function TimeCard() {
  return (
    <Card>
      <CardContent>
        <div className="mb-4">
          <UpcomingMeetingBadge />
        </div>
        <Clock />
      </CardContent>
    </Card>
  );
}
