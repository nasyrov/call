"use client";

import { Calendar, Link2, Plus, Video } from "lucide-react";

import { ActionCard } from "./action-card";
import { useMeetingDialog } from "./meeting-dialog-provider";

export function ActionCards() {
  const { openNewMeeting, openJoinMeeting, openScheduleMeeting } =
    useMeetingDialog();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ActionCard
        title="New Meeting"
        description="Start an instant meeting now"
        icon={Plus}
        onClick={openNewMeeting}
      />
      <ActionCard
        title="Join Meeting"
        description="Join via invitation link"
        icon={Link2}
        onClick={openJoinMeeting}
      />
      <ActionCard
        title="Schedule Meeting"
        description="Plan your meeting ahead"
        icon={Calendar}
        onClick={openScheduleMeeting}
      />
      <ActionCard
        title="Recordings"
        description="View your past recordings"
        icon={Video}
        href="/recordings"
      />
    </div>
  );
}
