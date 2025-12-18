import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { participantAudioTracks, recordings } from "./recordings";

export const promptRunStatusEnum = pgEnum("prompt_run_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const promptRuns = pgTable(
  "prompt_runs",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    recordingId: uuid("recording_id")
      .notNull()
      .references(() => recordings.id, { onDelete: "cascade" }),
    audioTrackId: uuid("audio_track_id")
      .notNull()
      .references(() => participantAudioTracks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptId: text("prompt_id").notNull(),
    promptTitle: text("prompt_title").notNull(),
    promptText: text("prompt_text").notNull(),
    participantName: text("participant_name").notNull(),
    transcript: text("transcript").notNull(),
    result: text("result"),
    error: text("error"),
    status: promptRunStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("prompt_runs_recording_id_idx").on(table.recordingId),
    index("prompt_runs_user_id_idx").on(table.userId),
    index("prompt_runs_created_at_idx").on(table.createdAt),
  ],
);

export const promptRunsRelations = relations(promptRuns, ({ one }) => ({
  recording: one(recordings, {
    fields: [promptRuns.recordingId],
    references: [recordings.id],
  }),
  audioTrack: one(participantAudioTracks, {
    fields: [promptRuns.audioTrackId],
    references: [participantAudioTracks.id],
  }),
  user: one(users, {
    fields: [promptRuns.userId],
    references: [users.id],
  }),
}));
