import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSignedInOwner } from "@/lib/auth/owner";
import { ProgressAnswerSchema } from "@/lib/ai/schemas";
import {
  getProgressSummaryTool,
  getSessionMetricsTool,
  suggestNextPracticeTool,
} from "@/lib/mcp/tools";
import { isOpenAiConfigured } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const owner = await requireSignedInOwner();
    const { prompt } = z.object({ prompt: z.string().min(3) }).parse(await request.json());

    const tools = {
      get_progress_summary: tool({
        description: "Load stored progress metrics for the signed-in user.",
        inputSchema: z.object({}),
        execute: async () => getProgressSummaryTool({ ownerId: owner.ownerId }),
      }),
      get_session_metrics: tool({
        description: "Load stored metrics for one of the user's sessions.",
        inputSchema: z.object({ sessionId: z.string() }),
        execute: async ({ sessionId }) =>
          getSessionMetricsTool({ sessionId, ownerId: owner.ownerId }),
      }),
      suggest_next_practice: tool({
        description: "Recommend the next practice from stored metrics.",
        inputSchema: z.object({}),
        execute: async () => suggestNextPracticeTool({ ownerId: owner.ownerId }),
      }),
    };

    if (!isOpenAiConfigured()) {
      const summary = await getProgressSummaryTool({ ownerId: owner.ownerId });
      const suggestion = await suggestNextPracticeTool({ ownerId: owner.ownerId });
      return NextResponse.json(
        ProgressAnswerSchema.parse({
          answer: `Average score is ${summary.averageScore}. Weakest area: ${summary.weakestDimension.replaceAll("_", " ")}.`,
          usedMetricKeys: ["averageScore", "weakestDimension"],
          recommendation: suggestion.recommendation,
        }),
      );
    }

    const { text, steps } = await generateText({
      model: openai("gpt-4o-mini"),
      tools,
      prompt,
      system:
        "You are PrepLoop's progress assistant. Answer only from tool results. Never invent scores. If tools return empty data, say there is not enough history yet.",
    });

    const usedMetricKeys = steps.flatMap((step) =>
      step.toolResults?.map((result) => result.toolName) ?? [],
    );
    const suggestion = await suggestNextPracticeTool({ ownerId: owner.ownerId });

    return NextResponse.json(
      ProgressAnswerSchema.parse({
        answer: text,
        usedMetricKeys,
        recommendation: suggestion.recommendation,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    const status = message === "SIGN_IN_REQUIRED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
