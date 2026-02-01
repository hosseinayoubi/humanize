import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620" // پیشنهاد من برای این کار Sonnet 3.5 یا Opus است

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error("ANTHROPIC_API_KEY is missing in runtime environment.")
  }
  return new Anthropic({ apiKey })
}

export async function humanizeText(text: string): Promise<string> {
  const prompt = `
Act as a professional writer who is slightly tired and writing a quick but insightful email/memo to a close colleague. You HATE academic, robotic, and "perfect" AI writing. 

Your task: Rewrite the provided text so it feels 100% human. 

**RULES FOR THE "HUMAN" VIBE:**
1. **The "Coffee Shop" Test:** Write like you're explaining this in a noisy coffee shop. Use sentence fragments. Start sentences with "So," "But," "Actually," or "Anyway."
2. **Variable Sentence Velocity:** Use a mix of very short (3-5 words) and very long, rambling sentences with multiple commas or dashes. This creates "Burstiness."
3. **Show, Don't Just Tell:** Instead of saying something is "important," say "it's the kind of thing that keeps you up at night" or "it's what actually matters here."
4. **Kill the AI Cliches (CRITICAL):** If you use any of these words, the mission fails: 
   - delve, tapestry, landscape, multifaceted, leverage, comprehensive, pivotal, underscores, realm, enhance, fostering, vibrant, nuanced, testament.
   - Also, NO "In conclusion" or "Furthermore." Just end the text naturally.
5. **Internal Monologue:** Occasionally include a brief "thinking out loud" moment in parentheses. e.g., (at least that's how I see it) or (ironic, right?).
6. **Contractions & Low-Level Grammar:** Use "don't," "can't," "won't." It's okay to end a sentence with a preposition or use a slightly "loose" grammatical structure if it improves the flow.

**TECHNICAL GOAL:** Maximize Perplexity and Burstiness. Avoid all symmetrical paragraph structures. 

TEXT TO REWRITE:
"${text}"
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    // دما روی 0.9 برای خروج از حالت پیش‌فرض و ماشینی
    temperature: 0.9,
    // اضافه کردن top_p برای انتخاب کلمات غیرمنتظره‌تر
    top_p: 0.95,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  // استخراج متن (با فرض اینکه تابع extractText را داری)
  const output = response.content[0].type === 'text' ? response.content[0].text : text
  return output
}
