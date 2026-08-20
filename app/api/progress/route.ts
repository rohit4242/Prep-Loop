import { NextResponse } from "next/server";
import { requireSignedInOwner } from "@/lib/auth/owner";
import { getProgressSummaryTool, suggestNextPracticeTool } from "@/lib/mcp/tools";
import { listRecentSessions } from "@/lib/db/queries";

export async function GET() {
  try {
    const owner = await requireSignedInOwner();
    const [summary, suggestion, sessions] = await Promise.all([
      getProgressSummaryTool({ ownerId: owner.ownerId }),
      suggestNextPracticeTool({ ownerId: owner.ownerId }),
      listRecentSessions(owner.ownerId, 8),
    ]);
    return NextResponse.json({ summary, suggestion, sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load progress";
    const status = message === "SIGN_IN_REQUIRED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
