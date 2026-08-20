import { NextResponse } from "next/server";
import { requireAgentToken } from "@/lib/internal/auth";
import { handleMcpRequest } from "@/lib/mcp/protocol";

export async function POST(request: Request) {
  try {
    requireAgentToken(request);
    const body = await request.json();
    const payload = await handleMcpRequest(body);
    if (!payload) {
      return new NextResponse(null, { status: 202 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "MCP error";
    const status = message === "UNAUTHORIZED_AGENT" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
