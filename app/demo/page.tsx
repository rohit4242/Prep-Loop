"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retorioSeedScenario } from "@/lib/seed/retorio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    setError(null);
    const bootstrap = await fetch("/api/demo/start", { method: "POST" });
    if (!bootstrap.ok) {
      setLoading(false);
      setError("Could not start the guest demo. Check DATABASE_URL.");
      return;
    }
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not create a demo session.");
      return;
    }
    router.push(`/interview/${data.sessionId}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Guest interview demo</h1>
        <p className="mt-2 text-muted-foreground">
          Try the seeded Retorio Working Student AI Product Engineering scenario without creating an account.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{retorioSeedScenario.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{retorioSeedScenario.interviewerPersona}</p>
          <p className="text-muted-foreground">{retorioSeedScenario.openingPrompt}</p>
        </CardContent>
      </Card>
      <Button onClick={() => void start()} disabled={loading}>
        Start demo interview
      </Button>
      {error ? (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
