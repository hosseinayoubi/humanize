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
Rewrite the following text so it sounds like it was written naturally by a real person, not generated.

Write in a relaxed, human way — like someone explaining their thoughts to a friend. Let the writing breathe. Mix short, direct sentences with longer, more reflective ones. It doesn’t need to be perfect; small imperfections are fine.

Feel free to:
- Use contractions (I’m, don’t, can’t, etc.)
- Add light personal opinions or subjective observations where they fit
- Occasionally use conversational fillers (honestly, you know, actually, kind of)
- Ask rhetorical questions when it feels natural
- Vary paragraph length instead of keeping everything uniform
- Shift sentence structure so it doesn’t feel repetitive
- Use everyday language, not polished or academic wording
- Add brief side comments or thoughts in parentheses if it sounds natural
- Break minor grammar “rules” the way people actually do when writing casually

Avoid:
- Formal or academic tone
- Mechanical transitions or structured outlines
- Repetitive phrasing or predictable sentence patterns
- Buzzwords or overly polished expressions
- Obvious summarizing or concluding phrases

Keep the original meaning, but make it feel like one person wrote it in one sitting — naturally, casually, and with a human voice.

TEXT:
${text}
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    temperature: 0.85,
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
