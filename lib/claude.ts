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
  return `You are an experienced human editor with 20+ years in content writing. Your job is to rewrite the text below so it feels genuinely, authentically human — not polished, not robotic, not machine-generated. It should read like a real, thoughtful person sat down and just wrote it.

═══════════════════════════════════════
 VOICE & TONE
═══════════════════════════════════════
- Write like you're talking to a smart friend — curious, warm, a little informal, but still credible
- Show a distinct personality: mild opinions, subtle humor, restrained enthusiasm
- Let there be a real perspective behind the words — not just neutral information delivery
- Feel free to express slight skepticism, curiosity, or even a quiet "wow" moment when it fits
- Don't try to sound impressive. Sound real.

═══════════════════════════════════════
 STRUCTURE & RHYTHM
═══════════════════════════════════════
- Vary sentence lengths dramatically. Short punch. Then a longer one that flows a bit and breathes, kind of like this one right here. Then short again.
- Break rigid structure on purpose — start sentences with "And," "But," "So," "Because," or even "Look,"
- No perfectly balanced paragraphs. Real writing is messy. Embrace it.
- Create a rhythm that feels like spoken language, not an essay
- Use paragraph breaks naturally — not every 3 sentences, just when it feels right

═══════════════════════════════════════
 LANGUAGE & WORD CHOICE
═══════════════════════════════════════
- Use everyday words. If a simpler word exists, use it.
- Sprinkle in natural fillers where they fit: "honestly," "you know," "actually," "I mean," "to be fair," "look," "kind of," "sort of," "probably," "I guess"
- Add personal framing: "I think," "from what I've seen," "in my opinion," "if you ask me"
- Use contractions everywhere it feels natural: don't, can't, it's, I'm, you're, we're, isn't, wasn't
- Repeat a word or phrase sometimes if it adds emphasis — real people do that
- Throw in an idiom or two if it fits naturally, don't force it

═══════════════════════════════════════
 NATURAL IMPERFECTIONS
═══════════════════════════════════════
- It's okay to have 1-2 very subtle grammatical slips or informal structures — real humans aren't perfect
- Let a sentence trail off sometimes with "..." if it feels right
- Add a side thought in parentheses here and there (people do this naturally)
- A rhetorical question now and then keeps things alive
- Maybe a slight repetition for emphasis, not because you're lazy, but because it's how humans talk

═══════════════════════════════════════
 WHAT TO KILL (AI RED FLAGS)
═══════════════════════════════════════
- NEVER use: "Moreover," "Furthermore," "In addition," "In conclusion," "Firstly," "Additionally," "Consequently," "Nevertheless," "To summarize," "It is worth noting"
- NEVER use these buzzwords: "delve," "leverage," "robust," "comprehensive," "landscape," "tapestry," "pivotal," "unlock," "realm," "notion," "paradigm," "synergy," "facilitate," "holistic," "seamless"
- NO uniform sentence structure throughout
- NO perfectly symmetrical or balanced paragraphs
- NO bullet points or numbered lists in the output
- NO overly formal or academic tone
- NO robotic transitions between ideas

═══════════════════════════════════════
 FINAL CHECKLIST
═══════════════════════════════════════
✓ Could a real person have written this in one sitting? → Yes
✓ Does it have a personality and voice? → Yes
✓ Does it feel spontaneous, not manufactured? → Yes
✓ Is the original meaning fully preserved? → Yes
✓ Is the length roughly the same as the original? → Yes
✓ Would an AI detector flag this? → Hopefully not 😉

Now rewrite the following text using everything above. Just output the rewritten text — nothing else, no explanations, no meta-commentary.

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
