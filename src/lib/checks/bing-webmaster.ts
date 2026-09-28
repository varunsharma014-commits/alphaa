import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

// Bing Webmaster Tools, via the user's own API key (Bing Webmaster → Settings →
// API access). Bing matters beyond Bing: ChatGPT search and Copilot ground on
// the Bing index, so "is Bing crawling and ranking this site" is an AI-search
// question, not a legacy-SEO one.
//
// JSON endpoint: https://ssl.bing.com/webmaster/api.svc/json/<Method>?apikey=KEY
// Responses wrap the payload as {"d": ...}; dates are "/Date(ms[+-hhmm])/".
// Errors come back as HTTP 400 {"ErrorCode": n, "Message": "..."}.
// Method reference: https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi?view=bing-webmaster-dotnet
//
// The API key is a credential: it is never logged and never put in an error
// message. URLs containing it are built inside `call` and go nowhere else.

const BASE = "https://ssl.bing.com/webmaster/api.svc/json/"
const TIMEOUT_MS = 15_000

// ApiErrorCode enum values → what we tell a business owner.
// https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.apierrorcode?view=bing-webmaster-dotnet
const ERROR_TEXT: Record<number, string> = {
  1: "Bing had an internal error — try again in a few minutes",
  2: "Bing returned an unknown error — try again in a few minutes",
  3: "Bing didn’t accept that API key",
  4: "Bing is rate-limiting this account — try again later",
  5: "Bing is rate-limiting this site — try again later",
  6: "Bing has blocked this Webmaster Tools account",
  7: "Bing says that URL isn’t valid",
  8: "Bing rejected the request as invalid",
  9: "This Bing account has too many sites",
  10: "Bing couldn’t find that Webmaster Tools user",
  11: "Bing couldn’t find that site in your Webmaster Tools account",
  12: "That already exists in Bing Webmaster Tools",
  13: "Bing doesn’t allow that for this site",
  14: "That API key doesn’t have access to this site in Bing Webmaster Tools",
  15: "Bing is in an unexpected state for this site — try again later",
  16: "Bing no longer supports that request",
}

type CallResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function call<T>(
  apiKey: string,
  method: string,
  opts: { query?: Record<string, string>; body?: unknown } = {}
): Promise<CallResult<T>> {
  const key = (apiKey || "").trim()
  if (!key) return { ok: false, error: "No Bing API key has been added yet" }

  const qs = new URLSearchParams({ ...(opts.query || {}), apikey: key })
  let res: Response
  try {
    res = await fetch(`${BASE}${method}?${qs.toString()}`, {
      method: opts.body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json; charset=utf-8", accept: "application/json" },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
    return { ok: false, error: timedOut ? "Bing took too long to answer — try again" : "Couldn’t reach Bing Webmaster Tools" }
  }

  let json: unknown = null
  try {
    const text = await res.text()
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  const errCode =
    json && typeof json === "object" && "ErrorCode" in json ? Number((json as { ErrorCode: unknown }).ErrorCode) : null
  if (errCode !== null && Number.isFinite(errCode) && errCode !== 0) {
    return { ok: false, error: ERROR_TEXT[errCode] || "Bing Webmaster Tools returned an error" }
  }
  if (res.status === 401 || res.status === 403) return { ok: false, error: "Bing didn’t accept that API key" }
  if (res.status === 429) return { ok: false, error: "Bing is rate-limiting this account — try again later" }
  if (!res.ok) return { ok: false, error: `Bing Webmaster Tools returned an error (HTTP ${res.status})` }

  const d = json && typeof json === "object" && "d" in json ? (json as { d: T }).d : (null as T)
  return { ok: true, data: d }
}

/** "/Date(1316156400000-0700)/" → epoch ms. The offset is display-only; the ms value is already UTC. */
export function parseBingDate(v: unknown): number | null {
  if (typeof v !== "string") return null
  const m = /\/Date\((-?\d+)(?:[+-]\d{4})?\)\//.exec(v)
  if (m) return Number(m[1])
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : t
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0)

function normSite(u: string): string {
  return u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "")
}

// ---------------------------------------------------------------------------

type BingSite = { Url?: string; IsVerified?: boolean }

/** GetUserSites — every site in the key owner's Webmaster Tools account. */
export async function bingSites(apiKey: string): Promise<{ url: string; verified: boolean }[] | { error: string }> {
  try {
    const r = await call<BingSite[] | null>(apiKey, "GetUserSites")
    if (!r.ok) return { error: r.error }
    return (r.data || [])
      .filter((s) => typeof s?.Url === "string" && s.Url)
      .map((s) => ({ url: s.Url as string, verified: !!s.IsVerified }))
  } catch {
    return { error: "Couldn’t read your sites from Bing Webmaster Tools" }
  }
}

/**
 * Pick the siteUrl exactly as Bing has it registered ("https://www.x.com/" vs
 * "x.com" matter to the API). Falls back to what we were given.
 */
async function resolveSiteUrl(apiKey: string, siteUrl: string): Promise<string | { error: string }> {
  const sites = await bingSites(apiKey)
  if ("error" in sites) return sites
  const want = normSite(siteUrl)
  const match = sites.find((s) => normSite(s.url) === want)
  if (!match) {
    return { error: "That site isn’t in your Bing Webmaster Tools account yet — add and verify it there first" }
  }
  if (!match.verified) return { error: "Bing hasn’t verified that site yet — finish verification in Bing Webmaster Tools" }
  return match.url
}

type RankTraffic = { Clicks?: number; Impressions?: number; Date?: string }
type QueryStat = { Query?: string; Clicks?: number; Impressions?: number; Date?: string }
type CrawlStat = { CrawlErrors?: number; BlockedByRobotsTxt?: number; Date?: string }

const DAY = 86_400_000

/**
 * Last-7-days vs previous-7-days clicks/impressions (GetRankAndTrafficStats,
 * daily), top queries (GetQueryStats, weekly buckets — latest bucket used), and
 * crawl health from the most recent GetCrawlStats day. Bing's data lags a
 * couple of days, so the windows are anchored on the newest date Bing returned,
 * not on today.
 */
export async function bingSummary(
  apiKey: string,
  siteUrl: string
): Promise<
  | {
      clicks7: number
      impressions7: number
      clicksPrev7: number
      impressionsPrev7: number
      topQueries: { query: string; clicks: number; impressions: number }[]
      crawlErrors: number | null
      blockedByRobots: number | null
    }
  | { error: string }
> {
  try {
    const site = await resolveSiteUrl(apiKey, siteUrl)
    if (typeof site !== "string") return site

    const q = { siteUrl: site }
    const [traffic, queries, crawl] = await Promise.all([
      call<RankTraffic[] | null>(apiKey, "GetRankAndTrafficStats", { query: q }),
      call<QueryStat[] | null>(apiKey, "GetQueryStats", { query: q }),
      call<CrawlStat[] | null>(apiKey, "GetCrawlStats", { query: q }),
    ])
    // Traffic is the core of the summary; the other two degrade to empty/null.
    if (!traffic.ok) return { error: traffic.error }

    let clicks7 = 0, impressions7 = 0, clicksPrev7 = 0, impressionsPrev7 = 0
    const days = (traffic.data || [])
      .map((r) => ({ t: parseBingDate(r.Date), c: num(r.Clicks), i: num(r.Impressions) }))
      .filter((r): r is { t: number; c: number; i: number } => r.t !== null)
    if (days.length) {
      const latest = Math.max(...days.map((d) => d.t))
      for (const d of days) {
        const age = Math.floor((latest - d.t) / DAY)
        if (age >= 0 && age < 7) { clicks7 += d.c; impressions7 += d.i }
        else if (age >= 7 && age < 14) { clicksPrev7 += d.c; impressionsPrev7 += d.i }
      }
    }

    let topQueries: { query: string; clicks: number; impressions: number }[] = []
    if (queries.ok && queries.data?.length) {
      const rows = queries.data.map((r) => ({ ...r, t: parseBingDate(r.Date) }))
      const latest = Math.max(...rows.map((r) => r.t ?? 0))
      const byQuery = new Map<string, { clicks: number; impressions: number }>()
      for (const r of rows) {
        if (!r.Query) continue
        // Latest weekly bucket only (within a day of it, to absorb TZ offsets).
        if (latest && r.t !== null && latest - r.t > DAY) continue
        const cur = byQuery.get(r.Query) || { clicks: 0, impressions: 0 }
        cur.clicks += num(r.Clicks)
        cur.impressions += num(r.Impressions)
        byQuery.set(r.Query, cur)
      }
      topQueries = [...byQuery.entries()]
        .map(([query, v]) => ({ query, ...v }))
        .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
        .slice(0, 10)
    }

    let crawlErrors: number | null = null
    let blockedByRobots: number | null = null
    if (crawl.ok && crawl.data?.length) {
      const newest = [...crawl.data].sort((a, b) => (parseBingDate(b.Date) ?? 0) - (parseBingDate(a.Date) ?? 0))[0]
      crawlErrors = num(newest.CrawlErrors)
      blockedByRobots = num(newest.BlockedByRobotsTxt)
    }

    return { clicks7, impressions7, clicksPrev7, impressionsPrev7, topQueries, crawlErrors, blockedByRobots }
  } catch {
    return { error: "Couldn’t read your Bing Webmaster Tools data" }
  }
}

/**
 * SubmitUrlBatch — asks Bing to (re)crawl these URLs. Max 500 per batch and
 * limited by the site's daily quota (GetUrlSubmissionQuota); we check the quota
 * first so the owner gets a clear message instead of a generic failure.
 */
export async function bingSubmitUrls(
  apiKey: string,
  siteUrl: string,
  urls: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const list = [...new Set(urls.map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u)))]
    if (!list.length) return { ok: false, error: "No valid page URLs to submit" }

    const site = await resolveSiteUrl(apiKey, siteUrl)
    if (typeof site !== "string") return { ok: false, error: site.error }

    const quota = await call<{ DailyQuota?: number; MonthlyQuota?: number } | null>(apiKey, "GetUrlSubmissionQuota", {
      query: { siteUrl: site },
    })
    if (quota.ok && quota.data && typeof quota.data.DailyQuota === "number") {
      const daily = quota.data.DailyQuota
      if (daily <= 0) return { ok: false, error: "You’ve used today’s Bing URL submission quota — try again tomorrow" }
      if (list.length > daily) {
        return { ok: false, error: `Bing only allows ${daily} more URL submission${daily === 1 ? "" : "s"} today — you tried ${list.length}` }
      }
    }

    const batch = list.slice(0, 500)
    const r = await call<null>(apiKey, "SubmitUrlBatch", { body: { siteUrl: site, urlList: batch } })
    if (!r.ok) return { ok: false, error: r.error }
    return { ok: true }
  } catch {
    return { ok: false, error: "Couldn’t submit those URLs to Bing" }
  }
}

// ---------------------------------------------------------------------------
// Secret storage for user-supplied connector keys. AES-256-GCM; output is
// base64(iv) "." base64(tag) "." base64(ciphertext).

function secretKey(): Buffer {
  const material = process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY
  if (!material) throw new Error("CONNECTOR_SECRET (or CLERK_SECRET_KEY) must be set to store connector keys")
  return createHash("sha256").update(material).digest()
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv)
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, data].map((b) => b.toString("base64")).join(".")
}

export function decryptSecret(enc: string): string {
  const parts = (enc || "").split(".")
  if (parts.length !== 3) throw new Error("Malformed encrypted secret")
  const [iv, tag, data] = parts.map((p) => Buffer.from(p, "base64"))
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
}
