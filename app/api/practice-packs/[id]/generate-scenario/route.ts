import { NextResponse } from "next/server";
import { requireSignedInOwner } from "@/lib/auth/owner";
import { getPracticePackForOwner } from "@/lib/db/queries";
import { generateScenario } from "@/lib/ai/generate";
import { getDb } from "@/lib/db";
import { scenarios } from "@/lib/db/schema";
import { createId } from "@/lib/id";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const owner = await requireSignedInOwner();
    const pack = await getPracticePackForOwner(id, owner.ownerId);
    if (!pack) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const scenario = await generateScenario({
      targetRole: pack.targetRole,
      sourceText: pack.sourceText,
    });
    const scenarioId = createId("scenario");
    const db = getDb();
    await db.insert(scenarios).values({
      id: scenarioId,
      practicePackId: pack.id,
      ...scenario,
    });
    return NextResponse.json({ scenarioId, scenario });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate scenario";
    const status = message === "SIGN_IN_REQUIRED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
