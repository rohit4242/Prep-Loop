from unittest.mock import Mock

import httpx
import pytest

from preploop_agent.http import finalize_session_once, record_turn


class FakeResponse:
    def __init__(self, status_code: int, payload: dict) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> dict:
        return self._payload

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("error", request=Mock(), response=Mock(status_code=self.status_code))


def test_record_turn_posts_event() -> None:
    client = Mock()
    client.post.return_value = FakeResponse(200, {"turn": {"id": "1"}})
    result = record_turn("session-1", {"speaker": "user", "text": "hello"}, client=client)
    assert result["turn"]["id"] == "1"
    assert "/api/internal/sessions/session-1/events" in client.post.call_args.args[0]


def test_finalize_retries_timeout_then_succeeds() -> None:
    client = Mock()
    client.post.side_effect = [
        httpx.TimeoutException("timeout"),
        FakeResponse(200, {"ok": True, "alreadyFinalized": False}),
    ]
    result = finalize_session_once("session-1", client=client, sleep=0)
    assert result["ok"] is True
    assert result["attempts"] == 2
    assert client.post.call_count == 2


def test_finalize_is_safe_to_call_after_success() -> None:
    client = Mock()
    client.post.return_value = FakeResponse(200, {"ok": True, "alreadyFinalized": True})
    first = finalize_session_once("session-1", client=client, sleep=0)
    second = finalize_session_once("session-1", client=client, sleep=0)
    assert first["alreadyFinalized"] is True
    assert second["alreadyFinalized"] is True


def test_agent_loads_scenario_through_mcp(monkeypatch: pytest.MonkeyPatch) -> None:
    from preploop_agent.mcp import PrepLoopMcpClient

    client = Mock()
    client.post.return_value = FakeResponse(
        200,
        {"result": {"content": [{"type": "text", "text": "{\"title\":\"Maya\"}"}]}},
    )
    mcp = PrepLoopMcpClient(client=client)
    data = mcp.get_scenario_rubric("scenario-1")
    assert data["title"] == "Maya"


def test_tool_failure_raises() -> None:
    from preploop_agent.mcp import McpError, PrepLoopMcpClient

    client = Mock()
    client.post.return_value = FakeResponse(200, {"error": {"message": "boom"}})
    mcp = PrepLoopMcpClient(client=client)
    with pytest.raises(McpError):
        mcp.get_approved_facts("scenario-1")
