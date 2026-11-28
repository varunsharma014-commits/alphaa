// AI search pages (/dashboard/visibility and /dashboard/visibility/[engine]), UI audit package 5.
// Real stored data only: the verdict per AI is getEngineEvidence() via getAiCards() (the same cards as
// the Briefing), the question-by-question detail and cited pages come from the weekly question scans
// (lib/workspace/citations.ts), the trend from the weekly audits. Nothing is promised or estimated.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAiCards, type AiCard } from "./ai-cards"
import { getCitationsData, type CitationsData, type PageRef } from "./citations"
import type { SovData, Tone } from "@/lib/ai-sources"
import { getEngineEvidence, type EngineKey } from "@/lib/engine-evidence"

export const ENGINE_ORDER: EngineKey[] = ["chatgpt", "claude", "perplexity", "gemini"]
export const ENGINE_LABEL: Record<EngineKey, string> = { chatgpt: "ChatGPT", claude: "Claude", perplexity: "Perplexity", gemini: "Gemini" }

export type VisibilityData = {
  business: string
  cards: AiCard[]
  /** AIs whose freshest evidence names the business / that were checked at all. */
  naming: number
  checked: number
  /** Same count at the weekly check before the newest (null = no earlier check to compare with). */
  prevNaming: number | null
  /** Newest weekly AI check. */
  lastAt: string | null
  share: { last: number | null; prev: number | null; answers: number | null }
  sov: SovData | null
  sovWeeks: number
  /** AIs naming you, per weekly check, oldest first (fallback chart before 2 question weeks exist). */
  trend: { at: string; pct: number }[]
  ownCited: number | null
  totalCitations: number | null
}

type AuditLike = { aiSearchStatus: unknown; aiEngineResults: { engine: string; appeared: boolean }[] }
const STATUS_KEY: Record<EngineKey, string> = { chatgpt: "chatgpt", claude: "google_ai", gemini: "gemini", perplexity: "perplexity" }

/** AIs that named the business in one weekly audit (AiEngineResult first, aiSearchStatus as fallback). */
function namedIn(a: AuditLike): number {
  const status = a.aiSearchStatus && typeof a.aiSearchStatus === "object" && !Array.isArray(a.aiSearchStatus) ? (a.aiSearchStatus as Record<string, unknown>) : {}
  return ENGINE_ORDER.filter((e) => {
    const row = a.aiEngineResults.find((r) => r.engine === e)
    if (row) return row.appeared
    const s = status[STATUS_KEY[e]]
    return s === "frequently" || s === "appeared" || s === "occasionally"
  }).length
}

export async function getVisibilityData(user: User): Promise<VisibilityData> {
  const [cards, audits, cites] = await Promise.all([
    getAiCards(user),
    db.audit.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12, select: { createdAt: true, aiSearchStatus: true, aiEngineResults: { select: { engine: true, appeared: true } } } }),
    getCitationsData(user).catch((): CitationsData | null => null),
  ])
  const naming = cards.filter((c) => c.state === "yes").length
  const checked = cards.filter((c) => c.state !== "unknown").length
  // Week over week only when the newest audit says the same as the cards (else the two would disagree).
  const prevNaming = audits.length >= 2 && namedIn(audits[0]) === naming ? namedIn(audits[1]) : null
  const own = cites?.sov?.series[0]
  const n = cites?.sov?.weeks.length ?? 0
  return {
    business: cites?.business ?? user.businessName?.trim() ?? "You",
    cards,
    naming,
    checked,
    prevNaming,
    lastAt: audits[0]?.createdAt.toISOString() ?? null,
    share: {
      last: own && n ? own.points[n - 1]?.share ?? null : null,
      prev: own && n > 1 ? own.points[n - 2]?.share ?? null : null,
      answers: n ? cites!.sov!.weeks[n - 1].answers : null,
    },
    sov: cites?.sov ?? null,
    sovWeeks: cites?.sovWeeks ?? 0,
    trend: [...audits].reverse().map((a) => ({ at: a.createdAt.toISOString(), pct: Math.round((namedIn(a) / ENGINE_ORDER.length) * 100) })),
    ownCited: cites?.at ? cites.ownCited : null,
    totalCitations: cites?.at ? cites.totalCitations : null,
  }
}

export type EngineQuestion = {
  q: string
  state: "named" | "not_named" | "error"
  rank: number | null
  /** Who it named instead (or as well). */
  others: string[]
  tone: Tone | null
  quote: string | null
  cited: PageRef[]
}

export type EngineDetail = {
  engine: EngineKey
  name: string
  business: string
  card: AiCard
  /** Where the verdict came from, in plain words ("my weekly check"). */
  source: string | null
  questions: EngineQuestion[]
  /** When the weekly questions were asked. */
  questionsAt: string | null
  sites: { site: string; kindLabel: string; count: number }[]
}

const SOURCE_WORDS: Record<string, string> = { weekly: "my weekly check", scan: "your free scan", sandbox: "a question you asked live" }

export async function getEngineDetail(user: User, engine: EngineKey): Promise<EngineDetail> {
  const [cards, cites, evidence] = await Promise.all([
    getAiCards(user),
    getCitationsData(user).catch((): CitationsData | null => null),
    getEngineEvidence({ id: user.id, email: user.email }).catch(() => null),
  ])
  const card = cards.find((c) => c.engine === engine)!
  const ev = evidence?.[engine]
  const questions: EngineQuestion[] = (cites?.questions ?? []).flatMap((q) => {
    const c = q.engines.find((e) => e.engine === engine)
    if (!c) return []
    return [{ q: q.q, state: c.state, rank: c.rank, others: c.ranks.map((r) => r.name).slice(0, 4), tone: c.tone, quote: c.quote, cited: c.pages.filter((p) => p.cited).slice(0, 4) }]
  })
  const by = cites?.byEngine.find((e) => e.engine === engine)
  return {
    engine,
    name: ENGINE_LABEL[engine],
    business: cites?.business ?? user.businessName?.trim() ?? "you",
    card,
    source: ev?.source ? SOURCE_WORDS[ev.source] ?? null : null,
    questions,
    questionsAt: cites?.at ?? null,
    sites: (by?.sites ?? []).slice(0, 6).map((s) => ({ site: s.site, kindLabel: s.kindLabel, count: s.count })),
  }
}
