// Data for the Briefing (/dashboard). Every figure is read from the DB or a connected account.
// Missing sources become an honest empty state ("Connect Google to see calls"), never a sample.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getProfileActions } from "@/lib/gmb"
import { eventDays, type EventDay } from "@/lib/tracking-events"
import { countLeads, getAccess } from "@/lib/metaads/store"
import { latestQuestionScan } from "@/lib/questions"
import { getEngineEvidence } from "@/lib/engine-evidence"
import { getAgentSettings } from "@/lib/agent/settings"
import { setupProgress } from "@/lib/agent/setup"
import { hasGrowth, hasPaidPlan, hasPro, isComped } from "@/lib/billing"
import { startWeekRun, WEEK_RUN, type WeekRun } from "@/lib/agent/week"
import { runAsUser } from "@/lib/usage"
import { listPosts, listAccounts } from "@/lib/social/store"
import { PLATFORM_NAME } from "@/lib/social/types"
import { imageUrl } from "@/lib/images"
import { LEDGER_TYPES, ledgerText, ENGINE_NAME, ENGINE_ORDER } from "@/lib/agent/briefing"
import { REVIEW_DRAFT } from "@/lib/approvals"
import type { Chip } from "@/lib/agent/types"
import { getAiCards, type AiCard } from "./ai-cards"
import { scheduledSitePosts } from "./site-posts"
import { ART, ago, cached, channelOf, headlineOf, n, pctChange, short, whenAhead, within } from "./common"

const DAY = 86_400_000

export type Part = { label: string; value: number; prev: number | null }
export type Headline = { total: number; prev: number | null; parts: Part[]; days: number; missing: string[] } | { total: null; missing: string[] }
export type Tile = { key: string; label: string; value: string | null; delta: string | null; empty: string; href?: string }
export type GoingItem = {
  id: string
  kind: "social" | "gbp" | "site"
  lane: string
  big: string
  small: string
  title: string
  text: string
  image: string | null
  at: string
  when: string
  art: string
}
/** What a button does: open a page, run an existing agent chip, open a chat thread, or open the autopilot warning. */
export type Act = { label: string; href?: string; chip?: Chip; topic?: string; autopilot?: boolean; primary?: boolean }
export type Question = { id: string; eyebrow: string; title: string; text: string; fallback: string; acts: Act[]; review?: { ai: string; claim: string; truth: string; fix: Chip } | null }
export type DoneItem = { ch: string; text: string; when: string; at: string; href: string | null }

export type PlanItem = { kind: "blog" | "google" | "social"; title: string; day: string; status: string; needsOk: boolean }
export type WeekPlan = { runId: string; running: boolean; items: PlanItem[]; summary: string; needsOk: number } | null

export type BriefingData = {
  plan: WeekPlan
  /** Website pages written and waiting or scheduled (post_draft ready / scheduled). */
  pagesInProgress: number
  /** Something real happened in the period (a published item or a lead): the recap has content. */
  recapReady: boolean
  /** Connections that feed the numbers, for the compact setup bar. */
  connected: { n: number; total: number; next: Act | null }
  firstName: string | null
  ai: AiCard[]
  headline: Headline
  tiles: Tile[]
  question: Question | null
  going: GoingItem[]
  waiting: number
  waitingTopic: string
  autopilot: boolean
  done: DoneItem[]
}

/** Calls from the Google listing over [start, end], cached 6h (Google's data lags ~3 days). */
async function googleCalls(userId: string, integ: NonNullable<Awaited<ReturnType<typeof db.integration.findUnique>>>) {
  return cached(`ws:gbp-calls:${userId}`, 6 * 3_600_000, async () => {
    const end = new Date(Date.now() - 3 * DAY)
    const [now, prev] = await within(
      Promise.all([
        getProfileActions(integ, new Date(end.getTime() - 29 * DAY), end),
        getProfileActions(integ, new Date(end.getTime() - 59 * DAY), new Date(end.getTime() - 30 * DAY)),
      ]),
      7000,
      [null, null] as const,
    )
    return now ? { now: now.calls, prev: prev?.calls ?? null } : null
  })
}

const LEAD_KINDS = { phone: "phone", email: "message", form: "message", hubspot: "message", typeform: "message", calendly: "booking" } as const
function splitLeads(days: EventDay[]) {
  const cut = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10)
  const out = { now: { phone: 0, message: 0, booking: 0 }, prev: { phone: 0, message: 0, booking: 0 }, hasPrev: false }
  for (const d of days) {
    if (d.day < cut) out.hasPrev = true
    const bucket = d.day >= cut ? out.now : out.prev
    for (const [k, g] of Object.entries(LEAD_KINDS)) bucket[g] += d.counts?.[k as keyof typeof LEAD_KINDS] ?? 0
  }
  return out
}

export async function getHeadline(user: User): Promise<Headline> {
  const [integ, settings, meta] = await Promise.all([
    db.integration.findUnique({ where: { userId: user.id } }),
    getAgentSettings(user.id),
    getAccess(user.id).catch(() => null),
  ])
  const parts: Part[] = []
  const missing: string[] = []
  if (integ?.gmbLocationId) {
    const c = await googleCalls(user.id, integ).catch(() => null)
    if (c) parts.push({ label: "Calls from Google", value: c.now, prev: c.prev })
  } else missing.push("Connect your Google listing to count calls from Google.")

  if (settings.tracking?.on) {
    const days = await eventDays(user.id, 60).catch(() => [])
    const s = splitLeads(days)
    // No counter rows before the window = tracking wasn't on yet, so there is nothing to compare with.
    const pv = (x: number) => (s.hasPrev ? x : null)
    parts.push({ label: "Calls from your website", value: s.now.phone, prev: pv(s.prev.phone) })
    parts.push({ label: "Messages and forms", value: s.now.message, prev: pv(s.prev.message) })
    if (s.now.booking || s.prev.booking) parts.push({ label: "Bookings", value: s.now.booking, prev: pv(s.prev.booking) })
  } else missing.push("Turn on lead tracking to count calls, forms and bookings from your website.")

  if (meta) {
    const [now, all] = await Promise.all([countLeads(user.id, 30), countLeads(user.id, 60)]).catch(() => [0, 0])
    if (now || all) parts.push({ label: "Leads from your ads", value: now, prev: all > now ? all - now : null })
  }

  if (!parts.length) return { total: null, missing }
  const total = parts.reduce((a, p) => a + p.value, 0)
  const prev = parts.every((p) => p.prev != null) ? parts.reduce((a, p) => a + (p.prev ?? 0), 0) : null
  return { total, prev, parts, days: 30, missing }
}

export async function getTiles(user: User): Promise<Tile[]> {
  const [qs, snap, integ] = await Promise.all([
    latestQuestionScan(user.id).catch(() => null),
    db.analyticsSnapshot.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true, gaPropertyId: true } }),
  ])
  const tiles: Tile[] = []

  // AI answers: the weekly question scan across the four AIs, else the per-AI evidence.
  if (qs && Date.now() - qs.at.getTime() < 14 * DAY && qs.scan.answers > 0) {
    tiles.push({ key: "ai", label: "AI answers naming you", value: `${qs.scan.named} of ${qs.scan.answers}`, delta: null, empty: "" })
  } else {
    const ev = await getEngineEvidence({ id: user.id, email: user.email }).catch(() => null)
    const known = ENGINE_ORDER.filter((e) => ev?.[e] && ev[e].state !== "unknown")
    const yes = known.filter((e) => ev![e].state === "found" || ev![e].state === "partial")
    tiles.push(known.length
      ? { key: "ai", label: "AIs naming you", value: `${yes.length} of ${known.length}`, delta: null, empty: "" }
      : { key: "ai", label: "AI answers naming you", value: null, delta: null, empty: "My first check runs this week." })
  }

  // Website visits: Google Analytics, synced as 28-day totals.
  if (snap && Date.now() - snap.date.getTime() < 10 * DAY) {
    const before = await db.analyticsSnapshot.findFirst({
      where: { userId: user.id, date: { gte: new Date(snap.date.getTime() - 35 * DAY), lte: new Date(snap.date.getTime() - 21 * DAY) } },
      orderBy: { date: "desc" },
    })
    const p = pctChange(snap.sessions, before?.sessions)
    tiles.push({ key: "visits", label: "Website visits · 28 days", value: n(snap.sessions), delta: p == null ? null : `${p > 0 ? "+" : ""}${p}%`, empty: "" })
  } else {
    tiles.push({ key: "visits", label: "Website visits", value: null, delta: null, empty: integ?.gaPropertyId ? "Syncing your visits." : "Connect Google Analytics to see visits.", href: integ?.gaPropertyId ? undefined : "/dashboard/settings/integrations" })
  }

  // Google rating: the reviews synced from the Business Profile.
  if (integ?.gmbLocationId) {
    const [agg, fresh] = await Promise.all([
      db.gmbReview.aggregate({ where: { userId: user.id }, _avg: { rating: true }, _count: true }),
      db.gmbReview.count({ where: { userId: user.id, publishedAt: { gte: new Date(Date.now() - 30 * DAY) } } }),
    ])
    tiles.push(agg._count
      ? { key: "rating", label: "Google rating", value: `${(agg._avg.rating ?? 0).toFixed(1)} ★`, delta: fresh ? `${fresh} new review${fresh === 1 ? "" : "s"}` : null, empty: "" }
      : { key: "rating", label: "Google rating", value: null, delta: null, empty: "No reviews synced yet." })
  } else {
    tiles.push({ key: "rating", label: "Google rating", value: null, delta: null, empty: "Connect your Google listing to see reviews.", href: "/api/integrations/google/connect?go=1" })
  }

  // Return on ad spend, once ads have spent (lib/roas): tracked only, else how to turn it on.
  if (hasGrowth(user)) {
    const roas = await roasTile(user).catch(() => null)
    if (roas) tiles.unshift(roas)
  }
  return tiles
}

async function roasTile(user: User): Promise<Tile | null> {
  const [meta, gacc] = await Promise.all([getAccess(user.id).catch(() => null), import("@/lib/gads/store").then((m) => m.getGadsAccount(user.id)).catch(() => null)])
  if (!meta && !gacc?.customerId) return null
  const { getRoas } = await import("@/lib/roas/sources")
  const { fmtRoas } = await import("@/lib/roas/rules")
  const r = await within(getRoas(user), 3000, null)
  if (!r) return null
  const w = r.windows[30]
  if (!w.platforms.some((p) => p.spend > 0)) return null
  const o = w.overall
  return o.roas !== null && o.revenue !== null && o.currency
    ? { key: "roas", label: "Tracked ROAS · 30 days", value: fmtRoas(o.roas), delta: `${new Intl.NumberFormat("en-US", { style: "currency", currency: o.currency, maximumFractionDigits: 0 }).format(o.revenue)} in sales`, empty: "", href: "/dashboard/ads" }
    : { key: "roas", label: "Return on ad spend", value: null, delta: null, empty: r.next ?? "Mark leads as won to see what your ads earn.", href: "/dashboard/ads" }
}

/** Scheduled social and Google posts: they go out on their own, and Stop holds them. */
export async function getGoing(user: User): Promise<GoingItem[]> {
  const now = Date.now()
  const out: GoingItem[] = []
  if (hasPro(user)) {
    const [posts, accounts] = await Promise.all([listPosts(user.id, 40).catch(() => []), listAccounts(user.id).catch(() => [])])
    const byId = new Map(accounts.map((a) => [a.id, a]))
    for (const p of posts) {
      if (p.status !== "scheduled" || !p.scheduledFor || Date.parse(p.scheduledFor) < now - 10 * 60_000) continue
      const where = Array.from(new Set(p.accountIds.map((id) => byId.get(id)).filter((a): a is NonNullable<typeof a> => !!a).map((a) => PLATFORM_NAME[a.platform])))
      out.push({
        id: p.id, kind: "social", lane: `Social · ${where.join(" & ") || "not connected"}`,
        big: short(p.title || headlineOf(p.text, 40), 40), small: where.length ? `${where.length} account${where.length === 1 ? "" : "s"}` : "",
        title: headlineOf(p.text), text: p.text, image: p.imageId ? imageUrl(p.imageId) : null,
        at: p.scheduledFor, when: whenAhead(p.scheduledFor), art: ART.social,
      })
    }
  }
  const gbp = await db.gbpPost.findMany({ where: { userId: user.id, status: "scheduled", scheduledFor: { gte: new Date(now - 10 * 60_000) } }, orderBy: { scheduledFor: "asc" }, take: 6 })
  for (const g of gbp) {
    out.push({
      id: g.id, kind: "gbp", lane: "Google listing · update", big: short(headlineOf(g.content, 40), 40), small: "On your Google listing",
      title: headlineOf(g.content), text: g.content, image: null, at: g.scheduledFor!.toISOString(), when: whenAhead(g.scheduledFor!.toISOString()), art: ART.google,
    })
  }
  for (const p of await scheduledSitePosts(user.id).catch(() => [])) {
    const at = p.m.scheduledFor!
    out.push({
      id: p.id, kind: "site", lane: "Website · new post", big: short(p.m.title ?? "New post", 40), small: "On your website",
      title: p.m.title ?? "New post", text: p.m.excerpt || headlineOf(p.m.markdown ?? "", 200), image: p.m.imageId ? imageUrl(p.m.imageId) : null,
      at, when: whenAhead(at), art: ART.blog,
    })
  }
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(0, 9)
}

/** Things written but waiting for the owner's OK (autopilot off, or not covered by it). */
async function waitingCount(user: User): Promise<{ total: number; topic: string }> {
  const integ = await db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true, gmbAccountId: true } })
  const gmb = !!(integ?.gmbAccountId && integ?.gmbLocationId)
  const [social, gbp, reviews] = await Promise.all([
    hasPro(user) ? listPosts(user.id, 30).then((p) => p.filter((x) => x.status === "draft").length).catch(() => 0) : 0,
    gmb ? db.gbpPost.count({ where: { userId: user.id, status: "draft", createdAt: { gte: new Date(Date.now() - 14 * DAY) } } }) : 0,
    gmb ? db.mockActivity.count({ where: { userId: user.id, type: REVIEW_DRAFT, createdAt: { gte: new Date(Date.now() - 14 * DAY) } } }) : 0,
  ])
  const total = social + gbp + reviews
  const topic = social >= gbp && social >= reviews ? "social" : reviews >= gbp ? "reviews" : "content"
  return { total, topic }
}

export async function getQuestion(user: User, waiting: { total: number; topic: string }, autopilot: boolean): Promise<Question | null> {
  const [qs, setup, settings] = await Promise.all([latestQuestionScan(user.id).catch(() => null), setupProgress(user).catch(() => null), getAgentSettings(user.id)])
  // 1. A fact an AI gets wrong: the owner confirms the truth before I publish a correction.
  const fresh = qs && Date.now() - qs.at.getTime() < 14 * DAY ? qs.scan : null
  const high = fresh?.facts.issues.find((i) => i.severity === "high")
  if (high) {
    const ai = ENGINE_NAME[high.engine as keyof typeof ENGINE_NAME] ?? "An AI"
    return {
      id: `fact:${short(high.claim, 40)}`, eyebrow: "AI answers · a fact to check",
      title: `${ai} tells customers “${short(high.claim, 120)}”. Is that wrong?`,
      text: `What I found on your site: ${short(high.truth, 200)}. I’ve written the correction.`,
      fallback: "Until you confirm, I don’t change anything on your site.",
      acts: [{ label: "See every answer", topic: "answers" }],
      review: { ai, claim: high.claim, truth: high.truth, fix: { label: "Write the correction", action: { type: "draft", topic: `The facts about ${user.businessName ?? "our business"}: ${short(high.truth, 160)}` } } },
    }
  }
  // 2. A first-time connection, one at a time (lib/agent/setup.ts).
  const next = setup?.next
  if (next && ["google", "site", "social", "tracking"].includes(next.key)) {
    const chip = next.chip
    const act: Act = chip?.action.type === "link" ? { label: chip.label, href: chip.action.href, primary: true } : chip ? { label: chip.label, chip, primary: true } : { label: "Set it up", topic: "setup", primary: true }
    return {
      id: `setup:${next.key}`, eyebrow: `Setup · step ${next.n} of ${setup!.total}`, title: next.name, text: next.why,
      fallback: "Until then, I keep working with what I have.",
      acts: [act, { label: "See all steps", topic: "setup" }],
    }
  }
  // 3. Money: ads never run without a monthly limit the owner set.
  if (hasGrowth(user) && !settings.autopilot?.adBudget) {
    return {
      id: "money:adBudget", eyebrow: "Ads · budget", title: "What’s the most I can spend on ads each month?",
      text: "Across Google and Meta together. Google and Meta bill you directly; I never mark it up.",
      fallback: "No answer = I don’t run any ads.",
      acts: [{ label: "Set my monthly limit", primary: true, chip: { label: "Set my monthly budget", action: { type: "agent-op", endpoint: "autopilot", body: { op: "budget" }, form: { text: "What’s the most you want to spend on ads each month, across Google and Meta together?", fields: [{ name: "amount", label: "Monthly ad budget", type: "text", placeholder: "500", value: "", required: true }], cta: "Save my budget", fine: "A number in the currency you pay Google and Meta in. I never go over it." } } } }],
    }
  }
  // 4. Autopilot is off and finished work is waiting: one switch instead of a queue.
  if (!autopilot && waiting.total > 0) {
    return {
      id: `autopilot:${waiting.total}`, eyebrow: "Autopilot",
      title: `${waiting.total} thing${waiting.total === 1 ? " is" : "s are"} ready. Let me send ${waiting.total === 1 ? "it" : "them"} on my own from now on?`,
      text: "With autopilot on, finished posts and replies go out on schedule and show up under “Going out soon”, where you can stop any of them.",
      fallback: "No answer = they wait for you.",
      acts: [{ label: "Turn on autopilot", autopilot: true, primary: true }, { label: "Look at them first", topic: waiting.topic }],
    }
  }
  return null
}

export async function getDone(userId: string, days = 7): Promise<DoneItem[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: { in: LEDGER_TYPES }, createdAt: { gte: new Date(Date.now() - days * DAY) } }, orderBy: { createdAt: "desc" }, take: 80 })
  const seen = new Set<string>()
  const out: DoneItem[] = []
  for (const w of rows) {
    const meta = (w.metadata ?? {}) as Record<string, unknown>
    const text = ledgerText(w.type, w.title, meta)
    if (!text) continue
    const key = `${w.createdAt.toISOString().slice(0, 10)}|${text}`
    if (seen.has(key)) continue
    seen.add(key)
    const href = typeof meta.url === "string" && /^https?:\/\//.test(meta.url) && !meta.undone ? meta.url : null
    out.push({ ch: channelOf(w.type), text, when: ago(w.createdAt.toISOString()), at: w.createdAt.toISOString(), href })
    if (out.length >= 14) break
  }
  return out
}

export async function getBriefingData(user: User): Promise<BriefingData> {
  const settings = await getAgentSettings(user.id)
  const autopilot = !!settings.autoApprove
  const [ai, headline, tiles, going, waiting, done] = await Promise.all([
    getAiCards(user).catch(() => []),
    getHeadline(user).catch((): Headline => ({ total: null, missing: [] })),
    getTiles(user).catch(() => []),
    getGoing(user).catch(() => []),
    waitingCount(user).catch(() => ({ total: 0, topic: "content" })),
    getDone(user.id).catch(() => []),
  ])
  const question = await getQuestion(user, waiting, autopilot).catch(() => null)
  const [plan, pagesInProgress, published, connected] = await Promise.all([
    going.length ? Promise.resolve(null) : getPlan(user).catch(() => null),
    db.mockActivity.count({ where: { userId: user.id, type: "post_draft", OR: [{ metadata: { path: ["status"], equals: "ready" } }, { metadata: { path: ["status"], equals: "scheduled" } }] } }),
    db.mockActivity.count({ where: { userId: user.id, type: { in: ["gbp_post", "social_published", "site_change", "review_reply", "email_campaign_sent"] }, createdAt: { gte: new Date(Date.now() - 30 * DAY) } } }),
    getConnected(user).catch(() => ({ n: 0, total: 0, next: null })),
  ])
  const recapReady = published > 0 || (headline.total ?? 0) > 0
  return { plan, pagesInProgress, recapReady, connected, firstName: user.fullName?.trim().split(/\s+/)[0] || null, ai, headline, tiles, question, going, waiting: waiting.total, waitingTopic: waiting.topic, autopilot, done }
}

const KIND_WORD = { blog: ["page that answers AI questions", "pages that answer AI questions"], google: ["Google update", "Google updates"], social: ["social post", "social posts"] } as const
const planKicked = new Set<string>()

/**
 * Nothing scheduled: show this week's plan from the existing week run (lib/agent/week.ts). If there
 * is no run in the last 7 days, start one in the background (paid plans, once per brand).
 */
export async function getPlan(user: User): Promise<WeekPlan> {
  const row = await db.mockActivity.findFirst({ where: { userId: user.id, type: WEEK_RUN, createdAt: { gte: new Date(Date.now() - 7 * DAY) } }, orderBy: { createdAt: "desc" }, select: { id: true, metadata: true } })
  if (!row) {
    if ((!hasPaidPlan(user) && !isComped(user.email)) || planKicked.has(user.id)) return null
    planKicked.add(user.id)
    setTimeout(() => planKicked.delete(user.id), 6 * 3_600_000)
    const id = await runAsUser(user.id, () => startWeekRun(user.id)).catch(() => null)
    return id ? { runId: id, running: true, items: [], summary: "", needsOk: 0 } : null
  }
  const run = row.metadata as WeekRun
  if (run.status === "failed") return null
  const items: PlanItem[] = (run.items ?? []).filter((i) => i.status !== "failed").map((i) => ({
    kind: i.kind, title: i.title, day: i.day, status: i.status,
    needsOk: (i.kind === "social" && i.socialId && i.socialStatus === "draft") || (i.kind === "google" && i.postId && i.status === "ready") || (i.kind === "blog" && i.draftId && i.status === "ready") ? true : false,
  }))
  const counts = (["social", "blog", "google"] as const).map((k) => [k, items.filter((i) => i.kind === k).length] as const).filter(([, c]) => c)
  const summary = counts.map(([k, c]) => `${c} ${KIND_WORD[k][c === 1 ? 0 : 1]}`).join(" · ")
  return { runId: row.id, running: run.status === "running", items, summary, needsOk: items.filter((i) => i.needsOk).length }
}

/** How many of the connections behind the numbers are on, and the next one to connect. */
async function getConnected(user: User): Promise<BriefingData["connected"]> {
  const [integ, s] = await Promise.all([db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true, gaPropertyId: true, gscSiteUrl: true } }), getAgentSettings(user.id)])
  const list: { ok: boolean; act: Act }[] = [
    { ok: !!integ?.gmbLocationId, act: { label: "Connect your Google listing", href: "/api/integrations/google/connect?go=1" } },
    { ok: !!integ?.gaPropertyId, act: { label: integ ? "Pick your Analytics property" : "Connect Google Analytics", href: integ ? "/dashboard/settings/integrations" : "/api/integrations/google/connect?go=1" } },
    { ok: !!(s.wp || s.site), act: { label: "Connect your website", chip: { label: "Connect my website", action: { type: "wp-connect" } } } },
  ]
  if (hasPro(user)) list.push({ ok: !!s.tracking?.on, act: { label: "Turn on lead tracking", topic: "tracking" } })
  return { n: list.filter((x) => x.ok).length, total: list.length, next: list.find((x) => !x.ok)?.act ?? null }
}
