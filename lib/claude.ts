import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620"

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
Listen, I need you to rewrite this text and make it sound like an actual human wrote it. Not some AI trying to sound human - like genuinely human.

Here's the vibe I'm going for:

Write like you're texting a friend or posting on Reddit. Mix short sentences with longer ones. Sometimes start with "And" or "But" because that's how people actually talk. Use contractions everywhere (don't, can't, it's, I'm).

Throw in some casual phrases like "honestly," "I mean," "you know," "actually," or "to be honest." Add parentheses when you have a side thought (because that's what people do when they're writing casually). 

Don't be perfect. Let some sentences run a bit long. Use simple words - if you catch yourself using fancy vocabulary, swap it for something more everyday.

Absolutely avoid these AI tells:
- No "Moreover" or "Furthermore" or "In conclusion"
- Skip words like "delve," "leverage," "robust," "comprehensive," "landscape," "tapestry"
- Don't make lists with bullet points or numbers
- No perfectly structured paragraphs with topic sentences

Instead, just... flow. Like you're explaining something to someone while you're thinking it through. Maybe repeat yourself a bit. Maybe backtrack. That's human.

Make it feel like a first draft that someone wrote in one go, not a polished essay. Real people don't write perfectly the first time.

Here's the text:
"${text}"

Just rewrite it naturally. Don't overthink it.
`.trim()

  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    temperature: 1.0,
    top_p: 0.95,
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
