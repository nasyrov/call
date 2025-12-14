"use client";

import { createContext, useContext, useState } from "react";

import { JoinMeetingDialog } from "./join-meeting-dialog";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog";

interface MeetingDialogContextValue {
  openNewMeeting: () => void;
  openJoinMeeting: () => void;
  openScheduleMeeting: () => void;
}

const MeetingDialogContext = createContext<MeetingDialogContextValue | null>(
  null,
);

export function useMeetingDialog() {
  const context = useContext(MeetingDialogContext);
  if (!context) {
    throw new Error(
      "useMeetingDialog must be used within MeetingDialogProvider",
    );
  }
  return context;
}

export function MeetingDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [joinMeetingOpen, setJoinMeetingOpen] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);

  return (
    <MeetingDialogContext.Provider
      value={{
        openNewMeeting: () => setNewMeetingOpen(true),
        openJoinMeeting: () => setJoinMeetingOpen(true),
        openScheduleMeeting: () => setScheduleMeetingOpen(true),
      }}
    >
      {children}
      <NewMeetingDialog
        open={newMeetingOpen}
        onOpenChange={setNewMeetingOpen}
      />
      <JoinMeetingDialog
        open={joinMeetingOpen}
        onOpenChange={setJoinMeetingOpen}
      />
      <ScheduleMeetingDialog
        open={scheduleMeetingOpen}
        onOpenChange={setScheduleMeetingOpen}
      />
    </MeetingDialogContext.Provider>
  );
}
