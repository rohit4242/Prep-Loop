import { notFound } from "next/navigation";
import { requirePageUserId } from "@/lib/auth/protect-page";
import { getPracticePackForOwner } from "@/lib/db/queries";
import { getDb } from "@/lib/db";
import { scenarios } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ScenarioReview } from "@/components/practice/scenario-review";

export default async function PracticeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requirePageUserId();
  const pack = await getPracticePackForOwner(id, userId);
  if (!pack) notFound();
  const db = getDb();
  const [scenario] = await db
    .select()
    .from(scenarios)
    .where(eq(scenarios.practicePackId, pack.id))
    .orderBy(desc(scenarios.createdAt))
    .limit(1);
  if (!scenario) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Review scenario</h1>
      <ScenarioReview
        packTitle={pack.title}
        targetRole={pack.targetRole}
        scenario={scenario}
      />
    </div>
  );
}
