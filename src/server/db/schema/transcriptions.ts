import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { meetings } from "./meetings";

export const transcriptionStatusEnum = pgEnum("transcription_status", [
  "in_progress",
  "completed",
  "failed",
]);

export const transcriptions = pgTable(
  "transcriptions",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .unique()
      .references(() => meetings.id, { onDelete: "cascade" }),
    status: transcriptionStatusEnum("status").default("in_progress").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  () => [],
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    transcriptionId: uuid("transcription_id")
      .notNull()
      .references(() => transcriptions.id, { onDelete: "cascade" }),
    speakerIdentity: text("speaker_identity").notNull(),
    speakerName: text("speaker_name").notNull(),
    content: text("content").notNull(),
    startTime: real("start_time").notNull(),
    endTime: real("end_time").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("transcript_segments_transcription_start_idx").on(
      table.transcriptionId,
      table.startTime,
    ),
  ],
);

export const transcriptionsRelations = relations(
  transcriptions,
  ({ one, many }) => ({
    meeting: one(meetings, {
      fields: [transcriptions.meetingId],
      references: [meetings.id],
    }),
    segments: many(transcriptSegments),
  }),
);

export const transcriptSegmentsRelations = relations(
  transcriptSegments,
  ({ one }) => ({
    transcription: one(transcriptions, {
      fields: [transcriptSegments.transcriptionId],
      references: [transcriptions.id],
    }),
  }),
);
