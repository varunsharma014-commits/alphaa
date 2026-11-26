// Research & Ideas: what's working in the owner's niche (real posts with their links and metrics),
// timely trends (each with the URL it came from), ideas from their own numbers, ad hooks from
// their ad plan, page gaps versus a competitor, and what competitors run. Read-only: nothing here
// calls an outside service, so the page opens fast; refreshes happen from the chat threads.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { latestInsights } from "@/lib/insights"
import { lastReadyNichePosts, metricLine, nicheEnabled, PLATFORM_LABEL, type NicheItem } from "@/lib/niche-posts"
import { lastReadyStrategy } from "@/lib/ad-strategy/generate"
import type { Trend } from "@/lib/trends"
import type { GapItem } from "@/lib/content-gaps"
import type { Chip } from "@/lib/agent/types"
import { ART_CYCLE, ago, n, short } from "./common"

export type WorkingCard = {
  id: string
  where: string
  title: string
  stats: { k: string; v: string }[]
  use: string
  url: string
  art: string
  rows: [string, string][]
  makeChip: Chip
}
export type IdeaRow = { kind: string; text: string; why: string; src: string | null; url: string | null; chip?: Chip }
export type GapCard = { title: string; priority: string; where: string; outline: string[]; links: { label: string; url: string }[]; chip: Chip }
export type CompCard = { name: string; site: string | null; summary: string | null; ads: number; topAd: string | null; adUrl: string | null }

export type ResearchData = {
  summary: string
  nicheOn: boolean
  working: WorkingCard[]
  trends: Trend[]
  ideas: IdeaRow[]
  hooks: IdeaRow[]
  gaps: GapCard[]
  comps: CompCard[]
  /** Gaps across what competitors advertise (from the ad plan), not tied to one competitor. */
  compGaps: string[]
  strategyAt: string | null
}

const host = (u: string) => { try { return new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "") } catch { return u } }
const href = (u: string) => (/^https?:\/\//.test(u) ? u : `https://${u}`)
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

function stats(i: NicheItem): { k: string; v: string }[] {
  const m = i.metrics
  const out: { k: string; v: string }[] = []
  if (m.views) out.push({ k: "Views", v: n(m.views) })
  if (m.likes != null) out.push({ k: "Likes", v: n(m.likes) })
  if (m.comments != null) out.push({ k: "Comments", v: n(m.comments) })
  if (m.shares) out.push({ k: "Shares", v: n(m.shares) })
  if (m.daysRunning != null) out.push({ k: "Days running", v: n(m.daysRunning) })
  return out.slice(0, 3)
}

const FORMAT_MODE = { blog: "post", google: "gbp", social: "social" } as const
const FORMAT_NAME = { blog: "Blog post", google: "Google update", social: "Social post" } as const

export async function getResearchData(user: User): Promise<ResearchData> {
  const [niche, insights, strategy, gapRows, comps, trendRow] = await Promise.all([
    lastReadyNichePosts(user.id).catch(() => null),
    latestInsights(user.id).catch(() => null),
    lastReadyStrategy(user.id).catch(() => null),
    db.contentGap.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 3 }),
    db.competitor.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 6 }),
    // Cached web-search trends only (lib/trends.ts); a fresh search runs from the week plan.
    db.mockActivity.findFirst({ where: { userId: user.id, type: "trends" }, orderBy: { createdAt: "desc" }, select: { metadata: true, createdAt: true } }),
  ])

  const items = niche?.items ?? []
  const working: WorkingCard[] = items.map((i, k) => ({
    id: i.id,
    where: PLATFORM_LABEL[i.platform] ?? i.platform,
    title: short(i.about, 110),
    stats: stats(i),
    use: short(i.angle, 90),
    url: i.url,
    art: ART_CYCLE[k % ART_CYCLE.length],
    rows: [
      ["What it is", i.about],
      ["Why it works", i.why],
      ["My version", i.angle],
      ...(metricLine(i) ? [["Numbers from the post", metricLine(i)] as [string, string]] : []),
      ...(i.handle ? [["Posted by", `@${i.handle.replace(/^@/, "")}`] as [string, string]] : []),
      ["Source", i.url],
    ],
    makeChip: { label: "Make my version", action: { type: "agent-op", endpoint: "niche", body: { op: "make", id: i.id } } },
  }))

  const trends = ((trendRow?.metadata as { trends?: Trend[] } | null)?.trends ?? []).filter((t) => t.url)

  const ideas: IdeaRow[] = (insights?.ideas ?? []).map((i) => ({
    kind: FORMAT_NAME[i.format] ?? "Idea",
    text: i.title,
    why: i.why,
    src: insights ? `From your numbers, ${ago(insights.at)}` : null,
    url: null,
    chip: { label: "Write it", action: { type: "draft", topic: i.title, mode: FORMAT_MODE[i.format] ?? "post" } },
  }))
  const hooks: IdeaRow[] = (strategy?.hooks ?? []).slice(0, 12).map((h) => ({ kind: h.type, text: h.line, why: "", src: "Your ad plan", url: "/dashboard/ad-strategy" }))

  const gaps: GapCard[] = []
  for (const row of gapRows) {
    const list = Array.isArray(row.gaps) ? (row.gaps as unknown as GapItem[]) : []
    for (const g of list.filter((x) => x && x.topic).sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0))) {
      gaps.push({
        title: g.suggestedTitle || g.topic,
        priority: g.priority === "high" ? "High priority" : g.priority === "medium" ? "Medium priority" : "Low priority",
        where: `${host(row.competitorUrl)} covers it`,
        outline: Array.isArray(g.suggestedOutline) ? g.suggestedOutline.filter((x) => typeof x === "string").slice(0, 6) : [],
        links: [{ label: `${host(row.competitorUrl)}`, url: href(row.competitorUrl) }],
        chip: { label: "Draft it for me", action: { type: "draft", topic: g.suggestedTitle || g.topic, competitor: host(row.competitorUrl) } },
      })
    }
    if (gaps.length >= 9) break
  }

  // Competitors: the ones I watch, plus their live Meta ads from the ad plan (Ad Library links).
  const ads = strategy?.competitors?.ads ?? []
  const byPage = new Map<string, typeof ads>()
  for (const a of ads) byPage.set(a.page, [...(byPage.get(a.page) ?? []), a])
  const compCards: CompCard[] = comps.map((c) => {
    const d = isRecord(c.crawlData) ? c.crawlData : {}
    const name = c.name || host(c.url)
    const key = name.toLowerCase().trim()
    const mine = [...byPage.entries()].find(([p]) => { const q = p.toLowerCase().trim(); return q === key || (key.length > 3 && (q.includes(key) || key.includes(q))) })?.[1] ?? []
    return {
      name,
      site: href(c.url),
      summary: typeof d.aiSummary === "string" ? short(d.aiSummary, 260) : null,
      ads: mine.length,
      topAd: mine[0] ? short(mine[0].title || mine[0].text, 160) : null,
      adUrl: mine[0]?.url ?? null,
    }
  })
  for (const [page, list] of byPage) {
    if (compCards.some((c) => c.ads && c.adUrl === list[0]?.url)) continue
    compCards.push({ name: page, site: null, summary: null, ads: list.length, topAd: short(list[0].title || list[0].text, 160), adUrl: list[0].url })
  }

  const sources = niche?.sources?.length ? niche.sources.join(", ") : null
  const summary = items.length
    ? `I looked at ${n(items.length)} posts${sources ? ` on ${sources}` : ""}${niche?.terms?.length ? ` for ${niche.terms.slice(0, 4).join(", ")}` : ""}${ads.length ? ` and ${n(ads.length)} competitor ads` : ""}. Here’s what I found, with a link to every source.`
    : ads.length
      ? `I looked at ${n(ads.length)} competitor ads. Here’s what I found, with a link to every source.`
      : "Here’s what I’ve found about your market so far. Every finding links to where it came from."

  return { summary, nicheOn: nicheEnabled(), working, trends, ideas, hooks, gaps, comps: compCards.slice(0, 6), compGaps: (strategy?.competitors?.gaps ?? []).slice(0, 4), strategyAt: strategy?.at ?? null }
}
