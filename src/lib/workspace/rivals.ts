// Research → Competitors ("attack cards") and Blog & page gaps ("winning moves").
// Every line is built from stored data; a line with no data behind it is left out.
//   Competitors: Competitor rows (crawl + analysis), the weekly AI question scan (who the AIs name),
//   competitor ads from the ad plan (Google Ads Transparency Center), rivals' Instagram posts from niche research,
//   and ContentGap rows for that competitor. Hidden: domain-rule hosts, owner dismissals, and hosts
//   the niche check says aren't competitors (unless the owner added them).
//   Gaps: ContentGap rows from visible competitors only. Signals come from the owner's own Search
//   Console rows (impressions, position) and the words of the topic (buyer intent).
import type { Competitor, ContentGap, User } from "@prisma/client"
import { db } from "@/lib/db"
import type { GapItem } from "@/lib/content-gaps"
import type { AdStrategy } from "@/lib/ad-strategy/types"
import type { NichePosts } from "@/lib/niche-posts"
import type { QuestionScan } from "@/lib/questions"
import type { Chip } from "@/lib/agent/types"
import { competitorGate, hostOf, isManualRow } from "@/lib/competitor-relevance"
import { n, short } from "./common"

export type Signal = { label: string; tone: "g" | "b" | "n" }
export type MoveCard = {
  id: string
  title: string
  topic: string
  rival: string
  rivalHost: string
  signals: Signal[]
  outline: string[]
  score: number
  why: string
  /** Their real page this gap came from (lib/content-gaps.ts since 2026-11-28; older gaps have none). */
  source?: { url: string; title: string; words: number | null; headings: string[]; read: boolean } | null
}
export type AttackCard = {
  id: string
  name: string
  host: string
  site: string
  favicon: string
  manual: boolean
  tag: "Direct rival" | "Local leader" | "Ad spender" | "Content machine" | null
  winning: string | null
  weak: string | null
  counter: string | null
  primary: { label: string; move?: MoveCard; chip?: Chip; topic?: string } | null
  adUrl: string | null
  detail: { k: string; v: string; href?: string }[]
  /** Their Instagram Business account (Meta Business Discovery via niche research): counts and links only. */
  instagram: { username: string; url: string; line: string; posts: { url: string; line: string }[]; make: Chip | null } | null
}
export type RivalsData = {
  comps: AttackCard[]
  hidden: number
  lastChecked: string | null
  moves: MoveCard[]
  compared: number
  hiddenGaps: number
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [])
const STOP = new Set(["the", "and", "for", "with", "your", "you", "how", "what", "why", "best", "near", "from", "that", "this", "into", "guide", "complete", "about", "are", "our", "vs"])
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w))
const nameKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

/**
 * The page title I'd publish on the owner's site: the scraped/suggested title without anyone's
 * brand, separators or trailing punctuation. Keeps the segment that talks about the topic.
 */
export function ourTitle(raw: string, topic: string, brands: string[]): string {
  const brandKeys = brands.map(nameKey).filter((b) => b.length >= 3)
  const isBrand = (seg: string) => { const k = nameKey(seg); return !!k && brandKeys.some((b) => k === b || k.includes(b) || b.includes(k)) }
  let segs = raw.split(/\s+[|–—:·]\s+|\s+-\s+|\s*\|\s*/).map((x) => x.trim()).filter(Boolean)
  segs = segs.filter((sg) => !isBrand(sg))
  const tw = new Set(words(topic))
  // Several segments: drop short ones that share nothing with the topic (usually a brand).
  if (segs.length > 1) segs = segs.filter((sg) => sg.split(/\s+/).length > 2 || words(sg).some((w) => tw.has(w)))
  let t = segs.sort((a, b) => words(b).filter((w) => tw.has(w)).length - words(a).filter((w) => tw.has(w)).length || b.length - a.length)[0] ?? topic
  // Brand names inside the title too ("… with GrowthTurbine").
  for (const b of brands) if (b.trim().length >= 3) t = t.replace(new RegExp(`\\b(by|with|at|from)?\\s*${b.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "ig"), "")
  t = t.replace(/\s{2,}/g, " ").replace(/^[\s|:–—-]+|[\s|:–—,-]+$/g, "").trim()
  return t.length >= 8 ? t : topic.trim()
}

const BUYER = /\b(price|prices|pricing|cost|costs|quote|hire|hiring|near me|vs|versus|alternative|alternatives|services?|agency|agencies|company|companies|consultant|book|booking|buy|for sale|software|tool|tools|plans?)\b/i

type Rank = { query: string; impressions: number; position: number }

function signalsFor(title: string, topic: string, ranks: Rank[]): { signals: Signal[]; score: number; why: string } {
  const tw = new Set([...words(title), ...words(topic)])
  const hits = ranks.filter((r) => { const q = words(r.query); return q.length >= 2 && q.filter((w) => tw.has(w)).length >= Math.min(2, q.length) })
  const signals: Signal[] = []
  let score = 0
  const why: string[] = []
  const impressions = hits.reduce((a, r) => a + r.impressions, 0)
  const near = hits.filter((r) => r.position >= 8 && r.position <= 20).sort((a, b) => b.impressions - a.impressions)[0]
  if (near) {
    signals.push({ label: `Quick win · you’re #${Math.round(near.position)} for “${short(near.query, 32)}”`, tone: "g" })
    score += 3
    why.push(`you already show up at #${Math.round(near.position)} on Google for “${short(near.query, 40)}”, so one strong page can move you onto page one`)
  }
  if (impressions > 0) {
    signals.push({ label: `${n(impressions)} Google impressions · 28 days`, tone: "b" })
    score += 2
    if (!near) why.push(`people already see you ${n(impressions)} times in 28 days for searches about this`)
  }
  if (BUYER.test(`${title} ${topic}`)) {
    signals.push({ label: "Buyer intent", tone: "n" })
    score += 1
    if (!why.length) why.push("people searching this are close to buying")
  }
  return { signals, score, why: why.join(", and ") }
}

export async function getRivals(user: User, ctx: { strategy: AdStrategy | null; niche: NichePosts | null; qs: { scan: QuestionScan; at: Date } | null }): Promise<RivalsData> {
  const [rows, gapRows, latestRanks] = await Promise.all([
    db.competitor.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 30 }),
    db.contentGap.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 8 }),
    db.keywordRanking.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" }, select: { date: true } }),
  ])
  const ranks: Rank[] = latestRanks
    ? (await db.keywordRanking.findMany({ where: { userId: user.id, date: latestRanks.date }, select: { query: true, impressions: true, position: true }, take: 2000 }))
    : []

  // ── Relevance gate ──────────────────────────────────────────────────────────────────────────
  // The shared gate (lib/competitor-relevance.ts): domain rules, dismissals, cached niche verdicts.
  const isManual = (c: Competitor) => isManualRow(c)
  const gate = await competitorGate(user, { rows, urls: gapRows.map((g) => g.competitorUrl) })
  const visibleHost = (h: string | null, manual = false) => !!h && gate.keep(h, manual)
  const firstPass = rows.filter((c) => !!hostOf(c.url))
  const seen = new Set<string>()
  const visible = firstPass.filter((c) => { const h = hostOf(c.url)!; if (seen.has(h) || !visibleHost(h, isManual(c))) return false; seen.add(h); return true })
  const brands = [user.businessName ?? "", ...rows.map((c) => c.name ?? ""), ...rows.map((c) => (hostOf(c.url) ?? "").split(".")[0])].filter(Boolean)

  // ── Gaps → winning moves ───────────────────────────────────────────────────────────────────
  const moves: MoveCard[] = []
  const titles = new Set<string>()
  let hiddenGaps = 0
  const visibleGapRows: ContentGap[] = []
  for (const row of gapRows) {
    const h = hostOf(row.competitorUrl)
    const manual = rows.some((c) => hostOf(c.url) === h && isManual(c))
    const list = Array.isArray(row.gaps) ? (row.gaps as unknown as GapItem[]).filter((g) => g && g.topic) : []
    if (!visibleHost(h, manual)) { hiddenGaps += list.length; continue }
    visibleGapRows.push(row)
    const rivalName = rows.find((c) => hostOf(c.url) === h)?.name || h!
    for (const [k, g] of list.entries()) {
      const title = ourTitle(g.suggestedTitle || g.topic, g.topic, brands)
      const key = title.toLowerCase()
      if (titles.has(key)) continue
      titles.add(key)
      const sig = signalsFor(title, g.topic, ranks)
      moves.push({
        id: `${row.id}:${k}`, title, topic: g.topic, rival: rivalName, rivalHost: h!,
        signals: sig.signals, score: sig.score, why: sig.why,
        outline: strs(g.suggestedOutline).slice(0, 6),
        source: g.sourceUrl ? { url: g.sourceUrl, title: g.sourceTitle ?? "", words: typeof g.sourceWords === "number" ? g.sourceWords : null, headings: strs(g.sourceHeadings).slice(0, 12), read: !!g.read } : null,
      })
    }
  }
  moves.sort((a, b) => b.score - a.score)

  // ── Attack cards ───────────────────────────────────────────────────────────────────────────
  const ads = ctx.strategy?.competitors?.ads ?? []
  const rivalsNamed = ctx.qs && Date.now() - ctx.qs.at.getTime() < 21 * 86_400_000 ? ctx.qs.scan.rivals : []
  const local = !!user.city?.trim()
  const comps: AttackCard[] = visible.slice(0, 9).map((c) => {
    const h = hostOf(c.url)!
    const d = isRecord(c.crawlData) ? c.crawlData : {}
    const name = c.name?.trim() || h
    const key = nameKey(name)
    const stem = nameKey(h.split(".")[0])
    const match = (s: string) => { const k = nameKey(s); return !!k && (k === key || k === stem || (key.length > 3 && (k.includes(key) || key.includes(k))) || (stem.length > 3 && k.includes(stem))) }
    const theirAds = ads.filter((a) => match(a.page))
    const aiCount = rivalsNamed.filter((r) => match(r.name)).reduce((a, r) => a + r.count, 0)
    const social = (ctx.niche?.items ?? []).filter((i) => i.source === "rival" && ((i.via && match(i.via)) || (i.handle && match(i.handle))))
    const ig = (ctx.niche?.rivalsIg ?? []).find((r) => match(r.name) || match(r.username))
    const igSum = (k: "likes" | "comments") => ig?.posts.reduce((a, p) => a + (p[k] ?? 0), 0) ?? 0
    const instagram: AttackCard["instagram"] = ig ? {
      username: ig.username,
      url: `https://www.instagram.com/${ig.username}/`,
      line: `@${ig.username}${ig.followers != null ? `, ${n(ig.followers)} followers` : ""}${ig.posts.length ? `, last ${ig.posts.length} post${ig.posts.length === 1 ? "" : "s"}: ${n(igSum("likes"))} likes, ${n(igSum("comments"))} comments` : ""}`,
      posts: ig.posts.map((p) => ({ url: p.url, line: [p.type === "REELS" ? "Reel" : p.type === "CAROUSEL_ALBUM" ? "Carousel" : "Post", p.likes != null ? `${n(p.likes)} likes` : null, p.comments != null ? `${n(p.comments)} comments` : null, p.views ? `${n(p.views)} views` : null, p.postedAt ? new Date(p.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null].filter(Boolean).join(" · ") })),
      // "Make my version" of their best post: only posts that passed the niche gates are in items.
      make: social[0] ? { label: "Make my version", action: { type: "agent-op", endpoint: "niche", body: { op: "make", id: social[0].id } } } : null,
    } : null
    const pages = typeof d.pagesFound === "number" ? d.pagesFound : 0
    const read = pages > 0 // strengths/weaknesses are only trusted when their site was actually read
    const strengths = read ? strs(d.strengths) : []
    const weaknesses = read ? strs(d.weaknesses) : []
    const schema = strs(d.schemaTypes)
    const myMove = moves.find((m) => m.rivalHost === h)

    const tag: AttackCard["tag"] = aiCount >= 3 ? (local ? "Local leader" : "Direct rival") : aiCount > 0 ? "Direct rival" : theirAds.length >= 2 ? "Ad spender" : social.length >= 3 ? "Content machine" : null
    const longest = theirAds.reduce((a, x) => Math.max(a, x.daysRunning ?? 0), 0)
    const likes = social.reduce((a, i) => a + (i.metrics.likes ?? 0), 0)
    const winning = aiCount > 0
      ? `Named in ${aiCount} AI answer${aiCount === 1 ? "" : "s"} to your customers’ questions`
      : theirAds.length
        ? `${theirAds.length} ad${theirAds.length === 1 ? "" : "s"} running on ${theirAds[0].platform === "google" ? "Google search" : "Facebook & Instagram"}${longest ? `, one for ${n(longest)} days` : ""}`
        : social.length
          ? `${social.length} recent social post${social.length === 1 ? "" : "s"}${likes ? ` with ${n(likes)} likes` : ""}`
          : instagram ? `Instagram ${instagram.line}` : strengths[0] ? short(strengths[0], 110) : null
    const weak = weaknesses[0] ? short(weaknesses[0], 110) : read && !schema.length ? "No structured data on their site, so AI has less to confirm who they are" : null
    const counter = myMove ? `I publish “${short(myMove.title, 70)}” to take that search` : theirAds.length && ctx.strategy?.competitors?.gaps?.[0] ? `My ads lead with what theirs leave out: ${short(ctx.strategy.competitors.gaps[0], 80)}` : null
    const primary: AttackCard["primary"] = myMove
      ? { label: "Take their gap", move: myMove }
      : theirAds.length
        ? ctx.strategy ? { label: "Counter their ads", topic: "adplan" } : { label: "Counter their ads", chip: { label: "Make my ad plan", action: { type: "agent-op", endpoint: "adplan", body: { op: "make" } } } }
        : null

    const detail: AttackCard["detail"] = []
    if (typeof d.aiSummary === "string" && d.aiSummary.trim()) detail.push({ k: read ? "What I found on their site" : "My read (I couldn’t open their site)", v: d.aiSummary.trim() })
    if (aiCount) detail.push({ k: "AI answers", v: `The AIs named them ${aiCount} time${aiCount === 1 ? "" : "s"} in my weekly check of your customers’ questions.` })
    if (strengths.length) detail.push({ k: "Winning at", v: strengths.map((x) => `• ${x}`).join("\n") })
    if (weaknesses.length) detail.push({ k: "Weak spots", v: weaknesses.map((x) => `• ${x}`).join("\n") })
    const topics = read ? strs(d.keyTopics) : []
    if (topics.length) detail.push({ k: "Topics they cover", v: topics.join(", ") })
    if (read) detail.push({ k: "Their site", v: `${pages} page${pages === 1 ? "" : "s"} read${schema.length ? ` · structured data: ${schema.join(", ")}` : " · no structured data"}` })
    for (const a of theirAds.slice(0, 4)) detail.push({ k: `${a.platform === "google" ? "Google ad" : "Ad"}${a.daysRunning ? ` · running ${a.daysRunning} days` : ""}`, v: short(a.title || a.text || `A ${a.format} ad`, 200), href: a.url })
    if (instagram) {
      detail.push({ k: "Instagram", v: instagram.line, href: instagram.url })
      for (const p of instagram.posts.slice(0, 12)) detail.push({ k: "Instagram post", v: p.line, href: p.url })
    }
    for (const p of social.slice(0, 3)) detail.push({ k: "Social post", v: short(p.about, 160), href: p.url })
    for (const m of moves.filter((x) => x.rivalHost === h).slice(0, 4)) detail.push({ k: "Gap I can take", v: m.title })

    return {
      id: c.id, name, host: h, site: `https://${h}`, favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=64`,
      manual: isManual(c), tag, winning, weak, counter, primary, adUrl: theirAds[0]?.url ?? null, detail, instagram,
    }
  })

  const lastChecked = visible.map((c) => c.analyzedAt ?? c.createdAt).sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() ?? null
  return { comps, hidden: rows.length - visible.length, lastChecked, moves: moves.slice(0, 12), compared: visibleGapRows.length, hiddenGaps }
}
