import { ActionCards } from "./_components/action-cards";
import { TimeCard } from "./_components/time-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TimeCard />
      <ActionCards />
    </div>
  );
}
