import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { meetings } from "./meetings";

export const recordingStatusEnum = pgEnum("recording_status", [
  "recording",
  "processing",
  "ready",
  "failed",
]);

export const recordings = pgTable(
  "recordings",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    egressId: text("egress_id").notNull(),
    filePath: text("file_path"),
    fileSize: bigint("file_size", { mode: "number" }),
    duration: integer("duration"),
    status: recordingStatusEnum("status").default("recording").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("recordings_meeting_id_idx").on(table.meetingId),
    index("recordings_created_at_idx").on(table.createdAt),
  ],
);

export const recordingsRelations = relations(recordings, ({ one }) => ({
  meeting: one(meetings, {
    fields: [recordings.meetingId],
    references: [meetings.id],
  }),
}));
