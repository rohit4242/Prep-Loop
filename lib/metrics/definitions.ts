import { METRIC_VERSION } from "@/lib/constants";

export const RUBRIC_DIMENSIONS = [
  "clarity",
  "technical_relevance",
  "answer_structure",
  "confidence",
  "warmth",
  "competence",
  "role_relevance",
] as const;

export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number];

export const DETERMINISTIC_METRIC_KEYS = [
  "word_count",
  "speaking_duration_ms",
  "words_per_minute",
  "filler_word_count",
  "filler_word_rate",
  "response_latency_ms",
  "turn_count",
  "question_coverage",
  "repeated_phrase_count",
] as const;

export const LLM_METRIC_KEYS = [
  "answer_structure_score",
  "technical_relevance_score",
  "clarity_score",
  "confidence_score",
  "warmth_score",
  "competence_score",
  "role_relevance_score",
] as const;

export const metricDefinitions = {
  version: METRIC_VERSION,
  deterministic: DETERMINISTIC_METRIC_KEYS,
  llm: LLM_METRIC_KEYS,
  dimensions: RUBRIC_DIMENSIONS,
};
