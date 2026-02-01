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
Rewrite the text below in an academic, logically structured style while preserving the original meaning.

Target tone:
- Academic and evidence-oriented (but not overly formal or inflated).
- Clear, precise, and logically coherent.
- Natural human writing: varied sentence length, no mechanical patterns.

Core requirements:
- Preserve all factual claims and key details. Do not invent new facts.
- Improve clarity, argument flow, and readability.
- Prefer specific wording over vague phrasing.
- Use cautious academic language where appropriate (e.g., “suggests,” “may,” “is likely”) without hedging excessively.
- Keep paragraphs organized: each paragraph should have one main idea, and transitions should feel natural.

Style constraints:
- Avoid casual spoken language, slang, filler words, or humor.
- Avoid rigid templates and robotic transitions.
- Do not add headings like “Conclusion” or “In summary.” End naturally once the point is complete.
- If the original text has lists, keep them only if they improve clarity; otherwise integrate them into prose.

Forbidden words (do not use any of these):
delve, tapestry, landscape, testament, leverage, intersection, fostering, nuanced, game-changer, symphony, comprehensive, realm, underscores, crucial, paramount

Output rules:
- Return only the rewritten text (no commentary, no notes).
- Keep the approximate length similar unless shortening clearly improves clarity.

TEXT:
${text}
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.35,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const output = extractText(response.content)
  return output || text
}
