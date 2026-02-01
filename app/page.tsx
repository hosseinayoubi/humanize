import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* subtle background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-64 w-[38rem] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/4 blur-3xl" />
      </div>

      {/* Top bar (optional, minimal) */}
      <div className="mb-10 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight">
          humanize <span className="text-muted-foreground font-normal">• rewrite</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>

      {/* Hero + right workflow cards */}
      <section className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Left */}
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Rewrite English text
            <span className="block text-muted-foreground">
              clearer, more natural, and consistent.
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Paste your text and get a clean rewrite that keeps the meaning intact.
            Built for emails, assignments, reports, and everyday writing.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/dashboard">Open app</Link>
            </Button>
          </div>

          {/* tiny trust row */}
          <div className="mt-2 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Fast" value="1–2 clicks" />
            <MiniStat label="Workflow" value="Side-by-side" />
            <MiniStat label="Output" value="Copy ready" />
          </div>

          {/* Pricing mini (Free + Pro) */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <PlanCard title="Free" words="5,000" note="Standard rewrite quality" subtle />
            <PlanCard title="Pro" words="50,000" note="Higher-quality rewrite + better consistency" />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <WorkflowCard
            title="1) Paste your text"
            desc="Drop in your content. Keep your structure—paragraphs, lists, and sections."
          />
          <WorkflowCard
            title="2) Rewrite + refine"
            desc="Cleaner flow, better tone, and less repetition. No fluff."
          />
          <WorkflowCard
            title="3) Ready-to-use output"
            desc="Copy the result with one click. Use it in emails, docs, or submissions."
          />

          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <p className="text-sm text-muted-foreground">
              Tip: If your text is technical, we keep terminology stable and focus on clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Minimal footer CTA */}
      <section className="mt-12 sm:mt-14">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Want it to sound professional—without sounding robotic?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start with Free. Upgrade to Pro only if you need higher limits.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="lg">
                <Link href="/signup">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function WorkflowCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="border-border/60 bg-card/60 transition hover:bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">{desc}</CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

function PlanCard({
  title,
  words,
  note,
  subtle,
}: {
  title: string
  words: string
  note: string
  subtle?: boolean
}) {
  return (
    <div
      className={[
        "rounded-xl border border-border/60 p-4 transition",
        subtle ? "bg-card/30 hover:bg-card/45" : "bg-card/55 hover:bg-card/75",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">monthly</div>
      </div>
      <div className="mt-2 text-sm">
        <span className="text-foreground font-semibold">{words}</span>{" "}
        <span className="text-muted-foreground">words</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{note}</div>
    </div>
  )
}
