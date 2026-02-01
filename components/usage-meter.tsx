"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type UsageOk = {
  success: true
  tier: string
  wordsUsed: number
  wordsLimit: number
  wordsRemaining: number
  percentageUsed: number
  resets: string
}
type UsageErr = { success: false; error: string }
type UsageResponse = UsageOk | UsageErr

async function fetchUsage(): Promise<UsageResponse> {
  const res = await fetch("/api/usage", { cache: "no-store" })
  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.success) {
    return { success: false, error: data?.error || "Failed to load usage." }
  }
  return data as UsageOk
}

export default function UsageMeter() {
  const [data, setData] = useState<UsageResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      // 3 بار تلاش با فاصله کوتاه (برای همون حالت «رفرش می‌زنم درست میشه»)
      for (let i = 0; i < 3; i++) {
        const d = await fetchUsage()
        if (cancelled) return
        setData(d)
        if (d.success) return
        await new Promise((r) => setTimeout(r, 600 * (i + 1)))
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (!data) {
    return (
      <Card>
        <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    )
  }

  if (!data.success) {
    return (
      <Card>
        <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">{data.error}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>Usage ({data.tier})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            {data.wordsUsed.toLocaleString()} / {data.wordsLimit.toLocaleString()} words
          </span>
          <span className="text-muted-foreground">{data.wordsRemaining.toLocaleString()} remaining</span>
        </div>
        <Progress value={data.percentageUsed} />
        <p className="text-xs text-muted-foreground">
          Resets on{" "}
          {new Date(data.resets).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
        </p>
      </CardContent>
    </Card>
  )
}
