// DataForSEO, the pure part: response envelopes, result parsers and location picking.
// No env, no network, no database (scripts/test-dataforseo.ts runs these against recorded
// responses in scripts/fixtures/dataforseo/). The client is lib/dataforseo.ts.
//
// Field names checked against docs.dataforseo.com/v3 and real responses recorded 2026-11-28:
//   serp/google/organic (live/advanced, task_get/advanced): items[] of type organic, ai_overview,
//     local_pack, people_also_ask; organic {rank_group, rank_absolute, domain, title, url,
//     description}; ai_overview {asynchronous_ai_overview, markdown, items[] (ai_overview_element:
//     title, text, references[]), references[] (ai_overview_reference: source, domain, url, title)}
//   serp/youtube/organic: items[] youtube_video {title, url, video_id, channel_name, channel_url,
//     views_count, timestamp, duration_time_seconds, is_shorts, thumbnail_url}
//   serp/google/ads_search: items[] ads_search {advertiser_id, creative_id, title (advertiser),
//     url (Transparency Center page), verified, format text|image|video, preview_image {url},
//     first_shown, last_shown}
//   business_data/google/my_business_info: items[] google_business_info {title, url, domain,
//     phone, address, rating {value, votes_count}, place_id, cid, is_claimed}
//   business_data/trustpilot/reviews + tripadvisor/reviews (task_get): result {title, check_url,
//     reviews_count, rating {value, votes_count}}
//   serp/google/locations/{country}: result[] {location_code, location_name, location_type}

export const DFS_OK = 20000
/** Task created (task_post). */
export const DFS_CREATED = 20100
/** Still working (task_get): "Task Handed" / "Task In Queue". */
export const DFS_WAITING = new Set([40601, 40602])
/** Google returned nothing for the query: an empty result, not an error. */
export const DFS_NO_RESULTS = 40102

export type DfsTask<T = unknown> = { id?: string; status_code?: number; status_message?: string; cost?: number; result?: T[] | null; data?: Record<string, unknown> }
export type DfsEnvelope<T = unknown> = { status_code?: number; status_message?: string; cost?: number; tasks?: DfsTask<T>[] }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

/** The first task of an envelope: its status, cost and first result (null when none). */
export function firstTask<T = Record<string, unknown>>(env: unknown): { ok: boolean; status: number | null; message: string | null; cost: number; id: string | null; result: T | null } {
  const e = isObj(env) ? (env as DfsEnvelope<T>) : {}
  const t = arr(e.tasks)[0]
  const task = isObj(t) ? (t as DfsTask<T>) : null
  const status = num(task?.status_code) ?? null
  const result = task && Array.isArray(task.result) && isObj(task.result[0]) ? (task.result[0] as T) : null
  return {
    ok: e.status_code === DFS_OK && (status === DFS_OK || status === DFS_CREATED),
    status,
    message: str(task?.status_message) ?? str(e.status_message),
    cost: Math.max(0, num(task?.cost) ?? num(e.cost) ?? 0),
    id: str(task?.id),
    result,
  }
}

const items = (result: unknown): Record<string, unknown>[] => (isObj(result) ? arr(result.items).filter(isObj) : [])
/** A Google redirect (live SERP without resolve_goto_urls): no real address in it. */
export const isGoogleRedirect = (u: string) => /^https?:\/\/(www\.)?google\.[a-z.]+\/(goto|url)\?/i.test(u)
const realUrl = (v: unknown): string | null => { const u = str(v); return u && /^https?:\/\//i.test(u) && !isGoogleRedirect(u) ? u : null }

// ── Google organic results ──────────────────────────────────────────────────────────────────────

export type SerpResult = {
  title: string
  url: string
  description?: string
  /** false = Google only gave a redirect link, so `url` is the site's own address (from the result's breadcrumb), not the page. */
  exact?: false
}

/** "https://www.drgreat.ca › clinic › …" → "https://www.drgreat.ca". */
export function breadcrumbOrigin(b: unknown): string | null {
  const s = str(b)
  const m = s?.match(/^(https?:\/\/[a-z0-9.-]+\.[a-z]{2,})(?=\s|$|\/)/i)
  return m ? m[1].toLowerCase() : null
}

/**
 * Organic results in rank order. Live results link through google.com redirects (DataForSEO only
 * resolves them in about 70 seconds, measured 2026-11-28), so a redirect falls back to the site's
 * own address from the breadcrumb, marked exact: false. A result with neither is left out.
 */
export function parseOrganic(result: unknown, max = 100): SerpResult[] {
  const out: SerpResult[] = []
  for (const it of items(result)) {
    if (it.type !== "organic") continue
    const title = str(it.title)
    if (!title) continue
    const real = realUrl(it.url)
    const origin = real ? null : breadcrumbOrigin(it.breadcrumb)
    const url = real ?? origin
    if (!url) continue
    out.push({ title, url, ...(str(it.description) ? { description: str(it.description)! } : {}), ...(real ? {} : { exact: false as const }) })
    if (out.length >= max) break
  }
  return out
}

// ── Google AI Overview ──────────────────────────────────────────────────────────────────────────

export type AiOverview = { shown: boolean; content: string | null; sources: { url: string; title: string | null }[] }

const cleanOverviewText = (s: string) => s.replace(/\[\[\d+\]\]\([^)]*\)/g, "").replace(/\[Highlight (start|end)\]/g, " ").replace(/\*\*/g, "").replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim()

/** The AI Overview on one results page: whether Google showed one, its text and the pages it cites. */
export function parseAiOverview(result: unknown): AiOverview {
  const ao = items(result).find((i) => i.type === "ai_overview")
  if (!ao) return { shown: false, content: null, sources: [] }
  const parts = arr(ao.items).filter(isObj)
  const text = parts.map((p) => [str(p.title), str(p.text)].filter(Boolean).join(": ")).filter(Boolean).join("\n")
  const content = text ? cleanOverviewText(text) : str(ao.markdown) ? cleanOverviewText(str(ao.markdown)!) : null
  const seen = new Set<string>()
  const sources: { url: string; title: string | null }[] = []
  const add = (r: unknown) => {
    if (!isObj(r)) return
    const url = realUrl(r.url)
    if (!url || seen.has(url)) return
    seen.add(url)
    sources.push({ url, title: str(r.title) ?? str(r.source) })
  }
  for (const r of arr(ao.references)) add(r)
  for (const p of parts) for (const r of arr(p.references)) add(r)
  return { shown: !!(content || sources.length), content: content ? content.slice(0, 1500) : null, sources: sources.slice(0, 10) }
}

// ── YouTube ─────────────────────────────────────────────────────────────────────────────────────

export type YoutubeVideo = { url: string; videoId: string | null; title: string; channel: string | null; channelUrl: string | null; views: number | null; timestamp: string | null; seconds: number | null; shorts: boolean; thumb: string | null }

export function parseYoutube(result: unknown): YoutubeVideo[] {
  const out: YoutubeVideo[] = []
  for (const it of items(result)) {
    if (it.type !== "youtube_video") continue
    const url = realUrl(it.url)
    const title = str(it.title)
    if (!url || !title) continue
    // Drop YouTube's tracking parameter; the watch URL is enough.
    const clean = str(it.video_id) ? `https://www.youtube.com/watch?v=${encodeURIComponent(str(it.video_id)!)}` : url
    out.push({
      url: clean, videoId: str(it.video_id), title, channel: str(it.channel_name), channelUrl: realUrl(it.channel_url),
      views: num(it.views_count), timestamp: str(it.timestamp), seconds: num(it.duration_time_seconds), shorts: it.is_shorts === true, thumb: realUrl(it.thumbnail_url),
    })
  }
  return out
}

// ── Google Ads Transparency Center ──────────────────────────────────────────────────────────────

export type TransparencyAd = { advertiserId: string; creativeId: string; advertiser: string | null; url: string; verified: boolean; format: "text" | "image" | "video" | "other"; preview: string | null; firstShown: string | null; lastShown: string | null }

const isoDay = (v: unknown): string | null => { const s = str(v); if (!s) return null; const t = Date.parse(s.replace(" +00:00", "Z").replace(" ", "T")); return Number.isFinite(t) ? new Date(t).toISOString() : null }

export function parseAdsSearch(result: unknown): TransparencyAd[] {
  const out: TransparencyAd[] = []
  for (const it of items(result)) {
    if (it.type !== "ads_search") continue
    const advertiserId = str(it.advertiser_id)
    const creativeId = str(it.creative_id)
    const url = realUrl(it.url)
    if (!advertiserId || !creativeId || !url || out.some((o) => o.creativeId === creativeId)) continue
    const f = str(it.format)
    out.push({
      advertiserId, creativeId, url, advertiser: str(it.title), verified: it.verified === true,
      format: f === "text" || f === "image" || f === "video" ? f : "other",
      preview: isObj(it.preview_image) ? realUrl(it.preview_image.url) : null,
      firstShown: isoDay(it.first_shown), lastShown: isoDay(it.last_shown),
    })
  }
  return out
}

// ── Business data: Google listing, Trustpilot, Tripadvisor ─────────────────────────────────────

export type Rating = { site: "Google" | "Trustpilot" | "Tripadvisor"; title: string | null; url: string | null; rating: number | null; count: number | null }

const stars = (r: unknown): number | null => {
  if (!isObj(r)) return null
  const v = num(r.value)
  const max = num(r.rating_max) ?? 5
  if (v == null || max <= 0) return null
  const five = max === 5 ? v : (v / max) * 5
  return five > 0 && five <= 5 ? Math.round(five * 10) / 10 : null
}

export type GoogleBusiness = Rating & { domain: string | null; phone: string | null; address: string | null; placeId: string | null; cid: string | null; claimed: boolean | null }

export function parseGoogleBusiness(result: unknown): GoogleBusiness | null {
  const it = items(result).find((i) => i.type === "google_business_info")
  if (!it) return null
  const r = isObj(it.rating) ? it.rating : {}
  const cid = str(it.cid)
  return {
    site: "Google", title: str(it.title),
    // The Maps page for the listing (check_url) is what a customer sees; the website is separate.
    url: isObj(result) && realUrl(result.check_url) ? realUrl(result.check_url) : cid ? `https://www.google.com/maps?cid=${encodeURIComponent(cid)}` : null,
    rating: stars(r), count: num(r.votes_count), domain: str(it.domain), phone: str(it.phone), address: str(it.address),
    placeId: str(it.place_id), cid, claimed: typeof it.is_claimed === "boolean" ? it.is_claimed : null,
  }
}

/** Trustpilot / Tripadvisor review pages: the business's overall rating and review count. */
export function parseReviewSite(result: unknown, site: "Trustpilot" | "Tripadvisor"): Rating | null {
  if (!isObj(result)) return null
  const r = isObj(result.rating) ? result.rating : {}
  const rating = stars(r)
  const count = num(result.reviews_count) ?? num(r.votes_count)
  if (rating == null && count == null) return null
  return { site, title: str(result.title), url: realUrl(result.check_url), rating, count }
}

// ── Locations ───────────────────────────────────────────────────────────────────────────────────

export type Country = "us" | "ca" | "gb" | "au"
export const COUNTRY_LOCATION: Record<Country, number> = { us: 2840, ca: 2124, gb: 2826, au: 2036 }
export const COUNTRY_NAME: Record<Country, string> = { us: "United States", ca: "Canada", gb: "United Kingdom", au: "Australia" }

const CA_REGIONS: Record<string, string> = { ON: "Ontario", QC: "Quebec", BC: "British Columbia", AB: "Alberta", MB: "Manitoba", SK: "Saskatchewan", NS: "Nova Scotia", NB: "New Brunswick", NL: "Newfoundland and Labrador", PE: "Prince Edward Island", YT: "Yukon", NT: "Northwest Territories", NU: "Nunavut" }
const AU_REGIONS: Record<string, string> = { NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland", WA: "Western Australia", SA: "South Australia", TAS: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory" }
const US_REGIONS: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
}
const REGIONS: Record<Country, Record<string, string>> = { us: US_REGIONS, ca: CA_REGIONS, au: AU_REGIONS, gb: { ENG: "England", SCT: "Scotland", WLS: "Wales", NIR: "Northern Ireland" } }

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
const hostOf = (u: string) => { try { return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "").toLowerCase() } catch { return "" } }

/** "Ottawa, ON" + state → { city: "Ottawa", region: "ON" }. */
export function splitCity(city: string | null | undefined, state?: string | null): { city: string | null; region: string | null } {
  const parts = (city ?? "").split(",").map((p) => p.trim()).filter(Boolean)
  const region = state?.trim() || parts[1] || null
  return { city: parts[0] || null, region: region ? region.replace(/\.$/, "") : null }
}

/** Full region name for a code ("ON" → "Ontario"), or the name itself when it's already one. */
export function regionName(region: string | null, cc: Country): string | null {
  if (!region) return null
  const t = region.trim()
  const byCode = REGIONS[cc][t.toUpperCase()]
  if (byCode) return byCode
  const hit = Object.values(REGIONS[cc]).find((n) => fold(n) === fold(t))
  return hit ?? null
}

/**
 * Which country's Google the business's customers use: province/state markers in the city or
 * state field, then the site's domain, else the US. (Same rules the free scan always used.)
 */
export function countryFor(p: { city?: string | null; state?: string | null; websiteUrl?: string | null }): Country {
  // An explicit province/state field decides first (WA is Washington here, not Western Australia).
  const st = p.state?.trim()
  if (st) {
    if (regionName(st, "ca")) return "ca"
    if (regionName(st, "us")) return "us"
    if (regionName(st, "au")) return "au"
    if (regionName(st, "gb")) return "gb"
  }
  const c = (p.city ?? "").toUpperCase()
  if (/,\s*(ON|QC|BC|AB|MB|SK|NS|NB|NL|PE|YT|NT|NU)\b/.test(c) || /\bCANADA\b/.test(c)) return "ca"
  if (/\b(UK|UNITED KINGDOM|ENGLAND|SCOTLAND|WALES)\b/.test(c)) return "gb"
  if (/,\s*(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/.test(c) || /\bAUSTRALIA\b/.test(c)) return "au"
  const host = p.websiteUrl ? hostOf(p.websiteUrl) : ""
  if (host.endsWith(".ca")) return "ca"
  if (host.endsWith(".co.uk") || host.endsWith(".uk")) return "gb"
  if (host.endsWith(".com.au") || host.endsWith(".au")) return "au"
  return "us"
}

export type DfsLocation = { location_code: number; location_name: string; location_type?: string | null }
export type PickedLocation = { code: number; name: string; level: "city" | "country" }

const TYPE_RANK: Record<string, number> = { City: 0, Municipality: 1, Neighborhood: 3, District: 3 }

/**
 * The DataForSEO location for a business: its city when the list has exactly that city (in the
 * right province/state when one is known), else its country. A city name that exists in several
 * states with no state to tell them apart falls back to the country: a guessed city would put the
 * results in the wrong place.
 */
export function pickLocation(list: DfsLocation[], p: { city?: string | null; state?: string | null; country: Country }): PickedLocation {
  const country: PickedLocation = { code: COUNTRY_LOCATION[p.country], name: COUNTRY_NAME[p.country], level: "country" }
  const { city, region } = splitCity(p.city, p.state)
  if (!city) return country
  const want = fold(city)
  const regionFull = regionName(region, p.country)
  const countryFold = fold(COUNTRY_NAME[p.country])
  const cands = list.filter((l) => {
    const segs = l.location_name.split(",").map(fold)
    return segs[0] === want && segs[segs.length - 1] === countryFold && (TYPE_RANK[l.location_type ?? ""] ?? 9) < 9
  })
  const inRegion = regionFull ? cands.filter((l) => l.location_name.split(",").map(fold).includes(fold(regionFull))) : cands
  if (!inRegion.length) return country
  // Several regions and none named: can't tell which city it is.
  const regionsSeen = new Set(inRegion.map((l) => { const s = l.location_name.split(","); return fold(s[s.length - 2] ?? "") }))
  if (!regionFull && regionsSeen.size > 1) return country
  const exact = regionFull ? `${want}|${fold(regionFull)}|${countryFold}` : null
  const best = [...inRegion].sort((a, b) => {
    const ea = exact && a.location_name.split(",").map(fold).join("|") === exact ? 0 : 1
    const eb = exact && b.location_name.split(",").map(fold).join("|") === exact ? 0 : 1
    return ea - eb || (TYPE_RANK[a.location_type ?? ""] ?? 9) - (TYPE_RANK[b.location_type ?? ""] ?? 9) || a.location_name.length - b.location_name.length
  })[0]
  return { code: best.location_code, name: best.location_name, level: "city" }
}

/** The locations list from GET /serp/google/locations/{country}. */
export function parseLocations(env: unknown): DfsLocation[] {
  const e = isObj(env) ? env : {}
  const t = arr(e.tasks)[0]
  const res = isObj(t) ? arr(t.result) : []
  return res.filter(isObj).flatMap((l) => (typeof l.location_code === "number" && typeof l.location_name === "string" ? [{ location_code: l.location_code, location_name: l.location_name, location_type: str(l.location_type) }] : []))
}

/** "en" for the four countries Alphaa serves; Quebec businesses still get English results. */
export const languageFor = (_cc: Country) => "en"
