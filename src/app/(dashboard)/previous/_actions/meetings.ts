"use server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

export const getPreviousMeetings = authenticatedProcedure.handler(
  async ({ ctx }) => {
    const result = await db.query.meetings.findMany({
      where: eq(meetings.status, "ended"),
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
      orderBy: (meetings, { desc }) => [desc(meetings.endedAt)],
    });

    // Filter to meetings where user is a participant (owner is always a participant)
    return result.filter((m) =>
      m.participants.some((p) => p.user.id === ctx.user.id),
    );
  },
);
