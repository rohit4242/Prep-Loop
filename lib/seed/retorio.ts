import { SEED_PACK_ID, SEED_SCENARIO_ID, SYSTEM_OWNER_ID } from "@/lib/constants";

export const retorioSeedPack = {
  id: SEED_PACK_ID,
  ownerId: SYSTEM_OWNER_ID,
  title: "Retorio Working Student — AI Product Engineering (Data)",
  targetRole: "Working Student, AI Product Engineering – Data",
  sourceType: "seed",
  sourceText: `Retorio is hiring a Working Student for AI Product Engineering – Data.

You will help productize AI interview and people-analytics models: evaluate data quality, design evaluation sets, analyze model behavior, and partner with engineers and product managers. Typical work includes Python analysis, SQL, experiment tracking, and turning messy real-world interview data into reliable product signals.

You should be enrolled as a student, comfortable with 10–20 hours per week, and able to explain technical tradeoffs clearly to a mixed audience.`,
};

export const retorioSeedScenario = {
  id: SEED_SCENARIO_ID,
  practicePackId: SEED_PACK_ID,
  title: "Technical interviewer — Retorio AI Product Engineering",
  interviewerPersona:
    "You are Maya, a calm senior product engineer at Retorio. You interview working-student candidates for AI Product Engineering – Data. You are curious, precise, and never invent company facts. You ask one question at a time, follow up on vague answers, and keep the conversation to about 8–10 minutes.",
  openingPrompt:
    "Thanks for joining. I'm Maya from AI Product Engineering at Retorio. We'll talk about how you work with data, evaluate models, and explain tradeoffs. To start: walk me through a data or ML project you owned and what you would do differently now.",
  version: 1,
  questions: [
    {
      category: "experience",
      prompt: "Walk me through a data or ML project you owned and what you would do differently now.",
    },
    {
      category: "data_quality",
      prompt: "How would you detect and handle noisy labels in interview or behavioral datasets?",
    },
    {
      category: "evaluation",
      prompt: "How would you design an evaluation set for an AI interview scoring model?",
    },
    {
      category: "product_sense",
      prompt: "If a model scores high technically but hiring managers distrust it, what would you investigate?",
    },
    {
      category: "python",
      prompt: "Describe a Python pipeline you would use to compute per-session metrics from transcripts.",
    },
    {
      category: "working_student",
      prompt: "How would you manage a 15-hour week across classes, this role, and a live experiment?",
    },
  ],
  approvedFacts: [
    "The role is Working Student, AI Product Engineering – Data at Retorio.",
    "Retorio builds AI interview and people-analytics products.",
    "The work focuses on data quality, evaluation, and productizing ML signals.",
    "Expected weekly hours are typically 10–20.",
    "The candidate should be an enrolled student.",
    "Core skills include Python, data analysis, and explaining tradeoffs.",
    "Raw candidate video is not stored by PrepLoop and should not be requested.",
  ],
  rubric: [
    { dimension: "clarity", description: "Answers are easy to follow and specific.", weight: 1 },
    { dimension: "technical_relevance", description: "Uses relevant data/ML concepts correctly.", weight: 1.2 },
    { dimension: "answer_structure", description: "Uses a clear structure such as situation, action, result.", weight: 1 },
    { dimension: "confidence", description: "Speaks with measured confidence, not bluffing.", weight: 0.8 },
    { dimension: "warmth", description: "Collaborative and professional tone.", weight: 0.7 },
    { dimension: "competence", description: "Shows ownership and practical judgment.", weight: 1.2 },
    { dimension: "role_relevance", description: "Connects answers to a working-student data/product role.", weight: 1 },
  ],
};
