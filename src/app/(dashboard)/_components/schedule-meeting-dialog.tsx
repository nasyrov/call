"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ScheduleMeetingFormValues } from "../_validation/schedule-meeting-schema";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useServerActionMutation } from "~/hooks/use-server-action";
import { cn } from "~/lib/utils";
import { scheduleMeeting } from "../_actions/schedule-meeting";
import { scheduleMeetingSchema } from "../_validation/schedule-meeting-schema";

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate time options in 30-minute intervals
function generateTimeOptions() {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      const value = `${h}:${m}`;
      const label = format(new Date(2000, 0, 1, hour, minute), "h:mm a");
      options.push({ value, label });
    }
  }
  return options;
}

const timeOptions = generateTimeOptions();

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
}: ScheduleMeetingDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<ScheduleMeetingFormValues>({
    resolver: zodResolver(scheduleMeetingSchema),
    defaultValues: {
      title: "",
      scheduledAt: undefined,
    },
  });

  const { mutate, isPending } = useServerActionMutation(scheduleMeeting, {
    onSuccess: async () => {
      toast.success("Meeting scheduled");
      onOpenChange(false);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["upcoming-meetings"] });
      router.push("/upcoming");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to schedule meeting");
    },
  });

  const onSubmit = (values: ScheduleMeetingFormValues) => {
    mutate(values);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
    }
  };

  const selectedDate = form.watch("scheduledAt");
  const selectedTime = selectedDate ? format(selectedDate, "HH:mm") : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const current = form.getValues("scheduledAt");
      if (current) {
        // Preserve the time from current selection
        date.setHours(current.getHours(), current.getMinutes());
      } else {
        // Default to 9:00 AM
        date.setHours(9, 0, 0, 0);
      }
      form.setValue("scheduledAt", date, { shouldValidate: true });
    }
  };

  const handleTimeSelect = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const current = form.getValues("scheduledAt") ?? new Date();
    const newDate = new Date(current);
    newDate.setHours(hours!, minutes, 0, 0);
    form.setValue("scheduledAt", newDate, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting for a future date and time.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Weekly standup"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                            disabled={isPending}
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {field.value ? (
                              format(field.value, "PPP 'at' h:mm a")
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={handleDateSelect}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                        <div className="border-t p-3">
                          <Select
                            value={selectedTime}
                            onValueChange={handleTimeSelect}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
