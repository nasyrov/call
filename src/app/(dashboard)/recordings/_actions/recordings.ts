"use server";

import { inArray } from "drizzle-orm";

import { db } from "~/server/db";
import { recordings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

export const getRecordings = authenticatedProcedure.handler(async ({ ctx }) => {
  const result = await db.query.recordings.findMany({
    where: inArray(recordings.status, ["ready", "processing", "recording"]),
    with: {
      meeting: {
        with: {
          owner: {
            columns: { id: true, name: true, image: true },
          },
        },
      },
    },
    orderBy: (recordings, { desc }) => [desc(recordings.createdAt)],
  });

  // Filter to recordings from meetings where user is owner
  return result.filter((r) => r.meeting.owner.id === ctx.user.id);
});
