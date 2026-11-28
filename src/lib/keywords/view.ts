// Research → Keywords: every phrase the brand cares about, from its own data, with Google's
// numbers. Rows come from: Search Console queries (90 days), the AI questions I track, Topic plan
// article targets, real competitors' page topics (Research gaps), the owner's pinned searches and
// Keyword Planner ideas around what the business sells. Each row: volume (Keyword Planner),
// difficulty 0-100 + intent (DataForSEO Labs), current Google position (Search Console) and an
// opportunity score = volume × winnability (lib/keywords/rules.ts).
//
// The page reads the cache only (fast). Missing/stale numbers are fetched in the background
// (at most once a day per brand on view, plus the monthly cron), on the brand's data_usd quota.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { latestQuestionScan } from "@/lib/questions"
import { relevantGaps } from "@/lib/competitor-relevance"
import type { GapItem } from "@/lib/content-gaps"
import { runAsUser } from "@/lib/usage"
import { latestBacklinks } from "@/lib/backlinks/run"
import { isComped } from "@/lib/billing"
import { cachedMetrics, keywordIdeas, keywordMetrics, KW_TYPE } from "./data"
import {
  difficultyLabel, difficultyTone, intentLabel, normKeyword, opportunity, plannerOk, siteStrength, trendOf, volumeLabel, volumeValue, winnability,
  type KeywordMetric,
} from "./rules"

export type KwSource = "gsc" | "ai" | "plan" | "gap" | "pin" | "idea"
export const SOURCE_LABEL: Record<KwSource, string> = { gsc: "Your Google searches", ai: "AI question", plan: "Topic plan", gap: "Competitor page", pin: "You picked it", idea: "Related search" }

export type KeywordRow = {
  keyword: string
  /** The words as they came in (an AI question keeps its question mark). */
  text: string
  sources: KwSource[]
  volume: string
  volumeN: number
  ranged: boolean
  trend: "up" | "down" | "flat" | null
  difficulty: number | null
  difficultyLabel: string
  tone: "g" | "a" | "r" | "n"
  intent: string | null
  bids: string | null
  position: number | null
  impressions: number | null
  clicks: number | null
  score: number
  win: number | null
  pinned: boolean
  /** A search for the business's own name (or a typo of it). Shown folded, apart from the rest. */
  branded?: boolean
}

export type KeywordsView = {
  rows: KeywordRow[]
  strength: number
  strengthFrom: "links" | "default"
  measuredAt: string | null
  refreshing: boolean
  /** When I last asked Google for numbers (the background refresh), ISO. */
  askedAt?: string | null
  /** Why some numbers are missing (first person). */
  notes: string[]
  canRefresh: boolean
}

type Seed = { keyword: string; text: string; source: KwSource; position?: number | null; impressions?: number; clicks?: number }

/** Every phrase from the brand's own data (DB + cached reads only). */
async function seeds(user: User): Promise<Seed[]> {
  const since = new Date(Date.now() - 90 * 86_400_000)
  const [ranks, qs, settings, gapRows, plan] = await Promise.all([
    db.keywordRanking.findMany({ where: { userId: user.id, date: { gte: since }, impressions: { gt: 0 } }, select: { query: true, impressions: true, clicks: true, position: true }, take: 5000 }).catch(() => []),
    latestQuestionScan(user.id).catch(() => null),
    getAgentSettings(user.id),
    db.contentGap.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 6 }).catch(() => []),
    import("@/lib/clusters").then((m) => m.clusterView(user.id)).catch(() => null),
  ])
  const out: Seed[] = []
  const byQ = new Map<string, { impressions: number; clicks: number; pw: number }>()
  for (const r of ranks) {
    const k = normKeyword(r.query)
    const c = byQ.get(k) ?? { impressions: 0, clicks: 0, pw: 0 }
    c.impressions += r.impressions; c.clicks += r.clicks; c.pw += r.position * r.impressions
    byQ.set(k, c)
  }
  for (const [k, v] of [...byQ.entries()].sort((a, b) => b[1].impressions - a[1].impressions).slice(0, 60)) out.push({ keyword: k, text: k, source: "gsc", position: v.impressions ? Math.round((v.pw / v.impressions) * 10) / 10 : null, impressions: v.impressions, clicks: v.clicks })
  for (const p of settings.keywordPins ?? []) out.push({ keyword: normKeyword(p.keyword), text: p.keyword, source: "pin" })
  const aiQs = [...(qs?.scan.questions.map((q) => q.q) ?? []), ...(settings.questions ?? [])]
  for (const q of aiQs.slice(0, 20)) out.push({ keyword: normKeyword(q), text: q, source: "ai" })
  for (const c of plan?.clusters ?? []) for (const a of [c.pillar, ...c.articles]) {
    const target = a.sources.find((s) => s.kind === "kw" || s.kind === "gsc")?.text ?? (a.question && a.question.split(" ").length <= 10 ? a.question : a.title)
    out.push({ keyword: normKeyword(target), text: target, source: "plan" })
  }
  for (const row of await relevantGaps(user.id, gapRows, { judge: false }).catch(() => [])) {
    for (const g of (Array.isArray(row.gaps) ? row.gaps : []) as unknown as GapItem[]) if (g.topic) out.push({ keyword: normKeyword(g.topic), text: g.topic, source: "gap" })
  }
  return out.filter((s) => s.keyword.length >= 2)
}

function merge(list: Seed[]): Map<string, Seed & { sources: KwSource[] }> {
  const m = new Map<string, Seed & { sources: KwSource[] }>()
  for (const s of list) {
    const cur = m.get(s.keyword)
    if (!cur) { m.set(s.keyword, { ...s, sources: [s.source] }); continue }
    if (!cur.sources.includes(s.source)) cur.sources.push(s.source)
    if (s.position != null && cur.position == null) Object.assign(cur, { position: s.position, impressions: s.impressions, clicks: s.clicks })
  }
  return m
}

const money = (n: number, c: string | null) => { try { return new Intl.NumberFormat("en-US", { style: "currency", currency: c ?? "USD", maximumFractionDigits: 2 }).format(n) } catch { return `${n.toFixed(2)}` } }

export function rowOf(s: Seed & { sources: KwSource[] }, m: KeywordMetric | undefined, strength: number, pinned: boolean): KeywordRow {
  const pos = s.position ?? null
  return {
    keyword: s.keyword,
    text: s.text,
    sources: s.sources,
    volume: m?.volumeAt ? volumeLabel(m.volume) : "Not measured yet",
    volumeN: volumeValue(m?.volume ?? null),
    ranged: !!m?.volume && m.volume.low !== null,
    trend: trendOf(m?.volume ?? null),
    difficulty: m?.difficulty ?? null,
    difficultyLabel: difficultyLabel(m?.difficulty ?? null),
    tone: difficultyTone(m?.difficulty ?? null),
    intent: m?.intent ? intentLabel(m.intent) : null,
    bids: m && m.bidLow !== null && m.bidHigh !== null ? `${money(m.bidLow, m.currency)} to ${money(m.bidHigh, m.currency)}` : null,
    position: pos,
    impressions: s.impressions ?? null,
    clicks: s.clicks ?? null,
    score: m ? opportunity(m, strength, pos) : 0,
    win: m?.difficulty != null || pos ? winnability(m?.difficulty ?? null, strength, pos) : null,
    pinned,
  }
}

async function strengthOf(userId: string): Promise<{ strength: number; from: "links" | "default" }> {
  const b = await latestBacklinks(userId).catch(() => null)
  const r = b?.summary?.rank ?? null
  return { strength: siteStrength(r), from: r == null ? "default" : "links" }
}

/** Labs keywords per refresh by plan (cost control): Starter 100, Pro/Growth 200. */
const labsMaxFor = (u: User) => (isComped(u.email) || /pro|full|growth/i.test(u.plan) ? 200 : 100)

/** Fetch what's missing (free volume, paid difficulty/intent). Used by the cron and the refresh button. */
export async function refreshKeywordData(user: User): Promise<{ rows: number; costUsd: number; planner: string; labs: string }> {
  const list = [...merge(await seeds(user)).values()]
  const services = [user.businessType, ...(list.filter((s) => s.sources.includes("gsc")).slice(0, 5).map((s) => s.keyword))].filter((x): x is string => !!x && x.trim().length > 2)
  const ideas = services.length ? await keywordIdeas(user, services, 25) : []
  const all = [...new Set([...list.map((s) => s.keyword), ...ideas])].filter(plannerOk)
  const r = await keywordMetrics(user, all, { labsMax: labsMaxFor(user) })
  // Remember the ideas that had volume, so the page can list them without another call.
  await saveAgentSettings(user.id, { seoData: { ...(await getAgentSettings(user.id)).seoData, keywordsAt: new Date().toISOString() } }).catch(() => null)
  await rememberIdeas(user.id, ideas)
  return { rows: r.metrics.size, costUsd: r.note.costUsd, planner: r.note.planner, labs: r.note.labs }
}

async function rememberIdeas(userId: string, ideas: string[]) {
  const row = await db.mockActivity.findFirst({ where: { userId, type: KW_TYPE }, orderBy: { createdAt: "desc" }, select: { id: true, metadata: true } })
  if (!row) return
  await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...(row.metadata as object), ideas: ideas.slice(0, 25), ideasAt: new Date().toISOString() } } })
}

/** Edit distance, capped: enough to tell "alpha" or "alphaa app" from "alphaa". */
function near(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    if (Math.min(...cur) > max) return false
    prev = cur
  }
  return prev[b.length] <= max
}

/** The business's own name and domain, letters only ("alphaa"), for spotting searches for it. */
export function brandKeys(user: Pick<User, "businessName" | "websiteUrl">): string[] {
  const out = new Set<string>()
  const name = (user.businessName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
  if (name.length >= 4) out.add(name)
  const stem = (user.websiteUrl ?? "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[./]/)[0].toLowerCase().replace(/[^a-z0-9]/g, "")
  if (stem.length >= 4) out.add(stem)
  return [...out]
}

/** True for a search that names the business (or a typo of its name). */
export function isBranded(keyword: string, brands: string[]): boolean {
  if (!brands.length) return false
  const flat = keyword.toLowerCase().replace(/[^a-z0-9]/g, "")
  const tokens = keyword.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4)
  return brands.some((b) => flat.includes(b) || tokens.some((t) => near(t, b, b.length > 6 ? 2 : 1)))
}

const bg = new Map<string, number>()

/** The Keywords view from cached numbers; starts a background refresh when they're missing or old (max once a day). */
export async function keywordsView(user: User, opts: { refresh?: boolean } = {}): Promise<KeywordsView> {
  const [list, settings, st, kwRow] = await Promise.all([
    seeds(user),
    getAgentSettings(user.id),
    strengthOf(user.id),
    db.mockActivity.findFirst({ where: { userId: user.id, type: KW_TYPE }, orderBy: { createdAt: "desc" }, select: { metadata: true } }),
  ])
  const ideas = ((kwRow?.metadata as { ideas?: string[] } | null)?.ideas ?? []).map((k) => ({ keyword: k, text: k, source: "idea" as const }))
  const merged = merge([...list, ...ideas])
  const metrics = await cachedMetrics(user, [...merged.keys()])
  const pins = new Set((settings.keywordPins ?? []).map((p) => normKeyword(p.keyword)))
  const brands = brandKeys(user)
  const rows = [...merged.values()].map((s) => ({ ...rowOf(s, metrics.get(s.keyword), st.strength, pins.has(s.keyword)), branded: isBranded(s.text, brands) }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.score - a.score || (b.impressions ?? 0) - (a.impressions ?? 0))

  const last = settings.seoData?.keywordsAt ? Date.parse(settings.seoData.keywordsAt) : 0
  const measured = [...metrics.values()].map((m) => m.volumeAt).filter(Boolean).sort().pop() ?? null
  const missing = rows.filter((r) => r.volume === "Not measured yet").length
  const canRefresh = Date.now() - last > 20 * 3_600_000 && (Date.now() - (bg.get(user.id) ?? 0) > 20 * 3_600_000)
  let refreshing = false
  if ((opts.refresh || missing > 0) && canRefresh && rows.length) {
    refreshing = true
    bg.set(user.id, Date.now())
    await saveAgentSettings(user.id, { seoData: { ...settings.seoData, keywordsAt: new Date().toISOString() } }).catch(() => null)
    void runAsUser(user.id, () => refreshKeywordData(user)).catch((e) => console.error("[keywords] refresh", e instanceof Error ? e.message : e))
  }
  // A refresh started in the last 10 minutes is still running: say so (the page keeps looking).
  if (!refreshing && missing > 0 && last && Date.now() - last < 10 * 60_000) refreshing = true
  const notes: string[] = []
  if (!refreshing && missing > 0 && last && missing === rows.length) notes.push("I asked Google for these numbers and they haven’t come back yet. I’ll ask again tomorrow.")
  if (!rows.length) notes.push("I don’t have any searches for you yet. Connect Search Console, or let my weekly AI check run, and they show up here.")
  if (rows.some((r) => r.ranged)) notes.push("Some numbers are ranges: that’s how Google shares them for accounts without ad spend, so I show them as Google gives them.")
  if (rows.length && rows.every((r) => r.difficulty === null) && measured) notes.push("I haven’t measured difficulty for these yet. It needs Google search volume first.")
  if (st.from === "default") notes.push("I don’t have your link data yet, so I treat your site as a small one when I judge what you can win.")
  return { rows: rows.slice(0, 150), strength: st.strength, strengthFrom: st.from, measuredAt: measured, askedAt: last ? new Date(last).toISOString() : null, refreshing, notes, canRefresh: canRefresh && !refreshing }
}

/** "Add to topic plan": remember the phrase for the next Topic plan build (max 20). */
export async function pinKeyword(userId: string, keyword: string, on = true): Promise<number> {
  const k = keyword.replace(/\s+/g, " ").trim().slice(0, 80)
  const s = await getAgentSettings(userId)
  const cur = (s.keywordPins ?? []).filter((p) => normKeyword(p.keyword) !== normKeyword(k))
  const next = on ? [{ keyword: k, at: new Date().toISOString() }, ...cur].slice(0, 20) : cur
  await saveAgentSettings(userId, { keywordPins: next })
  return next.length
}

/** For the Topic plan build: pinned searches + the best opportunities with real volume (cache only). */
export async function clusterKeywords(user: User, max = 15): Promise<{ keyword: string; detail: string | null; pinned: boolean }[]> {
  const v = await keywordsView(user).catch(() => null)
  if (!v) return []
  const pick = [...v.rows.filter((r) => r.pinned), ...v.rows.filter((r) => !r.pinned && !r.branded && r.volumeN > 0 && !r.sources.includes("ai"))].slice(0, max)
  return pick.map((r) => ({ keyword: r.text, detail: r.volumeN > 0 ? [r.volume.replace(/^About /, "about "), r.difficulty !== null ? `difficulty ${r.difficulty}/100` : null].filter(Boolean).join(", ") : null, pinned: r.pinned }))
}
