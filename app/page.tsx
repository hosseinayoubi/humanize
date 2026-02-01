import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      {/* Top bar */}
      <header className="mb-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-lg">
            ✨
          </span>
          <span className="text-sm font-semibold tracking-tight">
            humanize{" "}
            <span className="text-muted-foreground font-normal">rewrite</span>
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
      <section className="grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* Left */}
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

          {/* Free / Pro buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="
                inline-flex items-center gap-2 rounded-full
                border border-border/60 bg-card/50
                px-4 py-2 text-sm font-medium
                transition hover:bg-card/80
              "
            >
              Free
              <span className="text-xs text-muted-foreground">
                5,000 words / month
              </span>
            </button>

            <button
              className="
                inline-flex items-center gap-2 rounded-full
                border border-primary/40 bg-primary/10
                px-4 py-2 text-sm font-medium text-primary
                transition hover:bg-primary/20
              "
            >
              Pro
              <span className="text-xs text-muted-foreground">
                50,000 words / month
              </span>
            </button>
          </div>
        </div>

        {/* Right: workflow */}
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

      {/* Footer */}
      <footer className="mt-14 border-t border-border/50 pt-6 text-xs text-muted-foreground">
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
