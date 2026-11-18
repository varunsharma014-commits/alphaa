// Everything the agent writes for a business's own website, from
// the business's facts only — unknown facts become [bracketed] placeholders.
import { ownScanWhere } from "@/lib/scan-match"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { getAgentSettings, type Location } from "@/lib/agent/settings"
import { latestQuestionScan } from "@/lib/questions"
import { ensureVoice, voiceFor, voiceText } from "@/lib/voice"

const SONNET = "claude-sonnet-4-6"
const text = (r: { content: { type: string; text?: string }[] }) => r.content.find((c) => c.type === "text")?.text?.trim() ?? ""

type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

export function factsOf(user: U, voice?: string | null): string {
  return [
    `Business: ${user.businessName ?? "unknown"}`,
    `Type: ${user.businessType ?? "unknown"}`,
    `Location: ${[user.city, user.state].filter(Boolean).join(", ") || "unknown"}`,
    `Website: ${user.websiteUrl ?? "unknown"}`,
    user.voiceDescription ? `About them (their words): ${user.voiceDescription}` : "",
    voice ?? "",
    user.topicsToAvoid ? `Avoid: ${user.topicsToAvoid}` : "",
  ].filter(Boolean).join("\n")
}

const RULES = `Use only the facts given; for anything you'd have to invent (prices, hours, years in business, staff names, insurance, guarantees) write a [bracketed placeholder]. Plain English, no hype, never claim to be "the best". Answer-first: the first sentence under every heading answers it directly.`

/** One specific customer question this business hasn't written about yet (Haiku, ~1s). */
async function suggestTopic(user: U, posted: string[]): Promise<string | null> {
  const res = await anthropic.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 120,
    messages: [{
      role: "user",
      content: `${factsOf(user)}
Website: ${user.websiteUrl ?? "unknown"}
${user.voiceDescription ? `How they talk: ${user.voiceDescription}\n` : ""}Already written about (don't repeat or rephrase these): ${posted.length ? posted.map((p) => `"${p}"`).join("; ") : "nothing yet"}

Give ONE question a real prospective customer of this specific business would type into ChatGPT before choosing a provider — specific to what they sell (name the actual service or product category), not generic advice about "hiring a local business". Only mention a city if one is given above. Reply with the question only.`,
    }],
  })
  const q = text(res).replace(/^["'\s]+|["'\s]+$/g, "")
  return q.length > 10 && q.length < 160 ? q : null
}

/** A blog post answering a real customer question — markdown with ## question headings. */
export async function writePost(user: U, topic?: string, opts: { noPlaceholders?: boolean } = {}): Promise<{ title: string; markdown: string; excerpt: string; topic: string }> {
  // Write in the owner's chosen voice (learned from their own words the first time).
  const learned = await ensureVoice(user.id).catch(() => null)
  const voice = learned ? voiceText(learned) : null
  let t = topic
  if (!t) {
    // Prefer a tracked question the AIs didn't name us for; else a content gap.
    const qs = await latestQuestionScan(user.id)
    const missed = qs?.scan.questions.filter((q) => !Object.values(q.engines).some((e) => e?.appeared)).map((q) => q.q) ?? []
    const posted = (await db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft" }, select: { metadata: true }, take: 50, orderBy: { createdAt: "desc" } })).map((r) => (r.metadata as { topic?: string } | null)?.topic)
    t = missed.find((q) => !posted.includes(q))
    if (!t) {
      const gap = await db.contentGap.findFirst({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" } })
      const gaps = (Array.isArray(gap?.gaps) ? gap!.gaps : []) as { topic?: string; suggestedTitle?: string }[]
      t = gaps.map((g) => g.suggestedTitle || g.topic).find((x): x is string => !!x && !posted.includes(x))
    }
    // New accounts have no tracked questions yet: the question their /start scan asked comes next.
    if (!t) {
      const lead = await db.scanLead.findFirst({
        where: await ownScanWhere(user),
        orderBy: { createdAt: "desc" },
        select: { ogData: true },
      })
      const q = (lead?.ogData as { insights?: { query?: unknown } } | null)?.insights?.query
      if (typeof q === "string" && q.trim().length > 10 && !posted.includes(q.trim())) t = q.trim()
    }
    // Still nothing: ask for one specific question a customer of THIS business would ask, not a
    // template ("…a local business in your area" came out three times for the same account).
    if (!t) t = (await suggestTopic(user, posted.filter((x): x is string => !!x)).catch(() => null)) ?? undefined
    t ??= `What to know before hiring a ${user.businessType ?? "local business"}${user.city ? ` in ${user.city}` : ""}`
  }
  const res = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 2200,
    messages: [{
      role: "user",
      content: `Write a blog post (650–900 words) for this business's website that answers: "${t}". It should be the page an AI assistant quotes when a customer asks this.
Format: first line "TITLE: <title, under 65 characters>", second line "EXCERPT: <one sentence>", then the body in Markdown: a 2-sentence direct answer paragraph, then 4–6 sections with "## " headings phrased as questions, short paragraphs and "- " bullet lists where useful, ending with a "## Frequently asked questions" section of 3 "### " questions. Mention the business naturally once or twice, with its city. Write in the business's own voice (see HOW TO WRITE below). ${opts.noPlaceholders ? "This will publish automatically: NEVER write [placeholders] — if a fact isn't given, leave it out and write around it." : RULES}

FACTS
${factsOf(user, voice)}`,
    }],
  })
  const out = text(res)
  const title = out.match(/^TITLE:\s*(.+)$/m)?.[1]?.trim() ?? t
  const excerpt = out.match(/^EXCERPT:\s*(.+)$/m)?.[1]?.trim() ?? ""
  const markdown = out.replace(/^TITLE:.*$/m, "").replace(/^EXCERPT:.*$/m, "").trim()
  return { title, markdown, excerpt, topic: t }
}

/** Homepage title (≤60) + meta description (≤155), as "Title: …\nDescription: …". */
export async function writeMeta(user: U, page: { url: string; currentTitle?: string | null; currentDescription?: string | null }): Promise<string> {
  const voice = await voiceFor(user.id).catch(() => null)
  const res = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Write a better page title and meta description for ${page.url}.
Current title: ${page.currentTitle || "(none)"}
Current description: ${page.currentDescription || "(none)"}
Title: under 60 characters, "<what they do> in <city> | <business name>" style if local. Description: under 155 characters, says what they do, where, and one concrete reason to choose them from the facts — no invented claims.
Output exactly two lines: "Title: …" and "Description: …".

FACTS
${factsOf(user, voice)}`,
    }],
  })
  return text(res)
}

export function parseMeta(s: string): { title: string; description: string } {
  return { title: s.match(/^Title:\s*(.+)$/im)?.[1]?.trim() ?? "", description: s.match(/^Description:\s*(.+)$/im)?.[1]?.trim() ?? "" }
}

/** A page for one location — markdown, answer-first, with the location's facts. */
export async function writeLocationPage(user: U, loc: Location): Promise<{ title: string; markdown: string }> {
  const voice = await voiceFor(user.id).catch(() => null)
  const res = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 1600,
    messages: [{
      role: "user",
      content: `Write the location page for ${user.businessName}'s ${loc.city} location (400–600 words). First line "TITLE: <${user.businessType ?? "Business"} in ${loc.city} — ${user.businessName}>", then Markdown: a 2-sentence intro saying what they do at this location and exactly where; "## Where are we in ${loc.city}?" with the address and what's nearby only if known; "## What can you get done at our ${loc.city} location?"; "## How do you book or contact us?" with the phone; then "## Frequently asked questions" with 3 "### " questions. ${RULES}

LOCATION
Name: ${loc.name}
Address: ${[loc.street, loc.city, loc.state, loc.zip].filter(Boolean).join(", ")}
Phone: ${loc.phone || "[phone]"}
Hours: ${loc.hours || "[hours]"}

BUSINESS FACTS
${factsOf(user, voice)}`,
    }],
  })
  const out = text(res)
  return { title: out.match(/^TITLE:\s*(.+)$/m)?.[1]?.trim() ?? `${user.businessName} — ${loc.city}`, markdown: out.replace(/^TITLE:.*$/m, "").trim() }
}

export async function locationsOf(userId: string): Promise<Location[]> {
  return (await getAgentSettings(userId)).locations ?? []
}


/** A social post (Facebook / Instagram / LinkedIn) in the owner's voice, plus a 4-5 word headline for its image. */
export async function writeSocial(user: U, topic: string, context?: string): Promise<{ text: string; headline: string }> {
  const voice = await voiceFor(user.id).catch(() => null)
  return writeSocialFrom(factsOf(user, voice), topic, context)
}

/** The same, from a facts block (a visitor with no account yet). */
export async function writeSocialFrom(facts: string, topic: string, context?: string): Promise<{ text: string; headline: string }> {
  const res = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 800,
    messages: [{ role: "user", content: `Write one social media post (Facebook / Instagram / LinkedIn) for this business about: "${topic}".${context ? `\nWhy now: ${context}` : ""}
Hook in the first line, then 2-4 short lines that give the reader something useful, then one simple call to action. Under 90 words. At most 3 hashtags at the end, only if they fit. Use only the facts below; never invent prices, numbers, awards or guarantees. Never say "best", "#1" or "leading".
Then on a last line write "HEADLINE: " and a complete 4 to 6 word headline for the image (a full phrase, never cut off), in the same language, readable in two seconds.

${facts}` }],
  })
  const out = text(res)
  const m = out.match(/\n?HEADLINE:\s*(.+)\s*$/i)
  // Keep the whole headline (the image shrinks the type to fit); only a runaway one is cut.
  const words = (m?.[1] ?? topic).replace(/^["“«]\s*|\s*["”»]$/g, "").trim().split(/\s+/)
  const headline = words.length <= 9 ? words.join(" ") : words.slice(0, 5).join(" ")
  return { text: out.replace(/\n?HEADLINE:[\s\S]*$/i, "").trim(), headline }
}
