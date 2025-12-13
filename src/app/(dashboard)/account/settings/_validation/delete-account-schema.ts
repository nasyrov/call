import { z } from "zod";

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: 'Please type "DELETE" to confirm' }),
  }),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
