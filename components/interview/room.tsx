"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
} from "livekit-client";
import { InterviewerAvatar, type AgentState } from "@/components/avatar/interviewer-avatar";
import { useAudioAmplitude } from "@/components/avatar/use-audio-amplitude";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

type TranscriptLine = { speaker: string; text: string };

type InterviewRoomProps = {
  sessionId: string;
  serverUrl: string;
  participantToken: string;
  mock?: boolean;
  personaLabel?: string;
};

function parseAgentState(payload: string): AgentState | null {
  try {
    const data = JSON.parse(payload) as { type?: string; state?: AgentState };
    if (data.type === "agent_state" && data.state) return data.state;
  } catch {
    return null;
  }
  return null;
}

function parseTranscript(payload: string): TranscriptLine | null {
  try {
    const data = JSON.parse(payload) as {
      type?: string;
      speaker?: string;
      text?: string;
    };
    if (data.type === "transcript" && data.speaker && data.text) {
      return { speaker: data.speaker, text: data.text };
    }
  } catch {
    return null;
  }
  return null;
}

export function InterviewRoom({
  sessionId,
  serverUrl,
  participantToken,
  mock = false,
  personaLabel = "Technical Interviewer",
}: InterviewRoomProps) {
  const router = useRouter();
  const [state, setState] = useState<AgentState>("idle");
  const [connection, setConnection] = useState(() =>
    !serverUrl || !participantToken || mock ? (mock ? "preview" : "offline") : "connecting",
  );
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [audioTrack, setAudioTrack] = useState<RemoteTrack>();
  const [ending, setEnding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const amplitude = useAudioAmplitude(audioTrack);

  const canConnect = Boolean(serverUrl && participantToken) && !mock;

  useEffect(() => {
    const onTestState = (event: Event) => {
      const detail = (event as CustomEvent<AgentState>).detail;
      if (detail) setState(detail);
    };
    window.addEventListener("preploop:agent-state", onTestState);
    return () => window.removeEventListener("preploop:agent-state", onTestState);
  }, []);

  useEffect(() => {
    if (!canConnect) {
      return;
    }

    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.ConnectionStateChanged, (next) => {
      setConnection(next);
    });
    room.on(RoomEvent.DataReceived, (payload) => {
      const text = new TextDecoder().decode(payload);
      const nextState = parseAgentState(text);
      if (nextState) setState(nextState);
      const line = parseTranscript(text);
      if (line) setTranscript((current) => [...current, line]);
    });
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        setAudioTrack(track);
        track.attach();
      }
      if (track.kind === Track.Kind.Video) {
        const el = track.attach();
        el.className = "hidden";
      }
    });

    void room
      .connect(serverUrl, participantToken)
      .then(async () => {
        await room.localParticipant.setMicrophoneEnabled(true);
        setMicEnabled(true);
      })
      .catch(() => setConnection("failed"));

    return () => {
      void room.disconnect();
    };
  }, [canConnect, mock, participantToken, serverUrl]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || !videoRef.current) return;
    const cameraPub = [...room.localParticipant.videoTrackPublications.values()][0];
    if (cameraEnabled && cameraPub?.track) {
      cameraPub.track.attach(videoRef.current);
    }
  }, [cameraEnabled]);

  const statusLabel = useMemo(() => {
    if (connection === ConnectionState.Connected) return "Connected";
    return connection;
  }, [connection]);

  async function toggleCamera() {
    const room = roomRef.current;
    if (!room) {
      setCameraEnabled((value) => !value);
      return;
    }
    const next = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCameraEnabled(next);
  }

  async function toggleMic() {
    const room = roomRef.current;
    if (!room) {
      setMicEnabled((value) => !value);
      return;
    }
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }

  async function endInterview() {
    setEnding(true);
    roomRef.current?.disconnect();
    await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" }).catch(() => undefined);
    router.push(`/feedback/${sessionId}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Interview room</CardTitle>
          <Badge variant="outline">{statusLabel}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <InterviewerAvatar state={state} amplitude={amplitude} label={personaLabel} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Mic {micEnabled ? "on" : "off"}</Badge>
            <Badge variant="secondary">Camera {cameraEnabled ? "on" : "off"}</Badge>
            <Button variant="outline" onClick={() => void toggleMic()}>
              Toggle microphone
            </Button>
            <Button variant="outline" onClick={() => void toggleCamera()}>
              Toggle camera
            </Button>
            <Button variant="destructive" onClick={() => void endInterview()} disabled={ending}>
              End interview
            </Button>
          </div>
          <video
            ref={videoRef}
            className="h-32 w-44 rounded-lg border bg-muted object-cover"
            muted
            playsInline
            autoPlay
          />
          <Alert>
            <AlertDescription>Your video is not stored.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Live transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[28rem] pr-3">
            <div className="space-y-3 text-sm">
              {transcript.length === 0 ? (
                <p className="text-muted-foreground">Waiting for the interviewer...</p>
              ) : (
                transcript.map((line, index) => (
                  <p key={`${line.speaker}-${index}`}>
                    <span className="font-medium capitalize">{line.speaker}: </span>
                    {line.text}
                  </p>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
