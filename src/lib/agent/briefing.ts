// The owner's morning briefing: three answers, in this order.
//   1. Am I winning?          yes/no for each of the four AIs, who they name
//                             instead, and what I'm doing about it.
//   2. What's holding you up? every item waiting for the owner's OK, written
//                             in full so approving it is one tap.
//   3. Are you working?       a plain-English ledger of real work, with proof.
// Shared by the dashboard (components/agent/Briefing.tsx) and the weekly
// briefing email. Every line comes from a database row; nothing is invented.

import { db } from "@/lib/db"
import { getEngineEvidence, type EngineKey } from "@/lib/engine-evidence"
import { latestQuestionScan } from "@/lib/questions"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasPaidPlan } from "@/lib/billing"
import { REVIEW_DRAFT } from "@/lib/approvals"
import type { CitationReport } from "@/lib/citations"
import { imageUrl } from "@/lib/images"

export const ENGINE_ORDER: EngineKey[] = ["chatgpt", "gemini", "claude", "perplexity"]
export const ENGINE_NAME: Record<EngineKey, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity" }

export type Light = "yes" | "no" | "unknown"

export type InboxItem =
  | { kind: "review"; id: string; title: string; quote: string | null; text: string | null }
  | { kind: "gbp"; id: string; title: string; text: string }
  | { kind: "post"; id: string; title: string; text: string; image: string | null }
  | { kind: "fix"; id: string; title: string; text: string; topic: string }
  | { kind: "connect"; id: string; title: string; text: string; href: string; cta: string }

export type LedgerItem = { text: string; href: string | null; at: string }

export type Briefing = {
  firstName: string | null
  lights: { engine: EngineKey; name: string; light: Light }[]
  headline: string
  asOf: string | null // ISO of the newest check
  rivalLine: string | null
  planLine: string | null
  inbox: InboxItem[]
  ledger: LedgerItem[]
  nextCheck: string // ISO
  /** What I'll do next and when: the work never looks idle. */
  nextUp: { text: string; at: string }
  /** Firsts worth remembering, oldest first. */
  milestones: { text: string; at: string }[]
}

/** Next time a scheduler slot fires (UTC): `dows` = days of week (0 = Sun), or every day. */
function nextSlot(hour: number, dows: number[] | null, after = new Date()): Date {
  for (let i = 0; i < 8; i++) {
    const d = new Date(after)
    d.setUTCDate(d.getUTCDate() + i)
    d.setUTCHours(hour, 0, 0, 0)
    if (d > after && (!dows || dows.includes(d.getUTCDay()))) return d
  }
  return new Date(after.getTime() + 86_400_000)
}

const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`)

// Upbeat and honest: lead with every AI that recommends them, then say who
// I'm working on next. Never claim an AI recommends them unless it did.
function headlineFor(lights: Briefing["lights"]): string {
  const yes = lights.filter((l) => l.light === "yes").map((l) => l.name)
  const no = lights.filter((l) => l.light === "no").map((l) => l.name)
  const unknown = lights.filter((l) => l.light === "unknown").map((l) => l.name)
  if (yes.length === 0 && no.length === 0) return "I’m checking the four AIs for you right now."
  const parts: string[] = []
  if (yes.length === 4) parts.push("Great news! All four AIs are recommending you to customers.")
  else if (yes.length) parts.push(`Great news! ${list(yes)} ${yes.length === 1 ? "is" : "are"} recommending you to customers.`)
  if (no.length === 4) parts.push("I’m working on getting all four AIs to recommend you.")
  else if (no.length) parts.push(`I’m working on ${list(no)} next.`)
  if (unknown.length) parts.push(`I’m checking ${list(unknown)} now.`)
  return parts.join(" ")
}

// Ledger: only real work, in words an owner would use. Setup, billing, emails
// and bookkeeping rows are left out.
const SITE_OP: Record<string, string> = {
  schema: "Added the behind-the-scenes code AI uses to confirm who you are and where you are",
  llms: "Wrote the background file AI assistants read about you (llms.txt) and added it to your site",
  robots: "Opened your site to ChatGPT, Claude and Perplexity’s search bots",
  sitemap: "Turned on your sitemap so search engines can find every page",
  headers: "Added basic security settings to your site",
  meta: "Rewrote your page title and description so Google and AI know what you do",
}
export function ledgerText(type: string, title: string, meta: Record<string, unknown>): string | null {
  switch (type) {
    case "site_change":
      if (meta.undone) return null
      return SITE_OP[String(meta.op)] ?? title
    case "review_reply": return "Replied to a Google review"
    case "gbp_post": return "Posted an update to your Google listing"
    case "gbp_post_draft": return "Wrote an update for your Google listing"
    case REVIEW_DRAFT: return title
    case "post_draft": return meta.status === "published" && meta.auto ? title.replace(/^Drafted a post/, "Wrote and published a post") : title.replace(/^Drafted a post/, "Wrote a new post for you")
    case "draft_written": return title
    case "question_scan": return title
    case "visibility_scan": return "Checked whether ChatGPT, Gemini, Claude and Perplexity recommend you"
    case "citation_scan": return "Found the pages AI reads before it recommends a business like yours"
    case "site_check": return "Read your website the way AI does"
    case "competitors": return title
    case "content_gaps": return "Found topics your competitors cover that you don’t"
    case "handoff_sent": return title
    case "review_request": return title
    case "voice_learned": return "Learned how your business sounds from your website"
    case "win": return meta.kind === "engine_named" ? null : title.replace(/^🎉\s*/u, "")
    case "guarantee_credit": return title
    default: return null
  }
}
export const LEDGER_TYPES = ["site_change", "review_reply", "gbp_post", "gbp_post_draft", REVIEW_DRAFT, "post_draft", "draft_written", "question_scan", "visibility_scan", "citation_scan", "site_check", "competitors", "content_gaps", "handoff_sent", "review_request", "voice_learned", "win", "guarantee_credit"]

// The weekly AI re-check runs Wednesdays 09:00 UTC (lib/cron-scheduler.ts).
export function nextCheck(now = new Date()): string {
  const d = new Date(now)
  d.setUTCHours(9, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + ((3 - d.getUTCDay() + 7) % 7))
  if (d <= now) d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString()
}

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s)

export async function buildBriefing(userId: string, opts: { ledgerDays?: number } = {}): Promise<Briefing | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      integration: true,
      gmbReviews: { where: { reply: null }, orderBy: { publishedAt: "desc" }, take: 5 },
      gbpPosts: { where: { status: "draft" }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  })
  if (!user) return null
  const since = new Date(Date.now() - (opts.ledgerDays ?? 7) * 86_400_000)
  const [evidence, qs, settings, citationRow, postDrafts, reviewDrafts, work] = await Promise.all([
    getEngineEvidence({ id: user.id, email: user.email }),
    latestQuestionScan(user.id).catch(() => null),
    getAgentSettings(user.id),
    db.mockActivity.findFirst({ where: { userId, type: "citation_scan" }, orderBy: { createdAt: "desc" } }),
    db.mockActivity.findMany({ where: { userId, type: "post_draft" }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.mockActivity.findMany({ where: { userId, type: REVIEW_DRAFT }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.mockActivity.findMany({ where: { userId, type: { in: LEDGER_TYPES }, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 80 }),
  ])

  // ── 1. Am I winning? ──────────────────────────────────────────────────────
  const lights = ENGINE_ORDER.map((e) => {
    const s = evidence[e]?.state ?? "unknown"
    return { engine: e, name: ENGINE_NAME[e], light: (s === "found" || s === "partial" ? "yes" : s === "missing" ? "no" : "unknown") as Light }
  })
  const times = ENGINE_ORDER.map((e) => evidence[e]?.at).filter((d): d is Date => !!d)
  const asOf = times.length ? new Date(Math.max(...times.map((d) => d.getTime()))).toISOString() : null
  const anyNo = lights.some((l) => l.light === "no")
  const freshScan = qs && Date.now() - qs.at.getTime() < 14 * 86_400_000 ? qs.scan : null
  const self = (user.businessName ?? "").trim().toLowerCase()
  const rival = freshScan?.rivals.find((r) => r.name.trim().toLowerCase() !== self)
  const rivalLine = anyNo && rival ? `When they don’t name you, they name ${rival.name} instead.` : null

  const report = citationRow?.metadata && Array.isArray((citationRow.metadata as { targets?: unknown }).targets) ? (citationRow.metadata as unknown as CitationReport) : null
  const plan: string[] = []
  if (anyNo) {
    if (hasPaidPlan(user)) plan.push("I’m writing pages that answer the questions your customers ask them")
    if (report && report.missing > 0) plan.push(`I’ve lined up the ${report.missing} ${report.missing === 1 ? "site" : "sites"} they read that don’t list you yet`)
  }
  const planLine = plan.length ? `${plan.join(", and ")}.` : null

  // ── 2. What's holding you up? ─────────────────────────────────────────────
  const inbox: InboxItem[] = []
  const gmb = !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)
  const high = freshScan?.facts.issues.find((i) => i.severity === "high")
  if (high) inbox.push({ kind: "fix", id: "facts", title: `${ENGINE_NAME[high.engine as EngineKey] ?? "An AI"} has a fact about you wrong`, text: `It tells customers “${high.claim}”. The truth: ${high.truth}. I’ve written the correction for your site.`, topic: "answers" })
  if (gmb) {
    for (const r of user.gmbReviews) {
      const draft = reviewDrafts.find((d) => (d.metadata as { reviewId?: string } | null)?.reviewId === r.id)
      inbox.push({
        kind: "review",
        id: r.id,
        title: `${r.authorName} left you a ${r.rating}-star review. Here’s my reply:`,
        quote: r.comment ? short(r.comment, 280) : null,
        text: (draft?.metadata as { text?: string } | null)?.text ?? null,
      })
    }
    for (const p of user.gbpPosts) inbox.push({ kind: "gbp", id: p.id, title: "I wrote an update for your Google listing:", text: p.content })
  }
  if (settings.wp || settings.site) {
    for (const d of postDrafts) {
      const m = (d.metadata ?? {}) as { title?: string; markdown?: string; status?: string; imageId?: string | null }
      if (m.status !== "ready" || !m.markdown) continue
      inbox.push({ kind: "post", id: d.id, title: `I wrote a new post for your website: “${m.title ?? "New post"}”`, text: m.markdown, image: m.imageId ? imageUrl(m.imageId) : null })
    }
  }
  if (!user.integration) inbox.push({ kind: "connect", id: "google", title: "Connect your Google listing", text: "Then I can reply to your reviews and post updates to Google for you. It takes about a minute.", href: "/api/integrations/google/connect?go=1", cta: "Connect Google" })

  // ── 3. Are you actually working? ──────────────────────────────────────────
  const seen = new Set<string>()
  const ledger: LedgerItem[] = []
  for (const w of work) {
    const meta = (w.metadata ?? {}) as Record<string, unknown>
    const text = ledgerText(w.type, w.title, meta)
    if (!text) continue
    const day = w.createdAt.toISOString().slice(0, 10)
    if (seen.has(`${day}|${text}`)) continue
    seen.add(`${day}|${text}`)
    const href = typeof meta.url === "string" && /^https?:\/\//.test(meta.url) && !meta.undone ? meta.url : null
    ledger.push({ text, href, at: w.createdAt.toISOString() })
    if (ledger.length >= 25) break
  }

  // ── What I do next (times from lib/cron-scheduler.ts) ──────────────────────
  const paid = hasPaidPlan(user)
  const jobs: { text: string; at: Date }[] = [
    { text: "Asking ChatGPT, Gemini, Claude and Perplexity about you again", at: nextSlot(9, [3]) },
    { text: "Checking your listings and your site’s security", at: nextSlot(9, [2]) },
  ]
  if (gmb && user.gmbReviews.length) jobs.push({ text: "Writing replies to your new reviews", at: nextSlot(6, null) })
  if (gmb && paid) jobs.push({ text: "Writing your next Google listing update", at: nextSlot(13, [1, 2, 4, 5]) })
  if (paid) {
    // The writer drafts a post at most every 3 days (api/cron/content).
    const lastDraft = postDrafts[0]?.createdAt
    jobs.push({ text: "Writing your next post", at: nextSlot(10, null, lastDraft ? new Date(Math.max(Date.now(), lastDraft.getTime() + 3 * 86_400_000 - 3_600_000)) : new Date()) })
  }
  const soonest = jobs.sort((a, b) => a.at.getTime() - b.at.getTime())[0]

  // ── Milestones ────────────────────────────────────────────────────────────
  const firsts = await db.mockActivity.findMany({ where: { userId, type: "win", metadata: { path: ["kind"], equals: "engine_appeared" } }, orderBy: { createdAt: "asc" }, take: 12, select: { metadata: true, createdAt: true } })
  const milestones: Briefing["milestones"] = [{ text: "I started working for you", at: user.createdAt.toISOString() }]
  const seenEngines = new Set<string>()
  for (const f of firsts) {
    const e = (f.metadata as { engine?: string } | null)?.engine
    if (!e || seenEngines.has(e)) continue
    seenEngines.add(e)
    milestones.push({ text: `${ENGINE_NAME[e as EngineKey] ?? e} recommended you for the first time`, at: f.createdAt.toISOString() })
  }

  return { nextUp: { text: soonest.text, at: soonest.at.toISOString() }, milestones, firstName: user.fullName?.trim().split(/\s+/)[0] || null, lights, headline: headlineFor(lights), asOf, rivalLine, planLine, inbox, ledger, nextCheck: nextCheck() }
}
