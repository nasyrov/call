import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { WebhookReceiver } from "livekit-server-sdk";

import { env } from "~/env";
import { db } from "~/server/db";
import { recordings } from "~/server/db/schema";

const receiver = new WebhookReceiver(
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = await receiver.receive(body, authHeader);

    if (event.event === "egress_ended") {
      const egress = event.egressInfo;

      if (!egress) {
        return NextResponse.json({ received: true });
      }

      const recording = await db.query.recordings.findFirst({
        where: eq(recordings.egressId, egress.egressId),
      });

      if (recording) {
        const fileResult = egress.fileResults?.[0];

        await db
          .update(recordings)
          .set({
            status: egress.error ? "failed" : "ready",
            filePath: fileResult?.filename,
            fileSize: fileResult?.size ? Number(fileResult.size) : null,
            duration: fileResult?.duration
              ? Math.floor(Number(fileResult.duration) / 1_000_000_000)
              : null,
          })
          .where(eq(recordings.id, recording.id));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
