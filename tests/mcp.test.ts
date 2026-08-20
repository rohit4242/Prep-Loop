import { describe, expect, it } from "vitest";
import { callTool, handleMcpRequest } from "@/lib/mcp/protocol";
import { retorioSeedScenario } from "@/lib/seed/retorio";

describe("MCP and AI tool contracts", () => {
  it("lists the expected tools", async () => {
    const response = await handleMcpRequest({ method: "tools/list", id: 1 });
    const names = (response?.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name);
    expect(names).toContain("get_approved_facts");
    expect(names).toContain("get_progress_summary");
    expect(names).toContain("record_turn_event");
  });

  it("keeps approved facts bounded to the seeded scenario", () => {
    expect(retorioSeedScenario.approvedFacts.every((fact) => fact.length > 8)).toBe(true);
    expect(
      retorioSeedScenario.approvedFacts.some((fact) => fact.toLowerCase().includes("retorio")),
    ).toBe(true);
  });

  it("rejects unknown tools", async () => {
    await expect(callTool("invent_facts", {})).rejects.toThrow(/Unknown tool/);
  });
});
