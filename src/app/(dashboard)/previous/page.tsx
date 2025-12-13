import { MeetingsList } from "./_components/meetings-list";

export default function PreviousPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Previous Meetings</h1>
      <MeetingsList />
    </div>
  );
}
