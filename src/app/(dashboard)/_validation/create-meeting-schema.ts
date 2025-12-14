import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().max(100).optional(),
});

export type CreateMeetingFormValues = z.infer<typeof createMeetingSchema>;
