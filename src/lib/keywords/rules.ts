// Keyword data, pure (no DB, no network): parsers for DataForSEO Labs answers, how a volume is
// shown (Google rounds, and buckets accounts without ad spend into ranges: show what Google gave,
// never fake precision), difficulty labels, and the target pick = volume × winnability.
// Tested by scripts/test-keywords.ts.

export type Intent = "informational" | "navigational" | "commercial" | "transactional"

export type Volume = {
  /** Google's average monthly searches (already rounded by Google). */
  avg: number
  /** Set when Google gave a bucket instead of a number (accounts with no ad spend). */
  low: number | null
  high: number | null
  /** Last 12 months, oldest first (null = no number for that month). */
  monthly: (number | null)[]
}

export type KeywordMetric = {
  keyword: string
  /** null = Google has no search data for this phrase (too rare, or too long). */
  volume: Volume | null
  competition: "LOW" | "MEDIUM" | "HIGH" | null
  /** Top-of-page bid range in the planner account's currency. */
  bidLow: number | null
  bidHigh: number | null
  currency: string | null
  /** DataForSEO Labs keyword difficulty, 0-100 (null = not measured). */
  difficulty: number | null
  intent: Intent | null
  intentP: number | null
  volumeAt?: string
  difficultyAt?: string
  intentAt?: string
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null)

/** Lowercase, single spaces, no edge punctuation: the cache key and what we send. */
export function normKeyword(s: string): string {
  return s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^\p{L}\p{N}' &+.-]+/gu, " ").replace(/\s+/g, " ").trim().replace(/^[\s.'-]+|[\s.'-]+$/g, "").slice(0, 80)
}

/** Google Ads accepts keywords of up to 10 words and 80 characters. Longer phrases have no data. */
export const plannerOk = (k: string) => k.length >= 2 && k.length <= 80 && k.split(" ").length <= 10

// ── DataForSEO Labs parsers (first result object from lib/dataforseo.ts runTask) ───────────────

/** bulk_keyword_difficulty result → keyword → difficulty 0-100. */
export function parseDifficulty(result: unknown): Map<string, number> {
  const out = new Map<string, number>()
  for (const it of arr(isObj(result) ? result.items : null)) {
    if (!isObj(it) || typeof it.keyword !== "string") continue
    const d = num(it.keyword_difficulty)
    if (d !== null) out.set(normKeyword(it.keyword), Math.max(0, Math.min(100, Math.round(d))))
  }
  return out
}

const INTENTS = new Set<Intent>(["informational", "navigational", "commercial", "transactional"])
/** search_intent result → keyword → main intent + its probability. */
export function parseIntent(result: unknown): Map<string, { intent: Intent; p: number | null }> {
  const out = new Map<string, { intent: Intent; p: number | null }>()
  for (const it of arr(isObj(result) ? result.items : null)) {
    if (!isObj(it) || typeof it.keyword !== "string" || !isObj(it.keyword_intent)) continue
    const label = String(it.keyword_intent.label ?? "").toLowerCase() as Intent
    if (INTENTS.has(label)) out.set(normKeyword(it.keyword), { intent: label, p: num(it.keyword_intent.probability) })
  }
  return out
}

// ── Volume ─────────────────────────────────────────────────────────────────────────────────────

const BUCKETS = [0, 10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000]
const isBucket = (n: number | null) => n !== null && BUCKETS.includes(n)

/**
 * From Keyword Planner's numbers. Google buckets accounts without ad spend (every month and the
 * average land on 10 / 100 / 1,000 / 10,000…): then the honest reading is a range, e.g. 100 to 1K.
 */
export function volumeFrom(avg: number | null, monthly: (number | null)[]): Volume | null {
  if (avg === null) return null
  const months = monthly.slice(-12)
  // A flat 10 is Google rounding a tiny number, not a bucket: ranges start at 100.
  const bucketed = avg >= 100 && isBucket(avg) && months.length > 0 && months.every((m) => m === null || isBucket(m))
  if (bucketed) return { avg, low: avg, high: avg * 10, monthly: months }
  return { avg, low: null, high: null, monthly: months }
}

const short = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${+(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n))

/** "about 170 a month", "100 to 1K a month", "under 10 a month", "No Google data". */
export function volumeLabel(v: Volume | null, unit = " a month"): string {
  if (!v) return "No Google data"
  if (v.low !== null && v.high !== null) return `${short(v.low)} to ${short(v.high)}${unit}`
  if (v.avg === 0) return `Under 10${unit}`
  return `About ${v.avg.toLocaleString("en-US")}${unit}`
}

/** The number used for ranking: the average, or a range's geometric middle (100 to 1K → ~316). */
export function volumeValue(v: Volume | null): number {
  if (!v) return 0
  if (v.low !== null && v.high !== null) return Math.round(Math.sqrt(Math.max(1, v.low) * v.high))
  return v.avg
}

/** Trend over the last 12 months: last 3 months vs the 3 before them. null = not enough data. */
export function trendOf(v: Volume | null): "up" | "down" | "flat" | null {
  const m = (v?.monthly ?? []).filter((x): x is number => x !== null)
  if (m.length < 6 || (v && v.low !== null)) return null
  const a = m.slice(-6, -3).reduce((s, x) => s + x, 0)
  const b = m.slice(-3).reduce((s, x) => s + x, 0)
  if (a + b < 30) return null
  if (b >= a * 1.3) return "up"
  if (b <= a * 0.7) return "down"
  return "flat"
}

// ── Difficulty + winnability ───────────────────────────────────────────────────────────────────

export function difficultyLabel(d: number | null): string {
  if (d === null) return "Not measured"
  if (d < 15) return "Very easy"
  if (d < 30) return "Easy"
  if (d < 50) return "Doable"
  if (d < 70) return "Hard"
  if (d < 85) return "Very hard"
  return "Out of reach for now"
}
export const difficultyTone = (d: number | null): "g" | "a" | "r" | "n" => (d === null ? "n" : d < 30 ? "g" : d < 60 ? "a" : "r")

export function intentLabel(i: Intent | null): string {
  return i === "transactional" ? "Ready to buy" : i === "commercial" ? "Comparing options" : i === "informational" ? "Learning" : i === "navigational" ? "Looking for a brand" : "Unknown"
}

/**
 * The site's strength on the same 0-100 scale as difficulty: from its backlink rank
 * (DataForSEO, one_hundred scale) when measured, else a small-site default of 15.
 */
export function siteStrength(rank100: number | null | undefined): number {
  if (rank100 == null || !Number.isFinite(rank100)) return 15
  return Math.max(0, Math.min(100, Math.round(rank100)))
}

/**
 * 0-1: how likely this site can reach page one. Difficulty well above the site's strength = low;
 * already ranking top 20 on Google (Search Console) = high whatever the difficulty says.
 */
export function winnability(difficulty: number | null, strength: number, position: number | null = null): number {
  let w = difficulty === null ? 0.5 : Math.max(0.05, Math.min(1, 1 - Math.max(0, difficulty - strength - 10) / 50))
  if (position !== null && position > 0) {
    if (position <= 10) w = Math.max(w, 0.9)
    else if (position <= 20) w = Math.max(w, 0.7)
    else if (position <= 40) w = Math.max(w, 0.5)
  }
  return Math.round(w * 100) / 100
}

const INTENT_WEIGHT: Record<Intent, number> = { transactional: 1.25, commercial: 1.15, informational: 1, navigational: 0.4 }

/** Opportunity = sqrt(volume) × winnability × intent weight (sqrt so one huge head term doesn't drown everything). */
export function opportunity(m: Pick<KeywordMetric, "volume" | "difficulty" | "intent">, strength: number, position: number | null = null): number {
  const v = volumeValue(m.volume)
  if (v <= 0) return 0
  return Math.round(Math.sqrt(v) * winnability(m.difficulty, strength, position) * (m.intent ? INTENT_WEIGHT[m.intent] : 1) * 10) / 10
}

export type TargetPick = { keyword: string; metric: KeywordMetric; win: number; score: number; why: string }

/** The best target among candidates, with a plain reason. null = none has Google data. */
export function pickTarget(cands: { keyword: string; metric: KeywordMetric | undefined; position?: number | null }[], strength: number): TargetPick | null {
  const scored = cands
    .filter((c): c is { keyword: string; metric: KeywordMetric; position?: number | null } => !!c.metric && volumeValue(c.metric.volume) > 0)
    .map((c) => ({ keyword: c.keyword, metric: c.metric, win: winnability(c.metric.difficulty, strength, c.position ?? null), score: opportunity(c.metric, strength, c.position ?? null) }))
    .sort((a, b) => b.score - a.score)
  const top = scored[0]
  if (!top) return null
  const bits = [`${volumeLabel(top.metric.volume)} on Google`]
  if (top.metric.difficulty !== null) bits.push(`difficulty ${top.metric.difficulty} of 100 (${difficultyLabel(top.metric.difficulty).toLowerCase()})`)
  return { ...top, why: bits.join(", ") }
}

/** Keywords worth sending for difficulty: has volume, deduped, highest volume first, capped. */
export function forDifficulty(ms: KeywordMetric[], max: number): string[] {
  return ms.filter((m) => m.difficulty === null && volumeValue(m.volume) > 0).sort((a, b) => volumeValue(b.volume) - volumeValue(a.volume)).slice(0, max).map((m) => m.keyword)
}

/** Words two phrases share (3+ letters, not stop words): the relevance test for planner ideas. */
const STOP = new Set(["the", "and", "for", "with", "you", "your", "how", "what", "why", "when", "where", "who", "does", "can", "are", "near", "best", "from", "that", "this", "into", "about", "much", "cost"])
export const words = (s: string) => normKeyword(s).split(" ").filter((w) => w.length >= 3 && !STOP.has(w))
export function overlap(a: string, b: string): number {
  const wa = new Set(words(a))
  return words(b).filter((w) => wa.has(w) || wa.has(w.replace(/s$/, "")) || wa.has(`${w}s`)).length
}
