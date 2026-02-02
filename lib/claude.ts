import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

if (!model) {
  throw new Error("ANTHROPIC_MODEL is not set");
}

export const anthropic = new Anthropic({
  apiKey,
});

export async function humanizeText(input: string): Promise<string> {
  const response = await anthropic.messages.create({
    model, // ✅ فقط از ENV
    max_tokens: 2048,
    temperature: 0.8,
    messages: [
      {
        role: "user",
        content: input,
      },
    ],
  });

  const text = response.content?.[0];

  if (!text || text.type !== "text") {
    throw new Error("Invalid response from Anthropic");
  }

  return text.text;
}
