import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getPracticePackForOwner } from "@/lib/db/queries";
import { getDb } from "@/lib/db";
import { scenarios } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const owner = await requireOwner();
    const pack = await getPracticePackForOwner(id, owner.ownerId);
    if (!pack) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const db = getDb();
    const packScenarios = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.practicePackId, pack.id))
      .orderBy(desc(scenarios.createdAt));
    return NextResponse.json({ pack, scenarios: packScenarios });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pack";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
