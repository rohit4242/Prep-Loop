import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getSessionForOwner } from "@/lib/db/queries";
import { finalizeSession } from "@/lib/mcp/tools";

export async function POST(
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
    const result = await finalizeSession(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
