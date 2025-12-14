import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
});

export type CreateMeetingFormValues = z.infer<typeof createMeetingSchema>;
