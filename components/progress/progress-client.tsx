"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProgressPayload = {
  summary?: {
    averageScore: number;
    bestImprovement: number;
    weakestDimension: string;
    sessionCount: number;
  };
  suggestion?: { recommendation: string };
  sessions?: Array<{ id: string; status: string }>;
};

export function ProgressClient() {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [prompt, setPrompt] = useState("What improved?");
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/progress")
      .then((response) => response.json())
      .then(setData);
  }, []);

  async function ask() {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const payload = await response.json();
    setAnswer(payload.answer ?? payload.error);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Average score</CardTitle>
          </CardHeader>
          <CardContent>{data?.summary?.averageScore?.toFixed(1) ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Best improvement</CardTitle>
          </CardHeader>
          <CardContent>{data?.summary?.bestImprovement ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weakest area</CardTitle>
          </CardHeader>
          <CardContent className="capitalize">
            {data?.summary?.weakestDimension?.replaceAll("_", " ") ?? "—"}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ask about my progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <Button onClick={() => void ask()}>Ask</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["What improved?", "Which interview area is weakest?", "What should I practice next?"].map(
              (item) => (
                <Button key={item} variant="outline" onClick={() => setPrompt(item)}>
                  {item}
                </Button>
              ),
            )}
          </div>
          {answer ? <p className="text-sm">{answer}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2 text-sm">
              {(data?.sessions ?? []).map((session) => (
                <p key={session.id} className="capitalize">
                  {session.id.slice(0, 18)} — {session.status.replaceAll("_", " ")}
                </p>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
