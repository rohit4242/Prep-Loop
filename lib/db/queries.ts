import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  conversationTurns,
  feedbackReports,
  practicePacks,
  scenarios,
  sessionMetrics,
  sessions,
} from "@/lib/db/schema";
import { isGuestExpired } from "@/lib/auth/guest";
import { SEED_PACK_ID, SEED_SCENARIO_ID, SYSTEM_OWNER_ID } from "@/lib/constants";
import { demoSeedPack, demoSeedScenario } from "@/lib/seed/demo";

export function ownedBy(ownerId: string) {
  return eq(practicePacks.ownerId, ownerId);
}

export function sessionOwnedBy(ownerId: string) {
  return eq(sessions.ownerId, ownerId);
}

export function activeExpiry(now = new Date()) {
  return or(isNull(practicePacks.expiresAt), gt(practicePacks.expiresAt, now));
}

export function isOwnedAndActive<T extends { ownerId: string; expiresAt?: Date | null }>(
  record: T,
  ownerId: string,
  now = new Date(),
): boolean {
  return record.ownerId === ownerId && !isGuestExpired(record.expiresAt, now);
}

export async function ensureDemoSeed() {
  const db = getDb();
  await db
    .insert(practicePacks)
    .values({
      ...demoSeedPack,
      expiresAt: null,
    })
    .onConflictDoNothing();
  await db
    .insert(scenarios)
    .values(demoSeedScenario)
    .onConflictDoNothing();
  return { packId: SEED_PACK_ID, scenarioId: SEED_SCENARIO_ID, ownerId: SYSTEM_OWNER_ID };
}

export async function getPracticePackForOwner(id: string, ownerId: string) {
  const db = getDb();
  const [pack] = await db
    .select()
    .from(practicePacks)
    .where(
      and(
        eq(practicePacks.id, id),
        or(eq(practicePacks.ownerId, ownerId), eq(practicePacks.id, SEED_PACK_ID)),
      ),
    )
    .limit(1);
  if (!pack) return null;
  if (pack.id !== SEED_PACK_ID && pack.ownerId !== ownerId) return null;
  if (isGuestExpired(pack.expiresAt)) return null;
  return pack;
}

export async function getScenarioById(id: string) {
  const db = getDb();
  const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  return scenario ?? null;
}

export async function listRecentSessions(ownerId: string, limit = 10) {
  const db = getDb();
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.ownerId, ownerId)))
    .orderBy(desc(sessions.createdAt))
    .limit(limit);
}

export async function getSessionForOwner(sessionId: string, ownerId: string) {
  const db = getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.ownerId, ownerId)))
    .limit(1);
  if (!session || isGuestExpired(session.expiresAt)) return null;
  return session;
}

export async function getFeedbackForSession(sessionId: string) {
  const db = getDb();
  const [report] = await db
    .select()
    .from(feedbackReports)
    .where(eq(feedbackReports.sessionId, sessionId))
    .limit(1);
  const metrics = await db
    .select()
    .from(sessionMetrics)
    .where(eq(sessionMetrics.sessionId, sessionId));
  return { report: report ?? null, metrics };
}

export async function getTurns(sessionId: string) {
  const db = getDb();
  return db
    .select()
    .from(conversationTurns)
    .where(eq(conversationTurns.sessionId, sessionId))
    .orderBy(conversationTurns.sequence);
}
