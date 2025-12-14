import {
  AccessToken,
  AgentDispatchClient,
  EgressClient,
} from "livekit-server-sdk";

import { env } from "~/env";

// Egress Client for recording management
export const egressClient = new EgressClient(
  env.LIVEKIT_URL,
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

// Agent Dispatch Client for transcription agent
export const agentDispatchClient = new AgentDispatchClient(
  env.LIVEKIT_URL,
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
