import { ProgressClient } from "@/components/progress/progress-client";
import { requirePageUserId } from "@/lib/auth/protect-page";

export default async function ProgressPage() {
  await requirePageUserId();
  return <ProgressClient />;
}
