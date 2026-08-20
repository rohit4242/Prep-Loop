import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { PracticePackSchema, ScenarioSchema } from "@/lib/ai/schemas";
import { isOpenAiConfigured } from "@/lib/env";

function fallbackPack(input: { targetRole: string; sourceText: string; sourceType: "paste" | "pdf" }) {
  return PracticePackSchema.parse({
    title: `${input.targetRole} practice pack`,
    targetRole: input.targetRole,
    sourceText: input.sourceText,
    sourceType: input.sourceType,
    summary: input.sourceText.slice(0, 400),
  });
}

function fallbackScenario(targetRole: string, sourceText: string) {
  return ScenarioSchema.parse({
    title: `Technical interviewer — ${targetRole}`,
    interviewerPersona: `You are a precise, supportive interviewer hiring for ${targetRole}. Ask one question at a time and stay inside approved facts.`,
    openingPrompt: `Thanks for joining. Let's begin with a project that shows how you would succeed as a ${targetRole}.`,
    questions: [
      { category: "experience", prompt: "Tell me about a project that best matches this role." },
      { category: "technical", prompt: "Walk me through a technical decision you made and why." },
      { category: "collaboration", prompt: "How do you work with product and engineering partners?" },
      { category: "working_student", prompt: "How would you balance this role with your studies?" },
    ],
    approvedFacts: sourceText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 12)
      .slice(0, 8)
      .concat([`The target role is ${targetRole}.`])
      .slice(0, 8),
    rubric: [
      { dimension: "clarity", description: "Answers are specific and easy to follow.", weight: 1 },
      { dimension: "technical_relevance", description: "Uses relevant technical concepts.", weight: 1 },
      { dimension: "answer_structure", description: "Has a beginning, action, and result.", weight: 1 },
      { dimension: "competence", description: "Shows ownership and judgment.", weight: 1 },
    ],
  });
}

export async function generatePracticePack(input: {
  targetRole: string;
  sourceText: string;
  sourceType: "paste" | "pdf";
}) {
  if (!isOpenAiConfigured()) {
    return fallbackPack(input);
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: PracticePackSchema,
    prompt: `Extract a student interview practice pack from this role and source text.
Target role: ${input.targetRole}
Source type: ${input.sourceType}
Source text:
${input.sourceText.slice(0, 12_000)}`,
  });

  return PracticePackSchema.parse(object);
}

export async function generateScenario(input: { targetRole: string; sourceText: string }) {
  if (!isOpenAiConfigured()) {
    return fallbackScenario(input.targetRole, input.sourceText);
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: ScenarioSchema,
    prompt: `Create a realistic working-student / technical interview scenario.
Do not invent employer facts that are not present in the source text.
Target role: ${input.targetRole}
Source text:
${input.sourceText.slice(0, 12_000)}`,
  });

  return ScenarioSchema.parse(object);
}
