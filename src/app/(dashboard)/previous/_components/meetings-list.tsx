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
  const [page, setPage] = useState(1);

  const { data, isPending } = useServerActionQuery(getPreviousMeetings, {
    queryKey: ["previous-meetings", page],
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
          <EmptyTitle>No previous meetings</EmptyTitle>
          <EmptyDescription>
            Your completed meetings will appear here
          </EmptyDescription>
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
            endedAt={meeting.endedAt}
            participants={meeting.participants}
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
