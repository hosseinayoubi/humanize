import Anthropic from "@anthropic-ai/sdk"
import { retry, withTimeout } from "@/lib/stability"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-5-20251101"

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key.trim().length < 10) {
    throw new Error("ANTHROPIC_API_KEY is missing in runtime environment.")
  }
  return new Anthropic({ apiKey: key })
}

function pickText(content: any): string {
  if (!Array.isArray(content)) return ""
  return content
    .filter((b: any) => b?.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text)
    .join("")
    .trim()
}

export async function humanizeText(text: string): Promise<string> {
  const prompt =
    "You are a professional English editor.\n" +
    "Rewrite the text to sound natural, human, and fluent.\n" +
    "- Keep the original meaning and key details.\n" +
    "- Avoid repetitive phrasing.\n" +
    "- Vary sentence lengths.\n" +
    "- Use contractions where appropriate.\n" +
    "Return ONLY the final rewritten text.\n\n" +
    "TEXT:\n" + text

  const client = getClient()

  const res = await retry(
    async () =>
      await withTimeout(
        client.messages.create({
          model: MODEL,
          max_tokens: 1800,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }],
        }),
        45_000,
      ),
    { attempts: 4, baseDelayMs: 500, maxDelayMs: 6000 },
  )

  const out = pickText((res as any).content)
  return out || text
}
