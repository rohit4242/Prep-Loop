import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { FeedbackReportSchema, type FeedbackReportOutput } from "@/lib/ai/schemas";
import { isOpenAiConfigured } from "@/lib/env";
import { RUBRIC_DIMENSIONS } from "@/lib/metrics/definitions";
import { normalizeScore } from "@/lib/metrics/fillers";
import type { TranscriptTurn } from "@/lib/metrics/calculate";

function fallbackFeedback(transcript: string): FeedbackReportOutput {
  const hasContent = transcript.trim().length > 40;
  const score = hasContent ? 6.5 : 3;
  return FeedbackReportSchema.parse({
    overallScore: score,
    dimensionScores: RUBRIC_DIMENSIONS.map((dimension) => ({
      dimension,
      score,
      evidence: hasContent
        ? `Based on the transcript, the candidate showed mixed performance on ${dimension.replaceAll("_", " ")}.`
        : `The transcript does not contain enough evidence to score ${dimension.replaceAll("_", " ")} highly.`,
    })),
    strengths: hasContent
      ? ["The candidate attempted to answer the interviewer's questions."]
      : ["The session was started and can be used as a baseline."],
    improvementActions: [
      "Give a concrete example with situation, action, and result.",
      "Tie answers back to the working-student role and data work.",
    ],
    nextPracticeRecommendation:
      "Practice a 90-second structured answer about a data quality or evaluation project.",
  });
}

export async function generateFeedbackReport(input: {
  transcript: string;
  approvedFacts: string[];
  rubric: Array<{ dimension: string; description: string }>;
}): Promise<FeedbackReportOutput> {
  if (!isOpenAiConfigured() || input.transcript.trim().length < 20) {
    return fallbackFeedback(input.transcript);
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: FeedbackReportSchema,
    prompt: `Score this interview using only transcript evidence.
If a dimension has no supporting evidence, use a low score and say so.
Do not invent facts that are absent from approved facts.

Approved facts:
${input.approvedFacts.map((fact) => `- ${fact}`).join("\n")}

Rubric:
${input.rubric.map((item) => `- ${item.dimension}: ${item.description}`).join("\n")}

Transcript:
${input.transcript.slice(0, 16_000)}`,
  });

  return {
    ...object,
    overallScore: normalizeScore(object.overallScore),
    dimensionScores: object.dimensionScores.map((item) => ({
      ...item,
      score: normalizeScore(item.score),
    })),
  };
}

export function formatTranscript(turns: TranscriptTurn[]): string {
  return turns
    .map((turn) => `${turn.speaker}: ${turn.text}`)
    .join("\n");
}
