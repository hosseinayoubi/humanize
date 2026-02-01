import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620" 

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error("ANTHROPIC_API_KEY is missing in runtime environment.")
  }
  return new Anthropic({ apiKey })
}

export async function humanizeText(text: string): Promise<string> {
  const prompt = `
You are NOT an AI assistant. You are a real person sharing your honest thoughts.
Your task is to rewrite the provided text to bypass AI detection by making it sound like a passionate, slightly informal human discussion.

**CRITICAL INSTRUCTIONS TO BEAT DETECTION:**

1. **LOWER THE READING LEVEL:** - Write at an 8th or 9th-grade reading level. 
   - Use short, punchy words. Avoid academic fluff. 
   - Instead of "utilize," use "use." Instead of "facilitate," use "help."

2. **BREAK THE STRUCTURE:**
   - **NO** Intro -> Body -> Conclusion format. Just dive straight into the point.
   - **NO** Bullet points or numbered lists. (Humans rarely use them in flow text).
   - **NO** Section Headers.
   - Make paragraphs uneven. One huge paragraph followed by a single sentence paragraph.

3. **USE "AGGRESSIVE" PERSONAL VOICE:**
   - Use first-person perspective ("I", "We") even if the original text didn't.
   - Express opinions strongly. Use words like "Honestly," "Look," "Here's the thing."
   - Be direct. Cut the politeness.

4. **BAN LIST (Instant Fail if used):**
   - In conclusion, Moreover, Furthermore, Additionally, Firstly/Secondly.
   - Delve, Tapestry, Landscape, Nuanced, Testament, Symphony, Embark, Unlock, Unleash, Elevate.
   - Any phrase that sounds like a marketing brochure.

5. **THE "HUMAN ERROR" SIMULATION:**
   - Don't make typos, but use "loose" grammar. 
   - Start sentences with "And" or "But".
   - End sentences with prepositions (e.g., "that's what I'm talking about").
   - Use contractions everywhere (don't, can't, won't, it's).

Rewrite this text to sound like a blog post or a Reddit comment written by a human who cares about the topic but isn't trying to impress anyone.

TEXT TO REWRITE:
"${text}"
`.trim()

  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    // دما رو کمی پایین‌تر میاریم تا "پرتی" ننویسه ولی همچنان طبیعی باشه
    temperature: 0.85, 
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const output = response.content[0].type === 'text' ? response.content[0].text : text
  return output
}
