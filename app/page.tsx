import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Transform AI Text Into Natural, Human Writing</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Rewrite English text to sound clearer, more fluent, and more natural — while keeping your meaning intact.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg"><Link href="/signup">Start Free</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/login">Log in</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle>🎯 Natural rewrite</CardTitle></CardHeader><CardContent className="text-muted-foreground">Improve flow, tone, and clarity in plain English.</CardContent></Card>
        <Card><CardHeader><CardTitle>⚡ Fast workflow</CardTitle></CardHeader><CardContent className="text-muted-foreground">Side-by-side input/output with one-click copy.</CardContent></Card>
        <Card><CardHeader><CardTitle>🔒 Secure account</CardTitle></CardHeader><CardContent className="text-muted-foreground">Supabase Auth + per-user usage tracking.</CardContent></Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle>Free</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>5,000 words / month</p><p>Standard humanization</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Basic</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>50,000 words / month</p><p>Advanced humanization</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Pro</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>200,000 words / month</p><p>Premium quality + priority support</p></CardContent></Card>
        </div>
      </section>

      <section className="rounded-lg border p-6 text-center">
        <h3 className="text-xl font-semibold">Ready to humanize your content?</h3>
        <p className="mt-2 text-muted-foreground">Create a free account and start rewriting in seconds.</p>
        <div className="mt-4"><Button asChild size="lg"><Link href="/signup">Get Started Free</Link></Button></div>
      </section>
    </div>
  )
}
