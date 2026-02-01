import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
})

export async function humanizeText(text: string) {
  // 1) ANALYZE — سبک و لحن متن را بفهمد، نه بازنویسی کند
  const analysis = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `
Analyze the following English text briefly.

Focus on:
- tone (formal / neutral / casual)
- clarity issues
- stiffness or over-polished parts

Do NOT rewrite the text.
Be concise.

TEXT:
${text}
        `.trim(),
      },
    ],
  })

  const analysisText =
    analysis.content[0].type === "text"
      ? analysis.content[0].text
      : ""

  // 2) REWRITE — بازنویسی اصلی، با حفظ صدا و نواقص انسانی
  const rewrite = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `
Rewrite the following English text so it sounds natural, clear, and human-written.

STRICT RULES:
- Keep my original voice and level of formality
- Preserve meaning exactly
- Avoid generic filler phrases
- Avoid over-smoothing or robotic flow
- Keep some minor imperfections if they exist
- Prefer concrete nouns and specific wording
- Do NOT exaggerate or overstate claims
- Do NOT add new ideas or conclusions

Context about the original text:
${analysisText}

TEXT:
${text}
        `.trim(),
      },
    ],
  })

  const rewrittenText =
    rewrite.content[0].type === "text"
      ? rewrite.content[0].text
      : ""

  // 3) POLISH — فقط تمیزکاری نهایی، نه صیقل بیش‌ازحد
  const polish = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `
Lightly polish the following rewritten English text.

Rules:
- Improve readability only where needed
- Do NOT make it sound fancy or academic unless it already is
- Keep sentence length variation
- Avoid perfect symmetry or overly balanced phrasing
- Return ONLY the final text

TEXT:
${rewrittenText}
        `.trim(),
      },
    ],
  })

  return polish.content[0].type === "text"
    ? polish.content[0].text
    : rewrittenText
}
