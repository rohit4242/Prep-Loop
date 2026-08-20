"""PrepLoop LiveKit interview agent."""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

from livekit.agents import Agent, AgentSession, AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.plugins import openai

from preploop_agent.http import finalize_session_once, record_turn
from preploop_agent.mcp import PrepLoopMcpClient

AGENT_NAME = "preploop-interviewer"


class Interviewer(Agent):
    def __init__(self, instructions: str) -> None:
        super().__init__(instructions=instructions)


async def publish_state(ctx: JobContext, state: str) -> None:
    payload = json.dumps({"type": "agent_state", "state": state}).encode()
    await ctx.room.local_participant.publish_data(payload, reliable=True)


async def publish_transcript(ctx: JobContext, speaker: str, text: str) -> None:
    payload = json.dumps({"type": "transcript", "speaker": speaker, "text": text}).encode()
    await ctx.room.local_participant.publish_data(payload, reliable=True)


def build_instructions(scenario: dict[str, Any], facts: list[str]) -> str:
    questions = "\n".join(
        f"- ({item.get('category')}) {item.get('prompt')}" for item in scenario.get("questions", [])
    )
    fact_lines = "\n".join(f"- {fact}" for fact in facts)
    return f"""
You are a live technical interviewer.

Persona:
{scenario.get("interviewerPersona", "")}

Opening:
{scenario.get("openingPrompt", "")}

Question plan:
{questions}

Approved facts. Never invent facts outside this list:
{fact_lines}

Rules:
- Ask one question at a time.
- Follow up when an answer is vague.
- Keep the interview to about 8-10 minutes.
- Stay inside approved facts.
- After the last question, thank the candidate and end politely.
""".strip()


async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    metadata = json.loads(ctx.job.metadata or "{}")
    session_id = metadata["sessionId"]
    scenario_id = metadata["scenarioId"]
    finalized = False

    mcp_client = PrepLoopMcpClient()
    scenario = mcp_client.get_scenario_rubric(scenario_id)
    facts = mcp_client.get_approved_facts(scenario_id)

    await publish_state(ctx, "thinking")
    session = AgentSession(
        stt=openai.STT(),
        llm=openai.LLM(model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini")),
        tts=openai.TTS(),
    )

    async def on_user_transcript(text: str) -> None:
        record_turn(session_id, {"speaker": "user", "text": text})
        await publish_transcript(ctx, "user", text)
        await publish_state(ctx, "thinking")

    async def on_agent_transcript(text: str) -> None:
        record_turn(session_id, {"speaker": "agent", "text": text})
        await publish_transcript(ctx, "agent", text)
        await publish_state(ctx, "speaking")

    @session.on("user_input_transcribed")
    def _user(ev: Any) -> None:
        if getattr(ev, "is_final", True) and getattr(ev, "transcript", ""):
            asyncio.create_task(on_user_transcript(ev.transcript))

    @session.on("agent_speech_committed")
    def _agent(ev: Any) -> None:
        text = getattr(ev, "text", None) or getattr(ev, "content", "")
        if text:
            asyncio.create_task(on_agent_transcript(str(text)))

    await session.start(agent=Interviewer(build_instructions(scenario, facts)), room=ctx.room)
    await publish_state(ctx, "speaking")
    await session.generate_reply(instructions=scenario.get("openingPrompt") or "Greet the candidate and ask the first question.")

    async def shutdown() -> None:
        nonlocal finalized
        if finalized:
            return
        finalized = True
        await publish_state(ctx, "idle")
        finalize_session_once(session_id)

    ctx.add_shutdown_callback(shutdown)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name=AGENT_NAME))
