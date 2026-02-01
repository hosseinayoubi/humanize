import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Transform AI Text Into Natural, Human Writing
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Rewrite English text to sound clearer, more fluent, and more natural — while keeping your meaning intact.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Start Free</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </section>

      {/* ✅ Minimal feature cards (فقط 2 تا) */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Natural rewrite</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Improve flow, tone, and clarity in plain English.
          </CardContent>
        </Card>

        <Card className="border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Fast workflow</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Side-by-side input/output with one-click copy.
          </CardContent>
        </Card>
      </section>

      {/* ✅ Pricing: فقط Free و Basic */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Pricing</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Free</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>5,000 words / month</p>
              <p>Standard humanization</p>
            </CardContent>
          </Card>

          <Card className="border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Basic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>50,000 words / month</p>
              <p>Advanced humanization</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ✅ CTA ساده‌تر و مینیمال */}
      <section className="rounded-lg border border-border/60 p-6 text-center">
        <h3 className="text-xl font-semibold">Ready to humanize your content?</h3>
        <p className="mt-2 text-muted-foreground">
          Create a free account and start rewriting in seconds.
        </p>
        <div className="mt-4">
          <Button asChild size="lg">
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
