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
