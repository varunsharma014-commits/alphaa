// Builds the signed-in agent feed from real data. Every message here is
// backed by a row in the database — nothing is invented, and "I haven't
// checked yet" is always said out loud instead of being dressed up as a
// result. Rendered by <DashboardAgent> with the same components as /start.

import { cache } from "react"
import { db } from "@/lib/db"
import { getEngineEvidence, type EngineKey } from "@/lib/engine-evidence"
import { suggestedQuestion } from "@/lib/sandbox"
import { timeOfDayGreeting } from "@/lib/humanize"
import type { CitationReport } from "@/lib/citations"
import { agent, type Block, type Message, type VerdictState } from "@/lib/agent/types"

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

export type FeedData = { messages: Message[]; rail: RailData }

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
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) }, type: { notIn: ["sandbox_query"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ])

  const businessName = user.businessName ?? "your business"
  const question = suggestedQuestion(user.businessType, user.city)
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
    messages.push(
      agent([
        { kind: "text", text: greeting },
        { kind: "text", text: `I haven’t asked the AIs about ${businessName} yet. Want me to do it now? I’ll ask all four the way a customer would.` },
        { kind: "chips", items: [{ label: "Ask them now", action: { type: "live", question }, primary: true }, { label: "Change the question", action: { type: "link", href: "/dashboard/sandbox" } }] },
      ], "standing")
    )
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
    blocks.push({ kind: "chips", items: [{ label: "Ask them again now", action: { type: "live", question }, primary: false }] })
    messages.push(agent(blocks, "standing"))
  }

  // ── 2. Reviews waiting for a reply ────────────────────────────────────────
  const gmbConnected = !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)
  for (const r of user.gmbReviews) {
    const stars = `${r.rating}-star`
    messages.push(
      agent([
        { kind: "text", text: `${r.authorName} left a ${stars} review ${ago(r.publishedAt)}${r.comment ? ":" : "."}` },
        ...(r.comment ? [{ kind: "doc", title: `${r.authorName} · Google`, meta: `${"★".repeat(r.rating)}`, text: r.comment.slice(0, 600) } as Block] : []),
        { kind: "text", text: r.rating >= 4 ? "I’ll write a thank-you. You approve, I post it." : "I’ll draft a calm, specific reply. You approve every word before it goes up." },
        { kind: "chips", items: [{ label: "Draft a reply", action: { type: "review-draft", reviewId: r.id }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
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
        ...(report.missing > 0 ? [{ kind: "text", text: `Getting onto the ${report.missing === 1 ? "missing one" : `${report.missing} missing pages`} is the fastest way to change the answers above. Most are directories you can claim in a few minutes — I’ll walk you through each.` } as Block] : []),
        { kind: "chips", items: [{ label: "Open Source Tracking", action: { type: "link", href: "/dashboard/t/sources" }, primary: false }] },
      ], "citations")
    )
  } else if (checked > 0) {
    messages.push(
      agent([
        { kind: "text", text: "Next I’ll check which pages the AIs read before they recommend someone like you. It takes about two minutes — I’ll post what I find in Source Tracking." },
        { kind: "chips", items: [{ label: "Watch me do it", action: { type: "link", href: "/dashboard/t/sources" }, primary: true }] },
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
        ...(top.suggestedTitle ? [{ kind: "text", text: `I’d write it as “${top.suggestedTitle}” — from your own facts, nothing invented.` } as Block] : []),
        { kind: "chips", items: [{ label: "Draft it for me", action: { type: "draft", topic: top.suggestedTitle || top.topic, competitor: rival }, primary: true }, { label: "All competitor gaps", action: { type: "link", href: "/dashboard/t/competitors" } }] },
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
        { kind: "receipt", title: "This week", sub: `${weekActivity.length} ${weekActivity.length === 1 ? "thing" : "things"} done`, items },
        { kind: "text", text: "Ask me about any of it below." },
      ], "receipt")
    )
  } else {
    messages.push(agent([{ kind: "text", text: "Nothing logged yet this week. Ask me anything below — or tell me what to do first." }], "receipt"))
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
  return { messages, rail }
}

function dayNumber(createdAt: Date): number {
  return Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000) + 1)
}
