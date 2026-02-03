import Anthropic from "@anthropic-ai/sdk";
import type { Tier } from "@/lib/config";
import { getTierConfig } from "@/lib/config";

const FALLBACK_MODEL = "claude-sonnet-4-5-20250929";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim().length < 10) {
    console.error("❌ ANTHROPIC_API_KEY is missing or invalid!");
    throw new Error("ANTHROPIC_API_KEY is missing in runtime environment.");
  }
  return new Anthropic({ apiKey });
}

function extractText(content: any): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((c: any) => c?.type === "text" && typeof c.text === "string")
    .map((c: any) => c.text)
    .join("")
    .trim();
}

export async function humanizeText(text: string, tier: Tier = "free"): Promise<string> {
  const tierCfg = getTierConfig(tier);
  const model = process.env.ANTHROPIC_MODEL || tierCfg.model || FALLBACK_MODEL;

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
`.trim();

  const client = getClient();

  // ✅ FIX: For this model you can't send both temperature and top_p.
  // We'll use temperature only.
  const response = await client.messages.create({
    model,
    max_tokens: 2500,
    temperature: 1.0,
    // top_p: 0.95, // ❌ remove this
    messages: [{ role: "user", content: prompt }],
  });

  const output = extractText(response.content);
  return output || text;
}
