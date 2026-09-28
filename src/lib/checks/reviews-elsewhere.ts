// Reads the star rating and review count a business has on outside review
// sites (Yelp, Tripadvisor, BBB, Healthgrades…) — the sources AI assistants
// quote when they recommend someone. Schema.org AggregateRating first, then
// microdata, then the "4.5 stars · 120 reviews" text in page meta. Sites that
// block automated visits come back readable:false. Nothing here throws.

import { apifyEnabled, facebookPage } from "./apify"
import { fetchPage, jsonLdNodes, mapLimit } from "./fetch-page"

export type OutsideReview = { site: string; url: string; rating: number | null; count: number | null; readable: boolean }

const REVIEW_SITES: [RegExp, string][] = [
  [/(^|\.)yelp\.[a-z.]+$/i, "Yelp"],
  [/(^|\.)facebook\.com$/i, "Facebook"],
  [/(^|\.)tripadvisor\.[a-z.]+$/i, "Tripadvisor"],
  [/(^|\.)bbb\.org$/i, "BBB"],
  [/(^|\.)angi\.com$|(^|\.)angieslist\.com$/i, "Angi"],
  [/(^|\.)houzz\.[a-z.]+$/i, "Houzz"],
  [/(^|\.)healthgrades\.com$/i, "Healthgrades"],
  [/(^|\.)zocdoc\.com$/i, "Zocdoc"],
  [/(^|\.)avvo\.com$/i, "Avvo"],
  [/(^|\.)trustpilot\.com$/i, "Trustpilot"],
  [/(^|\.)opentable\.[a-z.]+$/i, "OpenTable"],
  [/(^|\.)thumbtack\.com$/i, "Thumbtack"],
  [/(^|\.)nextdoor\.com$/i, "Nextdoor"],
]

function siteOf(raw: string): string | null {
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase()
    return REVIEW_SITES.find(([re]) => re.test(host))?.[1] ?? null
  } catch {
    return null
  }
}

/** Keep only URLs on known review sites, de-duplicated. */
export function reviewSites(urls: string[]): string[] {
  const seen = new Set<string>()
  return urls.filter((u) => {
    if (!siteOf(u)) return false
    const k = u.trim().replace(/\/+$/, "").toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""))
    return Number.isFinite(n) ? n : null
  }
  return null
}

const validRating = (r: number | null, best: number | null) => {
  if (r == null) return null
  const scale = best && best > 0 ? best : 5
  const five = scale === 5 ? r : (r / scale) * 5
  return five > 0 && five <= 5 ? Math.round(five * 10) / 10 : null
}

function fromJsonLd(nodes: Record<string, unknown>[]): { rating: number | null; count: number | null } | null {
  // jsonLdNodes already walks @graph, itemReviewed and every nested object.
  for (const o of nodes) {
    const t = o["@type"]
    const types = typeof t === "string" ? [t] : Array.isArray(t) ? t : []
    const agg = (types.includes("AggregateRating") ? o : o.aggregateRating) as Record<string, unknown> | undefined
    if (!agg || typeof agg !== "object") continue
    const rating = validRating(num(agg.ratingValue), num(agg.bestRating))
    const count = num(agg.reviewCount) ?? num(agg.ratingCount)
    if (rating != null || count != null) return { rating, count: count != null ? Math.round(count) : null }
  }
  return null
}

function fromText(text: string): { rating: number | null; count: number | null } | null {
  const r = text.match(/\b([1-5](?:\.\d)?)\s*(?:out of 5|\/\s*5)?\s*(?:stars?|★|star rating)/i) || text.match(/rated\s+([1-5](?:\.\d)?)/i)
  const c = text.match(/\b(\d{1,3}(?:,\d{3})*|\d+)\s+(?:reviews?|ratings?)\b/i)
  const rating = r ? validRating(num(r[1]), 5) : null
  const count = c ? num(c[1]) : null
  return rating != null || count != null ? { rating, count } : null
}

async function readOne(url: string): Promise<OutsideReview> {
  const site = siteOf(url) ?? "Review site"
  const full = /^https?:\/\//i.test(url) ? url : `https://${url}`
  const blank: OutsideReview = { site, url: full, rating: null, count: null, readable: false }
  try {
    // Facebook needs a real scraper; it reports "% recommend", converted to stars.
    if (/facebook\.com/i.test(full) && apifyEnabled()) {
      const d = await facebookPage(full)
      if (d) return { site, url: full, rating: d.rating, count: d.ratingCount, readable: true }
    }
    const page = await fetchPage(full)
    if (!page.readable) return blank
    const { load } = await import("cheerio")
    const found =
      fromJsonLd(jsonLdNodes(page.html, load)) ??
      (() => {
        const $ = load(page.html)
        const val = (prop: string) => {
          const el = $(`[itemprop="${prop}"]`).first()
          return el.length ? num(el.attr("content") ?? el.text()) : null
        }
        const rating = validRating(val("ratingValue"), val("bestRating"))
        const count = val("reviewCount") ?? val("ratingCount")
        if (rating != null || count != null) return { rating, count: count != null ? Math.round(count) : null }
        const metaText = [
          $('meta[property="og:description"]').attr("content"),
          $('meta[name="description" i]').attr("content"),
          $('meta[property="og:title"]').attr("content"),
          $("title").first().text(),
        ]
          .filter(Boolean)
          .join(" · ")
        return fromText(metaText)
      })()
    return { site, url: full, rating: found?.rating ?? null, count: found?.count ?? null, readable: true }
  } catch {
    return blank
  }
}

// businessName is accepted for future page-identity checks; the URLs come from
// the business's own site or the owner, so we trust they're the right listing.
export async function outsideReviews(urls: string[], businessName: string): Promise<OutsideReview[]> {
  void businessName
  try {
    return await mapLimit(reviewSites(urls), 3, readOne)
  } catch {
    return []
  }
}
