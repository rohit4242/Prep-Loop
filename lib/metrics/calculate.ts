import { METRIC_VERSION } from "@/lib/constants";
import {
  countFillerWords,
  countWords,
  fillerWordRate,
  wordsPerMinute,
} from "@/lib/metrics/fillers";

export type TranscriptTurn = {
  speaker: string;
  text: string;
  startedAt?: string | Date | null;
  endedAt?: string | Date | null;
  durationMs?: number | null;
};

export type CalculatedMetric = {
  metricKey: string;
  value: number;
  source: "deterministic";
  metricVersion: string;
};

function toTime(value?: string | Date | null): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function userTurns(turns: TranscriptTurn[]): TranscriptTurn[] {
  return turns.filter((turn) => turn.speaker === "user" || turn.speaker === "candidate");
}

function speakingDurationMs(turns: TranscriptTurn[]): number {
  return userTurns(turns).reduce((sum, turn) => {
    if (turn.durationMs && turn.durationMs > 0) return sum + turn.durationMs;
    const start = toTime(turn.startedAt);
    const end = toTime(turn.endedAt);
    if (start && end && end > start) return sum + (end - start);
    return sum;
  }, 0);
}

function averageLatencyMs(turns: TranscriptTurn[]): number {
  const latencies: number[] = [];
  for (let i = 1; i < turns.length; i += 1) {
    const previous = turns[i - 1];
    const current = turns[i];
    if (
      (previous.speaker === "agent" || previous.speaker === "interviewer") &&
      (current.speaker === "user" || current.speaker === "candidate")
    ) {
      const start = toTime(current.startedAt);
      const end = toTime(previous.endedAt);
      if (start && end && start >= end) {
        latencies.push(start - end);
      }
    }
  }
  if (latencies.length === 0) return 0;
  return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
}

function questionCoverage(turns: TranscriptTurn[], questionCount: number): number {
  if (questionCount <= 0) return 0;
  const agentQuestions = turns.filter(
    (turn) =>
      (turn.speaker === "agent" || turn.speaker === "interviewer") &&
      turn.text.includes("?"),
  ).length;
  return Number(Math.min(1, agentQuestions / questionCount).toFixed(4));
}

function repeatedPhraseCount(text: string): number {
  const phrases = text
    .toLowerCase()
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter((part) => part.split(/\s+/).length >= 4);
  const seen = new Map<string, number>();
  for (const phrase of phrases) {
    seen.set(phrase, (seen.get(phrase) ?? 0) + 1);
  }
  return [...seen.values()].filter((count) => count > 1).length;
}

export function calculateDeterministicMetrics(
  turns: TranscriptTurn[],
  questionCount = 0,
): CalculatedMetric[] {
  const userText = userTurns(turns)
    .map((turn) => turn.text)
    .join(" ");
  const wordCount = countWords(userText);
  const duration = speakingDurationMs(turns);

  const values: Record<string, number> = {
    word_count: wordCount,
    speaking_duration_ms: duration,
    words_per_minute: wordsPerMinute(wordCount, duration),
    filler_word_count: countFillerWords(userText),
    filler_word_rate: fillerWordRate(userText),
    response_latency_ms: averageLatencyMs(turns),
    turn_count: userTurns(turns).length,
    question_coverage: questionCoverage(turns, questionCount),
    repeated_phrase_count: repeatedPhraseCount(userText),
  };

  return Object.entries(values).map(([metricKey, value]) => ({
    metricKey,
    value,
    source: "deterministic" as const,
    metricVersion: METRIC_VERSION,
  }));
}
