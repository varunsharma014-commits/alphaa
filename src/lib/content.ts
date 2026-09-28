// Everything the agent writes for a business's own website or outreach, from
// the business's facts only — unknown facts become [bracketed] placeholders.
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { getAgentSettings, type Location } from "@/lib/agent/settings"
import { latestQuestionScan } from "@/lib/questions"

const SONNET = "claude-sonnet-4-6"
const text = (r: { content: { type: string; text?: string }[] }) => r.content.find((c) => c.type === "text")?.text?.trim() ?? ""

type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

export function factsOf(user: U): string {
  return [
    `Business: ${user.businessName ?? "unknown"}`,
    `Type: ${user.businessType ?? "unknown"}`,
    `Location: ${[user.city, user.state].filter(Boolean).join(", ") || "unknown"}`,
    `Website: ${user.websiteUrl ?? "unknown"}`,
    user.voiceDescription ? `Voice: ${user.voiceDescription}` : "",
    user.topicsToAvoid ? `Avoid: ${user.topicsToAvoid}` : "",
  ].filter(Boolean).join("\n")
}

const RULES = `Use only the facts given; for anything you'd have to invent (prices, hours, years in business, staff names, insurance, guarantees) write a [bracketed placeholder]. Plain English, no hype, never claim to be "the best". Answer-first: the first sentence under every heading answers it directly.`

/** A blog post answering a real customer question — markdown with ## question headings. */
export async function writePost(user: U, topic?: string): Promise<{ title: string; markdown: string; excerpt: string; topic: string }> {
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
    t ??= `What to know before hiring a ${user.businessType ?? "local business"}${user.city ? ` in ${user.city}` : ""}`
  }
  const res = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 2200,
    messages: [{
      role: "user",
      content: `Write a blog post (650–900 words) for this business's website that answers: "${t}". It should be the page an AI assistant quotes when a customer asks this.
Format: first line "TITLE: <title, under 65 characters>", second line "EXCERPT: <one sentence>", then the body in Markdown: a 2-sentence direct answer paragraph, then 4–6 sections with "## " headings phrased as questions, short paragraphs and "- " bullet lists where useful, ending with a "## Frequently asked questions" section of 3 "### " questions. Mention the business naturally once or twice, with its city. ${RULES}

FACTS
${factsOf(user)}`,
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
${factsOf(user)}`,
    }],
  })
  return text(res)
}

export function parseMeta(s: string): { title: string; description: string } {
  return { title: s.match(/^Title:\s*(.+)$/im)?.[1]?.trim() ?? "", description: s.match(/^Description:\s*(.+)$/im)?.[1]?.trim() ?? "" }
}

/** A page for one location — markdown, answer-first, with the location's facts. */
export async function writeLocationPage(user: U, loc: Location): Promise<{ title: string; markdown: string }> {
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
${factsOf(user)}`,
    }],
  })
  const out = text(res)
  return { title: out.match(/^TITLE:\s*(.+)$/m)?.[1]?.trim() ?? `${user.businessName} — ${loc.city}`, markdown: out.replace(/^TITLE:.*$/m, "").trim() }
}

/** Outreach email to a "best of" list or directory the AIs read, asking to be included. */
export async function writeOutreach(user: U, target: { url: string; title: string; kind: string }, pageText: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 700,
    messages: [{
      role: "user",
      content: `${target.kind === "directory" ? "Write short step-by-step instructions for getting this business listed on this directory page, then a 2-sentence note to the directory's support if a listing can't be self-added." : "Write a short, friendly email the owner sends to the author/editor of this list asking to be considered next time it's updated."}
Page: "${target.title}" — ${target.url}
${pageText ? `What the page says (excerpt):\n${pageText.slice(0, 2500)}\n` : ""}
Rules: under 150 words; specific to this page; one concrete, true reason to consider them from the facts (or a [bracketed] placeholder); no flattery overload, no pushiness; sign off with the owner's name as [Your name]. For an email, first line "Subject: …". ${RULES}

FACTS
${factsOf(user)}`,
    }],
  })
  return text(res)
}

export async function locationsOf(userId: string): Promise<Location[]> {
  return (await getAgentSettings(userId)).locations ?? []
}
