"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { CreateMeetingFormValues } from "../_validation/create-meeting-schema";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useServerActionMutation } from "~/hooks/use-server-action";
import { createMeeting } from "../_actions/create-meeting";
import { createMeetingSchema } from "../_validation/create-meeting-schema";

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewMeetingDialog({
  open,
  onOpenChange,
}: NewMeetingDialogProps) {
  const router = useRouter();

  const form = useForm<CreateMeetingFormValues>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      title: "",
    },
  });

  const { mutate, isPending } = useServerActionMutation(createMeeting, {
    onSuccess: (data) => {
      toast.success("Meeting created");
      onOpenChange(false);
      form.reset();
      router.push(`/meetings/${data.meetingId}/lobby`);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create meeting");
    },
  });

  const onSubmit = (values: CreateMeetingFormValues) => {
    mutate(values);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Meeting</DialogTitle>
          <DialogDescription>
            Create an instant meeting and invite others to join.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Meeting"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Starting..." : "Start Meeting"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
