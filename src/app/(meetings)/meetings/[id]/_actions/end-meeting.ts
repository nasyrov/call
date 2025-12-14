"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

const endMeetingSchema = z.object({
  meetingId: z.string().uuid(),
});

export const endMeeting = authenticatedProcedure
  .input(endMeetingSchema)
  .handler(async ({ ctx, input }) => {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, input.meetingId),
    });

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Only host can end the meeting
    if (meeting.ownerId !== ctx.user.id) {
      throw new Error("Only the host can end the meeting");
    }

    await db
      .update(meetings)
      .set({
        status: "ended",
        endedAt: new Date(),
      })
      .where(eq(meetings.id, input.meetingId));

    return { success: true };
  });
