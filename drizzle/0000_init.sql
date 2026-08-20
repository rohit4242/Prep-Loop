CREATE TABLE IF NOT EXISTS "practice_packs" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "title" text NOT NULL,
  "target_role" text NOT NULL,
  "source_text" text NOT NULL,
  "source_type" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "scenarios" (
  "id" text PRIMARY KEY NOT NULL,
  "practice_pack_id" text NOT NULL REFERENCES "practice_packs"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "interviewer_persona" text NOT NULL,
  "opening_prompt" text NOT NULL,
  "questions" jsonb NOT NULL,
  "approved_facts" jsonb NOT NULL,
  "rubric" jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "scenario_id" text NOT NULL REFERENCES "scenarios"("id") ON DELETE cascade,
  "room_name" text NOT NULL,
  "status" text DEFAULT 'created' NOT NULL,
  "started_at" timestamp with time zone,
  "ended_at" timestamp with time zone,
  "transcript" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_guest" boolean DEFAULT false NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "conversation_turns" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL REFERENCES "sessions"("id") ON DELETE cascade,
  "sequence" integer NOT NULL,
  "speaker" text NOT NULL,
  "text" text NOT NULL,
  "started_at" timestamp with time zone,
  "ended_at" timestamp with time zone,
  "duration_ms" integer,
  "tool_calls" jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "session_metrics" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL REFERENCES "sessions"("id") ON DELETE cascade,
  "metric_key" text NOT NULL,
  "value" real NOT NULL,
  "source" text NOT NULL,
  "metric_version" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "feedback_reports" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL REFERENCES "sessions"("id") ON DELETE cascade,
  "overall_score" real NOT NULL,
  "dimension_scores" jsonb NOT NULL,
  "strengths" jsonb NOT NULL,
  "improvement_actions" jsonb NOT NULL,
  "next_practice_recommendation" text NOT NULL,
  "model" text NOT NULL,
  "prompt_version" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "practice_packs_owner_idx" ON "practice_packs" ("owner_id");
CREATE INDEX IF NOT EXISTS "scenarios_pack_idx" ON "scenarios" ("practice_pack_id");
CREATE INDEX IF NOT EXISTS "sessions_owner_idx" ON "sessions" ("owner_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_room_idx" ON "sessions" ("room_name");
CREATE INDEX IF NOT EXISTS "turns_session_idx" ON "conversation_turns" ("session_id");
CREATE INDEX IF NOT EXISTS "metrics_session_idx" ON "session_metrics" ("session_id");
CREATE UNIQUE INDEX IF NOT EXISTS "feedback_session_idx" ON "feedback_reports" ("session_id");
