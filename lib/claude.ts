import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-5-20251101"

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error("ANTHROPIC_API_KEY is missing in runtime environment.")
  }
  return new Anthropic({ apiKey })
}

function extractText(content: any): string {
  if (!Array.isArray(content)) return ""
  return content
    .filter((c: any) => c?.type === "text" && typeof c.text === "string")
    .map((c: any) => c.text)
    .join("")
    .trim()
}

export async function humanizeText(text: string): Promise<string> {
  const prompt = `
Rewrite the text below in a more academic, logically structured style while preserving the original meaning.

Requirements:
- Preserve facts and key details. Do not invent new facts.
- Improve clarity, coherence, and argument flow.
- Prefer precise wording; avoid vague phrasing.
- Use cautious academic language where appropriate (e.g., "suggests", "may", "is likely") without excessive hedging.
- Keep a natural human tone (not casual, not overly ornate). Vary sentence length without sounding mechanical.
- No headings like "Conclusion" or "In summary." End naturally.

Strictly avoid these words:
delve, tapestry, landscape, testament, leverage, intersection, fostering, nuanced, game-changer, symphony, comprehensive, realm, underscores, crucial, paramount

Return only the rewritten text.

TEXT:
${text}
`.trim()

  const client = getClient()

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.35,
    messages: [{ role: "user", content: prompt }],
  })

  return extractText(res.content) || text
}
