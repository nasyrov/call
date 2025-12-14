"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

import { PaginationControls } from "~/components/pagination-controls";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import { useServerActionQuery } from "~/hooks/use-server-action";
import { getUpcomingMeetings } from "../_actions/meetings";
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
  const [page, setPage] = useState(1);

  const { data, isPending } = useServerActionQuery(getUpcomingMeetings, {
    queryKey: ["upcoming-meetings", page],
    input: { page, limit: 9 },
  });

  if (isPending) {
    return <MeetingsListSkeleton />;
  }

  if (!data || data.data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Calendar />
          </EmptyMedia>
          <EmptyTitle>No upcoming meetings</EmptyTitle>
          <EmptyDescription>Schedule a meeting to get started</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.data.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            id={meeting.id}
            title={meeting.title}
            scheduledAt={meeting.scheduledAt}
            participants={meeting.participants}
            href={`/meetings/${meeting.id}/lobby`}
          />
        ))}
      </div>
      <PaginationControls
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        hasNextPage={data.pagination.hasNextPage}
        hasPreviousPage={data.pagination.hasPreviousPage}
        onPageChange={setPage}
      />
    </div>
  );
}
