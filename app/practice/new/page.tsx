import { PracticePackForm } from "@/components/practice/pack-form";
import { requirePageUserId } from "@/lib/auth/protect-page";

export default async function NewPracticePage() {
  await requirePageUserId();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">New practice pack</h1>
      <PracticePackForm />
    </div>
  );
}
