import Anthropic from "@anthropic-ai/sdk"

// ✅ پیش‌فرض دقیقاً همان مدلی که گفتی
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929"
const MODEL = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.trim().length < 10) {
    console.error("❌ ANTHROPIC_API_KEY is missing or invalid!")
    console.error("Current value:", apiKey ? `${apiKey.substring(0, 10)}...` : "undefined")
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
  // ✅ پرامپت: طبیعی/انسانی‌تر شدن (بدون اشاره به bypass detector)
  const prompt = `
Rewrite this text to sound natural and human, while keeping the meaning and roughly the same length.

Style guidelines:
- Use contractions when it feels natural (don't, can't, it's, I'm, you're)
- Vary sentence length (some short, some longer)
- Keep it clear, not overly formal
- Avoid robotic transitions and buzzwords
- No bullet points or numbered lists in the output

Original text:
"${text}"

Rewrite it as one cohesive text.
`.trim()

  try {
    const client = getClient()
    console.log("✅ Claude client created successfully")
    console.log("📝 Sending text to Claude (length:", text.length, "chars)")
    console.log("🤖 Using model:", MODEL)

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

    console.log("✅ Received response from Claude")
    const output = extractText(response.content)

    if (!output) {
      console.error("❌ No text extracted from Claude response")
      console.error("Response content:", JSON.stringify(response.content))
      return text
    }

    console.log("✅ Successfully humanized text (output length:", output.length, "chars)")
    return output
  } catch (error: any) {
    console.error("❌ Claude API Error:")
    console.error("Error name:", error?.name)
    console.error("Error message:", error?.message)
    console.error("Error status:", error?.status)
    console.error("Error type:", error?.type)
    console.error("Full error:", error)
    throw error
  }
}
