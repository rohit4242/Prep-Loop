import { describe, expect, it } from "vitest";
import { PracticePackSchema, ScenarioSchema } from "@/lib/ai/schemas";
import {
  countFillerWords,
  countWords,
  fillerWordRate,
  normalizeScore,
  wordsPerMinute,
} from "@/lib/metrics/fillers";
import { calculateDeterministicMetrics } from "@/lib/metrics/calculate";

describe("practice pack and scenario schemas", () => {
  it("validates a practice pack", () => {
    const parsed = PracticePackSchema.parse({
      title: "Retorio pack",
      targetRole: "Working Student AI PE",
      sourceText: "A".repeat(40),
      sourceType: "paste",
      summary: "A working-student data role at Retorio.",
    });
    expect(parsed.title).toContain("Retorio");
  });

  it("rejects a scenario without approved facts", () => {
    expect(() =>
      ScenarioSchema.parse({
        title: "Too thin",
        interviewerPersona: "short",
        openingPrompt: "hi",
        questions: [],
        approvedFacts: [],
        rubric: [],
      }),
    ).toThrow();
  });
});

describe("metrics", () => {
  it("counts filler words", () => {
    expect(countFillerWords("Um, I like, you know, actually built it")).toBeGreaterThan(2);
  });

  it("calculates words per minute", () => {
    expect(wordsPerMinute(120, 60_000)).toBe(120);
  });

  it("normalizes scores", () => {
    expect(normalizeScore(12)).toBe(10);
    expect(normalizeScore(-1)).toBe(0);
  });

  it("computes deterministic session metrics", () => {
    const metrics = calculateDeterministicMetrics(
      [
        {
          speaker: "agent",
          text: "Tell me about a project?",
          startedAt: "2026-01-01T10:00:00.000Z",
          endedAt: "2026-01-01T10:00:04.000Z",
        },
        {
          speaker: "user",
          text: "I built a Python pipeline for um data quality checks.",
          startedAt: "2026-01-01T10:00:05.000Z",
          endedAt: "2026-01-01T10:00:15.000Z",
        },
      ],
      4,
    );
    const byKey = Object.fromEntries(metrics.map((metric) => [metric.metricKey, metric.value]));
    expect(byKey.word_count).toBe(countWords("I built a Python pipeline for um data quality checks."));
    expect(byKey.filler_word_count).toBeGreaterThan(0);
    expect(byKey.turn_count).toBe(1);
    expect(byKey.response_latency_ms).toBe(1000);
  });

  it("computes filler rate from word count", () => {
    expect(fillerWordRate("um um hello world")).toBeGreaterThan(0);
  });
});
