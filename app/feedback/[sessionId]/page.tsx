"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type FeedbackPayload = {
  session?: {
    transcript?: Array<{ speaker: string; text: string }>;
  };
  report?: {
    overallScore: number;
    dimensionScores: Array<{ dimension: string; score: number; evidence: string }>;
    strengths: string[];
    improvementActions: string[];
    nextPracticeRecommendation: string;
  } | null;
  metrics?: Array<{ metricKey: string; value: number; source: string }>;
};

export default function FeedbackPage() {
  const params = useParams<{ sessionId: string }>();
  const [data, setData] = useState<FeedbackPayload | null>(null);

  useEffect(() => {
    void fetch(`/api/sessions/${params.sessionId}/feedback`)
      .then((response) => response.json())
      .then(setData);
  }, [params.sessionId]);

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const report = data.report;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Interview feedback</h1>
        <div className="flex gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href="/practice/new" />}>
            Practice this weakness again
          </Button>
          <Button nativeButton={false} render={<Link href="/progress" />}>Ask about my progress</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Overall score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-4xl font-semibold">{(report?.overallScore ?? 0).toFixed(1)}</p>
          <Progress value={(report?.overallScore ?? 0) * 10} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {(report?.dimensionScores ?? []).map((item) => (
          <Card key={item.dimension}>
            <CardHeader>
              <CardTitle className="capitalize">{item.dimension.replaceAll("_", " ")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-medium">{item.score.toFixed(1)}</p>
              <p className="text-muted-foreground">{item.evidence}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(report?.strengths ?? []).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(report?.improvementActions ?? []).map((item) => (
              <p key={item}>{item}</p>
            ))}
            <p className="text-muted-foreground">{report?.nextPracticeRecommendation}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Metric details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(data.metrics ?? []).map((metric) => (
            <Badge key={metric.metricKey} variant="secondary">
              {metric.metricKey}: {metric.value}
            </Badge>
          ))}
        </CardContent>
      </Card>
      <Accordion>
        <AccordionItem value="transcript">
          <AccordionTrigger>Transcript</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              {(data.session?.transcript ?? []).map((line, index) => (
                <p key={`${line.speaker}-${index}`}>
                  <span className="font-medium capitalize">{line.speaker}: </span>
                  {line.text}
                </p>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
