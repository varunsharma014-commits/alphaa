// Shared PageSpeed Insights fetcher for the speed + website-health pages.
//
// The old inline fetches failed on every single render, for three stacked
// reasons, which is why the speed page never showed data in production:
//   1. AbortSignal.timeout(5000) — PSI routinely takes 10-25s to run
//      Lighthouse, so 5s guaranteed an abort.
//   2. user.websiteUrl is stored without a protocol ("growthturbine.com"),
//      which PSI rejects.
//   3. No API key — the keyless shared quota returns 429 more or less
//      permanently. Set PAGESPEED_API_KEY (Google Cloud → PageSpeed Insights
//      API) to get a real per-project quota.
//
// Successful responses are cached for 6h via the Next data cache, so only the
// first render after a quiet period pays the Lighthouse latency.

export type PageSpeedAudit = {
  title?: string
  displayValue?: string
  score?: number | null
}

export type PageSpeedResult = {
  lighthouseResult?: {
    categories?: { performance?: { score?: number | null } }
    audits?: Record<string, PageSpeedAudit>
  }
}

export async function fetchPageSpeed(websiteUrl: string): Promise<PageSpeedResult | null> {
  const trimmed = websiteUrl.trim()
  if (!trimmed) return null
  const target = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  const key = process.env.PAGESPEED_API_KEY
  const psUrl =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=mobile` +
    (key ? `&key=${key}` : "")

  try {
    const res = await fetch(psUrl, {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) {
      console.error(`[pagespeed] PSI returned ${res.status} for ${target}${key ? "" : " (no PAGESPEED_API_KEY set — keyless quota is effectively always 429)"}`)
      return null
    }
    return (await res.json()) as PageSpeedResult
  } catch (err) {
    console.error(`[pagespeed] PSI fetch failed for ${target}:`, err instanceof Error ? err.message : err)
    return null
  }
}
