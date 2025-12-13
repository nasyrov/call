"use server";

import { and, eq, gt } from "drizzle-orm";

import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

export const getUpcomingMeetings = authenticatedProcedure.handler(
  async ({ ctx }) => {
    const now = new Date();

    const result = await db.query.meetings.findMany({
      where: and(
        eq(meetings.status, "scheduled"),
        gt(meetings.scheduledAt, now),
      ),
      with: {
        owner: {
          columns: { id: true, name: true, image: true },
        },
        participants: {
          with: {
            user: {
              columns: { id: true, name: true, image: true },
            },
          },
        },
      },
      orderBy: (meetings, { asc }) => [asc(meetings.scheduledAt)],
    });

    // Filter to meetings where user is a participant (owner is always a participant)
    return result.filter((m) =>
      m.participants.some((p) => p.user.id === ctx.user.id),
    );
  },
);
