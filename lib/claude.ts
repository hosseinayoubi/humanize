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
  return `You are rewriting this text to sound completely human. Your goal: make it undetectable by AI detection tools while keeping the meaning intact.

CRITICAL ANTI-AI-DETECTION RULES:

1. SENTENCE STRUCTURE CHAOS (This is KEY)
   - NEVER write 3+ sentences in a row with similar length
   - Alternate wildly: 4 words. Then 15-20 words. Then 8 words. Then 25+ words.
   - Break expected patterns. If you wrote short-long-short, do NOT repeat that rhythm.
   - Some sentences should feel almost too short. Others should meander a bit.

2. VOCABULARY UNPREDICTABILITY
   - Use common words, but mix in unexpected word choices
   - Avoid "obvious" synonyms that AI would pick
   - Example: Instead of "important" → try "matters" or "counts" or just restructure
   - Replace any word that feels "too perfect" for the context
   - Use contractions inconsistently (some sentences yes, some no)

3. WORD CHOICE THAT SCREAMS HUMAN
   ✓ USE: gonna, wanna, kinda, sorta, yeah, nope, stuff, things, bit, pretty (as in "pretty good"), way (as in "way better")
   ✓ VAGUE LANGUAGE: something like, kind of, sort of, around, roughly, about
   ✓ HUMAN CONNECTORS: though, still, anyway, besides, plus
   ✓ CASUAL STARTS: "Look," "So," "And," "But," "Because," "Or," "Honestly," "Basically"

4. FLOW DISRUPTIONS (Intentional "Imperfections")
   - Start some sentences mid-thought (use dashes —)
   - Throw in a super casual phrase randomly
   - Add a one-word sentence occasionally. Like this.
   - Use "..." when trailing off feels natural
   - Include a (quick aside in parentheses) 
   - Let some ideas run together with commas instead of periods

5. KILL THESE AI RED FLAGS IMMEDIATELY:
   ❌ NEVER: "Moreover," "Furthermore," "Additionally," "Nevertheless," "Consequently," "Thus," "Hence," "Therefore," "In conclusion," "To summarize," "Notably," "Essentially," "It is important to note," "It should be noted"
   ❌ BANNED WORDS: delve, leverage, robust, comprehensive, landscape, tapestry, pivotal, unlock, realm, notion, paradigm, synergy, multifaceted, intricate, nuanced (in AI contexts), facilitate, holistic, seamless, elevate, optimize, cutting-edge, game-changer, revolutionary
   ❌ NO PERFECT PARALLEL STRUCTURE: If you list things, make them uneven
   ❌ NO MECHANICAL TRANSITIONS: Never use formal bridges between ideas

6. EMBRACE NATURAL MESSINESS
   - Repeat a word if it feels right (real people do this for emphasis)
   - Double down on a point in a new sentence instead of moving on cleanly
   - Let thoughts interrupt themselves
   - Not every idea needs equal weight or perfect balance
   - Some paragraphs can be 1 sentence. Others can be 5+.

7. SENTENCE LENGTH TARGETS (approximate, vary wildly):
   - 20% ultra-short (3-7 words)
   - 30% short-medium (8-15 words) 
   - 30% medium-long (16-25 words)
   - 20% long, winding sentences (25+ words)

8. FINAL DETECTOR-KILLER TECHNIQUES:
   - Swap out any phrase that sounds "writerly" or polished
   - If a sentence sounds like it could be in a textbook, rewrite it
   - Read it out loud in your head — does it sound like a person talking? If not, fix it.
   - Check: Are any 3 consecutive sentences too similar in structure? Break the pattern.

REMEMBER: Real humans are inconsistent, slightly messy, and unpredictable. Perfect writing is AI writing. Imperfect (but clear) writing is human writing.

Now rewrite this text. Keep the same meaning and length, but make it sound like a real person wrote it casually, without overthinking.

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
    temperature: 0.9, // بالاتر برای خلاقیت بیشتر و فرار از pattern های AI
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
