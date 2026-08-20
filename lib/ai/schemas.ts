import { z } from "zod";
import { RUBRIC_DIMENSIONS } from "@/lib/metrics/definitions";

export const PracticePackSchema = z.object({
  title: z.string().min(3),
  targetRole: z.string().min(3),
  sourceText: z.string().min(20),
  sourceType: z.enum(["paste", "pdf", "seed"]),
  summary: z.string().min(10),
});

export const ScenarioSchema = z.object({
  title: z.string().min(3),
  interviewerPersona: z.string().min(20),
  openingPrompt: z.string().min(20),
  questions: z
    .array(
      z.object({
        category: z.string().min(2),
        prompt: z.string().min(8),
      }),
    )
    .min(4)
    .max(10),
  approvedFacts: z.array(z.string().min(8)).min(4).max(16),
  rubric: z
    .array(
      z.object({
        dimension: z.string().min(2),
        description: z.string().min(8),
        weight: z.number().positive(),
      }),
    )
    .min(4),
});

export const FeedbackDimensionSchema = z.object({
  dimension: z.enum(RUBRIC_DIMENSIONS),
  score: z.number().min(0).max(10),
  evidence: z.string().min(12),
});

export const FeedbackReportSchema = z.object({
  overallScore: z.number().min(0).max(10),
  dimensionScores: z.array(FeedbackDimensionSchema).min(1),
  strengths: z.array(z.string().min(8)).min(1).max(6),
  improvementActions: z.array(z.string().min(8)).min(1).max(6),
  nextPracticeRecommendation: z.string().min(12),
});

export const ProgressAnswerSchema = z.object({
  answer: z.string().min(8),
  usedMetricKeys: z.array(z.string()),
  recommendation: z.string().min(8),
});

export type PracticePackOutput = z.infer<typeof PracticePackSchema>;
export type ScenarioOutput = z.infer<typeof ScenarioSchema>;
export type FeedbackReportOutput = z.infer<typeof FeedbackReportSchema>;
export type ProgressAnswerOutput = z.infer<typeof ProgressAnswerSchema>;
