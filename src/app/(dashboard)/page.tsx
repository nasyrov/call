import { Calendar, Link2, Plus, Video } from "lucide-react";

import { ActionCard } from "./_components/action-card";
import { TimeCard } from "./_components/time-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TimeCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="New Meeting"
          description="Start an instant meeting now"
          icon={Plus}
          href="/meetings/new"
        />
        <ActionCard
          title="Join Meeting"
          description="Join via invitation link"
          icon={Link2}
          href="/meetings/join"
        />
        <ActionCard
          title="Schedule Meeting"
          description="Plan your meeting ahead"
          icon={Calendar}
          href="/meetings/schedule"
        />
        <ActionCard
          title="Recordings"
          description="View your past recordings"
          icon={Video}
          href="/recordings"
        />
      </div>
    </div>
  );
}
