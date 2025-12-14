"use client";

import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useMeetingDialog } from "./meeting-dialog-provider";

export function NewMeetingButton() {
  const { openNewMeeting } = useMeetingDialog();

  return (
    <Button onClick={openNewMeeting} size="sm">
      <Plus />
      <span>New Meeting</span>
    </Button>
  );
}
