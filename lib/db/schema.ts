import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const sessionStatuses = [
  "created",
  "in_progress",
  "processing",
  "complete",
  "failed",
] as const;

export type SessionStatus = (typeof sessionStatuses)[number];

export const practicePacks = pgTable(
  "practice_packs",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    targetRole: text("target_role").notNull(),
    sourceText: text("source_text").notNull(),
    sourceType: text("source_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    index("practice_packs_owner_idx").on(table.ownerId),
  ],
);

export const scenarios = pgTable(
  "scenarios",
  {
    id: text("id").primaryKey(),
    practicePackId: text("practice_pack_id")
      .notNull()
      .references(() => practicePacks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    interviewerPersona: text("interviewer_persona").notNull(),
    openingPrompt: text("opening_prompt").notNull(),
    questions: jsonb("questions")
      .$type<Array<{ category: string; prompt: string }>>()
      .notNull(),
    approvedFacts: jsonb("approved_facts").$type<string[]>().notNull(),
    rubric: jsonb("rubric")
      .$type<Array<{ dimension: string; description: string; weight: number }>>()
      .notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("scenarios_pack_idx").on(table.practicePackId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    scenarioId: text("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    roomName: text("room_name").notNull(),
    status: text("status").$type<SessionStatus>().notNull().default("created"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    transcript: jsonb("transcript")
      .$type<Array<{ speaker: string; text: string; startedAt?: string; endedAt?: string }>>()
      .notNull()
      .default([]),
    isGuest: boolean("is_guest").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_owner_idx").on(table.ownerId),
    uniqueIndex("sessions_room_idx").on(table.roomName),
  ],
);

export const conversationTurns = pgTable(
  "conversation_turns",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    toolCalls: jsonb("tool_calls").$type<unknown[]>().notNull().default([]),
  },
  (table) => [
    index("turns_session_idx").on(table.sessionId),
  ],
);

export const sessionMetrics = pgTable(
  "session_metrics",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    metricKey: text("metric_key").notNull(),
    value: real("value").notNull(),
    source: text("source").notNull(),
    metricVersion: text("metric_version").notNull(),
  },
  (table) => [
    index("metrics_session_idx").on(table.sessionId),
  ],
);

export const feedbackReports = pgTable(
  "feedback_reports",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    overallScore: real("overall_score").notNull(),
    dimensionScores: jsonb("dimension_scores")
      .$type<Array<{ dimension: string; score: number; evidence: string }>>()
      .notNull(),
    strengths: jsonb("strengths").$type<string[]>().notNull(),
    improvementActions: jsonb("improvement_actions").$type<string[]>().notNull(),
    nextPracticeRecommendation: text("next_practice_recommendation").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("feedback_session_idx").on(table.sessionId),
  ],
);
