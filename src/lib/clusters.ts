// Topic clusters (2026-11-28): each brand's content map = 3-6 pillar topics, each with supporting
// articles, built ONLY from real inputs: the AI customer questions I track (weekly question scan),
// Search Console queries (KeywordRanking, 90 days), the owner's live pages (sitemap + posts I
// published = covered), their drafts, Research gaps from real competitors' pages, and what the
// business sells (its category + service pages/menu links). One Sonnet 5.5 call proposes the
// grouping (structured output); lib/cluster-rules.ts drops anything that doesn't map to a real
// input, and each article's status (published / drafted / planned) is worked out on every read
// from the brand's drafts. Stored as MockActivity "topic_clusters" (newest row = the map).
//
// Used by: Research → Topic plan (Draft it / Open / Refresh), the brief (pillar + live sibling
// URLs as internal links), writePost's own topic pick and the week run (next unwritten article
// first). Refreshed weekly after the question scan (per brand, at most once in 6 days) and on
// demand; each build is one `topic_plan` quota use. Writing still follows each plan's blog quota.
import type { User } from "@prisma/client"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { withQuota } from "@/lib/quotas"
import { getAgentSettings } from "@/lib/agent/settings"
import { latestQuestionScan } from "@/lib/questions"
import { relevantGaps } from "@/lib/competitor-relevance"
import { hostOf, pickCompetitorPages, readArticleCached, readSitemap, slugTitle, withHttps } from "@/lib/page-reader"
import type { GapItem } from "@/lib/content-gaps"
import {
  clusterRef, findArticle, linkTargets, nextArticle, promptLists, validatePlan, viewOf, titleKey,
  type ClusterInputs, type ClusterMap, type ClusterView, type DraftRow, type RawPlan,
} from "@/lib/cluster-rules"

export type { ClusterView }
export const CLUSTER_TYPE = "topic_clusters"
const REFRESH_MS = 6 * 86_400_000
const anthropic = claudeFor("clusters")
const MODEL = "claude-sonnet-5-5"

const SERVICE_PATH = /\/(services?|solutions?|treatments?|what-we-do|offerings?|practice-areas?|products?)(\/|$)/i

/** Every real input, read fresh (sitemap + homepage are cached by lib/page-reader.ts). */
export async function gatherInputs(user: User): Promise<ClusterInputs> {
  const site = user.websiteUrl ? withHttps(user.websiteUrl) : null
  const since = new Date(Date.now() - 90 * 86_400_000)
  const [qs, settings, ranks, gapRows, draftRows, map, home] = await Promise.all([
    latestQuestionScan(user.id).catch(() => null),
    getAgentSettings(user.id),
    db.keywordRanking.findMany({ where: { userId: user.id, date: { gte: since }, impressions: { gt: 0 } }, select: { query: true, impressions: true, clicks: true, position: true }, take: 5000 }).catch(() => []),
    db.contentGap.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 6 }).catch(() => []),
    db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft", createdAt: { gte: new Date(Date.now() - 365 * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, metadata: true } }),
    site ? readSitemap(site, 500).catch(() => ({ urls: [], source: "none" })) : Promise.resolve({ urls: [], source: "none" }),
    site ? readArticleCached(site, 500).catch(() => null) : Promise.resolve(null),
  ])

  // AI questions: the newest scan (with how often I was named), else the owner's tracked list.
  const questions: ClusterInputs["questions"] = []
  for (const q of qs?.scan.questions ?? []) {
    const answered = Object.values(q.engines).filter((e) => e && e.status !== "error" && e.status !== "not_configured")
    questions.push({ q: q.q, named: answered.filter((e) => e!.appeared).length, asked: answered.length })
  }
  for (const q of settings.questions ?? []) if (!questions.some((x) => titleKey(x.q) === titleKey(q))) questions.push({ q, named: 0, asked: 0 })

  // Search Console: summed over 90 days, position weighted by impressions.
  const byQ = new Map<string, { impressions: number; clicks: number; pw: number }>()
  for (const r of ranks) {
    const k = r.query.trim().toLowerCase()
    const cur = byQ.get(k) ?? { impressions: 0, clicks: 0, pw: 0 }
    cur.impressions += r.impressions; cur.clicks += r.clicks; cur.pw += r.position * r.impressions
    byQ.set(k, cur)
  }
  const queries = [...byQ.entries()].filter(([, v]) => v.impressions >= 5).sort((a, b) => b[1].impressions - a[1].impressions).slice(0, 60)
    .map(([query, v]) => ({ query, impressions: v.impressions, clicks: v.clicks, position: v.impressions ? v.pw / v.impressions : 0 }))

  // Live pages: posts I published first, then the sitemap's content pages.
  const pages: ClusterInputs["pages"] = []
  const drafts: ClusterInputs["drafts"] = []
  for (const r of draftRows) {
    const m = (r.metadata ?? {}) as { title?: string; status?: string; url?: string; refresh?: unknown }
    if (m.refresh || !m.title) continue
    if (m.status === "published" && m.url) { if (!pages.some((p) => p.url === m.url)) pages.push({ url: m.url, title: m.title }) }
    else if (drafts.length < 30) drafts.push({ id: r.id, title: m.title })
  }
  for (const u of pickCompetitorPages(map.urls, { max: 140 })) if (!pages.some((p) => p.url.replace(/\/+$/, "") === u.url.replace(/\/+$/, "")) && u.title.length > 2) pages.push({ url: u.url, title: u.title })

  // Gaps from real competitors only (shared gate, lib/competitor-relevance.ts).
  const gaps: ClusterInputs["gaps"] = []
  for (const row of await relevantGaps(user.id, gapRows).catch(() => [])) {
    const list = (Array.isArray(row.gaps) ? row.gaps : []) as unknown as GapItem[]
    list.forEach((g, i) => {
      const title = g.suggestedTitle || g.topic
      if (title && gaps.length < 30 && !gaps.some((x) => titleKey(x.title) === titleKey(title))) gaps.push({ id: `${row.id}:${i}`, title, host: hostOf(row.competitorUrl) ?? row.competitorUrl, url: g.sourceUrl ?? null })
    })
  }

  // What they sell: the category, service pages in the sitemap, service links on the homepage.
  const services: ClusterInputs["services"] = []
  const addS = (name: string, url: string | null) => { const n = name.replace(/\s+/g, " ").trim(); if (n.length > 2 && n.length < 80 && !services.some((s) => titleKey(s.name) === titleKey(n))) services.push({ name: n, url }) }
  if (user.businessType?.trim()) addS(user.businessType.trim(), null)
  if (home?.ok) for (const l of home.page.links) { try { if (SERVICE_PATH.test(new URL(l.url).pathname) && l.text) addS(l.text, l.url) } catch {} }
  for (const p of pages) { try { if (SERVICE_PATH.test(new URL(p.url).pathname)) addS(slugTitle(p.url) || p.title, p.url) } catch {} }

  // Searches with Google's numbers (Research → Keywords): the owner's pins + the best opportunities.
  const keywords = await import("@/lib/keywords/view").then((m) => m.clusterKeywords(user)).catch(() => [])

  return { questions: questions.slice(0, 30), queries, pages: pages.slice(0, 140), drafts, gaps, services: services.slice(0, 15), keywords }
}

const Schema = z.object({
  clusters: z.array(z.object({
    pillar: z.string().describe("Title of the pillar page: the broad guide for this topic, under 70 characters"),
    pillarSources: z.array(z.string()).describe("Input ids (Q, K, G, S, W) this pillar comes from"),
    pillarPage: z.string().nullable().describe("A P id when a live page already is this pillar, a D id when a draft is, else null"),
    articles: z.array(z.object({
      title: z.string().describe("A supporting article that answers one narrower question, under 70 characters"),
      question: z.string().nullable().describe("The Q or K text it answers, copied exactly, else null"),
      sources: z.array(z.string()).describe("Input ids (Q, K, G, S, W) it comes from: at least one"),
      page: z.string().nullable().describe("A P id when a live page already covers it, a D id when a draft does, else null"),
    })).describe("3-8 supporting articles"),
  })).describe("3-6 topic clusters, most valuable first"),
})

export async function proposeClusters(user: Pick<User, "businessName" | "businessType" | "city" | "websiteUrl">, inputs: ClusterInputs): Promise<RawPlan | null> {
  const prompt = `Group this business's website content into topic clusters. A cluster = one pillar page (the broad guide on a topic) + 3-8 supporting articles (each answers one narrower question and links to the pillar).

BUSINESS: ${user.businessName ?? "unknown"} (${user.businessType ?? "business"})${user.city?.trim() ? `, ${user.city.trim()}` : ""}${user.websiteUrl ? `, ${user.websiteUrl}` : ""}

${promptLists(inputs)}

Rules:
- Use ONLY the inputs above. Every pillar and every article must cite at least one Q, K, G, S or W id in its sources. No topic nobody asks about.
- Searches with real Google volume (W) are worth an article each when they fit the business; a pinned W must get one.
- Make 3 to 6 clusters around what this business sells and what its customers are trying to do. Fewer, solid clusters beat padding: if the inputs only support 3, make 3.
- If a live page (P) already covers a pillar or an article, set its page to that P id (it counts as done). If a draft (D) covers it, set the D id.
- Group near-duplicate questions and searches into one article; don't make two articles that answer the same thing.
- Titles: plain and specific, under 70 characters, no numbers unless the cited input has them, never "best", "#1" or "ultimate", never a competitor's name.`
  const msg = await anthropic.messages.parse({ model: MODEL, max_tokens: 8000, output_config: { format: zodOutputFormat(Schema) }, messages: [{ role: "user", content: prompt }] })
  return msg.stop_reason === "refusal" ? null : (msg.parsed_output as RawPlan | null)
}

export type BuildResult = { ok: true; mapId: string; map: ClusterMap } | { ok: false; error: string }

/** Builds and stores the map (one topic_plan quota use; QuotaError when out). */
export async function buildClusters(user: User, o: { reason: "weekly" | "owner" } = { reason: "owner" }): Promise<BuildResult> {
  // Reading the inputs is free (DB + the owner's own sitemap); only the AI call is on the quota.
  const inputs = await gatherInputs(user)
  const signals = inputs.questions.length + inputs.queries.length + inputs.gaps.length + inputs.services.length + (inputs.keywords?.length ?? 0)
  if (signals < 3) return { ok: false, error: "I don’t have enough to plan from yet: no tracked AI questions, Google searches or competitor pages. Connect Search Console or let the weekly AI check run first." }
  const map = await withQuota(user, "topic_plan", async () => validatePlan(await proposeClusters(user, inputs), inputs))
  if (!map.clusters.length) return { ok: false as const, error: "I couldn’t group your topics from the data I have yet. I’ll try again after the next weekly check." }
  const total = map.clusters.reduce((n, c) => n + 1 + c.articles.length, 0)
  const row = await db.mockActivity.create({ data: { userId: user.id, type: CLUSTER_TYPE, title: `Planned ${map.clusters.length} topics with ${total} pages for your site`, metadata: { ...map, reason: o.reason } as object } })
  return { ok: true as const, mapId: row.id, map }
}

async function latestMap(userId: string): Promise<{ mapId: string; map: ClusterMap; at: Date } | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: CLUSTER_TYPE }, orderBy: { createdAt: "desc" } })
  const m = row?.metadata as ClusterMap | undefined
  return row && m?.v === 1 && Array.isArray(m.clusters) ? { mapId: row.id, map: m, at: row.createdAt } : null
}

async function draftRows(userId: string): Promise<DraftRow[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "post_draft" }, orderBy: { createdAt: "desc" }, take: 300, select: { id: true, metadata: true, createdAt: true } })
  return rows.map((r) => {
    const m = (r.metadata ?? {}) as { title?: string; topic?: string; requestTopic?: string; status?: string; url?: string; cluster?: string }
    return { id: r.id, title: m.title ?? null, topic: m.topic ?? null, requestTopic: m.requestTopic ?? null, status: m.status ?? null, url: m.url ?? null, cluster: m.cluster ?? null, at: r.createdAt.toISOString() }
  })
}

/** The Topic plan view (DB only; no outside calls). `badges` adds cached keyword numbers per article. */
export async function clusterView(userId: string, opts: { badges?: boolean } = {}): Promise<ClusterView | null> {
  const [m, drafts] = await Promise.all([latestMap(userId), draftRows(userId)])
  if (!m) return null
  const view = viewOf(m.mapId, m.map, drafts)
  if (opts.badges) await addKeywordBadges(userId, view).catch((e) => console.warn("[clusters] badges", e instanceof Error ? e.message : e))
  return view
}

/** The phrase an article targets on Google: its keyword/search source, else a short question, else the title. */
export function articleKeyword(a: { title: string; question: string | null; sources: { kind: string; text: string }[] }): string {
  return a.sources.find((s) => s.kind === "kw" || s.kind === "gsc")?.text ?? (a.question && a.question.split(" ").length <= 10 ? a.question : a.title)
}

async function addKeywordBadges(userId: string, view: ClusterView): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, city: true, state: true, websiteUrl: true } })
  if (!user) return
  const [{ cachedMetrics }, rules] = await Promise.all([import("@/lib/keywords/data"), import("@/lib/keywords/rules")])
  const all = view.clusters.flatMap((c) => [c.pillar, ...c.articles])
  const metrics = await cachedMetrics(user, all.map(articleKeyword))
  for (const a of all) {
    const k = rules.normKeyword(articleKeyword(a))
    const m = metrics.get(k)
    if (!m?.volumeAt) continue
    a.kw = { keyword: k, volume: rules.volumeLabel(m.volume), searches: rules.volumeValue(m.volume), difficulty: m.difficulty, label: rules.difficultyLabel(m.difficulty), tone: rules.difficultyTone(m.difficulty) }
  }
}

export type NextCluster = { ref: string; title: string; question: string | null; gapId: string | null; competitor: string | null; pillar: string }

/** The next unwritten article (pillar first, one topic at a time), or null. */
export async function nextClusterArticle(userId: string): Promise<NextCluster | null> {
  const [m, drafts] = await Promise.all([latestMap(userId), draftRows(userId)])
  if (!m) return null
  const n = nextArticle(m.mapId, m.map, drafts)
  return n ? { ref: n.article.ref, title: n.article.title, question: n.article.question, gapId: n.article.gapId, competitor: n.article.competitor, pillar: n.cluster.title } : null
}

/** A cluster article by its ref, with the pages its brief must link to. Null = not (or no longer) in a map. */
export async function clusterContext(userId: string, ref: string | null | undefined): Promise<{ ref: string; title: string; pillar: string; isPillar: boolean; targets: { url: string; title: string; pillar: boolean }[] } | null> {
  const m = ref?.match(/^([a-z0-9]+):(a_[a-z0-9]+)$/i)
  if (!m) return null
  const row = await db.mockActivity.findFirst({ where: { id: m[1], userId, type: CLUSTER_TYPE } })
  const map = row?.metadata as ClusterMap | undefined
  if (!row || map?.v !== 1) return null
  const found = findArticle(map, m[2])
  if (!found) return null
  const targets = linkTargets(row.id, map, m[2], await draftRows(userId))
  return { ref: clusterRef(row.id, m[2]), title: found.article.title, pillar: found.cluster.title, isPillar: found.article.pillar, targets }
}

/** Weekly (after the question scan): rebuild when the map is older than 6 days. Never throws. */
const lastTry = new Map<string, number>()

export async function refreshClustersIfStale(userId: string): Promise<"built" | "fresh" | "skipped"> {
  try {
    const m = await latestMap(userId)
    if (m && Date.now() - m.at.getTime() < REFRESH_MS) return "fresh"
    // The catch-up re-hits hourly: a build that found nothing isn't retried for a day.
    if (Date.now() - (lastTry.get(userId) ?? 0) < 20 * 3_600_000) return "skipped"
    lastTry.set(userId, Date.now())
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user?.websiteUrl) return "skipped"
    const r = await buildClusters(user, { reason: "weekly" })
    if (!r.ok) console.warn("[clusters] weekly", userId, r.error)
    return r.ok ? "built" : "skipped"
  } catch (err) {
    console.warn("[clusters] weekly failed", userId, err instanceof Error ? err.message : err)
    return "skipped"
  }
}
