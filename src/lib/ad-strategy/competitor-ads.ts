// What the owner's competitors are running on Facebook and Instagram, from the public Meta Ad
// Library via Apify's official scraper (apify/facebook-ads-scraper, pay per ad: about half a cent).
// Meta's own Ad Library API only returns political ads outside the EU, so it can't do this.
// Capped at 3 competitors x 8 ads, so one plan costs under $0.15.
import { db } from "@/lib/db"
import { runActor, apifyEnabled } from "@/lib/checks/apify"

export type CompetitorAd = {
  page: string
  text: string
  title: string | null
  format: "video" | "image" | "carousel" | "other"
  since: string | null
  daysRunning: number | null
  url: string
}

type Raw = {
  pageName?: string
  adArchiveID?: string | number
  adArchiveId?: string | number
  startDate?: number
  startDateFormatted?: string
  snapshot?: {
    page_name?: string
    body?: { text?: string } | string
    title?: string
    display_format?: string
    displayFormat?: string
    videos?: unknown[]
    images?: unknown[]
    cards?: { body?: string; title?: string }[]
  }
}

const DAY = 86_400_000
const PER = 8
const MAX_COMPETITORS = 3

const host = (u: string) => { try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "") } catch { return u } }
const nameOf = (c: { name: string | null; url: string }) => (c.name?.trim() || host(c.url).split(".")[0]).slice(0, 80)

function libraryUrl(name: string, country: string): string {
  const q = new URLSearchParams({ active_status: "active", ad_type: "all", country, q: `"${name}"`, search_type: "keyword_exact_phrase", media_type: "all" })
  return `https://www.facebook.com/ads/library/?${q}`
}

function parse(r: Raw): CompetitorAd | null {
  const s = r.snapshot ?? {}
  const body = typeof s.body === "string" ? s.body : s.body?.text ?? ""
  const cardText = (s.cards ?? []).map((c) => [c.title, c.body].filter(Boolean).join(": ")).join(" / ")
  const text = (body || cardText).replace(/\s+/g, " ").trim()
  const id = String(r.adArchiveID ?? r.adArchiveId ?? "")
  if (!text || !id) return null
  const start = r.startDateFormatted ? Date.parse(r.startDateFormatted) : r.startDate ? r.startDate * 1000 : NaN
  const fmt = (s.display_format ?? s.displayFormat ?? "").toUpperCase()
  const format: CompetitorAd["format"] = fmt.includes("VIDEO") || (s.videos?.length ?? 0) > 0 ? "video" : fmt.includes("CAROUSEL") || fmt.includes("DCO") || (s.cards?.length ?? 0) > 1 ? "carousel" : fmt.includes("IMAGE") || (s.images?.length ?? 0) > 0 ? "image" : "other"
  return {
    page: (r.pageName ?? s.page_name ?? "").trim(),
    text: text.slice(0, 400),
    title: s.title?.trim().slice(0, 120) || null,
    format,
    since: Number.isFinite(start) ? new Date(start).toISOString().slice(0, 10) : null,
    daysRunning: Number.isFinite(start) ? Math.max(0, Math.floor((Date.now() - start) / DAY)) : null,
    url: `https://www.facebook.com/ads/library/?id=${encodeURIComponent(id)}`,
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

/** Active Meta ads for the owner's tracked competitors. Empty when Apify is off or nothing runs. */
export async function competitorAds(userId: string, country: string | null): Promise<{ looked: string[]; ads: CompetitorAd[] }> {
  const rows = await db.competitor.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: MAX_COMPETITORS, select: { name: true, url: true } })
  const looked = rows.map(nameOf).filter(Boolean)
  if (!apifyEnabled() || !looked.length) return { looked, ads: [] }
  const urls = looked.map((n) => ({ url: libraryUrl(n, country ?? "US") }))
  const raw = (await runActor<Raw>("apify~facebook-ads-scraper", { startUrls: urls, resultsLimit: PER }, 120)) ?? []
  const seen = new Set<string>()
  const ads: CompetitorAd[] = []
  for (const r of raw) {
    const a = parse(r)
    if (!a || seen.has(a.text)) continue
    // Keyword search also returns other advertisers that mention the name; keep the competitor's own.
    if (a.page && !looked.some((n) => norm(a.page).includes(norm(n)) || norm(n).includes(norm(a.page)))) continue
    seen.add(a.text)
    ads.push(a)
  }
  ads.sort((x, y) => (y.daysRunning ?? 0) - (x.daysRunning ?? 0))
  return { looked, ads: ads.slice(0, MAX_COMPETITORS * PER) }
}
