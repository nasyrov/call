"use server";

import { and, eq, gt } from "drizzle-orm";

import { db } from "~/server/db";
import { meetingParticipants, meetings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

export const getUpcomingMeeting = authenticatedProcedure.handler(
  async ({ ctx }) => {
    const now = new Date();

    const upcomingMeeting = await db
      .selectDistinct({
        id: meetings.id,
        title: meetings.title,
        scheduledAt: meetings.scheduledAt,
      })
      .from(meetings)
      .innerJoin(
        meetingParticipants,
        eq(meetings.id, meetingParticipants.meetingId),
      )
      .where(
        and(
          eq(meetings.status, "scheduled"),
          gt(meetings.scheduledAt, now),
          eq(meetingParticipants.userId, ctx.user.id),
        ),
      )
      .orderBy(meetings.scheduledAt)
      .limit(1);

    if (!upcomingMeeting[0]) {
      return null;
    }

    return upcomingMeeting[0];
  },
);
