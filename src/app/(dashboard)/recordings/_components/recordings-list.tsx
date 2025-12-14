"use client";

import { useState } from "react";
import { Video } from "lucide-react";

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
import { getRecordings } from "../_actions/recordings";
import { RecordingCard } from "./recording-card";

function RecordingsListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

export function RecordingsList() {
  const [page, setPage] = useState(1);

  const { data, isPending } = useServerActionQuery(getRecordings, {
    queryKey: ["recordings", page],
    input: { page, limit: 9 },
  });

  if (isPending) {
    return <RecordingsListSkeleton />;
  }

  if (!data || data.data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Video />
          </EmptyMedia>
          <EmptyTitle>No recordings</EmptyTitle>
          <EmptyDescription>
            Your meeting recordings will appear here
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.data.map((recording) => (
          <RecordingCard
            key={recording.id}
            id={recording.id}
            meetingTitle={recording.meeting.title}
            duration={recording.duration}
            createdAt={recording.createdAt}
            status={recording.status}
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
