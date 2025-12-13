import { RecordingsList } from "./_components/recordings-list";

export default function RecordingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Recordings</h1>
      <RecordingsList />
    </div>
  );
}
