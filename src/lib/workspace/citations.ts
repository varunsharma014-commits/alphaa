// "Where AI gets its answers" (/dashboard/citations, revived 2026-11-28 with real data).
// Everything comes from the stored weekly question scans (MockActivity question_scan):
//   - share of voice per week: owner vs the top competitors named in the same answers
//   - the pages each AI cited, per question and engine, and the top sites across the niche
//   - how answers talk about the owner when they name it (stance + the quoted sentence)
//   - Google AI Overviews for the top questions
// Sources/stance/ranks/overviews exist only on scans from 2026-11-28 on; older weeks still feed
// share of voice (it only needs who was named).
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import type { QuestionScan } from "@/lib/questions"
import { nameOf } from "@/lib/questions"
import { blockedHost, competitorGate, hostOf, isManualRow } from "@/lib/competitor-relevance"
import { PLATFORM_NAME, SOURCE_KIND_LABEL, classifySource, shareOfVoice, sourceSite, type SourceKind, type SovData, type Tone } from "@/lib/ai-sources"
import type { OverviewScan } from "@/lib/ai-citations"
import { overviewsEnabled } from "@/lib/ai-citations"

export type Engine = "chatgpt" | "claude" | "gemini" | "perplexity"
export const ENGINE_NAME: Record<Engine, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" }
const ENGINES: Engine[] = ["chatgpt", "claude", "perplexity", "gemini"]

export type PageRef = { url: string; title: string | null; site: string; kind: SourceKind; cited: boolean }
export type EngineCell = {
  engine: Engine
  name: string
  state: "named" | "not_named" | "error"
  tone: Tone | null
  quote: string | null
  rank: number | null
  ranks: { name: string; rank: number }[]
  pages: PageRef[]
}
export type QuestionRow = { q: string; engines: EngineCell[] }
export type TopSite = { site: string; kind: SourceKind; kindLabel: string; answers: number; engines: string[]; pages: { url: string; title: string | null }[] }

export type CitationsData = {
  business: string
  /** The newest scan with source data, and when. */
  at: string | null
  /** Any scan at all (for the empty state). */
  scanned: boolean
  sov: SovData | null
  sovWeeks: number
  topSites: TopSite[]
  kinds: { kind: SourceKind; label: string; count: number }[]
  ownCited: number
  totalCitations: number
  questions: QuestionRow[]
  tones: Record<Tone, number>
  overviews: OverviewScan | null
  overviewsOn: boolean
  /** Per engine: pages cited in its newest answers and the sites it leans on most. */
  perEngine: Record<Engine, { pages: number; answers: number }>
  byEngine: { engine: Engine; name: string; answers: number; pages: number; sites: { site: string; kind: SourceKind; kindLabel: string; count: number }[] }[]
}

type Row = { at: string; scan: QuestionScan }

async function scans(userId: string): Promise<Row[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "question_scan" }, orderBy: { createdAt: "desc" }, take: 16, select: { createdAt: true, metadata: true } })
  return rows
    .filter((r) => r.metadata && typeof r.metadata === "object" && Array.isArray((r.metadata as { questions?: unknown }).questions))
    .map((r) => ({ at: r.createdAt.toISOString(), scan: r.metadata as unknown as QuestionScan }))
}

const hasSources = (s: QuestionScan) => s.questions.some((q) => Object.values(q.engines ?? {}).some((e) => (e?.sources?.length ?? 0) > 0))

export async function getCitationsData(user: User): Promise<CitationsData> {
  const business = nameOf(user) ?? "You"
  const [rows, comps] = await Promise.all([
    scans(user.id),
    db.competitor.findMany({ where: { userId: user.id }, select: { url: true, name: true, crawlData: true } }),
  ])

  // Competitors: the gated rows (relevance gate, cached verdicts only — no new AI calls on a page
  // view) + rival domains the answers named, through the same gate.
  const rivalDomains = new Map<string, string>()
  for (const r of rows) for (const q of r.scan.questions) for (const [n, d] of Object.entries(q.domains ?? {})) rivalDomains.set(n.trim().toLowerCase(), d)
  const gate = await competitorGate(user, { judge: false }).catch(() => null)
  const keepHost = (url: string, manual = false) => (gate ? gate.keep(url, manual) : !blockedHost(hostOf(url)))
  const compHosts = [
    ...comps.filter((c) => keepHost(c.url, isManualRow(c))).map((c) => hostOf(c.url)),
    ...[...rivalDomains.values()].filter((d) => keepHost(d)).map((d) => hostOf(d)),
  ].filter((h): h is string => !!h)
  const dismissedNames = new Set(comps.filter((c) => gate?.dismissed.has(hostOf(c.url) ?? "")).map((c) => (c.name ?? "").trim().toLowerCase()).filter(Boolean))
  const ownHost = hostOf(user.websiteUrl ?? "")
  const self = business.toLowerCase()

  const keepName = (n: string) => {
    const name = n.trim()
    const low = name.toLowerCase()
    if (!name || PLATFORM_NAME.test(name) || dismissedNames.has(low)) return false
    if (self && (low === self || low.includes(self) || self.includes(low))) return false
    // "Bing Places", "Google Business Profile", "Yelp for Business": platforms, not rivals.
    const first = low.split(/\s+/)[0].replace(/[^a-z0-9]/g, "")
    if (first && blockedHost(`${first}.com`)) return false
    const dom = rivalDomains.get(low)
    return dom ? keepHost(dom) : true
  }

  const sovAll = shareOfVoice(rows.map((r) => ({ at: r.at, questions: r.scan.questions })), { ownName: business, keep: keepName, top: 4 })
  const sovWeeks = sovAll.weeks.length

  const latest = rows.find((r) => hasSources(r.scan)) ?? null
  const ctx = { ownHost, competitorHosts: compHosts }
  const tones: Record<Tone, number> = { positive: 0, neutral: 0, negative: 0, mixed: 0 }
  const perEngine = Object.fromEntries(ENGINES.map((e) => [e, { pages: 0, answers: 0 }])) as CitationsData["perEngine"]
  const engineSites = Object.fromEntries(ENGINES.map((e) => [e, new Map<string, { kind: SourceKind; count: number }>()])) as Record<Engine, Map<string, { kind: SourceKind; count: number }>>
  const sites = new Map<string, { kind: SourceKind; answers: number; engines: Set<string>; pages: Map<string, string | null> }>()
  const kindCount = new Map<SourceKind, number>()
  let ownCited = 0, total = 0

  const questions: QuestionRow[] = (latest?.scan.questions ?? []).map((q) => ({
    q: q.q,
    engines: ENGINES.flatMap((engine): EngineCell[] => {
      const e = q.engines?.[engine]
      if (!e || e.status === "not_configured") return []
      const pages: PageRef[] = (e.sources ?? []).map((s) => ({ url: s.url, title: s.title, site: sourceSite(s.url), kind: classifySource(s.url, ctx), cited: s.cited }))
      if (e.status !== "error") {
        perEngine[engine].answers++
        perEngine[engine].pages += pages.filter((p) => p.cited).length
      }
      if (e.stance && e.appeared) tones[e.stance.tone]++
      const seenSite = new Set<string>()
      for (const p of pages) {
        if (!p.cited) continue
        total++
        kindCount.set(p.kind, (kindCount.get(p.kind) ?? 0) + 1)
        if (p.kind === "own") ownCited++
        const es = engineSites[engine].get(p.site) ?? { kind: p.kind, count: 0 }
        es.count++
        engineSites[engine].set(p.site, es)
        const s = sites.get(p.site) ?? { kind: p.kind, answers: 0, engines: new Set(), pages: new Map() }
        if (!seenSite.has(p.site)) { s.answers++; seenSite.add(p.site) }
        s.engines.add(ENGINE_NAME[engine])
        if (!s.pages.has(p.url)) s.pages.set(p.url, p.title)
        sites.set(p.site, s)
      }
      return [{
        engine, name: ENGINE_NAME[engine],
        state: e.status === "error" ? "error" : e.appeared ? "named" : "not_named",
        tone: e.appeared ? e.stance?.tone ?? null : null,
        quote: e.appeared ? e.stance?.quote ?? null : null,
        rank: e.appeared ? e.rank ?? null : null,
        ranks: (e.ranks ?? []).filter((r) => keepName(r.name)).slice(0, 3),
        pages,
      }]
    }),
  }))

  const topSites: TopSite[] = [...sites.entries()]
    .map(([site, s]) => ({ site, kind: s.kind, kindLabel: SOURCE_KIND_LABEL[s.kind], answers: s.answers, engines: [...s.engines], pages: [...s.pages.entries()].slice(0, 3).map(([url, title]) => ({ url, title })) }))
    .sort((a, b) => b.answers - a.answers || a.site.localeCompare(b.site))
    .slice(0, 12)
  const kinds = [...kindCount.entries()].map(([kind, count]) => ({ kind, label: SOURCE_KIND_LABEL[kind], count })).sort((a, b) => b.count - a.count)
  const overviews = rows.find((r) => r.scan.overviews)?.scan.overviews ?? null

  return {
    business,
    at: latest?.at ?? null,
    scanned: rows.length > 0,
    sov: sovWeeks >= 2 ? sovAll : null,
    sovWeeks,
    topSites,
    kinds,
    ownCited,
    totalCitations: total,
    questions,
    tones,
    overviews,
    overviewsOn: overviewsEnabled(),
    perEngine,
    byEngine: ENGINES.map((engine) => ({
      engine, name: ENGINE_NAME[engine], answers: perEngine[engine].answers, pages: perEngine[engine].pages,
      sites: [...engineSites[engine].entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([site, v]) => ({ site, kind: v.kind, kindLabel: SOURCE_KIND_LABEL[v.kind], count: v.count })),
    })),
  }
}

/** Cheap per-engine summary for the Briefing AI cards: cited pages + the most common stance when named, from the newest scan with sources. */
export async function engineCitationSummary(userId: string): Promise<Partial<Record<Engine, { pages: number; tone: Tone | null; quote: string | null }>>> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "question_scan" }, orderBy: { createdAt: "desc" }, take: 3, select: { metadata: true } })
  const latest = rows.map((r) => r.metadata as unknown as QuestionScan | null).find((s) => s && Array.isArray(s.questions) && hasSources(s))
  if (!latest) return {}
  const out: Partial<Record<Engine, { pages: number; tone: Tone | null; quote: string | null }>> = {}
  for (const engine of ENGINES) {
    let pages = 0
    const tones = new Map<Tone, { n: number; quote: string }>()
    for (const q of latest.questions) {
      const e = q.engines?.[engine]
      if (!e) continue
      pages += (e.sources ?? []).filter((s) => s.cited).length
      if (e.appeared && e.stance) tones.set(e.stance.tone, { n: (tones.get(e.stance.tone)?.n ?? 0) + 1, quote: tones.get(e.stance.tone)?.quote ?? e.stance.quote })
    }
    const top = [...tones.entries()].sort((a, b) => b[1].n - a[1].n)[0]
    out[engine] = { pages, tone: top?.[0] ?? null, quote: top?.[1].quote ?? null }
  }
  return out
}
