import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";
import { AGENT_NAME } from "@/lib/constants";
import { getEnv, isLiveKitConfigured } from "@/lib/env";

export async function createInterviewRoom(input: {
  sessionId: string;
  scenarioId: string;
  ownerId: string;
  roomName: string;
}) {
  if (!isLiveKitConfigured()) {
    return {
      serverUrl: "",
      participantToken: "",
      roomName: input.roomName,
      mock: true as const,
    };
  }

  const env = getEnv();
  const dispatch = new AgentDispatchClient(
    env.LIVEKIT_URL,
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );
  await dispatch.createDispatch(input.roomName, AGENT_NAME, {
    metadata: JSON.stringify({
      sessionId: input.sessionId,
      scenarioId: input.scenarioId,
      ownerId: input.ownerId,
    }),
  });

  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: `user-${input.ownerId.slice(0, 12)}-${input.sessionId.slice(0, 8)}`,
    ttl: "30m",
  });
  token.addGrant({
    roomJoin: true,
    room: input.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    serverUrl: env.LIVEKIT_URL,
    participantToken: await token.toJwt(),
    roomName: input.roomName,
    mock: false as const,
  };
}
