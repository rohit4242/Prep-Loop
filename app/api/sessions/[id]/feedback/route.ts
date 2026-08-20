import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getFeedbackForSession, getSessionForOwner } from "@/lib/db/queries";

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
    const feedback = await getFeedbackForSession(id);
    return NextResponse.json({ session, ...feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
