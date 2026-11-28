// Research & Ideas: what's working in the owner's niche (real posts with their links and metrics),
// timely trends (each with the URL it came from), ideas from their own numbers, ad hooks from
// their ad plan, page gaps versus a competitor, and what competitors run. Read-only: nothing here
// calls an outside service, so the page opens fast; refreshes happen from the chat threads.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { repurposablePosts } from "@/lib/repurpose"
import { hasPro } from "@/lib/billing"
import { latestInsights } from "@/lib/insights"
import { engagementRate, lastReadyNichePosts, median, metricLine, nicheEnabled, PLATFORM_LABEL, type InstagramState, type NicheItem } from "@/lib/niche-posts"
import { nicheFitVerdicts } from "@/lib/niche-fit"
import { claudeFor } from "@/lib/claude"
import { getAgentSettings as settingsOf, saveAgentSettings } from "@/lib/agent/settings"
import { lastReadyStrategy } from "@/lib/ad-strategy/generate"
import type { Trend } from "@/lib/trends"
import { latestQuestionScan } from "@/lib/questions"
import { getAgentSettings } from "@/lib/agent/settings"
import { consentCurrent } from "@/lib/auto-approve-text"
import { getRivals, type AttackCard, type MoveCard } from "./rivals"
import type { Chip } from "@/lib/agent/types"
import { ART_CYCLE, n, short } from "./common"
import { listAccounts } from "@/lib/social/store"
import { clusterView, type ClusterView } from "@/lib/clusters"

export type WorkingCard = {
  id: string
  where: string
  title: string
  /** The post's own opening line (quoted), and a 1-2 word format tag. */
  hook: string | null
  format: string | null
  /** Cover image from the platform: private reference view, never reused in published content. */
  thumb: string | null
  duration: string | null
  /** "4.2× typical engagement" (from this scrape's median) or "Running 64 days" for ads. */
  badge: string | null
  why: string
  stats: { k: string; v: string }[]
  use: string
  url: string
  art: string
  rows: [string, string][]
  makeChip: Chip
}
export type IdeaRow = {
  kind: string
  text: string
  why: string
  src: string | null
  url: string | null
  chip?: Chip
  /** The real evidence behind it ("0 of 4 AIs name you", "#26 on Google"). */
  proof?: string | null
  /** Social ideas: the opening line, in bold quotes. */
  hook?: string | null
  format?: "blog" | "google" | "social"
  /** Rests on an AI-answers fact (for "My top pick this week"). */
  ai?: boolean
}
export type ResearchData = {
  summary: string
  nicheOn: boolean
  /** Instagram in "What's working": on, waiting on Meta's approval, or not connected (from stored data). */
  instagram: InstagramState
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
  /** Niche posts left out: off-topic, or not above this scrape's typical engagement. */
  droppedPosts: number
  /** When the ideas were last worked out (insights). */
  ideasAt: string | null
  topIdea: IdeaRow | null
  hasSocialAccounts: boolean
  gmbConnected: boolean
  /** Blog posts already live on the owner's site, for "Repurpose" (lib/repurpose.ts). */
  published: { id: string; title: string; url: string | null; at: string; repurposed: boolean }[]
  /** Topic plan: pillar topics + supporting articles with their status (lib/clusters.ts). Null = not built yet. */
  clusters: ClusterView | null
  /** For "Refresh" on a live Topic plan page (the hand-off to a web person). */
  webPersonEmail: string | null
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

  // ── What's working: niche gate (writer's verdict, else a cached check) + engagement gate ──────
  const all = niche?.items ?? []
  const needFit = all.filter((i) => i.fit === undefined)
  const fits = needFit.length ? await nicheFitVerdicts(user, needFit.map((i) => ({ id: i.id, text: `${PLATFORM_LABEL[i.platform]} post${i.via ? ` found under ${i.source === "hashtag" ? `#${i.via}` : i.via}` : ""}: ${i.about} ${i.why}` }))).catch(() => ({} as Record<string, boolean>)) : {}
  const onTopic = all.filter((i) => i.fit !== false && fits[i.id] !== false)
  // Stored lift = already gated at scrape time (lib/niche-posts.ts rank). Older scrapes: gate now against
  // the median of the same scrape.
  const rates = all.filter((i) => i.platform !== "meta_ad" && i.platform !== "youtube").map((i) => i.rate ?? engagementRate(i.metrics)).filter((x): x is number => x != null)
  const mid = median(rates)
  const liftOf = (i: NicheItem) => i.lift ?? (() => { const r = i.rate ?? engagementRate(i.metrics); return r != null && mid ? r / mid : null })()
  const items = onTopic
    .filter((i) => i.platform === "meta_ad" ? (i.metrics.daysRunning ?? 0) >= 30 : (liftOf(i) ?? 0) > 1)
    .sort((a, b) => (liftOf(b) ?? 0) - (liftOf(a) ?? 0))
  const droppedPosts = all.length - items.length
  const firstSentence = (t: string) => { const m = t.trim().match(/^.*?[.!?](?=\s|$)/); return (m ? m[0] : t.trim()).trim() }
  const dur = (sec: number | null | undefined) => (sec && sec > 0 ? `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}` : null)
  const working: WorkingCard[] = items.map((i, k) => {
    const lift = liftOf(i)
    return {
      id: i.id,
      where: PLATFORM_LABEL[i.platform] ?? i.platform,
      title: short(i.about, 110),
      hook: i.hook ?? null,
      format: i.format ?? null,
      thumb: i.thumb ?? null,
      duration: dur(i.duration),
      badge: i.platform === "meta_ad" ? (i.metrics.daysRunning ? `Running ${n(i.metrics.daysRunning)} days` : null) : lift && lift >= 1.05 ? `${lift >= 10 ? Math.round(lift) : lift.toFixed(1)}× typical ${i.liftKind === "views" ? "views" : "engagement"}` : null,
      why: i.why,
      stats: stats(i),
      use: i.angle ? firstSentence(i.angle) : "",
      url: i.url,
      art: ART_CYCLE[k % ART_CYCLE.length],
      rows: [
        ["What it is", i.about],
        ...(i.hook ? [["Their opening line", `“${i.hook}”`] as [string, string]] : []),
        ["Why it works", i.why],
        ["My version", i.angle],
        ...(metricLine(i) ? [["Numbers from the post", metricLine(i)] as [string, string]] : []),
        ...(i.handle ? [["Posted by", i.platform === "youtube" || i.platform === "meta_ad" ? i.handle : `@${i.handle.replace(/^@/, "")}`] as [string, string]] : []),
        ["Source", i.url],
      ],
      makeChip: { label: "Make my version", action: { type: "agent-op", endpoint: "niche", body: { op: "make", id: i.id } } },
    }
  })

  const trends = ((trendRow?.metadata as { trends?: Trend[] } | null)?.trends ?? []).filter((t) => t.url)

  // Ideas: the proof pill comes from the fact each idea cites (lib/insights.ts keys).
  const latestRank = await db.keywordRanking.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" }, select: { date: true } })
  const ranks = latestRank ? await db.keywordRanking.findMany({ where: { userId: user.id, date: latestRank.date }, select: { query: true, position: true, clicks: true, impressions: true }, take: 2000 }) : []
  const proofFor = (keys: string[]): string | null => {
    for (const k of keys) {
      const [kind, sub, ...rest] = k.split(":")
      const arg = rest.join(":")
      if (kind === "ai" && sub === "lost" && qs) {
        const q = qs.scan.questions.find((x) => x.q === arg)
        const answered = q ? Object.values(q.engines).filter((e) => e && (e.status === "appeared" || e.status === "not_appearing")) : []
        if (answered.length) return `${answered.filter((e) => e!.appeared).length} of ${answered.length} AIs name you`
      }
      if (kind === "ai" && sub === "rival" && qs) {
        const r = qs.scan.rivals.find((x) => x.name === arg)
        if (r) return `AIs name ${short(r.name, 24)} ${r.count}×, not you`
      }
      if (kind === "gsc") {
        const r = ranks.find((x) => x.query === arg)
        if (r && (sub === "near" || sub === "ctr" || sub === "fall")) return `#${Math.round(r.position)} on Google`
        if (r && (sub === "top" || sub === "rise")) return `${n(r.clicks)} Google clicks · 28 days`
      }
    }
    return null
  }
  // Social ideas lead with the actual hook line: written once (Haiku), cached per title, no numbers.
  const st = await settingsOf(user.id)
  const hookCache = { ...(st.ideaHooks ?? {}) }
  const needHooks = (insights?.ideas ?? []).filter((i) => i.format === "social" && !hookCache[i.title]).slice(0, 5)
  if (needHooks.length) {
    const job = (async () => {
      try {
        const msg = await claudeFor("idea-hooks").messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 400,
          messages: [{ role: "user", content: `Write the opening line (the hook) for each social post idea for ${user.businessName ?? "a small business"}. Under 90 characters, plain words, no numbers, no emoji, no hashtags, no dashes, never "best" or "#1". It must make someone stop scrolling.\n\n${needHooks.map((i, k) => `${k + 1}. ${i.title} (${i.why})`).join("\n")}\n\nReply with ONLY JSON: [{"n": <number>, "hook": "..."}]` }],
        })
        const b = msg.content.find((x) => x.type === "text")
        const raw = b && b.type === "text" ? b.text : "[]"
        const at = new Date().toISOString()
        for (const p of JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1)) as { n?: number; hook?: string }[]) {
          const idea = typeof p.n === "number" ? needHooks[p.n - 1] : undefined
          const h = typeof p.hook === "string" ? p.hook.trim().replace(/^["“]|["”]$/g, "") : ""
          if (idea && h && h.length <= 120 && !/\d|#|\bbest\b|—|–/.test(h)) hookCache[idea.title] = { hook: h, at }
        }
        await saveAgentSettings(user.id, { ideaHooks: hookCache })
      } catch { /* no hook this time: the title leads */ }
    })()
    await Promise.race([job, new Promise((r) => setTimeout(r, 6000))])
  }
  const ideas: IdeaRow[] = (insights?.ideas ?? []).map((i) => ({
    kind: FORMAT_NAME[i.format] ?? "Idea",
    text: i.title,
    why: i.why,
    src: null,
    url: null,
    chip: { label: "Write it", action: { type: "draft", topic: i.title, mode: FORMAT_MODE[i.format] ?? "post" } },
    proof: proofFor(i.keys),
    hook: i.format === "social" ? hookCache[i.title]?.hook ?? null : null,
    format: i.format,
    ai: i.keys.some((k) => k.startsWith("ai:")),
  }))
  // My top pick: the strongest AI-visibility idea (AIs name a rival but not you beats a lost question).
  const topIdea = ideas.find((i) => i.ai && i.proof?.includes("not you")) ?? ideas.find((i) => i.ai && i.proof) ?? ideas.find((i) => i.ai) ?? null
  const hooks: IdeaRow[] = (strategy?.hooks ?? []).slice(0, 12).map((h) => ({ kind: h.type, text: h.line, why: "", src: "Your ad plan", url: "/dashboard/ad-strategy" }))

  const rivals = await getRivals(user, { strategy, niche, qs })
  const hasIg = (await listAccounts(user.id).catch(() => [])).some((a) => a.platform === "instagram" && a.status === "active")
  const instagram: InstagramState = !hasIg ? "connect" : niche?.instagram === "on" ? "on" : "pending"
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
    summary, nicheOn: nicheEnabled(), instagram, working, trends, ideas, hooks,
    moves: rivals.moves, comps: rivals.comps, compGaps: (strategy?.competitors?.gaps ?? []).slice(0, 4),
    strategyAt: strategy?.at ?? null, hiddenComps: rivals.hidden, hiddenGaps: rivals.hiddenGaps, lastChecked: rivals.lastChecked, compared: rivals.compared,
    autopilot: !!settings.autoApprove && consentCurrent(settings), siteConnected: !!(settings.wp || settings.site), top, island,
    droppedPosts, ideasAt: insights?.at ?? null, topIdea,
    hasSocialAccounts: (await listAccounts(user.id).catch(() => [])).some((a) => a.status === "active"),
    gmbConnected: !!(await db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true } }))?.gmbLocationId,
    published: hasPro(user) ? await repurposablePosts(user.id).catch(() => []) : [],
    clusters: await clusterView(user.id).catch(() => null),
    webPersonEmail: settings.webPersonEmail ?? null,
  }
}
