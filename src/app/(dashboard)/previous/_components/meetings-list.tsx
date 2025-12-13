"use client";

import { Calendar } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import { useServerActionQuery } from "~/hooks/use-server-action";
import { getPreviousMeetings } from "../_actions/meetings";
import { MeetingCard } from "../../_components/meeting-card";

function MeetingsListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-36" />
      ))}
    </div>
  );
}

export function MeetingsList() {
  const { data, isPending } = useServerActionQuery(getPreviousMeetings, {
    queryKey: ["previous-meetings"],
    input: undefined,
  });

  if (isPending) {
    return <MeetingsListSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Calendar />
          </EmptyMedia>
          <EmptyTitle>No previous meetings</EmptyTitle>
          <EmptyDescription>
            Your completed meetings will appear here
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          id={meeting.id}
          title={meeting.title}
          scheduledAt={meeting.scheduledAt}
          endedAt={meeting.endedAt}
          owner={meeting.owner}
          participants={meeting.participants}
        />
      ))}
    </div>
  );
}
