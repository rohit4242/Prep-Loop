"""HTTP helpers for the PrepLoop LiveKit worker."""

from __future__ import annotations

import os
import time
from typing import Any

import httpx

APP_URL = os.environ.get("APP_URL", "http://localhost:3000").rstrip("/")
AGENT_INTERNAL_TOKEN = os.environ.get("AGENT_INTERNAL_TOKEN", "dev-agent-token")


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {AGENT_INTERNAL_TOKEN}",
        "Content-Type": "application/json",
    }


def record_turn(session_id: str, payload: dict[str, Any], client: httpx.Client | None = None) -> dict[str, Any]:
    http = client or httpx.Client(timeout=15.0)
    response = http.post(
        f"{APP_URL}/api/internal/sessions/{session_id}/events",
        headers=_headers(),
        json=payload,
    )
    response.raise_for_status()
    return response.json()


def finalize_session_once(
    session_id: str,
    *,
    retries: int = 3,
    client: httpx.Client | None = None,
    sleep: float = 0.4,
) -> dict[str, Any]:
    http = client or httpx.Client(timeout=30.0)
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            response = http.post(
                f"{APP_URL}/api/internal/sessions/{session_id}/finalize",
                headers=_headers(),
                json={},
            )
            if response.status_code >= 500 or response.status_code in {408, 429}:
                raise httpx.TimeoutException(f"finalize failed: {response.status_code}")
            response.raise_for_status()
            data = response.json()
            data["attempts"] = attempt + 1
            return data
        except (httpx.TimeoutException, httpx.TransportError) as error:
            last_error = error
            time.sleep(sleep * (attempt + 1))
    if last_error:
        raise last_error
    raise RuntimeError("finalize failed")
