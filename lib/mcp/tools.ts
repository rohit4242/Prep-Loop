import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  conversationTurns,
  feedbackReports,
  practicePacks,
  scenarios,
  sessionMetrics,
  sessions,
} from "@/lib/db/schema";
import { getSessionForOwner, getTurns } from "@/lib/db/queries";
import { calculateDeterministicMetrics } from "@/lib/metrics/calculate";
import { generateFeedbackReport, formatTranscript } from "@/lib/ai/feedback";
import { METRIC_VERSION, PROMPT_VERSION } from "@/lib/constants";
import { createId } from "@/lib/id";
import { RUBRIC_DIMENSIONS } from "@/lib/metrics/definitions";

export async function getPracticePackTool(input: { practicePackId: string; ownerId: string }) {
  const db = getDb();
  const [pack] = await db
    .select()
    .from(practicePacks)
    .where(
      and(eq(practicePacks.id, input.practicePackId), eq(practicePacks.ownerId, input.ownerId)),
    )
    .limit(1);
  if (!pack) {
    const [seed] = await db
      .select()
      .from(practicePacks)
      .where(eq(practicePacks.id, input.practicePackId))
      .limit(1);
    return seed ?? null;
  }
  return pack;
}

export async function getScenarioRubricTool(input: { scenarioId: string }) {
  const db = getDb();
  const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, input.scenarioId)).limit(1);
  if (!scenario) return null;
  return {
    id: scenario.id,
    title: scenario.title,
    interviewerPersona: scenario.interviewerPersona,
    openingPrompt: scenario.openingPrompt,
    questions: scenario.questions,
    rubric: scenario.rubric,
  };
}

export async function getApprovedFactsTool(input: { scenarioId: string }) {
  const db = getDb();
  const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, input.scenarioId)).limit(1);
  return scenario?.approvedFacts ?? [];
}

export async function recordTurnEventTool(input: {
  sessionId: string;
  speaker: string;
  text: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  toolCalls?: unknown[];
}) {
  const db = getDb();
  const [max] = await db
    .select({ sequence: sql<number>`coalesce(max(${conversationTurns.sequence}), 0)` })
    .from(conversationTurns)
    .where(eq(conversationTurns.sessionId, input.sessionId));
  const sequence = Number(max?.sequence ?? 0) + 1;
  const [turn] = await db
    .insert(conversationTurns)
    .values({
      id: createId("turn"),
      sessionId: input.sessionId,
      sequence,
      speaker: input.speaker,
      text: input.text,
      startedAt: input.startedAt ? new Date(input.startedAt) : null,
      endedAt: input.endedAt ? new Date(input.endedAt) : null,
      durationMs: input.durationMs ?? null,
      toolCalls: input.toolCalls ?? [],
    })
    .returning();
  return turn;
}

export async function saveSessionResultTool(input: {
  sessionId: string;
  status?: "processing" | "complete" | "failed";
}) {
  const db = getDb();
  const [session] = await db
    .update(sessions)
    .set({
      status: input.status ?? "processing",
      endedAt: new Date(),
    })
    .where(eq(sessions.id, input.sessionId))
    .returning();
  return session ?? null;
}

export async function getSessionMetricsTool(input: { sessionId: string; ownerId: string }) {
  const session = await getSessionForOwner(input.sessionId, input.ownerId);
  if (!session) return null;
  const db = getDb();
  return db.select().from(sessionMetrics).where(eq(sessionMetrics.sessionId, input.sessionId));
}

export async function getProgressSummaryTool(input: { ownerId: string }) {
  const db = getDb();
  const recent = await db
    .select()
    .from(sessions)
    .where(eq(sessions.ownerId, input.ownerId))
    .orderBy(desc(sessions.createdAt))
    .limit(20);
  const reports =
    recent.length === 0
      ? []
      : await db
          .select()
          .from(feedbackReports)
          .where(
            inArray(
              feedbackReports.sessionId,
              recent.map((session) => session.id),
            ),
          );
  const bySession = new Map(reports.map((report) => [report.sessionId, report]));
  const scores = recent
    .map((session) => bySession.get(session.id)?.overallScore)
    .filter((score): score is number => typeof score === "number");
  const averageScore =
    scores.length === 0 ? 0 : Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  const latest = scores[0] ?? 0;
  const previous = scores[1] ?? latest;
  const bestImprovement = Number((latest - previous).toFixed(2));

  const dimensionTotals = new Map<string, { sum: number; count: number }>();
  for (const session of recent) {
    const report = bySession.get(session.id);
    for (const item of report?.dimensionScores ?? []) {
      const current = dimensionTotals.get(item.dimension) ?? { sum: 0, count: 0 };
      current.sum += item.score;
      current.count += 1;
      dimensionTotals.set(item.dimension, current);
    }
  }
  let weakestDimension = String(RUBRIC_DIMENSIONS[0]);
  let weakestScore = 10;
  for (const [dimension, stats] of dimensionTotals) {
    const avg = stats.sum / stats.count;
    if (avg < weakestScore) {
      weakestScore = avg;
      weakestDimension = dimension;
    }
  }

  return {
    sessionCount: recent.length,
    averageScore,
    latestScore: latest,
    bestImprovement,
    weakestDimension,
    weakestScore: Number(weakestScore.toFixed(2)),
    recentScores: scores.slice(0, 5),
  };
}

export async function suggestNextPracticeTool(input: { ownerId: string }) {
  const summary = await getProgressSummaryTool(input);
  return {
    recommendation: `Practice ${summary.weakestDimension.replaceAll("_", " ")} next with a focused 8-minute interview.`,
    weakestDimension: summary.weakestDimension,
    averageScore: summary.averageScore,
  };
}

export async function finalizeSession(sessionId: string) {
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }
  if (session.status === "complete") {
    return { session, alreadyFinalized: true };
  }

  await db
    .update(sessions)
    .set({ status: "processing", endedAt: session.endedAt ?? new Date() })
    .where(eq(sessions.id, sessionId));

  try {
    const turns = await getTurns(sessionId);
    const transcriptTurns = turns.map((turn) => ({
      speaker: turn.speaker,
      text: turn.text,
      startedAt: turn.startedAt,
      endedAt: turn.endedAt,
      durationMs: turn.durationMs,
    }));
    const [scenario] = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, session.scenarioId))
      .limit(1);
    const transcript = formatTranscript(transcriptTurns);
    const metrics = calculateDeterministicMetrics(
      transcriptTurns,
      scenario?.questions.length ?? 0,
    );
    const feedback = await generateFeedbackReport({
      transcript,
      approvedFacts: scenario?.approvedFacts ?? [],
      rubric: scenario?.rubric ?? [],
    });

    await db.delete(sessionMetrics).where(eq(sessionMetrics.sessionId, sessionId));
    if (metrics.length > 0) {
      await db.insert(sessionMetrics).values(
        metrics.map((metric) => ({
          id: createId("metric"),
          sessionId,
          ...metric,
        })),
      );
    }
    await db.insert(sessionMetrics).values(
      feedback.dimensionScores.map((item) => ({
        id: createId("metric"),
        sessionId,
        metricKey: `${item.dimension}_score`,
        value: item.score,
        source: "llm",
        metricVersion: METRIC_VERSION,
      })),
    );

    await db.delete(feedbackReports).where(eq(feedbackReports.sessionId, sessionId));
    await db.insert(feedbackReports).values({
      id: createId("feedback"),
      sessionId,
      overallScore: feedback.overallScore,
      dimensionScores: feedback.dimensionScores,
      strengths: feedback.strengths,
      improvementActions: feedback.improvementActions,
      nextPracticeRecommendation: feedback.nextPracticeRecommendation,
      model: "gpt-4o-mini",
      promptVersion: PROMPT_VERSION,
    });

    const [updated] = await db
      .update(sessions)
      .set({
        status: "complete",
        transcript: transcriptTurns.map((turn) => ({
          speaker: turn.speaker,
          text: turn.text,
          startedAt: turn.startedAt ? new Date(turn.startedAt).toISOString() : undefined,
          endedAt: turn.endedAt ? new Date(turn.endedAt).toISOString() : undefined,
        })),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    return { session: updated, alreadyFinalized: false };
  } catch (error) {
    await db.update(sessions).set({ status: "failed" }).where(eq(sessions.id, sessionId));
    throw error;
  }
}
