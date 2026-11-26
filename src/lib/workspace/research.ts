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
import { latestQuestionScan } from "@/lib/questions"
import { getAgentSettings } from "@/lib/agent/settings"
import { consentCurrent } from "@/lib/auto-approve-text"
import { getRivals, type AttackCard, type MoveCard } from "./rivals"
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
export type ResearchData = {
  summary: string
  nicheOn: boolean
  working: WorkingCard[]
  trends: Trend[]
  ideas: IdeaRow[]
  hooks: IdeaRow[]
  moves: MoveCard[]
  comps: AttackCard[]
  /** Gaps across what competitors advertise (from the ad plan), not tied to one competitor. */
  compGaps: string[]
  strategyAt: string | null
  /** Sites I left out because they aren't competitors (wikis, directories, other industries, dismissed). */
  hiddenComps: number
  hiddenGaps: number
  lastChecked: string | null
  /** Competitor sites I compared the owner's site with. */
  compared: number
  autopilot: boolean
  siteConnected: boolean
  top: { kind: "move"; move: MoveCard } | { kind: "post"; card: WorkingCard; why: string } | null
  island: string
}


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
  const [niche, insights, strategy, qs, settings, trendRow] = await Promise.all([
    lastReadyNichePosts(user.id).catch(() => null),
    latestInsights(user.id).catch(() => null),
    lastReadyStrategy(user.id).catch(() => null),
    latestQuestionScan(user.id).catch(() => null),
    getAgentSettings(user.id),
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

  const rivals = await getRivals(user, { strategy, niche, qs })
  const ads = strategy?.competitors?.ads ?? []

  const sources = niche?.sources?.length ? niche.sources.join(", ") : null
  const summary = items.length
    ? `I looked at ${n(items.length)} posts${sources ? ` on ${sources}` : ""}${niche?.terms?.length ? ` for ${niche.terms.slice(0, 4).join(", ")}` : ""}${ads.length ? ` and ${n(ads.length)} competitor ads` : ""}. Here’s what I found, with a link to every source.`
    : ads.length
      ? `I looked at ${n(ads.length)} competitor ads. Here’s what I found, with a link to every source.`
      : "Here’s what I’ve found about your market so far. Every finding links to where it came from."

  // My #1 move: the best gap by real signals, else the strongest niche post to make my version of.
  const bestMove = rivals.moves[0]
  const bestPost = working.find((w) => w.stats.length)
  const top: ResearchData["top"] = bestMove
    ? { kind: "move", move: bestMove }
    : bestPost
      ? { kind: "post", card: bestPost, why: `It’s doing well right now (${bestPost.stats.map((x) => `${x.v} ${x.k.toLowerCase()}`).join(", ")}), and nobody near you has made one like it yet.` }
      : null
  const worth = rivals.moves.filter((m) => m.signals.length).length
  const island = rivals.moves.length
    ? `Found ${worth || rivals.moves.length} gap${(worth || rivals.moves.length) === 1 ? "" : "s"} worth taking · the best one is ready to draft`
    : rivals.comps.length
      ? `Watching ${rivals.comps.length} competitor${rivals.comps.length === 1 ? "" : "s"} for you`
      : working.length ? `Found ${working.length} posts working in your niche` : ""

  return {
    summary, nicheOn: nicheEnabled(), working, trends, ideas, hooks,
    moves: rivals.moves, comps: rivals.comps, compGaps: (strategy?.competitors?.gaps ?? []).slice(0, 4),
    strategyAt: strategy?.at ?? null, hiddenComps: rivals.hidden, hiddenGaps: rivals.hiddenGaps, lastChecked: rivals.lastChecked, compared: rivals.compared,
    autopilot: !!settings.autoApprove && consentCurrent(settings), siteConnected: !!(settings.wp || settings.site), top, island,
  }
}
