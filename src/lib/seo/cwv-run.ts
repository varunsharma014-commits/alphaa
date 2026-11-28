// Core Web Vitals runs: PageSpeed Insights (field data first, lab second) for the homepage and the
// top pages by Search Console clicks (up to 5), mobile AND desktop, plus 25 weeks of CrUX history
// for the whole site. Stored as MockActivity "cwv_check" (one row per run = the history).
//
// PSI is free but rate limited (with a key: 25,000/day, 400 per 100 s per project). Calls go one at
// a time with a short gap, and each URL+strategy is cached in memory for 6h like lib/pagespeed.ts.
// Without PAGESPEED_API_KEY the keyless quota answers 429 almost always, so we don't try: the page
// says so instead.
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { safeFetch } from "@/lib/safe-fetch"
import { latestPageSnapshot } from "@/lib/seo/page-stats"
import { newlyPoor, parseCruxHistory, parsePsi, sentence, viewportOk, type History, type PsiResponse, type Strategy, type StrategyResult, type CruxHistoryResponse } from "@/lib/seo/cwv"

export const CWV_TYPE = "cwv_check"
export const MAX_PAGES = 5
const CACHE_MS = 6 * 3_600_000
const GAP_MS = 1500

export const psiKey = () => process.env.PAGESPEED_API_KEY?.trim() || null

export type PageVitals = { url: string; mobile: StrategyResult | null; desktop: StrategyResult | null; errors: string[] }
export type CwvAlert = { url: string; strategy: Strategy; metric: string; text: string }
export type CwvCheck = {
  at: string
  pages: PageVitals[]
  /** Whole-site phone history from the CrUX History API (null = not enough Chrome traffic, or the API isn't enabled for the key). */
  history: History | null
  /** The homepage HTML has <meta name="viewport" content="width=device-width…"> (null = couldn't read it). */
  viewportMeta: boolean | null
  /** Core metrics that turned poor since the previous run. */
  alerts: CwvAlert[]
  reason: "weekly" | "owner"
}

const withHttps = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`)
const bare = (u: string) => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, "") } catch { return "" } }
const keyOf = (u: string) => u.replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const memo = new Map<string, { at: number; v: StrategyResult }>()

/** One PSI run. Throws a short reason on failure (shown per page, never the raw body). */
export async function runPsi(url: string, strategy: Strategy): Promise<StrategyResult> {
  const key = psiKey()
  if (!key) throw new Error("no PAGESPEED_API_KEY")
  const k = `${keyOf(url)}|${strategy}`
  const hit = memo.get(k)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.v
  const q = new URLSearchParams({ url, strategy })
  q.append("category", "performance")
  q.append("category", "seo") // viewport / font size / tap targets live in the SEO category (until Lighthouse 12)
  q.set("key", key)
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout(90_000), cache: "no-store" })
  if (!res.ok) {
    const reason = res.status === 429 ? "Google’s speed test is busy (rate limit)" : res.status === 400 ? "Google couldn’t load the page" : `Google’s speed test answered ${res.status}`
    await res.body?.cancel().catch(() => {})
    throw new Error(reason)
  }
  const v = parsePsi((await res.json()) as PsiResponse, strategy)
  memo.set(k, { at: Date.now(), v })
  if (memo.size > 500) memo.delete(memo.keys().next().value!)
  return v
}

/** 25 weekly p75s for the whole site on phones. Null when CrUX has no data (404) or the API is off for the key. */
export async function cruxHistory(origin: string): Promise<History | null> {
  const key = psiKey()
  if (!key) return null
  try {
    const res = await fetch(`https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ origin, formFactor: "PHONE", metrics: ["largest_contentful_paint", "interaction_to_next_paint", "cumulative_layout_shift"] }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    })
    if (!res.ok) { await res.body?.cancel().catch(() => {}); return null }
    return parseCruxHistory((await res.json()) as CruxHistoryResponse)
  } catch {
    return null
  }
}

/** Homepage + the top pages by Search Console clicks on the same site, up to 5. */
export async function pagesToCheck(userId: string, websiteUrl: string): Promise<string[]> {
  const home = new URL(withHttps(websiteUrl)).origin + "/"
  const out = [home]
  const snap = await latestPageSnapshot(userId).catch(() => null)
  const host = bare(home)
  const rows = [...(snap?.rows ?? [])].filter((r) => bare(r.page) === host && r.clicks > 0).sort((a, b) => b.clicks - a.clicks)
  for (const r of rows) {
    if (out.length >= MAX_PAGES) break
    if (!out.some((u) => keyOf(u) === keyOf(r.page))) out.push(r.page)
  }
  return out
}

async function homepageViewport(url: string): Promise<boolean | null> {
  try {
    const res = await safeFetch(url, { headers: { "User-Agent": "AlphaaBot/1.0 (SEO audit; +https://alphaa.app)" }, signal: AbortSignal.timeout(10_000), redirect: "follow" })
    if (!res.ok) return null
    return viewportOk((await res.text()).slice(0, 300_000))
  } catch {
    return null
  }
}

export async function latestCwv(userId: string, skip = 0): Promise<(CwvCheck & { id: string }) | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: CWV_TYPE }, orderBy: { createdAt: "desc" }, skip, select: { id: true, metadata: true } })
  const m = row?.metadata as CwvCheck | null
  return m && Array.isArray(m.pages) ? { ...m, id: row!.id } : null
}

const inFlight = new Set<string>()
const lastFail = new Map<string, { at: string; errors: string[] }>()
/** The last run that measured nothing (this process only). */
export const cwvLastFail = (userId: string) => lastFail.get(userId) ?? null
export const cwvRunning = (userId: string) => inFlight.has(userId)

/** Runs the check for one brand and stores it. Null when there's no key, no website, or one is already running. */
export async function runCwv(user: { id: string; websiteUrl: string | null }, reason: CwvCheck["reason"]): Promise<CwvCheck | null> {
  if (!psiKey() || !user.websiteUrl?.trim() || inFlight.has(user.id)) return null
  inFlight.add(user.id)
  try {
    const urls = await pagesToCheck(user.id, user.websiteUrl)
    const prev = await latestCwv(user.id)
    const pages: PageVitals[] = []
    for (const url of urls) {
      const p: PageVitals = { url, mobile: null, desktop: null, errors: [] }
      for (const s of ["mobile", "desktop"] as const) {
        try {
          p[s] = await runPsi(url, s)
        } catch (e) {
          p.errors.push(`${s === "mobile" ? "Phone" : "Computer"}: ${e instanceof Error ? e.message : "failed"}`)
        }
        await sleep(GAP_MS)
      }
      pages.push(p)
    }
    const [history, viewportMeta] = await Promise.all([cruxHistory(new URL(urls[0]).origin), homepageViewport(urls[0])])
    const alerts: CwvAlert[] = []
    for (const p of pages) {
      const before = prev?.pages.find((x) => keyOf(x.url) === keyOf(p.url))
      for (const s of ["mobile", "desktop"] as const) {
        const cur = p[s]
        if (!cur) continue
        // Field data only: a single lab run is too noisy to alert on.
        for (const m of newlyPoor(before?.[s], cur)) alerts.push({ url: p.url, strategy: s, metric: m.key, text: sentence(m, s) })
      }
    }
    const check: CwvCheck = { at: new Date().toISOString(), pages, history, viewportMeta, alerts, reason }
    // Nothing measured (rate limit, site down): keep no row, so the weekly run tries again next hour.
    if (pages.every((p) => !p.mobile && !p.desktop)) {
      const errors = [...new Set(pages.flatMap((p) => p.errors.map((e) => e.replace(/^\w+: /, ""))))].slice(0, 3)
      console.error(`[cwv] ${user.id}: no page could be tested`, errors)
      lastFail.set(user.id, { at: check.at, errors })
      return null
    }
    lastFail.delete(user.id)
    await db.mockActivity.create({ data: { userId: user.id, type: CWV_TYPE, title: "Checked how fast your site loads for real visitors", metadata: check as unknown as Prisma.InputJsonValue } })
    return check
  } finally {
    inFlight.delete(user.id)
  }
}
