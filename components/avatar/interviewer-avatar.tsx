"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type AgentState = "idle" | "listening" | "thinking" | "speaking";

type InterviewerAvatarProps = {
  state: AgentState;
  amplitude?: number;
  label?: string;
};

export function InterviewerAvatar({
  state,
  amplitude = 0,
  label = "Technical Interviewer",
}: InterviewerAvatarProps) {
  const [blink, setBlink] = useState(false);
  const mouth = useMemo(() => {
    if (state !== "speaking") return 4;
    return 4 + Math.min(1, amplitude) * 18;
  }, [amplitude, state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  const faceColor =
    state === "thinking" ? "#dbeafe" : state === "listening" ? "#ecfeff" : "#f8fafc";

  return (
    <div className="flex flex-col items-center gap-3" data-agent-state={state}>
      <svg viewBox="0 0 200 220" className="h-64 w-64" role="img" aria-label={label}>
        <rect x="20" y="24" width="160" height="176" rx="36" fill={faceColor} stroke="#0f172a" strokeWidth="3" />
        <circle cx="72" cy="96" r="10" fill="#0f172a" />
        <circle cx="128" cy="96" r="10" fill="#0f172a" />
        {blink ? (
          <>
            <line x1="62" y1="96" x2="82" y2="96" stroke="#0f172a" strokeWidth="3" />
            <line x1="118" y1="96" x2="138" y2="96" stroke="#0f172a" strokeWidth="3" />
          </>
        ) : null}
        <ellipse cx="100" cy="148" rx="22" ry={mouth} fill="#0f172a" />
        {state === "thinking" ? (
          <text x="100" y="44" textAnchor="middle" fontSize="18">
            ...
          </text>
        ) : null}
      </svg>
      <div className="text-center">
        <p className="font-medium">{label}</p>
        <p className="text-sm capitalize text-muted-foreground">{state}</p>
      </div>
    </div>
  );
}

export function agentStateClass(state: AgentState) {
  return cn("rounded-full px-2 py-0.5 text-xs", {
    "bg-muted": state === "idle",
    "bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100": state === "listening",
    "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100": state === "thinking",
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100":
      state === "speaking",
  });
}
