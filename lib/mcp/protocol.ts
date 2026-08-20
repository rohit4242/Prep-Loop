import { z } from "zod";
import {
  getApprovedFactsTool,
  getPracticePackTool,
  getProgressSummaryTool,
  getScenarioRubricTool,
  getSessionMetricsTool,
  recordTurnEventTool,
  saveSessionResultTool,
  suggestNextPracticeTool,
} from "@/lib/mcp/tools";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
};

const toolList = [
  {
    name: "get_practice_pack",
    description: "Load a practice pack by id for the current owner.",
    inputSchema: {
      type: "object",
      properties: {
        practicePackId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["practicePackId", "ownerId"],
    },
  },
  {
    name: "get_scenario_rubric",
    description: "Load interviewer persona, questions, and rubric for a scenario.",
    inputSchema: {
      type: "object",
      properties: { scenarioId: { type: "string" } },
      required: ["scenarioId"],
    },
  },
  {
    name: "get_approved_facts",
    description: "Return approved facts the interviewer may use. Never invent extra facts.",
    inputSchema: {
      type: "object",
      properties: { scenarioId: { type: "string" } },
      required: ["scenarioId"],
    },
  },
  {
    name: "record_turn_event",
    description: "Persist one conversation turn for a session.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        speaker: { type: "string" },
        text: { type: "string" },
        startedAt: { type: "string" },
        endedAt: { type: "string" },
        durationMs: { type: "number" },
      },
      required: ["sessionId", "speaker", "text"],
    },
  },
  {
    name: "save_session_result",
    description: "Mark a session as processing, complete, or failed.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        status: { type: "string", enum: ["processing", "complete", "failed"] },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "get_session_metrics",
    description: "Return stored metrics for a session owned by the caller.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["sessionId", "ownerId"],
    },
  },
  {
    name: "get_progress_summary",
    description: "Return average score, improvement, and weakest dimension from stored sessions.",
    inputSchema: {
      type: "object",
      properties: { ownerId: { type: "string" } },
      required: ["ownerId"],
    },
  },
  {
    name: "suggest_next_practice",
    description: "Recommend the next practice focus from stored metrics.",
    inputSchema: {
      type: "object",
      properties: { ownerId: { type: "string" } },
      required: ["ownerId"],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "get_practice_pack":
      return getPracticePackTool(
        z.object({ practicePackId: z.string(), ownerId: z.string() }).parse(args),
      );
    case "get_scenario_rubric":
      return getScenarioRubricTool(z.object({ scenarioId: z.string() }).parse(args));
    case "get_approved_facts":
      return getApprovedFactsTool(z.object({ scenarioId: z.string() }).parse(args));
    case "record_turn_event":
      return recordTurnEventTool(
        z
          .object({
            sessionId: z.string(),
            speaker: z.string(),
            text: z.string(),
            startedAt: z.string().optional(),
            endedAt: z.string().optional(),
            durationMs: z.number().optional(),
          })
          .parse(args),
      );
    case "save_session_result":
      return saveSessionResultTool(
        z
          .object({
            sessionId: z.string(),
            status: z.enum(["processing", "complete", "failed"]).optional(),
          })
          .parse(args),
      );
    case "get_session_metrics":
      return getSessionMetricsTool(
        z.object({ sessionId: z.string(), ownerId: z.string() }).parse(args),
      );
    case "get_progress_summary":
      return getProgressSummaryTool(z.object({ ownerId: z.string() }).parse(args));
    case "suggest_next_practice":
      return suggestNextPracticeTool(z.object({ ownerId: z.string() }).parse(args));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function textResult(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

export async function handleMcpRequest(body: JsonRpcRequest) {
  const id = body.id ?? null;
  const method = body.method ?? "";

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "preploop-mcp", version: "1.0.0" },
      },
    };
  }

  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return null;
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: toolList } };
  }

  if (method === "tools/call") {
    const name = body.params?.name;
    if (!name) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: "Missing tool name" },
      };
    }
    const result = await callTool(name, body.params?.arguments ?? {});
    return { jsonrpc: "2.0", id, result: textResult(result) };
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

export { toolList, callTool };
