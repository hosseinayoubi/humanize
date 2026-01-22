import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function pickText(content: any): string {
  const first = Array.isArray(content) ? content[0] : null
  return first?.type === "text" ? first.text : ""
}

export async function humanizeText(text: string): Promise<string> {
  const analysisResponse = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 900,
    temperature: 0.4,
    messages: [{ role: "user", content: "Analyze the style and clarity issues briefly:\n\n" + text }],
  })
  const analysis = pickText(analysisResponse.content)

  const rewriteResponse = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 3500,
    temperature: 0.85,
    messages: [{
      role: "user",
      content:
        "Rewrite this English text so it sounds natural, human, and fluent. Keep meaning and key details. " +
        "Vary sentence lengths; avoid repetitive phrasing; use contractions where appropriate.\n\n" +
        "Analysis:\n" + analysis + "\n\nOriginal:\n" + text
    }],
  })
  const rewritten = pickText(rewriteResponse.content) || text

  const polishResponse = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 3500,
    temperature: 0.6,
    messages: [{ role: "user", content: "Polish this rewritten English text. Return only final text:\n\n" + rewritten }],
  })

  return pickText(polishResponse.content) || rewritten
}
