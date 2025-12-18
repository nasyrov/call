import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";

import { env } from "~/env";
import { handleEgressEnded } from "./_handlers/egress-ended";
import { handleRoomFinished } from "./_handlers/room-finished";
import { handleRoomStarted } from "./_handlers/room-started";
import { handleTrackPublished } from "./_handlers/track-published";

const receiver = new WebhookReceiver(
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const authHeader = request.headers.get("Authorization");

  console.log(
    `Webhook received, event type from body: ${(JSON.parse(body) as { event?: string }).event}`,
  );

  if (!authHeader) {
    console.log("Webhook rejected: no auth header");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = await receiver.receive(body, authHeader);

    console.log(`Received webhook event: ${event.event}`);

    switch (event.event) {
      case "room_started":
        await handleRoomStarted(event);
        break;
      case "track_published":
        await handleTrackPublished(event);
        break;
      case "room_finished":
        await handleRoomFinished(event);
        break;
      case "egress_ended":
        await handleEgressEnded(event);
        break;
      default:
        console.log(`Unhandled event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook validation failed:", error);
    console.error("Body was:", body.substring(0, 500));
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
