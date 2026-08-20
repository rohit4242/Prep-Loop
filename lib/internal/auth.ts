import { getEnv } from "@/lib/env";

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export function isValidAgentToken(token: string | null): boolean {
  const expected = getEnv().AGENT_INTERNAL_TOKEN;
  return Boolean(token && expected && token === expected);
}

export function requireAgentToken(request: Request): void {
  if (!isValidAgentToken(extractBearerToken(request))) {
    throw new Error("UNAUTHORIZED_AGENT");
  }
}
