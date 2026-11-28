// Core Web Vitals: pure parsing + plain-English verdicts (client-safe, no I/O).
//
// FIELD DATA FIRST. PageSpeed Insights returns two very different things:
//   - loadingExperience / originLoadingExperience = CrUX, what real Chrome users measured over the
//     last 28 days (p75 + Google's category). This is what Google's page experience uses.
//   - lighthouseResult = one lab test on Google's servers (an emulated phone or desktop). Useful for
//     WHY a page is slow, but it is not what visitors saw, so the UI labels it "lab test".
// Small sites often have no field data at all (CrUX needs enough Chrome traffic): then we say so.
//
// Thresholds (p75, "good" ≤ first, "poor" > second), from Google's definitions:
//   https://web.dev/articles/defining-core-web-vitals-thresholds
//   LCP https://web.dev/articles/lcp  INP https://web.dev/articles/inp  CLS https://web.dev/articles/cls
//   FCP https://web.dev/articles/fcp  TTFB https://web.dev/articles/ttfb
// PSI response format: https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
// CrUX history API: https://developer.chrome.com/docs/crux/history-api

export type MetricKey = "lcp" | "inp" | "cls" | "fcp" | "ttfb"
export type Rating = "good" | "needs" | "poor"
export type Strategy = "mobile" | "desktop"

/** good ≤ [0], poor > [1]. ms, except CLS (unitless). */
export const THRESHOLDS: Record<MetricKey, [number, number]> = {
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [0.1, 0.25],
  fcp: [1800, 3000],
  ttfb: [800, 1800],
}
/** The three that are Core Web Vitals; FCP and TTFB are supporting signals. */
export const CORE: MetricKey[] = ["lcp", "inp", "cls"]
export const METRIC_ORDER: MetricKey[] = ["lcp", "inp", "cls", "fcp", "ttfb"]

export const METRIC_NAME: Record<MetricKey, string> = {
  lcp: "Main content shows",
  inp: "Reacts to taps",
  cls: "Layout stays still",
  fcp: "First thing appears",
  ttfb: "Server answers",
}
/** The technical name, shown small for the owner's web person. */
export const METRIC_TECH: Record<MetricKey, string> = {
  lcp: "Largest Contentful Paint (LCP)",
  inp: "Interaction to Next Paint (INP)",
  cls: "Cumulative Layout Shift (CLS)",
  fcp: "First Contentful Paint (FCP)",
  ttfb: "Time to First Byte (TTFB)",
}

// PSI / CrUX field metric ids per metric (INP and TTFB were "EXPERIMENTAL_" before 2024).
const PSI_KEYS: Record<MetricKey, string[]> = {
  lcp: ["LARGEST_CONTENTFUL_PAINT_MS"],
  inp: ["INTERACTION_TO_NEXT_PAINT", "EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT"],
  cls: ["CUMULATIVE_LAYOUT_SHIFT_SCORE"],
  fcp: ["FIRST_CONTENTFUL_PAINT_MS"],
  ttfb: ["EXPERIMENTAL_TIME_TO_FIRST_BYTE", "TIME_TO_FIRST_BYTE"],
}
const CRUX_KEYS: Record<MetricKey, string> = {
  lcp: "largest_contentful_paint",
  inp: "interaction_to_next_paint",
  cls: "cumulative_layout_shift",
  fcp: "first_contentful_paint",
  ttfb: "experimental_time_to_first_byte",
}
const PSI_CATEGORY: Record<string, Rating> = { FAST: "good", AVERAGE: "needs", SLOW: "poor" }

export function rate(key: MetricKey, p75: number): Rating {
  const [good, poor] = THRESHOLDS[key]
  return p75 <= good ? "good" : p75 <= poor ? "needs" : "poor"
}

export type FieldMetric = { key: MetricKey; p75: number; rating: Rating; /** Share of visits in Google's "good" bucket, 0-1. */ goodShare: number | null }
export type Field = {
  /** page = this URL's own visitors; origin = the whole site (PSI falls back when the page has too little traffic). */
  scope: "page" | "origin"
  metrics: FieldMetric[]
  /** Google's overall verdict for the Core Web Vitals (worst of LCP/INP/CLS), when it gave one. */
  overall: Rating | null
}
export type Opportunity = { id: string; title: string; savingsMs: number | null; display: string | null }
export type Lab = {
  score: number | null // 0-100
  lcp: number | null
  cls: number | null
  tbt: number | null
  fcp: number | null
  si: number | null
  opportunities: Opportunity[]
}
/** Mobile usability signals: true = passes, false = fails, null = not measured (Lighthouse 12+ dropped tap targets and font size). */
export type Usability = { viewport: boolean | null; fontSize: boolean | null; tapTargets: boolean | null }
export type StrategyResult = { strategy: Strategy; url: string; field: Field | null; lab: Lab | null; usability: Usability; at: string }

type PsiMetric = { percentile?: number; category?: string; distributions?: { min?: number; max?: number; proportion?: number }[] }
type PsiExperience = { id?: string; metrics?: Record<string, PsiMetric>; overall_category?: string; origin_fallback?: boolean }
type LhAudit = { id?: string; title?: string; score?: number | null; scoreDisplayMode?: string; numericValue?: number; displayValue?: string; details?: { type?: string; overallSavingsMs?: number }; metricSavings?: Record<string, number> }
export type PsiResponse = {
  id?: string
  loadingExperience?: PsiExperience
  originLoadingExperience?: PsiExperience
  lighthouseResult?: {
    finalUrl?: string
    finalDisplayedUrl?: string
    requestedUrl?: string
    fetchTime?: string
    configSettings?: { formFactor?: string; emulatedFormFactor?: string }
    categories?: Record<string, { score?: number | null; auditRefs?: { id: string; weight?: number; group?: string }[] }>
    audits?: Record<string, LhAudit>
  }
  analysisUTCTimestamp?: string
}

function fieldFrom(exp: PsiExperience | undefined, scope: Field["scope"]): Field | null {
  if (!exp?.metrics) return null
  const metrics: FieldMetric[] = []
  for (const key of METRIC_ORDER) {
    const raw = PSI_KEYS[key].map((k) => exp.metrics![k]).find((m) => m && typeof m.percentile === "number")
    if (!raw) continue
    // PSI reports CLS ×100 as an integer (30 = 0.30).
    const p75 = key === "cls" ? raw.percentile! / 100 : raw.percentile!
    // Our rating comes from Google's published thresholds; PSI's own category is the fallback.
    const rating = Number.isFinite(p75) ? rate(key, p75) : PSI_CATEGORY[raw.category ?? ""] ?? "needs"
    const good = raw.distributions?.[0]?.proportion
    metrics.push({ key, p75, rating, goodShare: typeof good === "number" ? good : null })
  }
  if (!metrics.length) return null
  return { scope, metrics, overall: PSI_CATEGORY[exp.overall_category ?? ""] ?? null }
}

const num = (a: LhAudit | undefined) => (a && typeof a.numericValue === "number" && Number.isFinite(a.numericValue) ? a.numericValue : null)
const passes = (a: LhAudit | undefined): boolean | null => {
  if (!a || a.scoreDisplayMode === "notApplicable" || a.scoreDisplayMode === "manual" || a.scoreDisplayMode === "error") return null
  return typeof a.score === "number" ? a.score >= 0.9 : null
}

/** Lab-test opportunities: Lighthouse ≤12 "opportunity" audits and 12+/13 insight audits, biggest saving first. */
function opportunities(audits: Record<string, LhAudit>, perfRefs: string[] | null): Opportunity[] {
  const out: Opportunity[] = []
  for (const [id, a] of Object.entries(audits)) {
    if (perfRefs && !perfRefs.includes(id)) continue
    if (typeof a.score !== "number" || a.score >= 0.9) continue
    const saveMs = a.details?.overallSavingsMs ?? (a.metricSavings ? Math.max(a.metricSavings.LCP ?? 0, a.metricSavings.FCP ?? 0, a.metricSavings.INP ?? 0, a.metricSavings.TBT ?? 0) : undefined)
    const isOpp = a.details?.type === "opportunity" || /-insight$/.test(id) || (a.metricSavings && Object.values(a.metricSavings).some((v) => v > 0))
    if (!isOpp) continue
    if (!(typeof saveMs === "number" && saveMs > 0) && !(a.metricSavings?.CLS && a.metricSavings.CLS > 0)) continue
    out.push({ id, title: String(a.title ?? id).replace(/`/g, ""), savingsMs: typeof saveMs === "number" && saveMs > 0 ? Math.round(saveMs) : null, display: a.displayValue?.replace(/ /g, " ") ?? null })
  }
  return out.sort((x, y) => (y.savingsMs ?? 0) - (x.savingsMs ?? 0)).slice(0, 5)
}

/** One PSI response → field data (page, else origin), lab test and mobile usability. */
export function parsePsi(json: PsiResponse, strategy: Strategy, at = new Date().toISOString()): StrategyResult {
  const pageField = json.loadingExperience?.origin_fallback ? null : fieldFrom(json.loadingExperience, "page")
  const field = pageField ?? fieldFrom(json.originLoadingExperience, "origin")
  const lr = json.lighthouseResult
  let lab: Lab | null = null
  const audits = lr?.audits ?? {}
  if (lr?.categories?.performance) {
    const perfScore = lr.categories.performance.score
    const refs = lr.categories.performance.auditRefs?.map((r) => r.id) ?? null
    lab = {
      score: typeof perfScore === "number" ? Math.round(perfScore * 100) : null,
      lcp: num(audits["largest-contentful-paint"]),
      cls: num(audits["cumulative-layout-shift"]),
      tbt: num(audits["total-blocking-time"]),
      fcp: num(audits["first-contentful-paint"]),
      si: num(audits["speed-index"]),
      opportunities: opportunities(audits, refs),
    }
  }
  return {
    strategy,
    url: lr?.finalDisplayedUrl ?? lr?.finalUrl ?? json.id ?? json.loadingExperience?.id ?? "",
    field,
    lab,
    usability: { viewport: passes(audits["viewport"]), fontSize: passes(audits["font-size"]), tapTargets: passes(audits["tap-targets"]) },
    at: json.analysisUTCTimestamp ?? lr?.fetchTime ?? at,
  }
}

// ── CrUX history (25 weekly points, p75 per metric) ──────────────────────────────────────────
export type HistoryPoint = { end: string; p75: number | null }
export type History = Partial<Record<MetricKey, HistoryPoint[]>>
type CruxDate = { year: number; month: number; day: number }
export type CruxHistoryResponse = {
  record?: {
    metrics?: Record<string, { percentilesTimeseries?: { p75s?: (number | string | null)[] } }>
    collectionPeriods?: { firstDate?: CruxDate; lastDate?: CruxDate }[]
  }
}
const ymd = (d?: CruxDate) => (d ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "")

export function parseCruxHistory(json: CruxHistoryResponse): History | null {
  const rec = json.record
  if (!rec?.metrics || !rec.collectionPeriods?.length) return null
  const ends = rec.collectionPeriods.map((p) => ymd(p.lastDate))
  const out: History = {}
  for (const key of METRIC_ORDER) {
    const p75s = rec.metrics[CRUX_KEYS[key]]?.percentilesTimeseries?.p75s
    if (!p75s?.length) continue
    // CLS p75s come back as strings ("0.05"); missing weeks are null ("NaN" in some responses).
    out[key] = p75s.map((v, i) => {
      const n = v == null ? NaN : Number(v)
      return { end: ends[i] ?? "", p75: Number.isFinite(n) ? n : null }
    })
  }
  return Object.keys(out).length ? out : null
}

// ── plain English ─────────────────────────────────────────────────────────────────────────────
export function fmt(key: MetricKey, v: number): string {
  if (key === "cls") return v.toFixed(2)
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`
}
const GOAL: Record<MetricKey, string> = { lcp: "under 2.5s", inp: "under 0.2s", cls: "under 0.1", fcp: "under 1.8s", ttfb: "under 0.8s" }
const secs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${(ms / 1000).toFixed(2)}s`)

/** "Your main image loads in 4.1s on phones; Google wants under 2.5s." */
export function sentence(m: Pick<FieldMetric, "key" | "p75">, strategy: Strategy): string {
  const on = strategy === "mobile" ? "on phones" : "on computers"
  switch (m.key) {
    case "lcp": return `Your main image or headline shows up in ${secs(m.p75)} ${on}. Google wants ${GOAL.lcp}.`
    case "inp": return `Your page takes ${secs(m.p75)} to react when someone taps or clicks ${on}. Google wants ${GOAL.inp}.`
    case "cls": return `Things jump around while your page loads ${on} (shift score ${m.p75.toFixed(2)}). Google wants ${GOAL.cls}.`
    case "fcp": return `The first thing on your page appears after ${secs(m.p75)} ${on}. Google wants ${GOAL.fcp}.`
    case "ttfb": return `Your server takes ${secs(m.p75)} to start answering ${on}. Google wants ${GOAL.ttfb}.`
  }
}

/** What I'd fix first, per metric (shown when it's not good). */
export const FIX: Record<MetricKey, string> = {
  lcp: "Make the top image smaller (WebP, under 200 KB, sized for the screen), don’t lazy load it, and cut scripts that load before it.",
  inp: "Remove or delay heavy scripts: chat widgets, extra trackers, sliders and pop ups are the usual cause.",
  cls: "Give every image and video a width and height, and reserve space for banners, embeds and cookie bars so nothing pushes the page down.",
  fcp: "Load less CSS and JavaScript before the page shows, and turn on caching.",
  ttfb: "Turn on page caching or a CDN, or ask your host about a faster plan. A slow server delays everything else.",
}

export const RATING_WORD: Record<Rating, string> = { good: "Pass", needs: "Needs work", poor: "Poor" }

/** Core metrics that turned poor since the previous check (same page + strategy). */
export function newlyPoor(prev: StrategyResult | null | undefined, cur: StrategyResult): FieldMetric[] {
  if (!cur.field) return []
  return cur.field.metrics.filter((m) => {
    if (!CORE.includes(m.key) || m.rating !== "poor") return false
    const before = prev?.field?.metrics.find((x) => x.key === m.key)
    return !before || before.rating !== "poor"
  })
}

/** Mobile usability from the lab test + the page's own HTML (viewport meta). */
export function viewportOk(html: string): boolean {
  const m = html.match(/<meta[^>]+name=["']?viewport["']?[^>]*>/i)
  if (!m) return false
  const content = m[0].match(/content=["']([^"']*)["']/i)?.[1] ?? ""
  return /width\s*=\s*device-width/i.test(content)
}
