"use server";

import { db } from "~/server/db";
import { meetingParticipants, meetings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";
import { scheduleMeetingSchema } from "../_validation/schedule-meeting-schema";

export const scheduleMeeting = authenticatedProcedure
  .input(scheduleMeetingSchema)
  .handler(async ({ ctx, input }) => {
    const [meeting] = await db
      .insert(meetings)
      .values({
        title: input.title,
        ownerId: ctx.user.id,
        scheduledAt: input.scheduledAt,
        status: "scheduled",
      })
      .returning();

    if (!meeting) {
      throw new Error("Failed to schedule meeting");
    }

    // Add owner as host participant
    await db.insert(meetingParticipants).values({
      meetingId: meeting.id,
      userId: ctx.user.id,
      role: "host",
    });

    return { meetingId: meeting.id };
  });
