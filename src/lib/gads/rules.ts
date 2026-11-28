// Pure rules (no I/O), unit-tested in scripts/test-gads.ts: ad copy checks, budget maths and
// the weekly tuning decisions.

// ── Ad copy (Google's limits + our claims policy) ─────────────────────────────
export const HEADLINE_MAX = 30
export const DESCRIPTION_MAX = 90
export const PATH_MAX = 15

// Superlatives and claims we can't verify. Google also rejects unsupported superlatives.
const BANNED = /(\bbest\b|#\s*1\b|\bno\.?\s*1\b|\bnumber\s+one\b|\btop[-\s]?rated\b|\bleading\b|\bcheapest\b|\blowest\b|\bfastest\b|\bgreatest\b|\bultimate\b|\bunbeatable\b|\bworld[-\s]?class\b|\baward[-\s]?winning\b|\bguarantee[ds]?\b|\bperfect\b|\bpremier\b|\b#?1st\b)/i
export const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, "").replace(/,/g, ""))

export type CopyProblem = { text: string; reason: string }

/**
 * The owner's banned words for the writer running now (lib/guardrails.ts registers this on the
 * server; client bundles never do, so it stays a no-op there and this file stays pure).
 */
let ownerBanned: ((text: string) => string | null) | null = null
export function registerOwnerBanned(fn: (text: string) => string | null) { ownerBanned = fn }
export const ownerBannedIn = (text: string): string | null => ownerBanned?.(text) ?? null

/** Why this line can't run, or null if it's fine. `allowedNumbers` = numbers that appear in the business's real facts. */
export function copyProblem(text: string, max: number, allowedNumbers: Set<string>, headline: boolean, brand?: string | null): string | null {
  const t = text.trim()
  // The business's own name may contain a word like "Best" or a number; judge the rest.
  const b = brand?.trim()
  const rest = b ? t.split(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig")).join(" ") : t
  if (!t) return "empty"
  if (t.length > max) return `over ${max} characters`
  if (BANNED.test(rest)) return "superlative or claim I can’t back up"
  const own = ownerBannedIn(t)
  if (own) return `uses “${own}”, which you asked me never to use`
  if (headline && t.includes("!")) return "Google doesn’t allow ! in headlines"
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t)) return "emoji"
  if (/\[|\]/.test(t)) return "placeholder"
  if (/(.)\1{3,}/.test(t) || /!{2,}|\?{2,}/.test(t)) return "repeated characters"
  const caps = t.replace(/[^A-Za-z]/g, "")
  if (caps.length >= 6 && caps === caps.toUpperCase()) return "all capitals"
  if (numbersIn(rest).some((n) => !allowedNumbers.has(n))) return "a number that isn’t in your facts"
  return null
}

/** Keep valid, distinct lines up to `limit`; report the rest. */
export function cleanLines(lines: string[], max: number, limit: number, allowed: Set<string>, headline: boolean, brand?: string | null): { ok: string[]; dropped: CopyProblem[] } {
  const ok: string[] = []
  const dropped: CopyProblem[] = []
  const seen = new Set<string>()
  for (const raw of lines) {
    const t = raw.replace(/\s+/g, " ").trim()
    const reason = copyProblem(t, max, allowed, headline, brand) ?? (seen.has(t.toLowerCase()) ? "duplicate" : null)
    if (reason) { dropped.push({ text: t, reason }); continue }
    seen.add(t.toLowerCase())
    if (ok.length < limit) ok.push(t)
  }
  return { ok, dropped }
}

export const cleanPath = (p?: string | null) => (p ?? "").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, PATH_MAX) || undefined

/** Google keyword text: no symbols it rejects, at most 10 words and 80 characters. */
export function cleanKeyword(k: string): string | null {
  const t = k.toLowerCase().replace(/[^\p{L}\p{N}\s&'-]/gu, " ").replace(/\s+/g, " ").trim()
  if (!t || t.length > 80 || t.split(" ").length > 10) return null
  if (BANNED.test(t)) return null
  return t
}

// ── Budget ───────────────────────────────────────────────────────────────────
export const DAYS_PER_MONTH = 30.4
/** Daily budget from a monthly cap, rounded down to the cent so 30.4 days never exceed the cap. */
export const dailyFromMonthly = (monthly: number) => Math.floor((monthly / DAYS_PER_MONTH) * 100) / 100
export const monthlyFromDaily = (daily: number) => Math.round(daily * DAYS_PER_MONTH * 100) / 100

/** A suggested daily budget: about 10 clicks a day at the median top-of-page bid Google reported. */
export function suggestDaily(bidsMicros: number[]): { daily: number; cpc: number } | null {
  const b = bidsMicros.filter((x) => x > 0).sort((a, z) => a - z)
  if (!b.length) return null
  const mid = b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2
  const cpc = Math.round((mid / 1_000_000) * 100) / 100
  return { daily: Math.max(5, Math.round(cpc * 10)), cpc }
}

/** The owner's typed daily budget, if it's valid and inside their monthly cap. */
export function checkDaily(input: unknown, cap: number | null): { ok: true; daily: number } | { ok: false; error: string } {
  const n = Number(String(input ?? "").replace(/[^0-9.]/g, ""))
  if (!Number.isFinite(n) || n < 1) return { ok: false, error: "Tell me a daily budget of at least 1." }
  const daily = Math.round(n * 100) / 100
  if (cap && monthlyFromDaily(daily) > cap + 0.01) return { ok: false, error: `That’s more than your monthly cap of ${cap}. The most I can set is ${dailyFromMonthly(cap)} a day.` }
  return { ok: true, daily }
}

// ── Weekly tuning ────────────────────────────────────────────────────────────
export type TermRow = { term: string; status: string; cost: number; clicks: number; conversions: number }
export type KeywordRow = { criterion: string; text: string; status: string; cost: number; clicks: number; conversions: number }
export type TuneDecision =
  | { kind: "negative"; term: string; cost: number; clicks: number }
  | { kind: "pause_keyword"; criterion: string; text: string; cost: number; clicks: number }

/**
 * What to change, from real numbers only.
 * - A search term that cost at least half a day's budget (min 5) with 3+ clicks and no conversion → exact negative.
 * - A keyword that cost at least 3 days' budget (min 30) with no conversion → paused.
 * Both need conversion tracking: without it "0 conversions" means "not measured", so nothing is cut.
 */
export function decideTuning(o: { daily: number; tracking: boolean; terms: TermRow[]; keywords: KeywordRow[]; maxActions?: number }): TuneDecision[] {
  if (!o.tracking) return []
  const termCap = Math.max(5, o.daily * 0.5)
  const kwCap = Math.max(30, o.daily * 3)
  const out: TuneDecision[] = []
  const keywordTexts = new Set(o.keywords.map((k) => k.text.toLowerCase()))
  for (const t of [...o.terms].sort((a, z) => z.cost - a.cost)) {
    if (t.conversions > 0 || t.clicks < 3 || t.cost < termCap) continue
    if (t.status === "EXCLUDED" || t.status === "ADDED_EXCLUDED") continue
    if (keywordTexts.has(t.term.toLowerCase())) continue // it's one of our keywords; the keyword rule handles it
    out.push({ kind: "negative", term: t.term, cost: t.cost, clicks: t.clicks })
  }
  const enabled = o.keywords.filter((k) => k.status === "ENABLED")
  for (const k of [...enabled].sort((a, z) => z.cost - a.cost)) {
    if (k.conversions > 0 || k.cost < kwCap) continue
    if (enabled.length - out.filter((d) => d.kind === "pause_keyword").length <= 3) break // always leave a few keywords running
    out.push({ kind: "pause_keyword", criterion: k.criterion, text: k.text, cost: k.cost, clicks: k.clicks })
  }
  return out.slice(0, o.maxActions ?? 20)
}

// ── Location ──────────────────────────────────────────────────────────────────
const CA = new Set(["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "NU", "YT"])
const US = new Set(["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"])
export function countryOf(state?: string | null, zip?: string | null): "US" | "CA" | null {
  const s = (state ?? "").trim().toUpperCase()
  if (CA.has(s)) return "CA"
  if (US.has(s)) return "US"
  if (zip && /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(zip.trim())) return "CA"
  if (zip && /^\d{5}(-\d{4})?$/.test(zip.trim())) return "US"
  return null
}
