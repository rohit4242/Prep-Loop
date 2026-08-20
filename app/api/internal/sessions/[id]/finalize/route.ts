import { NextResponse } from "next/server";
import { requireAgentToken } from "@/lib/internal/auth";
import { finalizeSession } from "@/lib/mcp/tools";

const inflight = new Set<string>();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireAgentToken(request);
    const { id } = await context.params;
    if (inflight.has(id)) {
      return NextResponse.json({ ok: true, pending: true });
    }
    inflight.add(id);
    try {
      const result = await finalizeSession(id);
      return NextResponse.json({ ok: true, ...result });
    } finally {
      inflight.delete(id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Finalize failed";
    const status = message === "UNAUTHORIZED_AGENT" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
