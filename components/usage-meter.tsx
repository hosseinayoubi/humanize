"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type UsageResponse =
  | { success: true; tier: string; wordsUsed: number; wordsLimit: number; wordsRemaining: number; percentageUsed: number; resets: string }
  | { success: false; error: string }

export default function UsageMeter() {
  const [data, setData] = useState<UsageResponse | null>(null)

  useEffect(() => {
    fetch("/api/usage").then((r) => r.json()).then(setData).catch(() => setData({ success: false, error: "Failed to load usage." }))
  }, [])

  if (!data) return (<Card><CardHeader><CardTitle>Usage</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Loading…</CardContent></Card>)
  if (!data.success) return (<Card><CardHeader><CardTitle>Usage</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{data.error}</CardContent></Card>)

  return (
    <Card>
      <CardHeader><CardTitle>Usage ({data.tier})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{data.wordsUsed.toLocaleString()} / {data.wordsLimit.toLocaleString()} words</span>
          <span className="text-muted-foreground">{data.wordsRemaining.toLocaleString()} remaining</span>
        </div>
        <Progress value={data.percentageUsed} />
        <p className="text-xs text-muted-foreground">Resets on {new Date(data.resets).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.</p>
      </CardContent>
    </Card>
  )
}
