import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentToken } from "@/lib/internal/auth";
import { recordTurnEventTool } from "@/lib/mcp/tools";
import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  speaker: z.string(),
  text: z.string(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationMs: z.number().optional(),
  toolCalls: z.array(z.unknown()).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireAgentToken(request);
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const db = getDb();
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (session.status === "created") {
      await db
        .update(sessions)
        .set({ status: "in_progress", startedAt: session.startedAt ?? new Date() })
        .where(eq(sessions.id, id));
    }
    const turn = await recordTurnEventTool({ sessionId: id, ...body });
    return NextResponse.json({ turn });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record event";
    const status = message === "UNAUTHORIZED_AGENT" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
