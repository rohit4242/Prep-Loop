"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Scenario = {
  id: string;
  title: string;
  interviewerPersona: string;
  openingPrompt: string;
  questions: Array<{ category: string; prompt: string }>;
  approvedFacts: string[];
};

export function ScenarioReview({
  packTitle,
  targetRole,
  scenario,
}: {
  packTitle: string;
  targetRole: string;
  scenario: Scenario;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: scenario.id }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      router.push(`/interview/${data.sessionId}`);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{packTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{targetRole}</p>
          <p>{scenario.title}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Interviewer persona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">{scenario.interviewerPersona}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Opening prompt</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">{scenario.openingPrompt}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Question categories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {scenario.questions.map((question) => (
            <Badge key={question.prompt} variant="secondary">
              {question.category}
            </Badge>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Approved facts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {scenario.approvedFacts.map((fact) => (
            <p key={fact}>{fact}</p>
          ))}
        </CardContent>
      </Card>
      <Button onClick={() => void start()} disabled={loading}>
        Start interview
      </Button>
    </div>
  );
}
