import Link from "next/link";
import { requirePageUserId } from "@/lib/auth/protect-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgressSummaryTool, suggestNextPracticeTool } from "@/lib/mcp/tools";
import { listRecentSessions } from "@/lib/db/queries";

export default async function DashboardPage() {
  const userId = await requirePageUserId();

  let summary = {
    sessionCount: 0,
    averageScore: 0,
    latestScore: 0,
    bestImprovement: 0,
    weakestDimension: "clarity",
    weakestScore: 0,
    recentScores: [] as number[],
  };
  let recommendation = "Create a practice pack and complete your first interview.";
  let sessions: Awaited<ReturnType<typeof listRecentSessions>> = [];

  try {
    [summary, { recommendation }, sessions] = await Promise.all([
      getProgressSummaryTool({ ownerId: userId }),
      suggestNextPracticeTool({ ownerId: userId }),
      listRecentSessions(userId, 5),
    ]);
  } catch {
    // Database may be unconfigured during first boot.
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Practice, review scores, and keep a measurable loop.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/practice/new" />}>Start practice</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Average score</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{summary.averageScore.toFixed(1)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Best improvement</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.bestImprovement > 0 ? "+" : ""}
            {summary.bestImprovement.toFixed(1)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weakest dimension</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {summary.weakestDimension.replaceAll("_", " ")}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Practice recommendation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{recommendation}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground">No interviews yet.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-3">
                <span className="capitalize">{session.status.replaceAll("_", " ")}</span>
                <Button nativeButton={false} variant="ghost" render={<Link href={`/feedback/${session.id}`} />}>
                  View
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
