import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { meetings } from "./meetings";

export type TranscriptionData = {
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
  }>;
};

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

export const recordingsRelations = relations(recordings, ({ one, many }) => ({
  meeting: one(meetings, {
    fields: [recordings.meetingId],
    references: [meetings.id],
  }),
  audioTracks: many(participantAudioTracks),
}));

export const participantAudioTracks = pgTable(
  "participant_audio_tracks",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    recordingId: uuid("recording_id")
      .notNull()
      .references(() => recordings.id, { onDelete: "cascade" }),
    participantIdentity: text("participant_identity").notNull(),
    participantName: text("participant_name").notNull(),
    trackSid: text("track_sid").notNull(),
    egressId: text("egress_id").notNull().unique(),
    filePath: text("file_path"),
    fileSize: bigint("file_size", { mode: "number" }),
    duration: integer("duration"),
    status: recordingStatusEnum("status").default("recording").notNull(),
    transcription: jsonb("transcription").$type<TranscriptionData>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("participant_audio_tracks_recording_id_idx").on(table.recordingId),
    index("participant_audio_tracks_egress_id_idx").on(table.egressId),
  ],
);

export const participantAudioTracksRelations = relations(
  participantAudioTracks,
  ({ one }) => ({
    recording: one(recordings, {
      fields: [participantAudioTracks.recordingId],
      references: [recordings.id],
    }),
  }),
);
