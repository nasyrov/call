"use server";

import { sql } from "drizzle-orm";

import {
  createPaginatedResult,
  getOffset,
  paginationSchema,
} from "~/lib/pagination";
import { db } from "~/server/db";
import { meetingParticipants, meetings, users } from "~/server/db/schema";
import { authenticatedProcedure } from "~/server/procedures";

export const getPreviousMeetings = authenticatedProcedure
  .input(paginationSchema)
  .handler(async ({ ctx, input }) => {
    const offset = getOffset(input.page, input.limit);

    const rows = await db.execute<{
      id: string;
      title: string;
      scheduled_at: string | null;
      ended_at: string | null;
      participants: { id: string; name: string; image: string | null }[];
      total_count: number;
    }>(sql`
      SELECT
        m.id,
        m.title,
        m.scheduled_at,
        m.ended_at,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'name', u.name, 'image', u.image)),
          '[]'
        ) as participants,
        COUNT(*) OVER() as total_count
      FROM ${meetings} m
      INNER JOIN ${meetingParticipants} mp ON m.id = mp.meeting_id
      INNER JOIN ${users} u ON mp.user_id = u.id
      WHERE m.status = 'ended'
        AND EXISTS (
          SELECT 1 FROM ${meetingParticipants} p
          WHERE p.meeting_id = m.id AND p.user_id = ${ctx.user.id}
        )
      GROUP BY m.id
      ORDER BY m.ended_at DESC
      LIMIT ${input.limit}
      OFFSET ${offset}
    `);

    const totalCount = rows[0]?.total_count ?? 0;

    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : null,
      endedAt: row.ended_at ? new Date(row.ended_at) : null,
      participants: row.participants,
    }));

    return createPaginatedResult(data, totalCount, input.page, input.limit);
  });
