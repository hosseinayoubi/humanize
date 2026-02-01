import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-5-20251101"

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.trim().length < 10) {
    // اینجا اگر key واقعاً ست نشده باشد، هیچ کدی نمی‌تواند Claude را صدا بزند.
    // ولی چون گفتی قبلاً کار می‌کرد، احتمالاً env درست است.
    throw new Error("ANTHROPIC_API_KEY is missing in runtime environment.")
  }
  return new Anthropic({ apiKey })
}

function pickText(content: any): string {
  if (!Array.isArray(content)) return ""
  return content
    .filter((b: any) => b?.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text)
    .join("")
    .trim()
}

function isRetryable(status?: number) {
  return status === 408 || status === 409 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 529
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${ms}ms`)), ms)),
  ])
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
  const maxAttempts = 4

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await withTimeout(
        client.messages.create({
          model: MODEL,
          max_tokens: 1800,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }],
        }),
        45_000,
      )

      const out = pickText((res as any).content)
      return out || text
    } catch (err: any) {
      const status = err?.status || err?.response?.status
      if (attempt < maxAttempts && isRetryable(status)) {
        await sleep(700 * Math.pow(2, attempt - 1))
        continue
      }
      // throw to be handled in route
      throw err
    }
  }

  return text
}
