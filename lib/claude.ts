import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-5-20251101"

function pickAllText(content: any): string {
  if (!Array.isArray(content)) return ""
  return content
    .filter((b: any) => b?.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text)
    .join("")
    .trim()
}

function isRetryableStatus(status: number | undefined) {
  // 429 rate limit, 500+ server issues, 529 overload (رایج تو بعضی سرویس‌ها)
  return status === 429 || status === 408 || status === 409 || status === 500 || status === 502 || status === 503 || status === 504 || status === 529
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key.trim().length < 10) {
    // این پیام رو عمداً واضح می‌ذاریم که بفهمی مشکل از ENVـه
    throw new Error("Missing ANTHROPIC_API_KEY in environment variables.")
  }
  return key
}

const anthropic = new Anthropic({ apiKey: getApiKey() })

export async function humanizeText(text: string): Promise<string> {
  const prompt =
    "You are a professional English editor.\n" +
    "Rewrite the text to sound natural, human, and fluent.\n" +
    "- Keep the original meaning and key details.\n" +
    "- Vary sentence lengths, avoid repetitive phrasing.\n" +
    "- Use contractions where appropriate.\n" +
    "- Preserve formatting (paragraphs, lists) as much as possible.\n" +
    "Return ONLY the final rewritten text.\n\n" +
    "TEXT:\n" + text

  // ✅ یک درخواست به‌جای 3 تا (ریسک fail پایین میاد)
  const maxAttempts = 4

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1800,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      })

      const out = pickAllText(res.content)
      return out || text
    } catch (err: any) {
      const status = err?.status || err?.response?.status
      const msg = err?.message || String(err)

      // اگر retryable بود، چند بار تلاش کن
      if (attempt < maxAttempts && isRetryableStatus(status)) {
        // backoff: 0.8s, 1.6s, 3.2s ...
        await sleep(800 * Math.pow(2, attempt - 1))
        continue
      }

      // خطای غیرقابل retry یا تلاش آخر
      throw new Error(`Anthropic request failed (status=${status ?? "unknown"}): ${msg}`)
    }
  }

  // نباید برسیم اینجا
  return text
}
