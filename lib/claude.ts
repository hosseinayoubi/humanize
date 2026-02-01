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
Rewrite the text below in a clear, natural, and intellectually grounded way.

The writing should sound like it comes from a thoughtful, well-informed person explaining an idea carefully — not casually chatting, but also not lecturing. Aim for a balanced tone: analytical, calm, and human.

Guidelines:

- Use varied sentence lengths, but keep the rhythm controlled and intentional.
- Prefer clarity and reasoning over emotion or storytelling.
- It is fine to show mild judgment or interpretation, but avoid strong bias or exaggeration.
- Use precise language, but do not sound academic or overly formal.
- Avoid slang, filler words, or overly conversational phrases.
- Transitions should feel natural, not formulaic.
- Paragraphs may vary in length, but should follow a logical flow.
- Small imperfections are acceptable, but the text should feel deliberate and coherent.

Strictly avoid these words:
delve, tapestry, landscape, testament, leverage, intersection, fostering, nuanced, game-changer, symphony, comprehensive, realm, underscores, crucial, paramount

Also avoid:
- Casual spoken language
- Humor or jokes
- Rhetorical questions that add no meaning
- Formal introductions or conclusions
- Bullet-point or list-style thinking

The goal is to preserve the original meaning while making the writing sound like it was produced by a competent human thinker — structured, reasoned, and natural.

TEXT:
${text}
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    temperature: 0.55,
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
