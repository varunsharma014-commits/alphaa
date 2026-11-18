// "What's working in your niche": real posts and long-running ads from this business's
// vertical and area, so the owner can see what earns attention and make their own version.
//
//   1. Terms: 3-6 hashtags / keywords from the business type + city (Haiku, structured), plus
//      the known rivals (scan dossier + Competitor rows) and their homepage social links.
//   2. Sources (each optional, each capped hard because Apify bills PER RESULT):
//      - Instagram hashtag posts   apify/instagram-hashtag-scraper   ≤ 24 results
//      - TikTok hashtag + keyword  clockworks/tiktok-scraper          ≤ 20 results
//      - Rivals' Instagram posts   apify/instagram-post-scraper       ≤ 12 results
//      - Rivals' Facebook posts    apify/facebook-posts-scraper       ≤ 12 results
//      - Meta Ad Library (graph.facebook.com/v21.0/ads_archive), only with META_AD_LIBRARY_TOKEN:
//        active ads that started more than 30 days ago (an ad that keeps running is paying off).
//   3. Rank by engagement (relative to the author's followers when the source gives it), keep 5-8.
//      Sonnet writes a one-sentence paraphrase, "why it works" and "your version" from the real
//      fields only. Captions are never stored; any text sharing 8+ words with a caption is dropped.
// Saved weekly per brand as MockActivity "niche_posts". Field names verified on the actor pages
// (apify.com/<actor>) and the Graph API ArchivedAd reference on 2026-11-18.
import { createHash } from "crypto"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { apifyEnabled } from "@/lib/checks/apify"
import { buildAccountDossier, socialLinks } from "@/lib/personal/research"
import { safeFetch } from "@/lib/safe-fetch"
import { runAsUser } from "@/lib/usage"
import { numbers } from "@/lib/insights"

export const NICHE = "niche_posts"
const DAY = 86_400_000
const FRESH_MS = 7 * DAY
const RUN_STALE_MS = 20 * 60_000
const HAIKU = "claude-haiku-4-5"
const SONNET = "claude-sonnet-5-5"

export type NichePlatform = "instagram" | "tiktok" | "facebook" | "meta_ad"
export type NicheSource = "hashtag" | "keyword" | "rival" | "ad"
export type NicheMetrics = { likes?: number; comments?: number; shares?: number; views?: number; followers?: number; daysRunning?: number }
export type NicheItem = {
  id: string
  url: string
  platform: NichePlatform
  source: NicheSource
  handle: string | null
  /** The hashtag / keyword / rival name that found it. */
  via: string | null
  metrics: NicheMetrics
  postedAt: string | null
  /** One sentence, our words: what the post is. Never the caption. */
  about: string
  why: string
  angle: string
}
export type NichePosts = {
  v: 1
  status: "running" | "ready" | "failed"
  at: string
  terms: string[]
  sources: string[]
  items: NicheItem[]
}

export const nicheEnabled = () => apifyEnabled()
export const adLibraryEnabled = () => !!process.env.META_AD_LIBRARY_TOKEN

export const PLATFORM_LABEL: Record<NichePlatform, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", meta_ad: "Facebook & Instagram ad" }

const n = (x: number) => Math.round(x).toLocaleString("en-US")
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined)
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 10)
const dateOnly = (v: unknown): string | null => {
  if (typeof v === "number" && v > 1e9) return new Date(v < 1e12 ? v * 1000 : v).toISOString().slice(0, 10)
  const s = str(v)
  if (!s) return null
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null
}
const humanDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

/** The metrics as one plain line (also the only numbers the writer may use). */
export function metricLine(i: Pick<NicheItem, "metrics" | "postedAt" | "platform">): string {
  const m = i.metrics
  const parts: string[] = []
  if (m.daysRunning != null) parts.push(`running for ${n(m.daysRunning)} days`)
  if (m.views != null && m.views > 0) parts.push(`${n(m.views)} views`)
  if (m.likes != null) parts.push(`${n(m.likes)} likes`)
  if (m.comments != null) parts.push(`${n(m.comments)} comments`)
  if (m.shares != null && m.shares > 0) parts.push(`${n(m.shares)} shares`)
  if (m.followers != null && m.followers > 0) parts.push(`${n(m.followers)} followers`)
  if (i.postedAt && i.platform !== "meta_ad") parts.push(`posted ${humanDay(i.postedAt)}`)
  if (i.postedAt && i.platform === "meta_ad") parts.push(`since ${humanDay(i.postedAt)}`)
  return parts.join(" · ")
}

// ── Apify (pay per result: every call passes maxItems and a spend cap) ───────

async function actor(id: string, input: object, maxItems: number): Promise<Record<string, unknown>[]> {
  const token = process.env.APIFY_TOKEN
  if (!token || maxItems <= 0) return []
  try {
    const qs = new URLSearchParams({ token, timeout: "150", maxItems: String(maxItems), maxTotalChargeUsd: "0.25" })
    const r = await fetch(`https://api.apify.com/v2/acts/${id}/run-sync-get-dataset-items?${qs}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(170_000),
    })
    if (!r.ok) {
      console.error(`[niche] ${id} ${r.status}`)
      return []
    }
    const items = await r.json()
    return Array.isArray(items) ? items.filter(isRecord).slice(0, maxItems) : []
  } catch (err) {
    console.error(`[niche] ${id}`, err instanceof Error ? err.message : err)
    return []
  }
}

type Raw = Omit<NicheItem, "id" | "about" | "why" | "angle"> & { caption: string }

// apify/instagram-hashtag-scraper: { hashtags, resultsType: "posts", resultsLimit }
//   → { url, caption, likesCount, commentsCount, videoViewCount, videoPlayCount, timestamp, ownerUsername }
// apify/instagram-post-scraper: { username: [..], resultsLimit, skipPinnedPosts, onlyPostsNewerThan } → same item shape
function fromInstagram(p: Record<string, unknown>, source: NicheSource, via: string): Raw | null {
  const url = str(p.url)
  if (!url) return null
  const likes = num(p.likesCount)
  return {
    url, platform: "instagram", source, via,
    handle: str(p.ownerUsername),
    metrics: { likes, comments: num(p.commentsCount), views: num(p.videoPlayCount) ?? num(p.videoViewCount) },
    postedAt: dateOnly(p.timestamp),
    caption: str(p.caption) ?? "",
  }
}

// clockworks/tiktok-scraper: { hashtags, searchQueries, resultsPerPage, shouldDownload*: false }
//   → { webVideoUrl, text, diggCount, commentCount, shareCount, playCount, createTimeISO, authorMeta: { name, fans }, isAd }
function fromTikTok(p: Record<string, unknown>, source: NicheSource, via: string): Raw | null {
  const url = str(p.webVideoUrl)
  if (!url || p.isAd === true) return null
  const author = isRecord(p.authorMeta) ? p.authorMeta : {}
  return {
    url, platform: "tiktok", source, via,
    handle: str(author.name) ?? str(p["authorMeta.name"]),
    metrics: { likes: num(p.diggCount), comments: num(p.commentCount), shares: num(p.shareCount), views: num(p.playCount), followers: num(author.fans) ?? num(p["authorMeta.fans"]) },
    postedAt: dateOnly(p.createTimeISO) ?? dateOnly(p.createTime),
    caption: str(p.text) ?? "",
  }
}

// apify/facebook-posts-scraper: { startUrls: [{ url }], resultsLimit, onlyPostsNewerThan }
//   → { url, text, time, likes, comments, shares, viewsCount, pageName, user: { name } }
function fromFacebook(p: Record<string, unknown>, via: string): Raw | null {
  const url = str(p.url)
  if (!url) return null
  const user = isRecord(p.user) ? p.user : {}
  return {
    url, platform: "facebook", source: "rival", via,
    handle: str(p.pageName) ?? str(user.name),
    metrics: { likes: num(p.likes), comments: num(p.comments), shares: num(p.shares), views: num(p.viewsCount) },
    postedAt: dateOnly(p.time) ?? dateOnly(p.timestamp),
    caption: str(p.text) ?? "",
  }
}

// ── Meta Ad Library ──────────────────────────────────────────────────────────
// Outside the EU/UK, Meta only returns ads about social issues, elections or politics, so for
// most US/Canadian businesses this finds little. It's free, so it runs whenever the token is set.

const CA = /^(ab|bc|mb|nb|nl|ns|nt|nu|on|pe|qc|sk|yt|alberta|british columbia|manitoba|new brunswick|newfoundland|nova scotia|ontario|prince edward island|quebec|québec|saskatchewan|yukon)$/i

async function metaAds(terms: string[], country: string): Promise<Raw[]> {
  const token = process.env.META_AD_LIBRARY_TOKEN
  if (!token) return []
  const out: Raw[] = []
  for (const term of terms.slice(0, 3)) {
    const qs = new URLSearchParams({
      access_token: token,
      search_terms: term.slice(0, 100),
      ad_reached_countries: JSON.stringify([country]),
      ad_active_status: "ACTIVE",
      ad_type: "ALL",
      fields: "id,page_name,ad_creative_bodies,ad_creative_link_titles,ad_delivery_start_time,publisher_platforms",
      limit: "15",
    })
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${qs}`, { signal: AbortSignal.timeout(20_000) })
      if (!r.ok) {
        console.error(`[niche] ads_archive ${r.status}`) // never log the URL: it carries the token
        continue
      }
      const j = (await r.json()) as { data?: Record<string, unknown>[] }
      for (const a of j.data ?? []) {
        const id = str(a.id)
        const start = dateOnly(a.ad_delivery_start_time)
        if (!id || !start) continue
        const days = Math.floor((Date.now() - Date.parse(`${start}T00:00:00Z`)) / DAY)
        if (days < 30) continue // only ads that have kept running a month or more
        const body = Array.isArray(a.ad_creative_bodies) ? a.ad_creative_bodies.filter((x): x is string => typeof x === "string").join(" ") : ""
        const title = Array.isArray(a.ad_creative_link_titles) ? a.ad_creative_link_titles.filter((x): x is string => typeof x === "string").join(" ") : ""
        // The public Ad Library page, never ad_snapshot_url (that one carries our token).
        out.push({ url: `https://www.facebook.com/ads/library/?id=${encodeURIComponent(id)}`, platform: "meta_ad", source: "ad", via: term, handle: str(a.page_name), metrics: { daysRunning: days }, postedAt: start, caption: `${title} ${body}`.trim() })
      }
    } catch (err) {
      console.error("[niche] ads_archive", err instanceof Error ? err.message : err)
    }
  }
  return out
}

// ── Terms ────────────────────────────────────────────────────────────────────

const TermSchema = z.object({
  hashtags: z.array(z.string()).describe("3 to 4 Instagram/TikTok hashtags without #, lowercase, no spaces, that people in this niche and area actually use"),
  keywords: z.array(z.string()).describe("1 or 2 short search phrases (2-4 words) customers of this business would search on TikTok"),
})

type Biz = { businessName: string | null; businessType: string | null; city: string | null; state: string | null }

async function pickTerms(u: Biz): Promise<{ hashtags: string[]; keywords: string[] }> {
  const type = u.businessType?.trim()
  const city = u.city?.trim()
  const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "")
  const fallback = {
    hashtags: [type && city ? slug(`${city}${type}`) : null, type ? slug(type) : null].filter((x): x is string => !!x && x.length >= 3 && x.length <= 40),
    keywords: type ? [`${type}${city ? ` ${city}` : ""}`.toLowerCase()] : [],
  }
  if (!type) return fallback
  try {
    const msg = await anthropic.messages.parse({
      model: HAIKU,
      max_tokens: 400,
      output_config: { format: zodOutputFormat(TermSchema) },
      messages: [{ role: "user", content: `A ${type}${city ? ` in ${city}${u.state ? `, ${u.state}` : ""}` : ""} wants to see the social posts doing well in its niche.
Give hashtags and search phrases that real posts in this niche use. Mix one or two local ones (city + service) with broader niche ones. Don't use the business's own name${u.businessName ? ` (${u.businessName})` : ""}. No generic tags like fyp, love, instagood.` }],
    })
    const out = msg.parsed_output
    const hashtags = Array.from(new Set((out?.hashtags ?? []).map((h) => slug(h.replace(/^#/, ""))).filter((h) => h.length >= 3 && h.length <= 40 && !/^(fyp|foryou|love|instagood|viral)$/.test(h)))).slice(0, 4)
    const keywords = Array.from(new Set((out?.keywords ?? []).map((k) => k.trim().toLowerCase()).filter((k) => k.length >= 3 && k.length <= 60))).slice(0, 2)
    return { hashtags: hashtags.length ? hashtags : fallback.hashtags, keywords: keywords.length ? keywords : fallback.keywords }
  } catch (err) {
    console.error("[niche] terms", err instanceof Error ? err.message : err)
    return fallback
  }
}

/** Rivals with a website, and the Instagram / Facebook pages their homepage links to. */
async function rivalSocials(userId: string): Promise<{ name: string; instagram?: string; facebook?: string }[]> {
  const dossier = await buildAccountDossier(userId, { offline: true }).catch(() => null)
  const comps = await db.competitor.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { url: true, name: true } })
  const seen = new Set<string>()
  const list: { name: string; domain: string }[] = []
  const add = (name: string, raw: string | null) => {
    const domain = raw?.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase()
    if (!domain || seen.has(domain)) return
    seen.add(domain)
    list.push({ name, domain })
  }
  for (const r of dossier?.rivals ?? []) add(r.name, r.domain)
  for (const c of comps) add(c.name ?? c.url, c.url)
  const out: { name: string; instagram?: string; facebook?: string }[] = []
  for (const r of list.slice(0, 3)) {
    try {
      const res = await safeFetch(`https://${r.domain}/`, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" }, signal: AbortSignal.timeout(8000) })
      const html = res.ok ? (await res.text()).slice(0, 800_000) : ""
      const links = socialLinks(html)
      if (links.instagram || links.facebook) out.push({ name: r.name, instagram: links.instagram, facebook: links.facebook })
    } catch {
      // unreadable homepage: skip this rival
    }
    if (out.length >= 2) break
  }
  return out
}

// ── Ranking ──────────────────────────────────────────────────────────────────

function engagement(m: NicheMetrics): number {
  return (m.likes ?? 0) + 2 * (m.comments ?? 0) + 3 * (m.shares ?? 0) + (m.views ?? 0) / 50
}

/** Best first within each source group, then taken in turn so one platform doesn't fill the list. */
function rank(raw: Raw[], ownHandles: Set<string>): Raw[] {
  const cutoff = Date.now() - 120 * DAY
  const seen = new Set<string>()
  const ok = raw.filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    if (r.handle && ownHandles.has(r.handle.toLowerCase().replace(/^@/, ""))) return false
    if (r.platform === "meta_ad") return true
    if (r.postedAt && Date.parse(r.postedAt) < cutoff) return false
    return engagement(r.metrics) >= 10
  })
  const score = (r: Raw) => (r.platform === "meta_ad" ? r.metrics.daysRunning ?? 0 : r.metrics.followers ? engagement(r.metrics) / Math.max(r.metrics.followers, 200) : engagement(r.metrics) / 1000)
  const groups = new Map<string, Raw[]>()
  for (const r of ok) {
    const k = r.platform === "meta_ad" ? "ad" : r.source === "rival" ? `rival:${r.platform}` : r.platform
    groups.set(k, [...(groups.get(k) ?? []), r])
  }
  for (const g of groups.values()) g.sort((a, b) => score(b) - score(a))
  const order = ["ad", "rival:instagram", "rival:facebook", "instagram", "tiktok"].filter((k) => groups.has(k))
  const out: Raw[] = []
  for (let i = 0; out.length < 8 && order.some((k) => (groups.get(k)?.length ?? 0) > i); i++) {
    for (const k of order) {
      const r = groups.get(k)?.[i]
      if (r && out.length < 8) out.push(r)
    }
  }
  return out
}

// ── Writing: paraphrase, why it works, your version ──────────────────────────

const WriteSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    about: z.string().describe("One sentence in your own words: what the post or ad is (format and subject). Never quote it."),
    why: z.string().describe("One sentence: why it gets attention, from the format, hook, subject and the real metrics"),
    angle: z.string().describe("One sentence to the owner: the post they could make in the same spirit, about their own business"),
  })),
})

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
function copies(text: string, caption: string, k = 8): boolean {
  const c = words(caption)
  if (c.length < k) return false
  const grams = new Set<string>()
  for (let i = 0; i + k <= c.length; i++) grams.add(c.slice(i, i + k).join(" "))
  const t = words(text)
  for (let i = 0; i + k <= t.length; i++) if (grams.has(t.slice(i, i + k).join(" "))) return true
  return false
}

async function describe(items: (Raw & { id: string })[], u: Biz): Promise<NicheItem[]> {
  const fallback = (r: Raw & { id: string }): NicheItem => ({
    ...strip(r),
    about: r.platform === "meta_ad" ? `An ad from ${r.handle ?? "a business in your niche"} that is still running.` : `A ${PLATFORM_LABEL[r.platform]} post from ${r.handle ? `@${r.handle.replace(/^@/, "")}` : "an account in your niche"}${r.via && r.source !== "rival" ? ` found under ${r.source === "hashtag" ? `#${r.via}` : `“${r.via}”`}` : ""}.`,
    why: "",
    angle: "",
  })
  if (!items.length) return []
  try {
    const msg = await anthropic.messages.parse({
      model: SONNET,
      max_tokens: 4000,
      output_config: { format: zodOutputFormat(WriteSchema) },
      messages: [{ role: "user", content: `You help a ${u.businessType ?? "small business"}${u.city ? ` in ${u.city}` : ""} learn from posts and ads doing well in its niche.
For each item: "about" says in your own words what it is (format and subject, at most 20 words, never quote the caption). "why" says why it gets attention. "angle" suggests the owner's own version, about their business, in the same spirit (not a copy).
Rules: use only the facts given. The only numbers you may use are the ones in each item's METRICS. Don't guess at results you can't see (sales, bookings). Never say "best", "#1", "leading" or "viral". Plain English, short.

${items.map((r) => `ID: ${r.id}
PLATFORM: ${PLATFORM_LABEL[r.platform]}${r.source === "rival" ? " (a competitor's own account)" : r.source === "ad" ? " (a paid ad)" : ` (found under ${r.source === "hashtag" ? `#${r.via}` : `“${r.via}”`})`}
AUTHOR: ${r.handle ?? "unknown"}
METRICS: ${metricLine(r) || "none"}
CAPTION (for your understanding only, do not quote): ${r.caption.replace(/\s+/g, " ").slice(0, 400) || "(none)"}`).join("\n\n")}` }],
    })
    const byId = new Map((msg.parsed_output?.items ?? []).map((x) => [x.id, x]))
    return items.map((r) => {
      const w = byId.get(r.id)
      if (!w) return fallback(r)
      const allowed = new Set(numbers(metricLine(r)))
      const clean = (s: string) => {
        const t = s.trim().replace(/\s+/g, " ").slice(0, 280)
        if (!t || copies(t, r.caption) || /\b(best|#1|leading|viral)\b/i.test(t) || numbers(t).some((x) => !allowed.has(x))) return ""
        return t
      }
      const fb = fallback(r)
      return { ...fb, about: clean(w.about) || fb.about, why: clean(w.why), angle: clean(w.angle) }
    })
  } catch (err) {
    console.error("[niche] describe", err instanceof Error ? err.message : err)
    return items.map(fallback)
  }
}

function strip(r: Raw & { id: string }): Omit<NicheItem, "about" | "why" | "angle"> {
  const { caption: _c, ...rest } = r
  void _c
  return rest
}

// ── Build, store, read ───────────────────────────────────────────────────────

async function build(userId: string): Promise<Omit<NichePosts, "v" | "status" | "at">> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true, state: true, websiteUrl: true } })
  if (!user) return { terms: [], sources: [], items: [] }
  const [terms, rivals] = await Promise.all([pickTerms(user), rivalSocials(userId).catch(() => [])])
  const sources = new Set<string>()
  const igUser = (u?: string) => u?.match(/instagram\.com\/([A-Za-z0-9_.]+)/i)?.[1]
  const rivalIg = rivals.map((r) => ({ name: r.name, user: igUser(r.instagram) })).filter((r): r is { name: string; user: string } => !!r.user)
  const rivalFb = rivals.filter((r) => r.facebook)
  const tags = terms.hashtags.slice(0, 2)
  const country = user.state && CA.test(user.state.trim()) ? "CA" : "US"

  const [ig, tt, rIg, rFb, ads] = await Promise.all([
    tags.length ? actor("apify~instagram-hashtag-scraper", { hashtags: tags, resultsType: "posts", resultsLimit: 12 }, 24) : Promise.resolve([]),
    tags.length || terms.keywords.length
      ? actor("clockworks~tiktok-scraper", { hashtags: tags.slice(0, 1), searchQueries: terms.keywords.slice(0, 1), resultsPerPage: 10, shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSlideshowImages: false, shouldDownloadAvatars: false, shouldDownloadMusicCovers: false }, 20)
      : Promise.resolve([]),
    rivalIg.length ? actor("apify~instagram-post-scraper", { username: rivalIg.map((r) => r.user), resultsLimit: 6, skipPinnedPosts: true, onlyPostsNewerThan: "2 months" }, 12) : Promise.resolve([]),
    rivalFb.length ? actor("apify~facebook-posts-scraper", { startUrls: rivalFb.map((r) => ({ url: r.facebook })), resultsLimit: 6, onlyPostsNewerThan: "2 months" }, 12) : Promise.resolve([]),
    metaAds([...rivals.map((r) => r.name), ...terms.keywords].filter(Boolean), country),
  ])
  const raw: Raw[] = []
  const tagOf = (p: Record<string, unknown>) => {
    const h = Array.isArray(p.hashtags) ? p.hashtags.map((x) => String(x).toLowerCase().replace(/^#/, "")) : []
    return tags.find((t) => h.includes(t)) ?? tags[0]
  }
  for (const p of ig) { const r = fromInstagram(p, "hashtag", tagOf(p)); if (r) raw.push(r) }
  for (const p of tt) {
    const h = Array.isArray(p.hashtags) ? p.hashtags.map((x) => (isRecord(x) ? String(x.name ?? "") : String(x)).toLowerCase()) : []
    const viaTag = tags.find((t) => h.includes(t))
    const r = fromTikTok(p, viaTag ? "hashtag" : "keyword", viaTag ?? terms.keywords[0] ?? tags[0])
    if (r) raw.push(r)
  }
  for (const p of rIg) {
    const owner = str(p.ownerUsername)?.toLowerCase()
    const r = fromInstagram(p, "rival", rivalIg.find((x) => x.user.toLowerCase() === owner)?.name ?? owner ?? "")
    if (r) raw.push(r)
  }
  for (const p of rFb) { const r = fromFacebook(p, rivalFb[0]?.name ?? ""); if (r) raw.push(r) }
  raw.push(...ads)
  if (ig.length) sources.add("Instagram")
  if (tt.length) sources.add("TikTok")
  if (rIg.length || rFb.length) sources.add("your competitors’ own pages")
  if (ads.length) sources.add("the Meta Ad Library")

  // The owner's own handles never count as "your niche".
  const s = await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true } })
  const own = new Set<string>()
  if (s?.websiteUrl) {
    try {
      const r = await safeFetch(`https://${s.websiteUrl.replace(/^https?:\/\//, "")}`, { signal: AbortSignal.timeout(8000) })
      const links = r.ok ? socialLinks((await r.text()).slice(0, 800_000)) : {}
      for (const u of Object.values(links)) { const h = u.match(/\.com\/@?([A-Za-z0-9_.\-]+)/)?.[1]; if (h) own.add(h.toLowerCase()) }
    } catch { /* fine */ }
  }
  const top = rank(raw, own).map((r) => ({ ...r, id: hash(r.url) }))
  const items = await describe(top, user)
  return { terms: [...terms.hashtags.map((h) => `#${h}`), ...terms.keywords], sources: [...sources], items }
}

export async function latestNichePosts(userId: string): Promise<(NichePosts & { rowId: string }) | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: NICHE }, orderBy: { createdAt: "desc" }, select: { id: true, metadata: true } })
  const m = row?.metadata as NichePosts | null
  if (!row || !m || m.v !== 1) return null
  // A run that never finished (deploy, crash) counts as failed.
  if (m.status === "running" && Date.now() - Date.parse(m.at) > RUN_STALE_MS) return { ...m, status: "failed", rowId: row.id }
  return { ...m, rowId: row.id }
}

/** The last finished result (a newer run may still be going). */
export async function lastReadyNichePosts(userId: string): Promise<NichePosts | null> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: NICHE }, orderBy: { createdAt: "desc" }, take: 3, select: { metadata: true } })
  return (rows.map((r) => r.metadata as NichePosts | null).find((m) => m?.v === 1 && m.status === "ready") ?? null)
}

export const nicheFresh = (p: Pick<NichePosts, "at" | "status"> | null) => !!p && p.status === "ready" && Date.now() - Date.parse(p.at) < FRESH_MS

const inFlight = new Set<string>()

/**
 * Refresh this brand's niche posts unless they're fresh (or a run is going).
 * `minAgeMs` lets the owner's "Refresh" re-run sooner than weekly, but never more than once a day.
 */
export async function refreshNichePosts(userId: string, opts: { minAgeMs?: number } = {}): Promise<NichePosts | null> {
  if (!nicheEnabled() || inFlight.has(userId)) return null
  const cur = await latestNichePosts(userId)
  if (cur?.status === "running") return null
  // A failed run (actor down, no results) isn't retried on every thread open.
  if (cur?.status === "failed" && Date.now() - Date.parse(cur.at) < 6 * 3_600_000) return null
  const minAge = Math.max(opts.minAgeMs ?? FRESH_MS, DAY)
  if (cur && cur.status === "ready" && Date.now() - Date.parse(cur.at) < minAge) return cur
  inFlight.add(userId)
  const start: NichePosts = { v: 1, status: "running", at: new Date().toISOString(), terms: [], sources: [], items: [] }
  const row = await db.mockActivity.create({ data: { userId, type: NICHE, title: "Looked at what’s working in your niche", metadata: start as object } })
  try {
    const out: NichePosts = { ...start, status: "ready", at: new Date().toISOString(), ...(await build(userId)) }
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: out as object } })
    return out
  } catch (err) {
    console.error("[niche] build failed", err instanceof Error ? err.message : err)
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...start, status: "failed" } as object } }).catch(() => null)
    return null
  } finally {
    inFlight.delete(userId)
  }
}

/** Fire-and-forget refresh (thread open, Refresh chip). Usage is counted for this brand. */
export function startNicheRefresh(userId: string, opts: { minAgeMs?: number } = {}): void {
  if (!nicheEnabled() || inFlight.has(userId)) return
  void runAsUser(userId, () => refreshNichePosts(userId, opts)).catch((err) => console.error("[niche] refresh", err))
}

export const nicheRunning = (userId: string) => inFlight.has(userId)

/**
 * Compact facts for the weekly plan (lib/agent/week.ts): one line per item, built only from the
 * stored metrics, so the plan's number check applies to them like any other fact.
 */
export async function nicheFacts(userId: string): Promise<{ key: string; text: string }[]> {
  const p = await lastReadyNichePosts(userId)
  if (!p || Date.now() - Date.parse(p.at) > 14 * DAY) return []
  return p.items.slice(0, 5).map((i) => ({
    key: `niche:${i.id}`,
    text: `${i.platform === "meta_ad" ? "An ad" : `A ${PLATFORM_LABEL[i.platform]} post`}${i.handle ? ` by ${i.handle}` : ""} in your niche (${metricLine(i)}): ${i.about}${i.why ? ` Why it works: ${i.why}` : ""}`,
  }))
}

/** What the thread shows. `kick` starts a background refresh when the last one is over a week old. */
export async function nicheView(userId: string, opts: { kick?: boolean } = {}): Promise<{ enabled: boolean; latest: NichePosts | null; ready: NichePosts | null; running: boolean }> {
  if (!nicheEnabled()) return { enabled: false, latest: null, ready: null, running: false }
  const latest = await latestNichePosts(userId)
  const ready = latest?.status === "ready" ? latest : await lastReadyNichePosts(userId)
  let running = inFlight.has(userId) || latest?.status === "running"
  const failedRecently = latest?.status === "failed" && Date.now() - Date.parse(latest.at) < 6 * 3_600_000
  if (opts.kick && !running && !failedRecently && !nicheFresh(ready)) {
    startNicheRefresh(userId)
    running = true
  }
  return { enabled: true, latest, ready, running }
}
