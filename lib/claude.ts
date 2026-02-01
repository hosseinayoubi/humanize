import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-opus-20240229" // مدل رو روی نسخه موجود تنظیم کردم

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
  // تغییـر اصـلی اینجـاست: پرامپت متمرکز بر Burstiness و Perplexity
  const prompt = `
You are a ghostwriter tasked with rewriting the following text to bypass advanced AI detectors. 
Your goal is to maximize "Perplexity" (complexity of text) and "Burstiness" (variation in sentence structure), while sounding like a distinct human voice.

**CORE INSTRUCTIONS:**

1. **Destroy the AI Rhythm:**
   - AI writes in a steady beat. You must break it.
   - Mix extremely long, convoluted sentences (that use em-dashes, semicolons, or parenthetical thoughts) with very short, punchy fragments.
   - Example: "Ideally, this would work perfectly, but—and let's be honest here—it rarely does. Whatever."

2. **Adopt a Subjective Persona:**
   - Don't be neutral. Be opinionated, slightly skeptical, or enthusiastic.
   - Use hedging words naturally: "I guess," "sort of," "probably," "in my experience."
   - Write as if you are explaining this to a peer over coffee, not writing a textbook.

3. **Vocabulary & Phrasing (CRITICAL):**
   - **STRICTLY FORBIDDEN WORDS:** delve, tapestry, landscape, testament, leverage, intersection, fostering, nuanced, game-changer, symphony, comprehensive, realm, underscores, crucial, paramount, utilize, multifaceted.
   - Use simple, Anglo-Saxon words instead of Latinate ones (e.g., use "do" instead of "execute", "help" instead of "facilitate").
   - Include occasional filler words or conversational transitions: "Honestly," "Frankly," "Mind you," "Then again."

4. **Structural Imperfections:**
   - Start sentences with conjunctions (But, And, So, Or).
   - Avoid standard transition words like "Moreover," "Furthermore," "In conclusion."
   - Do NOT use headers, bullet points, or numbered lists unless absolutely necessary (turn lists into paragraphs).

5. **The "Human" Touch:**
   - It’s okay to be slightly repetitive for emphasis.
   - It’s okay to have a minor grammatical looseness if it flows better conversationally.

Rewrite the text below keeping the core meaning but completely changing the style to match the above constraints.

TEXT TO REWRITE:
${text}
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    // دما را بالا بردیم تا "خلاقیت" و "غیرقابل پیش‌بینی بودن" بیشتر شود
    temperature: 0.75, 
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
