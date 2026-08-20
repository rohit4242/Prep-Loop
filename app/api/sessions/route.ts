import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/owner";
import { guestExpiryDate } from "@/lib/auth/guest";
import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { createInterviewRoom } from "@/lib/livekit/token";
import { ensureDemoSeed, getScenarioById } from "@/lib/db/queries";
import { SEED_SCENARIO_ID } from "@/lib/constants";

const schema = z.object({
  scenarioId: z.string().optional(),
  demo: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const owner = await requireOwner();
    const body = schema.parse(await request.json().catch(() => ({})));
    if (body.demo) {
      await ensureDemoSeed();
    }
    const scenarioId = body.demo ? SEED_SCENARIO_ID : body.scenarioId;
    if (!scenarioId) {
      return NextResponse.json({ error: "scenarioId is required" }, { status: 400 });
    }
    const scenario = await getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const sessionId = createId("session");
    const roomName = `preploop-${sessionId}`;
    const db = getDb();
    await db.insert(sessions).values({
      id: sessionId,
      ownerId: owner.ownerId,
      scenarioId,
      roomName,
      status: "created",
      isGuest: owner.isGuest,
      expiresAt: owner.isGuest ? guestExpiryDate() : null,
    });

    const room = await createInterviewRoom({
      sessionId,
      scenarioId,
      ownerId: owner.ownerId,
      roomName,
    });

    return NextResponse.json({
      sessionId,
      scenarioId,
      ...room,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
