// Google SERP via Apify's official actor (apify/google-search-scraper).
// Gated on APIFY_TOKEN — if it's not configured, callers get an empty list and
// degrade gracefully (no errors). $2.50 / 1,000 result pages.

export interface SerpResult {
  title: string
  url: string
  description?: string
}

const ACTOR = "apify~google-search-scraper"

export function isSearchConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN)
}

export async function googleSearch(
  query: string,
  opts?: { results?: number; country?: string; timeoutMs?: number },
): Promise<SerpResult[]> {
  const token = process.env.APIFY_TOKEN
  if (!token) return []
  // One results page on the brand's search quota (lib/quotas.ts search); public scans (no brand) pass.
  const { quotaHere } = await import("@/lib/quotas")
  const q = await quotaHere("search")
  if (!q.allowed) { console.warn("[apify-search] search quota", q.userId, q.period); return [] }
  if (q.userId) void quotaHere("apify_usd", 0.005) // ~$0.005 a page, for the cost view

  // run-sync-get-dataset-items runs the actor and returns its dataset directly.
  const endpoint = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`
  const body = {
    queries: query,
    maxPagesPerQuery: 1,
    resultsPerPage: opts?.results ?? 10,
    countryCode: opts?.country ?? "",
    languageCode: "en",
    mobileResults: false,
    saveHtml: false,
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      // SERP scrapes can take ~30–60s; cap so we never hang a request.
      // Callers on a tight budget (the synchronous public scan) pass a lower cap.
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 120_000),
    })
    if (!res.ok) return []

    const items = (await res.json()) as Array<{
      organicResults?: Array<{ title?: string; url?: string; description?: string }>
    }>

    const out: SerpResult[] = []
    for (const item of Array.isArray(items) ? items : []) {
      for (const r of item.organicResults ?? []) {
        if (r.url && r.title) {
          out.push({ title: r.title, url: r.url, description: r.description })
        }
      }
    }
    return out
  } catch {
    return []
  }
}

/**
 * One SERP page with everything the actor returns (organic results + Google's AI Overview when
 * one was shown), on the same quota as googleSearch(). Null = not run (no token, quota) or failed,
 * so callers can tell "no AI Overview" from "couldn't check".
 */
export async function googleSerpItem(
  query: string,
  opts?: { country?: string; timeoutMs?: number },
): Promise<Record<string, unknown> | null> {
  const token = process.env.APIFY_TOKEN
  if (!token) return null
  const { quotaHere } = await import("@/lib/quotas")
  const q = await quotaHere("search")
  if (!q.allowed) { console.warn("[apify-search] search quota", q.userId, q.period); return null }
  if (q.userId) void quotaHere("apify_usd", 0.005)
  try {
    const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ queries: query, maxPagesPerQuery: 1, resultsPerPage: 10, countryCode: opts?.country ?? "", languageCode: "en", mobileResults: false, saveHtml: false }),
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 120_000),
    })
    if (!res.ok) return null
    const items = (await res.json()) as unknown
    const first = Array.isArray(items) ? items[0] : null
    return first && typeof first === "object" ? (first as Record<string, unknown>) : null
  } catch {
    return null
  }
}
