import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "active",
  "ended",
  "cancelled",
]);

export const participantRoleEnum = pgEnum("participant_role", [
  "host",
  "participant",
]);

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    title: text("title").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isPersonalRoom: boolean("is_personal_room").default(false).notNull(),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    status: meetingStatusEnum("status").default("scheduled").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meetings_owner_id_idx").on(table.ownerId),
    index("meetings_status_idx").on(table.status),
  ],
);

export const meetingParticipants = pgTable(
  "meeting_participants",
  {
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: participantRoleEnum("role").default("participant").notNull(),
    joinedAt: timestamp("joined_at"),
    leftAt: timestamp("left_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.meetingId, table.userId] }),
    index("meeting_participants_user_id_idx").on(table.userId),
  ],
);

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  owner: one(users, {
    fields: [meetings.ownerId],
    references: [users.id],
  }),
  participants: many(meetingParticipants),
}));

export const meetingParticipantsRelations = relations(
  meetingParticipants,
  ({ one }) => ({
    meeting: one(meetings, {
      fields: [meetingParticipants.meetingId],
      references: [meetings.id],
    }),
    user: one(users, {
      fields: [meetingParticipants.userId],
      references: [users.id],
    }),
  }),
);
