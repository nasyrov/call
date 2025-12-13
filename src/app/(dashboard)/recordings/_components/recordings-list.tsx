"use client";

import { Video } from "lucide-react";

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
  const { data, isPending } = useServerActionQuery(getRecordings, {
    queryKey: ["recordings"],
    input: undefined,
  });

  if (isPending) {
    return <RecordingsListSkeleton />;
  }

  if (!data || data.length === 0) {
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((recording) => (
        <RecordingCard
          key={recording.id}
          id={recording.id}
          meetingTitle={recording.meeting.title}
          duration={recording.duration}
          createdAt={recording.createdAt}
        />
      ))}
    </div>
  );
}
