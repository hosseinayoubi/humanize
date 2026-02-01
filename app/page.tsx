import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Natural English rewriting.
          <span className="block text-muted-foreground">
            Cleaner tone, same meaning.
          </span>
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Paste your text and get a clearer, more natural rewrite—without changing what you meant.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Start Free</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </section>

      {/* Features (فقط 2 تا) */}
      <section className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/60 transition hover:bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Natural rewrite
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            Improves flow, tone, and clarity in plain English—without sounding artificial.
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 transition hover:bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Fast workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            Side-by-side input and output with simple one-click copy.
          </CardContent>
        </Card>
      </section>

      {/* Pricing */}
      <section className="mt-12 sm:mt-14">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Pricing
          </h2>
          <p className="text-sm text-muted-foreground">
            Simple plans. Clear limits.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Free */}
          <Card className="border-border/60 bg-card/60 transition hover:bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Free
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p className="text-foreground">
                <span className="font-medium">5,000</span> words / month
              </p>
              <p>Standard rewriting quality</p>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-border/60 bg-card/60 transition hover:bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Pro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p className="text-foreground">
                <span className="font-medium">50,000</span> words / month
              </p>
              <p>Higher-quality rewriting</p>
              <p>Better consistency for longer texts</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 sm:mt-14">
        <div className="rounded-xl border border-border/60 bg-card/40 p-6 text-center">
          <h3 className="text-lg font-semibold">
            Start with Free. Upgrade when you need more.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No commitment. No hidden complexity.
          </p>
          <div className="mt-4">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
