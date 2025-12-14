"use server";

import { db } from "~/server/db";
import { meetingParticipants, meetings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";
import { createMeetingSchema } from "../_validation/create-meeting-schema";

export const createMeeting = authenticatedProcedure
  .input(createMeetingSchema)
  .handler(async ({ ctx, input }) => {
    const title = input.title ?? `${ctx.user.name}'s Meeting`;

    const [meeting] = await db
      .insert(meetings)
      .values({
        title,
        ownerId: ctx.user.id,
        status: "active",
        startedAt: new Date(),
      })
      .returning();

    if (!meeting) {
      throw new Error("Failed to create meeting");
    }

    await db.insert(meetingParticipants).values({
      meetingId: meeting.id,
      userId: ctx.user.id,
      role: "host",
      joinedAt: new Date(),
    });

    return { meetingId: meeting.id };
  });
