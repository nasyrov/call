import { MeetingsList } from "./_components/meetings-list";

export default function UpcomingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upcoming Meetings</h1>
      <MeetingsList />
    </div>
  );
}
