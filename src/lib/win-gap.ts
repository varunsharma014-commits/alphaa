import { anthropic } from "@/lib/claude"

export type WinGapFormat = "FAQ" | "Blog post" | "Service page"

export type WinGapDraft = {
  title: string
  format: WinGapFormat
  body: string
  targetQuestion: string
}

// An item appended into ContentGap.gaps (Json array). It intentionally has a
// different shape from GapItem — the Content ideas page tells them apart by
// the presence of `draft`.
export type WinGapItem = WinGapDraft & {
  gap: string
  draft: string
  createdAt: string
}

const FORMATS: WinGapFormat[] = ["FAQ", "Blog post", "Service page"]

export async function draftContentForGap(args: {
  gap: string
  businessName: string
  businessType: string
  city: string
  websiteUrl: string | null
  voiceDescription: string | null
  topicsToAvoid: string | null
  competitorUrl: string
}): Promise<WinGapDraft> {
  const {
    gap,
    businessName,
    businessType,
    city,
    websiteUrl,
    voiceDescription,
    topicsToAvoid,
    competitorUrl,
  } = args

  const voiceLine = voiceDescription
    ? `Write it in your voice. You described your voice as: "${voiceDescription}". Match it.`
    : `Write it plainly and warmly, the way you would explain it to a customer standing in front of you.`

  const avoidLine = topicsToAvoid
    ? `Never mention these topics — you asked to avoid them: "${topicsToAvoid}".`
    : ""

  const prompt = `You are writing a piece of content FOR a business owner, speaking to them as "you" throughout. Never describe their business in the third person.

You run ${businessName}, a ${businessType} in ${city}.${websiteUrl ? ` Your website is ${websiteUrl}.` : ""}
One of your competitors is ${competitorUrl}. Here is a gap where that competitor is weak and you can win:

"${gap}"

Write the content that wins that gap.

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "title": "<the title of the piece, plain language a customer would search for>",
  "format": "FAQ" | "Blog post" | "Service page",
  "targetQuestion": "<the single question a real customer asks that this piece answers>",
  "body": "<the draft itself, markdown, 300-500 words>"
}

Rules:
- ANSWER FIRST. The first two sentences of the body must answer targetQuestion directly and completely. AI engines quote the answer, not the wind-up. No introductions, no "In today's world", no restating the question.
- ${voiceLine}
- ${avoidLine}
- DO NOT INVENT FACTS about the business. No made-up credentials, awards, certifications, statistics, review counts, prices, or years in business. If a specific claim would make the piece stronger, write a clearly marked placeholder instead, exactly like [add your years in business] or [add your starting price]. Placeholders are expected and good — invented facts are not.
- Never promise or imply rankings, positions, traffic numbers, or that this will "rank #1".
- PLAIN ENGLISH ONLY. The reader is a busy owner, not a marketer. NEVER use the words: schema, alt text, crawlable, crawl, H1, meta description, SEO, SEO issues, indexed, structured data, organic visibility, AEO, LLM, entity, semantic, generative engine, keyword density, funnel, leverage, synergy.
- format: pick the one that actually fits — "FAQ" for a question people keep asking, "Service page" for something you sell, "Blog post" for everything else.
- body: 300-500 words, markdown, short paragraphs. It must be publishable as-is once the placeholders are filled in.`

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0]?.type === "text" ? message.content[0].text : ""

  try {
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim()
    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    const format = FORMATS.includes(parsed.format as WinGapFormat)
      ? (parsed.format as WinGapFormat)
      : "Blog post"
    const body = typeof parsed.body === "string" ? parsed.body.trim() : ""
    if (!body) throw new Error("Empty body in draft")

    return {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : gap,
      format,
      body,
      targetQuestion:
        typeof parsed.targetQuestion === "string" && parsed.targetQuestion.trim()
          ? parsed.targetQuestion.trim()
          : gap,
    }
  } catch (err) {
    console.error("draftContentForGap parse error:", err)
    // Fallback: if Claude returned prose instead of JSON, still hand back
    // whatever it wrote rather than failing the request entirely.
    if (text.trim().length > 0) {
      return {
        title: gap,
        format: "Blog post",
        body: text.trim(),
        targetQuestion: gap,
      }
    }
    throw new Error("Could not write a draft for this gap. Try again.")
  }
}
