import { AccessToken, EgressClient } from "livekit-server-sdk";

import { env } from "~/env";

// Egress Client for recording management (uses internal URL for fast server-to-server calls)
console.log(`EgressClient using URL: ${env.LIVEKIT_INTERNAL_URL}`);
export const egressClient = new EgressClient(
  env.LIVEKIT_INTERNAL_URL,
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

interface GenerateTokenOptions {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  isHost?: boolean;
}

export async function generateToken(options: GenerateTokenOptions) {
  const {
    roomName,
    participantIdentity,
    participantName,
    isHost = false,
  } = options;

  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    ttl: "2h",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
    roomRecord: isHost,
  });

  return token.toJwt();
}
