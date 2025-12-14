import { eq, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);

// Schema definitions (mirroring the main app schema)
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
    meetingId: uuid("meeting_id").notNull().unique(),
    status: transcriptionStatusEnum("status").default("in_progress").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("transcriptions_meeting_id_idx").on(table.meetingId)],
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    transcriptionId: uuid("transcription_id").notNull(),
    speakerIdentity: text("speaker_identity").notNull(),
    speakerName: text("speaker_name").notNull(),
    content: text("content").notNull(),
    startTime: real("start_time").notNull(),
    endTime: real("end_time").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("transcript_segments_transcription_id_idx").on(table.transcriptionId),
    index("transcript_segments_start_time_idx").on(table.startTime),
  ],
);

export async function createTranscription(meetingId: string) {
  const [transcription] = await db
    .insert(transcriptions)
    .values({ meetingId })
    .onConflictDoNothing()
    .returning();

  if (!transcription) {
    // Already exists, fetch it
    const [existing] = await db
      .select()
      .from(transcriptions)
      .where(eq(transcriptions.meetingId, meetingId));
    return existing;
  }

  return transcription;
}

export async function addSegment(
  transcriptionId: string,
  segment: {
    speakerIdentity: string;
    speakerName: string;
    content: string;
    startTime: number;
    endTime: number;
  },
) {
  const [inserted] = await db
    .insert(transcriptSegments)
    .values({
      transcriptionId,
      ...segment,
    })
    .returning();

  return inserted;
}

export async function completeTranscription(transcriptionId: string) {
  console.log(`Completing transcription: ${transcriptionId}`);
  const result = await db
    .update(transcriptions)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(transcriptions.id, transcriptionId))
    .returning();
  console.log(`Transcription update result:`, result);
  return result;
}

export async function failTranscription(
  transcriptionId: string,
  error: string,
) {
  await db
    .update(transcriptions)
    .set({ status: "failed", error, updatedAt: new Date() })
    .where(eq(transcriptions.id, transcriptionId));
}
