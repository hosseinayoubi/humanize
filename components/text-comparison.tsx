import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function TextComparison({ input, output, onInputChange }: { input: string; output: string; onInputChange: (v: string) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Input</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={input} onChange={(e) => onInputChange(e.target.value)} placeholder="Paste English text here..." className="min-h-[260px]" />
          <p className="text-xs text-muted-foreground">Tip: Use at least 50 words.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Output</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={output} readOnly placeholder="Humanized output will appear here..." className="min-h-[260px]" />
          <p className="text-xs text-muted-foreground">Copy the output with one click.</p>
        </CardContent>
      </Card>
    </div>
  )
}
