import { z } from "zod";

export const scheduleMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  scheduledAt: z
    .date({
      required_error: "Date and time is required",
    })
    .refine((date) => date > new Date(), {
      message: "Scheduled time must be in the future",
    }),
});

export type ScheduleMeetingFormValues = z.infer<typeof scheduleMeetingSchema>;
