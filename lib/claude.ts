// lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import { getTierConfig, type Tier } from "@/lib/config";

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

function buildPrompt(text: string): string {
  return `You are an expert human editor. Rewrite the text below to sound natural, authentic, and genuinely human-written — the kind of writing that flows effortlessly and feels real, not manufactured by AI.

═══════════════════════════════════════
 CORE WRITING PRINCIPLES
═══════════════════════════════════════
• VARY RHYTHM: Mix short, punchy sentences with longer, flowing ones. Real writing has texture and breathing room, not uniformity.
• NATURAL VOICE: Sound credible and thoughtful, but not stiff or overly formal. Think "smart conversation" not "academic paper."
• ORGANIC FLOW: Let ideas connect naturally. Avoid mechanical transitions. If you need to shift topics, do it the way a person would — smoothly, without announcing it.
• SUBTLE PERSONALITY: A hint of curiosity, mild enthusiasm, or quiet skepticism where it fits — but never forced or overdone.

═══════════════════════════════════════
 LANGUAGE GUIDELINES
═══════════════════════════════════════
✓ USE:
- Everyday vocabulary (simple words over fancy ones)
- Contractions where natural (don't, can't, it's, isn't, won't, they're)
- Occasional conversational connectors: "actually," "honestly," "to be fair," "sure," "of course"
- Sentence starters like "And," "But," "So," "Because" when it feels right
- A parenthetical side note here and there (keeps it human)

✗ AVOID:
- First-person overload: Don't constantly say "I think," "I believe," "in my opinion," "from what I've seen"
  → Use these sparingly, only when the text genuinely calls for personal perspective
- Robotic transitions: "Moreover," "Furthermore," "In addition," "Consequently," "Nevertheless," "In conclusion"
- AI buzzwords: "delve," "leverage," "robust," "comprehensive," "landscape," "tapestry," "pivotal," "unlock," "realm," "notion," "paradigm," "synergy," "facilitate," "holistic," "seamless," "it's worth noting"
- Perfect symmetry: Balanced paragraphs, uniform sentence length, or overly tidy structure
- Excessive formality: Academic tone, jargon, or unnecessarily complex phrasing

═══════════════════════════════════════
 STRUCTURAL TECHNIQUES
═══════════════════════════════════════
• Break up monotony with varied sentence length
• Use short sentences for impact. Let longer ones breathe and expand when needed.
• Paragraph breaks should feel natural, not formulaic (not every 3 sentences)
• Occasional repetition for emphasis is fine — that's how people write when they care about a point
• A well-placed rhetorical question can keep things engaging
• Trailing off with "..." works sometimes, but don't overdo it

═══════════════════════════════════════
 NATURAL IMPERFECTIONS (USE SPARINGLY)
═══════════════════════════════════════
Real humans aren't perfect. You can include:
- 1-2 subtle informal structures (but not grammatical errors)
- A slightly looser sentence here and there
- Minor stylistic quirks that feel human, not sloppy

═══════════════════════════════════════
 FINAL QUALITY CHECK
═══════════════════════════════════════
Before you finish, ask yourself:
✓ Does this sound like a real person wrote it?
✓ Is the tone natural and appropriate for the content?
✓ Did I preserve the original meaning and key information?
✓ Is the length roughly similar to the original?
✓ Would this pass as genuine human writing?

Now rewrite the following text. Output ONLY the rewritten version — no preamble, no explanation, no meta-commentary.

Original text:
"${text}"`;
}

export async function humanizeText(text: string, tier: Tier = "free"): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error("Input text is empty.");
  }

  // مدل رو بر اساس tier از config بگیر
  const model = process.env.ANTHROPIC_MODEL || getTierConfig(tier).model;

  const client = getClient();

  const response = await client.messages.create({
    model,
    max_tokens: 2500,
    top_p: 0.95,
    messages: [
      {
        role: "user",
        content: buildPrompt(text),
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
