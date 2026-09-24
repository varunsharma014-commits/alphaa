// Topic threads for the signed-in agent. Each rail item opens a conversation
// in the same chat window instead of a dashboard page. Messages come from real
// rows; when there is nothing yet, the thread says so and the agent starts the
// job itself (the client runs `autorun`) — never a blank page with a button.

import { db } from "@/lib/db"
import type { CitationReport } from "@/lib/citations"
import { agent, type Block, type Message } from "@/lib/agent/types"
import { citationBlocks } from "@/lib/agent/thread-blocks"

export type Topic = "reviews" | "site" | "sources" | "competitors" | "briefings"
export const TOPICS: { key: Topic; label: string; blurb: string }[] = [
  { key: "reviews", label: "Reviews", blurb: "Your Google reviews and my reply drafts" },
  { key: "site", label: "Site Schema & Code", blurb: "What AI can read on your site, and the fixes I wrote" },
  { key: "sources", label: "Source Tracking", blurb: "The pages AI reads before it recommends anyone" },
  { key: "competitors", label: "Competitors", blurb: "What they have that you don’t — and drafts to close it" },
  { key: "briefings", label: "Weekly Briefings", blurb: "What I did each week, in plain English" },
]
export const isTopic = (t: string): t is Topic => TOPICS.some((x) => x.key === t)

export type Thread = { messages: Message[]; autorun: ("site-check" | "citations")[] }

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
const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
// Legacy key: the "claude" engine is stored as google_ai in old reports.
const ENGINE_NAME: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", google_ai: "Claude", perplexity: "Perplexity" }

export async function buildThread(topic: Topic, userId: string): Promise<Thread> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { integration: true } })
  if (!user) return { messages: [], autorun: [] }
  const biz = user.businessName ?? "your business"
  const site = user.websiteUrl ? host(user.websiteUrl) : null
  const gmbReady = !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)

  switch (topic) {
    // ── Reviews ────────────────────────────────────────────────────────────
    case "reviews": {
      if (!user.integration) {
        return {
          autorun: [],
          messages: [
            agent([
              { kind: "text", text: "I can’t see your Google reviews yet.", big: true },
              { kind: "text", text: "Connect Google once and I’ll read every new review each day, draft a reply in your voice, and post it when you tap approve." },
              { kind: "chips", items: [{ label: "Connect Google", action: { type: "link", href: "/api/integrations/google/connect" }, primary: true }] },
            ], "rv-connect"),
          ],
        }
      }
      if (!gmbReady) {
        return {
          autorun: [],
          messages: [
            agent([
              { kind: "text", text: "You’re connected to Google — I just need to know which listing is yours.", big: true },
              { kind: "text", text: "Pick it once and I’ll start drafting replies to your reviews." },
              { kind: "chips", items: [{ label: "Pick my listing", action: { type: "link", href: "/dashboard/settings/integrations" }, primary: true }] },
            ], "rv-pick"),
          ],
        }
      }
      const reviews = await db.gmbReview.findMany({ where: { userId }, orderBy: { publishedAt: "desc" }, take: 30 })
      if (reviews.length === 0) {
        return { autorun: [], messages: [agent([{ kind: "text", text: "No Google reviews on your listing yet.", big: true }, { kind: "text", text: "I check every day. The moment one arrives I’ll draft a reply for you here." }], "rv-none")] }
      }
      const waiting = reviews.filter((r) => !r.reply)
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      const msgs: Message[] = [
        agent([
          { kind: "text", text: waiting.length ? `${waiting.length} ${waiting.length === 1 ? "review is" : "reviews are"} waiting for a reply.` : "Every review has a reply.", big: true },
          { kind: "text", text: `You have ${reviews.length}${reviews.length === 30 ? "+" : ""} reviews averaging ${avg.toFixed(1)}★. ${waiting.length ? "I’ll draft each one — you approve, I post." : "I check daily and will draft the next one as soon as it lands."}` },
        ], "rv-sum"),
      ]
      for (const r of waiting.slice(0, 6)) {
        msgs.push(
          agent([
            { kind: "text", text: `${r.authorName} · ${"★".repeat(r.rating)} · ${ago(r.publishedAt)}` },
            ...(r.comment ? [{ kind: "doc", title: `${r.authorName} · Google`, meta: "review", text: r.comment.slice(0, 600) } as Block] : []),
            { kind: "chips", items: [{ label: "Draft my reply", action: { type: "review-draft", reviewId: r.id }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
          ], `review-${r.id}`)
        )
      }
      return { autorun: [], messages: msgs }
    }

    // ── Site Schema & Code ────────────────────────────────────────────────
    case "site": {
      if (!site) {
        return { autorun: [], messages: [agent([{ kind: "text", text: "I don’t have your website address yet.", big: true }, { kind: "text", text: "Add it once and I’ll read your site the way ChatGPT, Claude and Perplexity do, then write the fixes." }, { kind: "chips", items: [{ label: "Add my website", action: { type: "link", href: "/dashboard/settings/business" }, primary: true }] }], "st-none")] }
      }
      return {
        autorun: ["site-check"],
        messages: [agent([{ kind: "text", text: `I’m reading ${site} the way ChatGPT, Claude and Perplexity do.`, big: true }, { kind: "steps", items: ["Opening your homepage as each AI crawler", "Checking what they can read", "Checking the facts AI needs", "Writing the fixes"], done: 0 }], "st-run")],
      }
    }

    // ── Source Tracking ───────────────────────────────────────────────────
    case "sources": {
      const row = await db.mockActivity.findFirst({ where: { userId, type: "citation_scan" }, orderBy: { createdAt: "desc" } })
      const report = isRecord(row?.metadata) && Array.isArray((row!.metadata as Record<string, unknown>).targets) ? (row!.metadata as unknown as CitationReport) : null
      const fresh = row && Date.now() - row.createdAt.getTime() < 7 * 86_400_000
      if (!report || !report.searchConfigured || report.targets.length === 0 || !fresh) {
        return {
          autorun: ["citations"],
          messages: [agent([{ kind: "text", text: "I’m searching the way your customers do.", big: true }, { kind: "text", text: "Then I open each result the AIs lean on and check whether you’re on it. About two minutes — nothing changes on your site." }, { kind: "steps", items: ["Searching like a customer", "Opening each page AI reads", "Checking if you’re named"], done: 0 }], "src-run")],
        }
      }
      return { autorun: [], messages: [agent(citationBlocks(report, user.businessType, user.city, row!.createdAt), "src-report")] }
    }

    // ── Competitors ───────────────────────────────────────────────────────
    case "competitors": {
      const [comps, gapRow] = await Promise.all([
        db.competitor.findMany({ where: { userId }, orderBy: { analyzedAt: "desc" }, take: 6 }),
        db.contentGap.findFirst({ where: { userId }, orderBy: { analyzedAt: "desc" } }),
      ])
      if (comps.length === 0) {
        return { autorun: [], messages: [agent([{ kind: "text", text: "I haven’t found your competitors yet.", big: true }, { kind: "text", text: "I pick them up from the businesses the AIs name instead of you. Ask the AIs once and I’ll start watching the top ones." }, { kind: "chips", items: [{ label: "Ask the AIs now", action: { type: "link", href: "/dashboard" }, primary: true }] }], "cp-none")] }
      }
      const msgs: Message[] = [agent([{ kind: "text", text: `I’m watching ${comps.length} ${comps.length === 1 ? "competitor" : "competitors"} and re-reading their sites every week.`, big: true }, { kind: "text", text: "Here’s what’s working for them — and the gaps I can close for you." }], "cp-sum")]
      for (const c of comps.slice(0, 3)) {
        const d = isRecord(c.crawlData) ? c.crawlData : {}
        const strengths = (Array.isArray(d.strengths) ? d.strengths : []).filter((s): s is string => typeof s === "string").slice(0, 3)
        const name = c.name || host(c.url)
        if (!strengths.length) continue
        msgs.push(agent([{ kind: "text", text: `What’s working for ${name}:` }, { kind: "receipt", title: name, sub: host(c.url), items: strengths }], `cp-${c.id}`))
      }
      const gaps = Array.isArray(gapRow?.gaps) ? (gapRow!.gaps as { topic?: string; priority?: string; suggestedTitle?: string }[]) : []
      const rival = gapRow ? host(gapRow.competitorUrl) : ""
      for (const g of gaps.filter((g) => g.topic).sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0)).slice(0, 3)) {
        msgs.push(
          agent([
            { kind: "text", text: `${rival} answers “${g.topic}”. You don’t — so when AI gets asked, they’re the answer.` },
            { kind: "chips", items: [{ label: "Draft it for me", action: { type: "draft", topic: g.suggestedTitle || g.topic!, competitor: rival }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
          ], `gap-${g.topic}`)
        )
      }
      return { autorun: [], messages: msgs }
    }

    // ── Weekly Briefings ──────────────────────────────────────────────────
    case "briefings": {
      const reports = await db.weeklyReport.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 })
      if (reports.length === 0) {
        return { autorun: [], messages: [agent([{ kind: "text", text: "Your first briefing lands Monday morning.", big: true }, { kind: "text", text: "Each week I’ll tell you what I did, what moved, and what I need a yes on — here and by email." }], "br-none")] }
      }
      const msgs: Message[] = []
      for (const r of reports) {
        const week = r.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })
        const delta = isRecord(r.visibilityDelta) ? (r.visibilityDelta as Record<string, number>) : {}
        const up = Object.entries(delta).filter(([, v]) => typeof v === "number" && v > 0).map(([k]) => ENGINE_NAME[k] ?? k)
        const down = Object.entries(delta).filter(([, v]) => typeof v === "number" && v < 0).map(([k]) => ENGINE_NAME[k] ?? k)
        const lines: string[] = []
        if (up.length) lines.push(`${up.join(" and ")} started naming you.`)
        if (down.length) lines.push(`${down.join(" and ")} stopped naming you — I’m on it.`)
        if (!up.length && !down.length) lines.push("No change in which AIs name you.")
        if (r.postsPublished > 0) lines.push(`I published ${r.postsPublished} ${r.postsPublished === 1 ? "update" : "updates"} to your Google listing.`)
        if (r.reviewsNew > 0) lines.push(`You got ${r.reviewsNew} new ${r.reviewsNew === 1 ? "review" : "reviews"}.`)
        const movers = (Array.isArray(r.keywordMovers) ? r.keywordMovers : []) as { query?: string; positionBefore?: number; positionAfter?: number }[]
        const real = movers.filter((m) => m.query && typeof m.positionAfter === "number" && m.positionAfter > 0 && m.positionBefore !== m.positionAfter).slice(0, 2)
        for (const m of real) lines.push(`On Google, “${m.query}” moved from #${Math.round(m.positionBefore ?? 0)} to #${Math.round(m.positionAfter!)}.`)
        msgs.push(agent([{ kind: "divider", text: `Week of ${week}` }, { kind: "text", text: lines[0], big: true }, ...lines.slice(1).map((t) => ({ kind: "text", text: t }) as Block), ...(r.emailSent ? [{ kind: "text", text: "Also sent to your inbox." } as Block] : [])], `br-${r.id}`))
      }
      return { autorun: [], messages: msgs }
    }
  }
}
