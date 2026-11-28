// DataForSEO client (https://docs.dataforseo.com/v3/): Google results (with AI Overviews), YouTube
// results, the Google Ads Transparency Center, and business ratings (Google listing, Trustpilot,
// Tripadvisor). Basic auth with DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD (Railway).
//
//   Live mode (one call, answer in seconds) for anything a person waits on: the free scan, the
//   originality check, "Find competitors now", an owner's own listings check.
//   Standard mode (task_post, then task_get by id until ready, usually 1-2 minutes, about a third
//   of the price) for crons and background work.
//
// Cost: every task's own `cost` is recorded as `data_usd` for the brand of the request/cron
// context (lib/usage.ts; the house row for public scans), and a brand over its data_usd quota gets
// no call. Google and YouTube results pages also count as `search`. Prices seen 2026-11-28: Google
// results live $0.002 / standard $0.0006, YouTube and ads standard $0.0006, Google listing live
// $0.0054, Trustpilot / Tripadvisor $0.00075.
//
// Nothing here throws. Every failure comes back as the empty shape the caller already handles
// ([] / null). Account problems (no balance, payment, access paused: HTTP 401/402 or the 401xx/402xx
// account codes) pause every call for 15 minutes, are logged once, and send the founders one email
// per UTC day (MockActivity "data_alert" on the founder account).
import {
  COUNTRY_LOCATION, countryFor, DFS_NO_RESULTS, DFS_OK, DFS_WAITING, firstTask, parseAdsSearch, parseGoogleBusiness, parseLocations, parseOrganic,
  parseReviewSite, parseYoutube, pickLocation, type Country, type DfsLocation, type GoogleBusiness, type PickedLocation, type Rating, type SerpResult,
  type TransparencyAd, type YoutubeVideo,
} from "@/lib/dataforseo-parse"

export type { SerpResult } from "@/lib/dataforseo-parse"

const BASE = "https://api.dataforseo.com/v3"
const MIN = 60_000

export const dataforseoConfigured = () => !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)
/** Google search results are available (the scan's SERP, discovery, originality, AI Overviews). */
export const isSearchConfigured = dataforseoConfigured

const authHeader = () => `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN ?? ""}:${process.env.DATAFORSEO_PASSWORD ?? ""}`).toString("base64")}`

export const ENDPOINTS = {
  organic: { live: "/serp/google/organic/live/advanced", post: "/serp/google/organic/task_post", get: "/serp/google/organic/task_get/advanced" },
  youtube: { live: "/serp/youtube/organic/live/advanced", post: "/serp/youtube/organic/task_post", get: "/serp/youtube/organic/task_get/advanced" },
  adsSearch: { live: "/serp/google/ads_search/live/advanced", post: "/serp/google/ads_search/task_post", get: "/serp/google/ads_search/task_get/advanced" },
  googleBusiness: { live: "/business_data/google/my_business_info/live", post: "/business_data/google/my_business_info/task_post", get: "/business_data/google/my_business_info/task_get" },
  trustpilot: { live: null, post: "/business_data/trustpilot/reviews/task_post", get: "/business_data/trustpilot/reviews/task_get" },
  tripadvisor: { live: null, post: "/business_data/tripadvisor/reviews/task_post", get: "/business_data/tripadvisor/reviews/task_get" },
  // Live only (DataForSEO Labs and the Backlinks API have no standard mode): runTask uses live for these.
  kwDifficulty: { live: "/dataforseo_labs/google/bulk_keyword_difficulty/live", post: null, get: null },
  searchIntent: { live: "/dataforseo_labs/google/search_intent/live", post: null, get: null },
  blSummary: { live: "/backlinks/summary/live", post: null, get: null },
  blReferringDomains: { live: "/backlinks/referring_domains/live", post: null, get: null },
  blHistory: { live: "/backlinks/history/live", post: null, get: null },
  blIntersection: { live: "/backlinks/domain_intersection/live", post: null, get: null },
} as const satisfies Record<string, { live: string | null; post: string | null; get: string | null }>
export type Endpoint = keyof typeof ENDPOINTS
export type Mode = "live" | "standard"

// ── Account problems: pause, log once, one founder email a day ─────────────────────────────────

/** Account-level codes (docs.dataforseo.com/v3/appendix/errors): credentials, verification, payment, balance, paused access, cost limit. */
export const ACCOUNT_CODES = new Set([40100, 40104, 40200, 40201, 40203, 40204, 40207, 40208, 40210])
const RATE_CODES = new Set([40202, 40209])
const PAUSE_MS = 15 * MIN
let pausedUntil = 0
let alertedDay: string | null = null

/** True while calls are paused after an account problem (callers get their empty result). */
export const dataPaused = () => Date.now() < pausedUntil

// "Access denied, activate your subscription" (40204) on ONE API family (e.g. the Backlinks API
// needs its own subscription) pauses only that family for 6 hours, never every data call.
const DENIED_CODE = 40204
const deniedUntil = new Map<string, number>()
const familyOf = (path: string) => path.split("/")[1] ?? ""
/** True while an API family ("backlinks", "dataforseo_labs") answered "access denied" in the last 6 hours. */
export const apiDenied = (family: string) => (deniedUntil.get(family) ?? 0) > Date.now()

function accountProblem(code: number, message: string | null): void {
  const fresh = !dataPaused()
  pausedUntil = Date.now() + PAUSE_MS
  if (fresh) console.error(`[dataforseo] account problem ${code}${message ? ` (${message})` : ""}: pausing data calls for 15 minutes`)
  void alertFounders(code, message).catch((e) => console.error("[dataforseo] alert", e instanceof Error ? e.message : e))
}

async function alertFounders(code: number, message: string | null): Promise<void> {
  const day = new Date().toISOString().slice(0, 10)
  if (alertedDay === day) return
  alertedDay = day
  const [{ db }, { ADMIN_EMAILS }, { resend }, { fromAs }] = await Promise.all([import("@/lib/db"), import("@/lib/billing"), import("@/lib/resend"), import("@/lib/email-sender")])
  const founder = await db.user.findFirst({ where: { email: ADMIN_EMAILS[0] }, select: { id: true } })
  if (!founder) return
  const sent = await db.mockActivity.findFirst({ where: { userId: founder.id, type: "data_alert", metadata: { path: ["date"], equals: day } }, select: { id: true } })
  if (sent) return
  const balance = code === 40200 || code === 40210 || code === 402
  const text = [
    `DataForSEO stopped answering Alphaa's data calls (${day}, ${new Date().toISOString().slice(11, 16)} UTC).`,
    "",
    `Code ${code}${message ? `: ${message}` : ""}.`,
    balance ? "This usually means the balance ran out. Top up at https://app.dataforseo.com/ (Billing)." : "Check the account at https://app.dataforseo.com/.",
    "",
    "Until it's fixed: the free scan skips its Google results, the weekly AI Overview check, competitor discovery, Google ads of competitors, YouTube ideas and the Trustpilot / Tripadvisor / Google ratings are skipped. Nothing breaks; I retry every 15 minutes.",
    "You get at most one of these emails a day.",
  ].join("\n")
  const { error } = await resend.emails.send({ from: fromAs("Alphaa"), to: ADMIN_EMAILS, subject: `DataForSEO calls are failing (${day})`, text })
  if (error) { console.error("[dataforseo] alert send", error.message); return }
  await db.mockActivity.create({ data: { userId: founder.id, type: "data_alert", title: "DataForSEO alert sent", metadata: { date: day, code, message } } })
}

// ── HTTP ─────────────────────────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * One request with a timeout. Retries once on a 5xx, a network error or a rate-limit code, when
 * there's time left. Returns the parsed envelope, or null (logged).
 */
async function request(method: "GET" | "POST", path: string, body: unknown, timeoutMs: number): Promise<unknown | null> {
  const deadline = Date.now() + timeoutMs
  for (let attempt = 0; attempt < 2; attempt++) {
    const left = deadline - Date.now()
    if (left < 1500) return null
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { authorization: authHeader(), "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(left),
      })
      if (res.status === 401 || res.status === 402) { accountProblem(res.status, res.statusText || null); return null }
      if (res.status >= 500) { if (attempt === 0) { await sleep(800); continue } console.error(`[dataforseo] ${path} HTTP ${res.status}`); return null }
      const env = (await res.json().catch(() => null)) as { status_code?: number; status_message?: string } | null
      if (!env) { console.error(`[dataforseo] ${path} unreadable answer (HTTP ${res.status})`); return null }
      const code = env.status_code ?? 0
      const taskCode = Number((env as { tasks?: { status_code?: number }[] }).tasks?.[0]?.status_code ?? 0)
      if ((code === DENIED_CODE || taskCode === DENIED_CODE) && familyOf(path) !== "serp") {
        const why = (env as { tasks?: { status_message?: string }[] }).tasks?.[0]?.status_message ?? env.status_message ?? "no subscription"
        if (!apiDenied(familyOf(path))) console.error(`[dataforseo] ${familyOf(path)} access denied (${why}): pausing that API for 6 hours`)
        deniedUntil.set(familyOf(path), Date.now() + 6 * 60 * MIN)
        return null
      }
      if (ACCOUNT_CODES.has(code)) { accountProblem(code, env.status_message ?? null); return null }
      if (RATE_CODES.has(code) && attempt === 0) { await sleep(2000); continue }
      if (code !== DFS_OK) { console.error(`[dataforseo] ${path} ${code} ${env.status_message ?? ""}`); return null }
      return env
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
      if (!timedOut && attempt === 0) { await sleep(800); continue }
      console.error(`[dataforseo] ${path} ${timedOut ? "timed out" : err instanceof Error ? err.message : "failed"}`)
      return null
    }
  }
  return null
}

// ── Quota + cost ─────────────────────────────────────────────────────────────────────────────────

/** Room for about `estUsd` more data spend for the brand in context (public / house work: yes). */
async function room(estUsd: number): Promise<boolean> {
  const { currentBrandId } = await import("@/lib/usage")
  const userId = await currentBrandId()
  if (!userId) return true
  const { checkQuota } = await import("@/lib/quotas")
  const d = await checkQuota(userId, "data_usd", { n: estUsd, record: false, credits: false })
  if (!d.allowed) console.warn("[dataforseo] data quota", userId, d.period)
  return d.allowed
}
async function charge(cost: number): Promise<void> {
  if (!(cost > 0)) return
  const { tallyHere } = await import("@/lib/usage")
  tallyHere("data_usd", cost)
}

// ── Tasks ────────────────────────────────────────────────────────────────────────────────────────

export type TaskOutcome = {
  ok: boolean
  /** First result object (null with ok = no results, e.g. Google had nothing for the query). */
  result: Record<string, unknown> | null
  cost: number
  status: number | null
  /** Standard mode: the task id, so a caller that stopped waiting can collect it later. */
  taskId?: string | null
  /** Standard mode stopped waiting before the task was ready. */
  pending?: boolean
}
const FAIL: TaskOutcome = { ok: false, result: null, cost: 0, status: null }

/** POST one standard task. Its cost is recorded. Null when it couldn't be set. */
export async function postTask(ep: Endpoint, task: Record<string, unknown>, estUsd = 0.001): Promise<{ id: string; cost: number } | null> {
  const post = ENDPOINTS[ep].post
  if (!dataforseoConfigured() || dataPaused() || !post) return null
  if (!(await room(estUsd))) return null
  const env = await request("POST", post, [task], 30_000)
  if (!env) return null
  const t = firstTask(env)
  await charge(t.cost)
  if (!t.ok || !t.id) { if (t.status) console.error(`[dataforseo] ${ep} task_post ${t.status} ${t.message ?? ""}`); return null }
  return { id: t.id, cost: t.cost }
}

/** One look at a standard task (free). `ready` false while DataForSEO is still working on it. */
export async function getTask(ep: Endpoint, id: string): Promise<{ ready: boolean; ok: boolean; result: Record<string, unknown> | null; status: number | null }> {
  const get = ENDPOINTS[ep].get
  if (!dataforseoConfigured() || dataPaused() || !get) return { ready: false, ok: false, result: null, status: null }
  const env = await request("GET", `${get}/${encodeURIComponent(id)}`, undefined, 30_000)
  if (!env) return { ready: true, ok: false, result: null, status: null }
  const t = firstTask(env)
  if (t.status !== null && DFS_WAITING.has(t.status)) return { ready: false, ok: false, result: null, status: t.status }
  if (t.status === DFS_NO_RESULTS) return { ready: true, ok: true, result: null, status: t.status }
  if (!t.ok) console.error(`[dataforseo] ${ep} task_get ${t.status} ${t.message ?? ""}`)
  return { ready: true, ok: t.ok, result: t.ok ? t.result : null, status: t.status }
}

/**
 * Run one task and return its first result. Live mode answers in one call; standard mode posts the
 * task and polls task_get until it's ready or `maxWaitMs` passes (then `pending` + `taskId`).
 */
export async function runTask(ep: Endpoint, task: Record<string, unknown>, opts: { mode?: Mode; timeoutMs?: number; maxWaitMs?: number; estUsd?: number } = {}): Promise<TaskOutcome> {
  if (!dataforseoConfigured() || dataPaused()) return FAIL
  const live = ENDPOINTS[ep].live
  if (live && apiDenied(familyOf(live))) return FAIL
  // Trustpilot and Tripadvisor have no live endpoint: always standard. Labs + Backlinks have only live.
  if (live && (opts.mode === "live" || !ENDPOINTS[ep].post)) {
    if (!(await room(opts.estUsd ?? 0.006))) return FAIL
    const env = await request("POST", live, [task], opts.timeoutMs ?? 60_000)
    if (!env) return FAIL
    const t = firstTask(env)
    await charge(t.cost)
    if (t.status === DFS_NO_RESULTS) return { ok: true, result: null, cost: t.cost, status: t.status }
    if (!t.ok) { console.error(`[dataforseo] ${ep} live ${t.status} ${t.message ?? ""}`); return { ...FAIL, cost: t.cost, status: t.status } }
    return { ok: true, result: t.result, cost: t.cost, status: t.status }
  }
  const posted = await postTask(ep, task, opts.estUsd ?? 0.003)
  if (!posted) return FAIL
  const until = Date.now() + (opts.maxWaitMs ?? 5 * MIN)
  let wait = 5000
  while (Date.now() + wait < until) {
    await sleep(wait)
    const g = await getTask(ep, posted.id)
    if (g.ready) return { ok: g.ok, result: g.result, cost: posted.cost, status: g.status, taskId: posted.id }
    wait = Math.min(15_000, wait + 2500)
  }
  return { ok: false, result: null, cost: posted.cost, status: null, taskId: posted.id, pending: true }
}

// ── Locations ────────────────────────────────────────────────────────────────────────────────────

const locCache = new Map<Country, { at: number; list: Promise<DfsLocation[]> }>()

/** Google's locations for a country (free endpoint), cached a day per process. Empty on failure. */
async function locations(cc: Country): Promise<DfsLocation[]> {
  const hit = locCache.get(cc)
  if (hit && Date.now() - hit.at < 24 * 60 * MIN) return hit.list
  const list = (async () => {
    const env = await request("GET", `/serp/google/locations/${cc}`, undefined, 30_000)
    // Keep only the place types pickLocation can use (the US list is ~60,000 rows).
    return env ? parseLocations(env).filter((l) => /^(City|Municipality|Neighborhood|District|Country)$/.test(l.location_type ?? "")) : []
  })()
  locCache.set(cc, { at: Date.now(), list })
  const got = await list
  if (!got.length) locCache.delete(cc) // try again next time
  return got
}

export type Place = { city?: string | null; state?: string | null; websiteUrl?: string | null; country?: string | null }

/** The business's city as a DataForSEO location when it can be matched exactly, else its country. */
export async function locationFor(p: Place): Promise<PickedLocation & { country: Country }> {
  const cc = (p.country && p.country.toLowerCase() in COUNTRY_LOCATION ? p.country.toLowerCase() : countryFor(p)) as Country
  const base = pickLocation([], { city: null, country: cc })
  if (!p.city?.trim() || !dataforseoConfigured()) return { ...base, country: cc }
  const list = await locations(cc).catch(() => [] as DfsLocation[])
  return { ...pickLocation(list, { city: p.city, state: p.state, country: cc }), country: cc }
}

const countryCode = (c: string | null | undefined) => (c && c.toLowerCase() in COUNTRY_LOCATION ? COUNTRY_LOCATION[c.toLowerCase() as Country] : COUNTRY_LOCATION.us)

// ── Google results ───────────────────────────────────────────────────────────────────────────────

export type SearchOpts = {
  results?: number
  /** ISO country ("us", "ca", "gb", "au"); ignored when `city` gives a place. */
  country?: string
  city?: string | null
  state?: string | null
  /** Helps pick the country (.ca / .co.uk / .com.au) when nothing else says. */
  websiteUrl?: string | null
  timeoutMs?: number
  /** live (default, someone is waiting) or standard (cron / background). */
  mode?: Mode
}

async function searchUse(): Promise<{ ok: boolean; refund: () => void }> {
  const { quotaHere, refundQuota } = await import("@/lib/quotas")
  const q = await quotaHere("search")
  if (!q.allowed) { console.warn("[dataforseo] search quota", q.userId, q.period); return { ok: false, refund: () => undefined } }
  return { ok: true, refund: () => { if (q.userId) refundQuota(q.userId, "search") } }
}

async function serpTask(keyword: string, opts: SearchOpts & { overview?: boolean }): Promise<TaskOutcome> {
  const loc = opts.city || opts.websiteUrl ? (await locationFor({ city: opts.city, state: opts.state, country: opts.country, websiteUrl: opts.websiteUrl })).code : countryCode(opts.country)
  const mode = opts.mode ?? "live"
  return runTask("organic", {
    keyword: keyword.slice(0, 700),
    location_code: loc,
    language_code: "en",
    depth: Math.min(100, Math.max(10, opts.results ?? 10)),
    // Live results link through google.com redirects; resolving them takes ~70 s, so parseOrganic
    // falls back to each site's own address instead. Standard mode resolves them (default).
    ...(opts.overview ? { load_async_ai_overview: true } : {}),
  }, { mode, timeoutMs: opts.timeoutMs ?? 60_000, estUsd: opts.overview ? 0.004 : 0.002 })
}

/** Google's organic results for a query (top 10 by default). [] when off, over quota or failed. */
export async function googleSearch(query: string, opts: SearchOpts = {}): Promise<SerpResult[]> {
  if (!dataforseoConfigured() || dataPaused() || !query.trim()) return []
  const use = await searchUse()
  if (!use.ok) return []
  const r = await serpTask(query, opts)
  if (!r.ok) { use.refund(); return [] }
  return parseOrganic(r.result, opts.results ?? 10)
}

/**
 * One results page with everything on it (organic results + Google's AI Overview when one was
 * shown), on the same quota as googleSearch(). Null = not run or failed, so callers can tell
 * "no AI Overview" from "couldn't check". Google showing nothing = an empty page ({ items: [] }).
 */
export async function googleSerp(query: string, opts: SearchOpts = {}): Promise<Record<string, unknown> | null> {
  if (!dataforseoConfigured() || dataPaused() || !query.trim()) return null
  const use = await searchUse()
  if (!use.ok) return null
  const r = await serpTask(query, { ...opts, overview: true })
  if (!r.ok) { use.refund(); return null }
  return r.result ?? { items: [] }
}

// ── YouTube ──────────────────────────────────────────────────────────────────────────────────────

/** YouTube's results for a phrase (views from YouTube itself). Standard mode by default. */
export async function youtubeSearch(keyword: string, opts: { country?: string; mode?: Mode; max?: number } = {}): Promise<YoutubeVideo[]> {
  if (!dataforseoConfigured() || dataPaused() || !keyword.trim()) return []
  const use = await searchUse()
  if (!use.ok) return []
  const r = await runTask("youtube", { keyword: keyword.slice(0, 700), location_code: countryCode(opts.country), language_code: "en", block_depth: Math.min(40, opts.max ?? 20) }, { mode: opts.mode ?? "standard", estUsd: 0.002 })
  if (!r.ok) { use.refund(); return [] }
  return parseYoutube(r.result)
}

// ── Google Ads Transparency Center ───────────────────────────────────────────────────────────────

/** The Google search ads a domain's advertiser account runs (40 newest per call). Null when not run. */
export async function adsForDomain(domain: string, opts: { country?: string; mode?: Mode } = {}): Promise<TransparencyAd[] | null> {
  if (!dataforseoConfigured() || dataPaused()) return null
  const target = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase()
  if (!target.includes(".")) return null
  const r = await runTask("adsSearch", { target, location_code: countryCode(opts.country), platform: "google_search", depth: 40 }, { mode: opts.mode ?? "standard", estUsd: 0.003 })
  if (!r.ok) return null
  return parseAdsSearch(r.result)
}

// ── Ratings ──────────────────────────────────────────────────────────────────────────────────────

/** The Google listing for a business name in its place: rating, review count, phone, website. Live. */
export async function googleBusinessInfo(name: string, place: Place): Promise<GoogleBusiness | null> {
  if (!dataforseoConfigured() || dataPaused() || !name.trim()) return null
  const loc = await locationFor(place)
  const r = await runTask("googleBusiness", { keyword: name.slice(0, 700), location_code: loc.code, language_code: "en" }, { mode: "live", timeoutMs: 40_000, estUsd: 0.006 })
  return r.ok ? parseGoogleBusiness(r.result) : null
}

export { parseReviewSite, type Rating }
