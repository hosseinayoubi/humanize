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
Rewrite the text below. Your absolute priority is to bypass AI detection by sounding like a regular person who is a bit disorganized and informal. 

**STRICT HUMAN-WRITING RULES:**

1. **Vary Sentence length AGGRESSIVELY:** - Start with a very short sentence. Then a long, rambling one. Then another short one. 
   - Use sentence fragments (e.g., "Not really." or "Just my two cents.").

2. **The "Non-Expert" Tone:** - Use phrases like "I think," "I mean," "to be honest," "actually," and "kind of." 
   - Don't be too polished. If a sentence is a bit "wordy," leave it that way.

3. **Break AI Patterns:** - NEVER use: "In conclusion," "Moreover," "Furthermore," "Firstly," "Delve," "Tapestry," "Landscape," "Pivotal," "Unlock," "Comprehensive."
   - Do NOT use bullet points or numbered lists.
   - Use "and" or "but" to start sentences occasionally.

4. **Add "Inner Monologue":** - Use parentheses to add a side thought (like this). It shows a human-like stream of consciousness.

5. **Simulate a "Draft" Feel:** - Use contractions (don't, it's, can't) every single time. 
   - Use simple, everyday words instead of fancy ones.

**GOAL:** Make this sound like a post on a forum or a casual blog. NOT an essay. NOT an email.

TEXT:
"${text}"
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    // دما را روی 1.0 گذاشتم تا تصادفی بودن کلمات به اوج برسد
    temperature: 1.0,
    // Top_p را روی 1.0 گذاشتم تا تنوع لغات محدود نشود
    top_p: 1.0,
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
