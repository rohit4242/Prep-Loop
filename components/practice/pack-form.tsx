"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PracticePackForm() {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState("Working Student, AI Product Engineering – Data");
  const [sourceText, setSourceText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitPaste() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/practice-packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRole, sourceText, sourceType: "paste" }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not generate a scenario.");
      return;
    }
    router.push(`/practice/${data.packId}`);
  }

  async function submitPdf() {
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("targetRole", targetRole);
    form.set("file", file);
    const response = await fetch("/api/practice-packs", { method: "POST", body: form });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not extract the PDF.");
      return;
    }
    router.push(`/practice/${data.packId}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a practice pack</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="grid gap-2 text-sm font-medium">
          Target role
          <Input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} />
        </label>
        <Tabs defaultValue="paste">
          <TabsList>
            <TabsTrigger value="paste">Paste text</TabsTrigger>
            <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="space-y-3 pt-3">
            <Textarea
              rows={10}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste a job description or CV text"
            />
            <Button onClick={() => void submitPaste()} disabled={loading}>
              Generate scenario
            </Button>
          </TabsContent>
          <TabsContent value="pdf" className="space-y-3 pt-3">
            <Input
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-sm text-muted-foreground">
              Text is extracted on the server. The original PDF is discarded.
            </p>
            <Button onClick={() => void submitPdf()} disabled={loading}>
              Generate scenario
            </Button>
          </TabsContent>
        </Tabs>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}
        {error ? (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
