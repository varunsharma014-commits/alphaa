// Builds the signed-in agent feed from real data. Every message here is
// backed by a row in the database — nothing is invented, and "I haven't
// checked yet" is always said out loud instead of being dressed up as a
// result. Rendered by <DashboardAgent> with the same components as /start.

import { cache } from "react"
import { db } from "@/lib/db"
import { getEngineEvidence, type EngineKey } from "@/lib/engine-evidence"
import { accountQuestion } from "@/lib/sandbox"
import { timeOfDayGreeting } from "@/lib/humanize"
import type { CitationReport } from "@/lib/citations"
import { agent, type Block, type Message, type VerdictState } from "@/lib/agent/types"
import { latestQuestionScan } from "@/lib/questions"

const ENGINES: EngineKey[] = ["chatgpt", "gemini", "claude", "perplexity"]
const LABEL: Record<EngineKey, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity" }

export type RailData = {
  businessName: string
  location: string
  dayNumber: number
  named: number
  checked: number
  states: VerdictState[]
  waiting: { reviews: number; posts: number }
  googleConnected: boolean
}

export type FeedData = { messages: Message[]; rail: RailData; status: AgentStatus }

/** The strip above the work: what the agent did last and what it does next. */
export type AgentStatus = { last: { title: string; at: string } | null; next: string; firstCheck: string | null }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function ago(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 14) return "last week"
  return `${Math.floor(days / 7)} weeks ago`
}

const longDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })

// Deduped per request: the app layout (rail) and the /dashboard page (feed)
// both call this for the same user during one render.
export const getFeed = cache(buildFeed)

export async function buildFeed(userId: string): Promise<FeedData | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      integration: true,
      audits: { orderBy: { createdAt: "desc" }, take: 2, include: { aiEngineResults: true } },
      gmbReviews: { where: { reply: null }, orderBy: { publishedAt: "desc" }, take: 2 },
      gbpPosts: { where: { status: "draft" }, orderBy: { createdAt: "desc" }, take: 1 },
      contentGaps: { orderBy: { analyzedAt: "desc" }, take: 1 },
      competitors: { take: 5 },
    },
  })
  if (!user) return null

  const [evidence, citationRow, weekActivity] = await Promise.all([
    getEngineEvidence({ id: user.id, email: user.email }),
    db.mockActivity.findFirst({ where: { userId: user.id, type: "citation_scan" }, orderBy: { createdAt: "desc" } }),
    db.mockActivity.findMany({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) }, type: { notIn: ["sandbox_query", "agent_settings", "question_scan_started", "ai_visit", "site_check", "citation_scan", "check_security", "check_profiles", "check_listings", "check_bing"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ])

  const businessName = user.businessName ?? "your business"
  const question = await accountQuestion(user)
  const messages: Message[] = []
  const now = new Date()
  messages.push({ id: "day", role: "agent", blocks: [{ kind: "divider", text: `${longDate(now)} · day ${dayNumber(user.createdAt)}` }] })

  // ── 1. Where you stand with the four AIs ──────────────────────────────────
  const states = ENGINES.map((e) => evidence[e]?.state ?? "unknown")
  const checked = states.filter((s) => s !== "unknown").length
  const named = states.filter((s) => s === "found" || s === "partial").length
  const latest = user.audits[0]
  const previous = user.audits[1]
  const greeting = `Good ${timeOfDayGreeting(now)}.`

  if (checked === 0) {
    // Never ask permission to do the job: the dashboard runs this check itself
    // on load (DashboardAgent firstCheck) and reports what the AIs said.
    messages.push(agent([{ kind: "text", text: `${greeting} I’m asking the four AIs about ${businessName} right now, the way a customer would.` }], "standing"))
  } else {
    const blocks: Block[] = []
    // A change since the previous check is the headline; otherwise the count.
    const newlyNamed = ENGINES.filter((e) => {
      const nowRow = latest?.aiEngineResults.find((r) => r.engine === e)
      const prevRow = previous?.aiEngineResults.find((r) => r.engine === e)
      return nowRow?.appeared && prevRow && !prevRow.appeared
    })
    const lost = ENGINES.filter((e) => {
      const nowRow = latest?.aiEngineResults.find((r) => r.engine === e)
      const prevRow = previous?.aiEngineResults.find((r) => r.engine === e)
      return nowRow && !nowRow.appeared && prevRow?.appeared
    })
    if (newlyNamed.length > 0) {
      blocks.push({ kind: "text", text: `${newlyNamed.map((e) => LABEL[e]).join(" and ")} named you ${ago(latest!.createdAt)}.`, big: true })
      blocks.push({ kind: "text", text: previous ? `That’s new — ${ago(previous.createdAt)} it didn’t.` : "First time I’ve seen that." })
    } else if (lost.length > 0) {
      blocks.push({ kind: "text", text: `${lost.map((e) => LABEL[e]).join(" and ")} stopped naming you.`, big: true })
      blocks.push({ kind: "text", text: "AI answers move. I’ll keep asking and tell you when it comes back." })
    } else {
      blocks.push({ kind: "text", text: `${greeting} ${named === 0 ? "None" : named === checked ? "All" : `${named} of ${checked}`} of the AIs ${named === 1 ? "names" : "name"} you${named === 0 ? " yet" : ""}.` })
    }
    blocks.push({
      kind: "verdicts",
      items: ENGINES.map((e) => {
        const ev = evidence[e]
        const note = ev?.at ? (ev.source === "sandbox" ? `you asked · ${ago(ev.at)}` : ev.source === "scan" ? `free scan · ${ago(ev.at)}` : `checked ${ago(ev.at)}`) : undefined
        return { engine: e, state: ev?.state ?? "unknown", note }
      }),
    })
    // The actual answer text when we have it (weekly audit rows keep it).
    const row = latest?.aiEngineResults.find((r) => r.engine === "chatgpt" && r.response.trim().length > 20)
      ?? latest?.aiEngineResults.find((r) => r.response.trim().length > 20)
    if (row) {
      blocks.push({ kind: "text", text: `Here’s what ${LABEL[row.engine as EngineKey] ?? row.engine} actually said ${ago(latest!.createdAt)}:` })
      blocks.push({ kind: "answer", engine: row.engine as EngineKey, query: row.query, answer: row.response, appeared: row.appeared, mentioned: [], businessName })
    }
    messages.push(agent(blocks, "standing"))
  }

  // ── 1b. Every tracked question, and anything the AIs get wrong ─────────────
  const qs = await latestQuestionScan(user.id).catch(() => null)
  if (qs && Date.now() - qs.at.getTime() < 10 * 86_400_000) {
    const wrong = qs.scan.facts.issues
    const high = wrong.filter((i) => i.severity === "high")
    if (wrong.length) {
      messages.push(agent([
        { kind: "text", text: high.length ? `${LABEL[high[0].engine as EngineKey] ?? "An AI"} is telling customers “${high[0].claim}”. That’s wrong — ${high[0].truth}.` : `${wrong.length} AI ${wrong.length === 1 ? "answer gets" : "answers get"} a detail about you wrong.`, big: true },
        { kind: "chips", items: [{ label: "See my fix", action: { type: "thread", topic: "answers" }, primary: true }] },
      ], "facts"))
    }
    messages.push(agent([
      { kind: "text", text: `Across your ${qs.scan.questions.length} customer questions, the four AIs named you in ${qs.scan.named} of ${qs.scan.answers} answers.${qs.scan.rivals[0] ? ` ${qs.scan.rivals[0].name} was named ${qs.scan.rivals[0].count} times.` : ""}` },
      { kind: "chips", items: [{ label: "Question by question", action: { type: "thread", topic: "answers" } }] },
    ], "questions"))
  }

  // ── 2. Reviews waiting for a reply ────────────────────────────────────────
  const gmbConnected = !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)
  for (const r of user.gmbReviews) {
    const stars = `${r.rating}-star`
    messages.push(
      agent([
        { kind: "text", text: `${r.authorName} left a ${stars} review ${ago(r.publishedAt)}${r.comment ? ":" : "."}` },
        ...(r.comment ? [{ kind: "doc", title: `${r.authorName} · Google`, meta: `${"★".repeat(r.rating)}`, text: r.comment.slice(0, 600) } as Block] : []),
        { kind: "text", text: r.rating >= 4 ? "I’ll thank them for you. Nothing goes up without your OK." : "I’ll reply calmly and specifically. Nothing goes up without your OK." },
        { kind: "chips", items: [{ label: "Show my reply", action: { type: "review-draft", reviewId: r.id }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
      ], `review-${r.id}`)
    )
  }

  // ── 3. A Google post waiting for approval ─────────────────────────────────
  const draft = user.gbpPosts[0]
  if (draft && gmbConnected) {
    messages.push(
      agent([
        { kind: "text", text: `I wrote a Google update for your listing${draft.createdAt ? ` ${ago(draft.createdAt)}` : ""}. Post it?` },
        { kind: "doc", title: "Google Business Profile · update", meta: "draft", text: draft.content, docId: `post-${draft.id}`, editable: true },
        { kind: "chips", items: [{ label: "Post it", action: { type: "post-publish", postId: draft.id }, primary: true }, { label: "Delete it", action: { type: "post-delete", postId: draft.id } }] },
      ], `post-${draft.id}`)
    )
  }

  // ── 3b. Posts for the website waiting on a yes ────────────────────────────
  const readyPosts = await db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft" }, orderBy: { createdAt: "desc" }, take: 8 })
  const waitingPosts = readyPosts.filter((p) => (p.metadata as { status?: string } | null)?.status === "ready")
  if (waitingPosts.length) {
    const m = waitingPosts[0].metadata as { title?: string }
    messages.push(agent([
      { kind: "text", text: `I wrote ${waitingPosts.length === 1 ? "a new post" : `${waitingPosts.length} new posts`} for your website${m.title ? ` — “${m.title}”` : ""}. Want to read ${waitingPosts.length === 1 ? "it" : "them"}?` },
      { kind: "chips", items: [{ label: "Read and approve", action: { type: "thread", topic: "content" }, primary: true }] },
    ], "posts"))
  }

  // ── 4. Where AI looks you up ──────────────────────────────────────────────
  const report = isRecord(citationRow?.metadata) && Array.isArray((citationRow!.metadata as Record<string, unknown>).targets)
    ? (citationRow!.metadata as unknown as CitationReport)
    : null
  if (report && report.searchConfigured && report.targets.length > 0) {
    const targets = [...report.targets].sort((a, b) => (a.status === "missing" ? -1 : 1) - (b.status === "missing" ? -1 : 1) || a.rank - b.rank).slice(0, 6)
    messages.push(
      agent([
        { kind: "text", text: `Where the AIs look before they recommend a ${user.businessType || "business"}${user.city ? ` in ${user.city}` : ""}: ${report.listed} of ${report.targets.length} pages mention you.` },
        { kind: "sources", items: targets.map((t) => ({ name: t.domain, detail: t.title.slice(0, 80), status: t.status === "listed" ? "You’re on it" : t.status === "missing" ? "Not on it" : "Couldn’t check", ok: t.status === "listed", href: t.url })) },
        ...(report.missing > 0 ? [{ kind: "text", text: `Getting onto the ${report.missing === 1 ? "missing one" : `${report.missing} missing pages`} is the fastest way to change the answers above. Most are listings only the owner can claim, so I’ve lined them up with the steps for each.` } as Block] : []),
        ...(report.missing > 0 ? [{ kind: "chips", items: [{ label: "See the list", action: { type: "thread", topic: "sources" } }] } as Block] : []),
      ], "citations")
    )
  } else if (checked > 0) {
    messages.push(
      agent([
        { kind: "text", text: "I’m checking which pages the AIs read before they recommend someone like you. You’ll see what I find here." },
      ], "citations")
    )
  }

  // ── 5. What a competitor covers that you don’t ────────────────────────────
  const gap = user.contentGaps[0]
  const gaps = Array.isArray(gap?.gaps) ? (gap!.gaps as { topic?: string; priority?: string; suggestedTitle?: string }[]) : []
  const top = gaps.find((g) => g.priority === "high") ?? gaps[0]
  if (gap && top?.topic) {
    const rival = user.competitors.find((c) => c.url === gap.competitorUrl)?.name ?? gap.competitorUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
    messages.push(
      agent([
        { kind: "text", text: `${rival} has a page on “${top.topic}”. You don’t. When AI gets asked about it, they’re the answer.` },
        { kind: "text", text: `It’s on my writing list${top.suggestedTitle ? ` as “${top.suggestedTitle}”` : ""}, from your own facts. The draft lands here for your OK.` },
      ], "gap")
    )
  }

  // ── 6. Setup that unlocks the rest ────────────────────────────────────────
  if (!user.integration) {
    messages.push(
      agent([
        { kind: "text", text: "One thing I can’t do yet: reply to your reviews or post to your Google listing. Connect Google and I take those over." },
        { kind: "chips", items: [{ label: "Connect Google", action: { type: "link", href: "/api/integrations/google/connect?go=1" }, primary: true }] },
      ], "setup")
    )
  }

  // ── 7. This week’s receipt ────────────────────────────────────────────────
  const items = weekActivity.map((a) => a.title).filter((t, i, arr) => arr.indexOf(t) === i).slice(0, 8)
  if (items.length > 0) {
    messages.push(
      agent([
        { kind: "receipt", title: "Done for you this week", sub: `${weekActivity.length} ${weekActivity.length === 1 ? "job" : "jobs"}`, items },
      ], "receipt")
    )
  } else {
    messages.push(agent([{ kind: "text", text: "Nothing finished yet this week. My next pass is already scheduled." }], "receipt"))
  }

  const rail: RailData = {
    businessName,
    location: [user.city, user.state].filter(Boolean).join(", "),
    dayNumber: dayNumber(user.createdAt),
    named,
    checked,
    states,
    waiting: { reviews: user.gmbReviews.length, posts: draft && gmbConnected ? 1 : 0 },
    googleConnected: !!user.integration,
  }
  const last = weekActivity[0] ?? (await db.mockActivity.findFirst({ where: { userId: user.id, type: { notIn: ["sandbox_query", "agent_settings", "ai_visit", "email_sent"] } }, orderBy: { createdAt: "desc" } }))
  const status: AgentStatus = { last: last ? { title: last.title, at: last.createdAt.toISOString() } : null, next: nextCheck(now), firstCheck: checked === 0 ? question : null }
  return { messages: sections(messages), rail, status }
}

// Work first: what needs the owner's OK, then what was done, then where they stand.
function sections(messages: Message[]): Message[] {
  const needs = (id: string) => id === "facts" || id === "setup" || id === "posts" || id.startsWith("review-") || id.startsWith("post-")
  const head = (id: string, text: string): Message => ({ id, role: "agent", blocks: [{ kind: "divider", text }] })
  const pick = (f: (id: string) => boolean) => messages.filter((m) => f(m.id))
  const waiting = pick(needs)
  return [
    ...pick((id) => id === "day"),
    head("h-needs", waiting.length ? `Needs your OK · ${waiting.length}` : "Nothing needs you right now"),
    ...waiting,
    head("h-done", "What I did"),
    ...pick((id) => id === "receipt"),
    head("h-stand", "Where you stand"),
    ...pick((id) => id !== "day" && id !== "receipt" && !needs(id)),
  ]
}

// The weekly AI re-check runs Wednesdays 09:00 UTC (lib/cron-scheduler.ts).
function nextCheck(now: Date): string {
  const d = new Date(now)
  d.setUTCHours(9, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + ((3 - d.getUTCDay() + 7) % 7))
  if (d <= now) d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString()
}

function dayNumber(createdAt: Date): number {
  return Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000) + 1)
}
