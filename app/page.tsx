import Link from "next/link";
import { ArrowRight, Mic, ClipboardCheck, LineChart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Add a role",
    body: "Paste a CV or job description. PrepLoop builds a realistic interview scenario.",
  },
  {
    icon: Mic,
    title: "Speak in a live room",
    body: "Join a browser interview with a Python AI interviewer and a custom 2D avatar.",
  },
  {
    icon: LineChart,
    title: "Get scored progress",
    body: "See transcript-backed feedback, metrics, and what to practice next.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-16">
      <section className="max-w-3xl space-y-6">
        <p className="text-sm font-medium text-muted-foreground">
          Student interview coach
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Practice the interview you actually have to pass.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
          Working-student and technical interviews are high-stakes and hard to
          rehearse. PrepLoop gives you a realistic live interviewer, structured
          scores, and a clear next practice loop — without storing your video.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/demo" className={buttonVariants({ size: "lg" })}>
            Try interview demo
            <ArrowRight data-icon="inline-end" />
          </Link>
          <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Sign in to save progress
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <step.icon className="size-5 text-muted-foreground" />
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">{step.body}</CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
        Built with Next.js, Clerk, Neon, Drizzle, the Vercel AI SDK, LiveKit
        Agents, and a custom SVG avatar. Raw video and audio are never stored.
      </section>
    </div>
  );
}
