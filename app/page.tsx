import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {/* Top bar */}
      <header className="mb-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-lg">
            ✨
          </span>
          <span className="text-sm font-semibold tracking-tight">
            humanize <span className="text-muted-foreground font-normal">rewrite</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Rewrite English text
            <span className="block text-muted-foreground">
              clearer and more natural.
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Paste your text and get a clean rewrite that keeps your meaning intact.
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

          {/* Minimal pricing (not cards) */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <span className="font-semibold">Free</span>{" "}
                <span className="text-muted-foreground">5,000 words/month</span>
              </div>
              <div className="text-muted-foreground">•</div>
              <div>
                <span className="font-semibold">Pro</span>{" "}
                <span className="text-muted-foreground">50,000 words/month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Simple workflow (3 compact cards) */}
        <div className="space-y-3">
          <StepCard
            title="Paste your text"
            desc="Drop your content in. Keep paragraphs and structure."
          />
          <StepCard
            title="Rewrite with better flow"
            desc="Cleaner tone, fewer repeats, more natural phrasing."
          />
          <StepCard
            title="Copy and use"
            desc="One-click copy. Use it wherever you write."
          />

          <p className="pt-2 text-xs text-muted-foreground">
            Tip: For technical writing, we keep terminology stable and focus on clarity.
          </p>
        </div>
      </section>

      {/* Tiny footer line */}
      <footer className="mt-12 border-t border-border/50 pt-6 text-xs text-muted-foreground">
        Simple, fast rewriting. No clutter.
      </footer>
    </main>
  )
}

function StepCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">
        {desc}
      </CardContent>
    </Card>
  )
}
