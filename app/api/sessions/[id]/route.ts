import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getSessionForOwner, getScenarioById } from "@/lib/db/queries";
import { createInterviewRoom } from "@/lib/livekit/token";
import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const owner = await requireOwner();
    const session = await getSessionForOwner(id, owner.ownerId);
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const scenario = await getScenarioById(session.scenarioId);
    let connection = {
      serverUrl: "",
      participantToken: "",
      roomName: session.roomName,
      mock: true as boolean,
    };
    if (session.status === "created" || session.status === "in_progress") {
      connection = await createInterviewRoom({
        sessionId: session.id,
        scenarioId: session.scenarioId,
        ownerId: owner.ownerId,
        roomName: session.roomName,
      });
      if (session.status === "created") {
        const db = getDb();
        await db
          .update(sessions)
          .set({ status: "in_progress", startedAt: new Date() })
          .where(eq(sessions.id, session.id));
      }
    }
    return NextResponse.json({ session, scenario, connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
