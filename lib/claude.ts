import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim().length < 10) {
    console.error("❌ ANTHROPIC_API_KEY is missing or invalid!");
    throw new Error("ANTHROPIC_API_KEY is missing in runtime environment.");
  }

  return new Anthropic({ apiKey });
}

function extractText(content: Anthropic.ContentBlock[]): string {
  if (!Array.isArray(content)) return "";

  return content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();
}

export async function humanizeText(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error("Input text is empty.");
  }

  const prompt = `
Rewrite this text to sound completely human. Your goal is to make it undetectable by AI checkers while keeping roughly the same length as the original.

Write like you're having a conversation. Mix it up - throw in a short sentence. Then maybe a longer one that kinda meanders a bit. Then back to short. That's how real people write.

Use these human touches:
- Contractions always (don't, can't, it's, I'm, you're)
- Casual phrases: "honestly," "I mean," "you know what," "actually," "to be fair," "look"
- Start sentences with "And" or "But" sometimes
- Add side thoughts in parentheses (it's natural)
- Use "..." when trailing off a thought
- Throw in rhetorical questions now and then

Kill these AI red flags immediately:
- NO: "Moreover," "Furthermore," "In addition," "In conclusion," "Firstly," "To summarize"
- NO: "delve," "leverage," "robust," "comprehensive," "landscape," "tapestry," "pivotal," "unlock," "realm," "notion"
- NO: perfectly balanced paragraphs or symmetrical structure
- NO: bullet points or numbered lists
- NO: overly formal transitions

Make it messy in a good way:
- Repeat a word if it feels natural (people do that)
- Use simple everyday words over fancy ones
- Let sentences run long sometimes, then cut them short
- Write like you're thinking out loud
- Don't worry about being "proper" - be real

Keep the length similar to the original text. Don't expand it or shrink it too much. Just make it sound human.

Original text:
"${text}"

Rewrite it like a real person would write it in one sitting. Go.
  `.trim();

  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    top_p: 0.95,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const output = extractText(response.content);

  if (!output) {
    console.warn("⚠️ Model returned an empty response, falling back to original text.");
    return text;
  }

  return output;
}
