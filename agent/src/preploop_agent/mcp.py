"""Minimal MCP JSON-RPC client used by the LiveKit worker."""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

APP_URL = os.environ.get("APP_URL", "http://localhost:3000").rstrip("/")
AGENT_INTERNAL_TOKEN = os.environ.get("AGENT_INTERNAL_TOKEN", "dev-agent-token")


class McpError(RuntimeError):
    pass


class PrepLoopMcpClient:
    def __init__(self, client: httpx.Client | None = None) -> None:
        self._client = client or httpx.Client(timeout=20.0)
        self._id = 0

    def call(self, name: str, arguments: dict[str, Any]) -> Any:
        self._id += 1
        response = self._client.post(
            f"{APP_URL}/api/mcp",
            headers={
                "Authorization": f"Bearer {AGENT_INTERNAL_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "jsonrpc": "2.0",
                "id": self._id,
                "method": "tools/call",
                "params": {"name": name, "arguments": arguments},
            },
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("error"):
            raise McpError(str(payload["error"]))
        content = payload.get("result", {}).get("content", [])
        if not content:
            return None
        return json.loads(content[0]["text"])

    def get_scenario_rubric(self, scenario_id: str) -> dict[str, Any]:
        return self.call("get_scenario_rubric", {"scenarioId": scenario_id})

    def get_approved_facts(self, scenario_id: str) -> list[str]:
        facts = self.call("get_approved_facts", {"scenarioId": scenario_id})
        return facts or []
