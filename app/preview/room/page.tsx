"use client";

import { InterviewRoom } from "@/components/interview/room";
import { Button } from "@/components/ui/button";

export default function PreviewRoomPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8">
      <div className="flex gap-2">
        {(["idle", "listening", "thinking", "speaking"] as const).map((state) => (
          <Button
            key={state}
            variant="outline"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("preploop:agent-state", { detail: state }))
            }
          >
            {state}
          </Button>
        ))}
      </div>
      <InterviewRoom
        sessionId="preview"
        serverUrl=""
        participantToken=""
        mock
        personaLabel="Technical Interviewer"
      />
    </div>
  );
}
