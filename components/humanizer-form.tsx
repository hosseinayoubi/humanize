"use client"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import TextComparison from "@/components/text-comparison"
import { toast } from "@/components/ui/toast"

function countWords(text: string) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export default function HumanizerForm() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const words = useMemo(() => countWords(input), [input])

  async function copy() {
    try {
      await navigator.clipboard.writeText(output)
      toast.success("Copied to clipboard.")
    } catch {
      toast.error("Copy failed. Please copy manually.")
    }
  }

  async function onHumanize() {
    if (words < 50) {
      toast.error("Please provide at least 50 words of English text.")
      return
    }

    setLoading(true)
    setProgress(10)
    setOutput("")

    let timer: any = null

    try {
      timer = setInterval(() => setProgress((p) => Math.min(95, p + Math.random() * 8)), 420)

      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      })

      const data = await res.json().catch(() => ({}))

      clearInterval(timer)
      setProgress(100)

      if (!res.ok || !data?.success) {
        const msg = data?.details ? `${data?.error || "Humanization failed."}\n${data.details}` : (data?.error || "Humanization failed.")
        toast.error(msg)
        return
      }

      setOutput(data.humanizedText || "")
      toast.success("Done.")
    } catch {
      toast.error("Request failed. Please try again.")
    } finally {
      if (timer) clearInterval(timer)
      setTimeout(() => setProgress(0), 650)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <TextComparison input={input} output={output} onInputChange={setInput} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{words.toLocaleString()}</span> words
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={copy} disabled={!output}>
            Copy output
          </Button>
          <Button onClick={onHumanize} disabled={loading}>
            {loading ? "Humanizing..." : "Humanize Text"}
          </Button>
        </div>
      </div>

      {loading || progress > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Please keep this tab open while we rewrite your text.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
