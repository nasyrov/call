"use server";

import { desc, eq, sql } from "drizzle-orm";

import {
  createPaginatedResult,
  getOffset,
  paginationSchema,
} from "~/lib/pagination";
import { db } from "~/server/db";
import { meetingParticipants, meetings, recordings } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

export const getRecordings = authenticatedProcedure
  .input(paginationSchema)
  .handler(async ({ ctx, input }) => {
    const offset = getOffset(input.page, input.limit);

    const rows = await db
      .select({
        id: recordings.id,
        meetingId: recordings.meetingId,
        duration: recordings.duration,
        status: recordings.status,
        createdAt: recordings.createdAt,
        meetingTitle: meetings.title,
        totalCount: sql<number>`count(*) over()`.as("total_count"),
      })
      .from(recordings)
      .innerJoin(meetings, eq(recordings.meetingId, meetings.id))
      .innerJoin(
        meetingParticipants,
        eq(meetings.id, meetingParticipants.meetingId),
      )
      .where(eq(meetingParticipants.userId, ctx.user.id))
      .orderBy(desc(recordings.createdAt))
      .limit(input.limit)
      .offset(offset);

    const totalCount = rows[0]?.totalCount ?? 0;

    const data = rows.map((row) => ({
      id: row.id,
      duration: row.duration,
      status: row.status,
      createdAt: row.createdAt,
      meeting: {
        id: row.meetingId,
        title: row.meetingTitle,
      },
    }));

    return createPaginatedResult(data, totalCount, input.page, input.limit);
  });
