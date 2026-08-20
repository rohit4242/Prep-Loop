import { NextResponse } from "next/server";
import { ensureGuestId } from "@/lib/auth/guest";
import { ensureDemoSeed } from "@/lib/db/queries";
import { SEED_PACK_ID, SEED_SCENARIO_ID } from "@/lib/constants";

export async function POST() {
  try {
    await ensureGuestId();
    await ensureDemoSeed();
    return NextResponse.json({
      packId: SEED_PACK_ID,
      scenarioId: SEED_SCENARIO_ID,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo start failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
