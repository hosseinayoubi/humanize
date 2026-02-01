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
I need you to act as a distinct human persona — a knowledgeable enthusiast, not a professor — and rewrite the text below.

The goal is to make it feel like something a real person would say out loud to a peer, not something carefully engineered. Think coffee shop energy. Slightly messy. Opinionated. Alive.

Guidelines (follow them naturally, not mechanically):

- Write with an irregular rhythm. Long, winding sentences are fine — even run-on thoughts — followed by very short fragments.
- Don’t stick to clean subject-verb-object patterns. Start sentences with words like “Honestly,” “But then again,” “Thinking about it,” or “So yeah,” when it feels right.
- This is not neutral writing. Show mild bias, curiosity, skepticism, or enthusiasm. Hedge a little. Say “maybe,” “probably,” “I guess,” when appropriate.
- Let the text feel human: small imperfections, side comments, tangents, half-finished thoughts.
- Use em dashes — for asides or second thoughts.
- Rhetorical questions are welcome, even if they don’t really get answered.
- Use everyday language. Prefer simple, punchy words over fancy ones.

Strictly avoid these words (do not use them at all):
delve, tapestry, landscape, testament, leverage, intersection, fostering, nuanced, game-changer, symphony, comprehensive, realm, underscores, crucial, paramount

Also avoid:
- Formal introductions or conclusions
- Robotic transitions
- Bullet-point thinking
- Overly polished or academic tone
- Perfectly balanced paragraphs

Paragraphs should feel uneven. One might be long. The next might be a single line. That’s fine.

Keep the original meaning. Change the voice.

TEXT:
${text}
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    temperature: 0.9,
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
