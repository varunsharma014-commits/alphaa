// Fact dossier for one recipient (a scan lead or an account), so every drip
// email can be about THAT business: who the AIs named instead of them, what a
// rival just published, what they almost rank for on Google.
//
// Every fact has a stable key ("rival:abcflooring.com:newpost:…") so a sequence
// never repeats a fact, and a plain-English `text` that is the ONLY thing the
// writer may state as fact. Two halves:
//   - stored: read from the DB (scan, audit, competitors, GSC). Cheap, always recomputed.
//   - fresh: researched at send time (one AI asked again today, rivals' and the
//     recipient's own newest sitemap URL, social links/posts). Cached on the
//     lead in ogData.dossier for 6 days (social: 14 days).
// Nothing here throws: every network step degrades to "no fact".

import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { safeFetch } from "@/lib/safe-fetch"
import { scanChatGPT, scanClaude, scanGemini, scanPerplexity, type EngineResult } from "@/lib/ai-engines"
import { extractMentionedBusinesses } from "@/lib/scan-insights"
import { scanEngineRows } from "@/lib/scan-engines"
import { extractLeadFacts, siteGaps, type LeadFacts } from "@/lib/nurture"

const DAY = 24 * 60 * 60 * 1000
const FRESH_TTL_DAYS = 6
const SOCIAL_TTL_DAYS = 14
const FETCH_MS = 8000
const MAX_BODY = 1_500_000
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

export type EngineKey = "chatgpt" | "gemini" | "claude" | "perplexity"
export const ENGINE_NAME: Record<EngineKey, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity" }

export interface Fact {
  key: string
  text: string
}

export interface Rival {
  name: string
  domain: string | null
  aiMentions: number | null
  googleRank: number | null
}

export interface SitemapHit {
  url: string
  title: string | null
  lastmod: string // YYYY-MM-DD
  kind: "post" | "page"
}

export interface SocialPost {
  platform: "instagram" | "facebook"
  url: string | null
  date: string | null
  text: string
  likes: number | null
}

export interface FreshResearch {
  fetchedAt: string
  freshAnswer: { engine: EngineKey; date: string; question: string; named: string[]; appeared: boolean } | null
  rivalActivity: { name: string; domain: string; newest: SitemapHit | null }[]
  ownActivity: { newest: SitemapHit | null; social: Record<string, string> }
  social: { fetchedAt: string; posts: SocialPost[] } | null
}

export interface Dossier {
  kind: "lead" | "account"
  /** Lead id, or user id for accounts. */
  id: string
  /** The ScanLead the fresh research is cached on (lead itself, or the account's newest scan). */
  leadId: string | null
  business: { name: string; nameIsGeneric: boolean; domain: string | null; city: string | null; industry: string | null }
  question: string | null
  rivals: Rival[]
  facts: Fact[]
  fresh: FreshResearch | null
  /** Template inputs, for the fallback copy. */
  leadFacts: LeadFacts
}

export interface ResearchOptions {
  /** Index into the engine rotation for the fresh answer (the step number works). */
  rotation?: number
  /** Re-ask an AI even when the cached fresh answer is younger than the TTL (older than 20h). */
  forceFreshAnswer?: boolean
  /** Don't write ogData.dossier (preview script, dry runs). */
  noCache?: boolean
  /** Skip all network research (stored facts only). */
  offline?: boolean
}

// ── small helpers ────────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

const clean = (s: string) => s.replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim()

export function hostOf(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return u.hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "x"

function shortHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
/** "2026-10-12" / ISO → "Oct 12, 2026". */
export function humanDate(d: string | Date | null | undefined): string | null {
  if (!d) return null
  const t = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(t.getTime())) return null
  return `${MONTHS[t.getUTCMonth()]} ${t.getUTCDate()}, ${t.getUTCFullYear()}`
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&#39;|&#039;|&rsquo;|&lsquo;|&apos;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, "\"")
    .replace(/&nbsp;/g, " ").replace(/&ndash;|&mdash;/g, "-").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

async function fetchText(url: string, ms = FETCH_MS): Promise<{ status: number; text: string; finalUrl: string } | null> {
  try {
    const res = await safeFetch(url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml,application/xml,text/xml,*/*" },
      signal: AbortSignal.timeout(ms),
    })
    if (!res.ok) {
      await res.body?.cancel().catch(() => {})
      return { status: res.status, text: "", finalUrl: res.url || url }
    }
    const text = (await res.text()).slice(0, MAX_BODY)
    return { status: res.status, text, finalUrl: res.url || url }
  } catch {
    return null
  }
}

// ── sitemap: the newest URL a site changed in the last 90 days ───────────────

const BLOGGY = /\/(blogs?|news|posts?|articles?|insights?|resources?|guides?|journal|stories|updates|learn|tips)\/./i
const SKIP_PATH = /\/(tag|tags|category|categories|author|page|feed|cart|checkout|account|search|wp-content|cdn-cgi)\b|\.(jpg|jpeg|png|gif|webp|pdf|xml)$/i

function parseLocs(xml: string): { loc: string; lastmod: string | null }[] {
  const out: { loc: string; lastmod: string | null }[] = []
  const re = /<(?:url|sitemap)\b[^>]*>([\s\S]*?)<\/(?:url|sitemap)>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) && out.length < 5000) {
    const body = m[1]
    const loc = body.match(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/i)?.[1]
    if (!loc) continue
    const lastmod = body.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i)?.[1] ?? null
    out.push({ loc: decodeEntities(loc), lastmod })
  }
  return out
}

function pageTitle(html: string): string | null {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{3,300})["']/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']{3,300})["'][^>]+property=["']og:title["']/i)?.[1]
  const t = og ?? html.match(/<title[^>]*>([\s\S]{3,300}?)<\/title>/i)?.[1] ?? html.match(/<h1[^>]*>([\s\S]{3,300}?)<\/h1>/i)?.[1]
  if (!t) return null
  const s = clean(decodeEntities(t.replace(/<[^>]+>/g, " ")))
  return s ? s.slice(0, 140) : null
}

/** Newest same-site URL with a lastmod in the last 90 days, plus its title. At most ~6 fetches. */
export async function newestSitemapEntry(domain: string): Promise<SitemapHit | null> {
  let budget = 6
  const get = async (u: string) => (budget-- > 0 ? fetchText(u) : null)
  const host = domain.replace(/^www\./, "")
  const base = `https://${host}`

  const candidates: string[] = []
  const robots = await get(`${base}/robots.txt`)
  if (robots?.text) {
    for (const m of robots.text.matchAll(/^\s*sitemap:\s*(\S+)/gim)) if (candidates.length < 2) candidates.push(m[1])
  }
  for (const p of ["/sitemap.xml", "/sitemap_index.xml"]) if (!candidates.some((c) => c.endsWith(p))) candidates.push(`${base}${p}`)

  let entries: { loc: string; lastmod: string | null }[] = []
  for (const c of candidates) {
    if (budget <= 1) break
    const r = await get(c)
    if (!r?.text || !/<(urlset|sitemapindex)\b/i.test(r.text)) continue
    if (/<sitemapindex\b/i.test(r.text)) {
      const children = parseLocs(r.text)
        .filter((s) => !/(product|image|video|tag|author|categor)/i.test(s.loc))
        .sort((a, b) => {
          const blog = Number(/post|blog|news|article|insight|resource|guide/i.test(b.loc)) - Number(/post|blog|news|article|insight|resource|guide/i.test(a.loc))
          return blog || (b.lastmod ?? "").localeCompare(a.lastmod ?? "")
        })
        .slice(0, 2)
      for (const child of children) {
        if (budget <= 1) break
        const cr = await get(child.loc)
        if (cr?.text) entries.push(...parseLocs(cr.text))
      }
    } else {
      entries = parseLocs(r.text)
    }
    if (entries.length) break
  }

  const cutoff = Date.now() - 90 * DAY
  const fresh = entries
    .map((e) => ({ ...e, t: e.lastmod ? Date.parse(e.lastmod) : NaN }))
    .filter((e) => Number.isFinite(e.t) && e.t >= cutoff && e.t <= Date.now() + DAY)
    .filter((e) => {
      const h = hostOf(e.loc)
      if (!h || h !== host) return false
      try {
        const path = new URL(e.loc).pathname
        return path.length > 1 && !SKIP_PATH.test(path)
      } catch {
        return false
      }
    })
  if (!fresh.length) return null
  const posts = fresh.filter((e) => BLOGGY.test(new URL(e.loc).pathname))
  const pick = (posts.length ? posts : fresh).sort((a, b) => b.t - a.t)[0]
  const page = budget > 0 ? await fetchText(pick.loc) : null
  return {
    url: pick.loc,
    title: page?.text ? pageTitle(page.text) : null,
    lastmod: new Date(pick.t).toISOString().slice(0, 10),
    kind: posts.length ? "post" : "page",
  }
}

// ── homepage social links ────────────────────────────────────────────────────

const SOCIAL_RES: [string, RegExp, RegExp | null][] = [
  ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{2,30})\/?(?=["'?#\s<]|$)/gi, /^(p|reel|reels|explore|accounts|stories|tv)$/i],
  ["facebook", /https?:\/\/(?:www\.|m\.)?facebook\.com\/([A-Za-z0-9.\-]{2,80})\/?(?=["'?#\s<]|$)/gi, /^(sharer|sharer\.php|share|dialog|tr|plugins|login|groups|events|watch|profile\.php|pages)$/i],
  ["linkedin", /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(company\/[A-Za-z0-9_\-%.]{2,80})\/?/gi, null],
  ["tiktok", /https?:\/\/(?:www\.)?tiktok\.com\/(@[A-Za-z0-9_.]{2,30})/gi, null],
  ["youtube", /https?:\/\/(?:www\.)?youtube\.com\/((?:@|channel\/|c\/)[A-Za-z0-9_\-.]{2,60})/gi, null],
  ["x", /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{2,15})\/?(?=["'?#\s<]|$)/gi, /^(share|intent|home|search|hashtag|i)$/i],
]

export function socialLinks(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [platform, re, skip] of SOCIAL_RES) {
    for (const m of html.matchAll(re)) {
      const id = m[1]
      if (skip && skip.test(id)) continue
      out[platform] = m[0].replace(/\/$/, "")
      break
    }
  }
  return out
}

// ── social posts via Apify's official actors (optional) ──────────────────────
// apify/instagram-post-scraper: { username: [..], resultsLimit, skipPinnedPosts, onlyPostsNewerThan }
//   → items { url, caption, timestamp, likesCount }
// apify/facebook-posts-scraper: { startUrls: [{ url }], resultsLimit, onlyPostsNewerThan }
//   → items { url, text, time, likes }
// Input/output fields verified against apify.com/apify/*/input-schema on 2026-10-27.

async function runApify(actor: string, input: object): Promise<unknown[]> {
  const token = process.env.APIFY_TOKEN
  if (!token) return []
  try {
    const res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&maxItems=3`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(90_000),
    })
    if (!res.ok) return []
    const items = await res.json()
    return Array.isArray(items) ? items.slice(0, 3) : []
  } catch {
    return []
  }
}

export async function fetchSocialPosts(links: Record<string, string>): Promise<SocialPost[]> {
  if (!process.env.APIFY_TOKEN) return []
  const ig = links.instagram?.match(/instagram\.com\/([A-Za-z0-9_.]+)/i)?.[1]
  if (ig) {
    const items = await runApify("apify~instagram-post-scraper", { username: [ig], resultsLimit: 3, skipPinnedPosts: true, onlyPostsNewerThan: "3 months" })
    const posts = items.filter(isRecord).map((p): SocialPost => ({
      platform: "instagram",
      url: typeof p.url === "string" ? p.url : null,
      date: typeof p.timestamp === "string" ? p.timestamp.slice(0, 10) : null,
      text: typeof p.caption === "string" ? clean(p.caption).slice(0, 220) : "",
      likes: typeof p.likesCount === "number" && p.likesCount >= 0 ? p.likesCount : null,
    })).filter((p) => p.text)
    if (posts.length) return posts
  }
  if (links.facebook) {
    const items = await runApify("apify~facebook-posts-scraper", { startUrls: [{ url: links.facebook }], resultsLimit: 3, onlyPostsNewerThan: "3 months" })
    return items.filter(isRecord).map((p): SocialPost => ({
      platform: "facebook",
      url: typeof p.url === "string" ? p.url : null,
      date: typeof p.time === "string" ? p.time.slice(0, 10) : null,
      text: typeof p.text === "string" ? clean(p.text).slice(0, 220) : "",
      likes: typeof p.likes === "number" ? p.likes : null,
    })).filter((p) => p.text)
  }
  return []
}

// ── fresh answer: ask one AI the same customer question today ────────────────

const ROTATION: EngineKey[] = ["chatgpt", "gemini", "claude", "perplexity"]
const engineConfigured = (e: EngineKey) =>
  e === "chatgpt" ? !!process.env.OPENAI_API_KEY : e === "gemini" ? !!process.env.GEMINI_API_KEY : e === "perplexity" ? !!process.env.PERPLEXITY_API_KEY : !!process.env.ANTHROPIC_API_KEY

const SCAN: Record<EngineKey, (n: string, t: string, c: string, q: string[]) => Promise<EngineResult>> = {
  chatgpt: scanChatGPT, gemini: scanGemini, claude: scanClaude, perplexity: scanPerplexity,
}

async function askFresh(rotation: number, business: Dossier["business"], question: string, website: string): Promise<FreshResearch["freshAnswer"]> {
  const engines = ROTATION.filter(engineConfigured)
  if (!engines.length || business.nameIsGeneric) return null
  for (let i = 0; i < Math.min(2, engines.length); i++) {
    const engine = engines[(rotation + i) % engines.length]
    try {
      const r = await SCAN[engine](business.name, business.industry ?? "", business.city ?? "", [question, question, question])
      if (r.status === "error" || r.status === "not_configured" || !r.response.trim()) continue
      const ext = await extractMentionedBusinesses([{ engine: r.engine, query: question, response: r.response }], business.name, website)
      return { engine, date: new Date().toISOString().slice(0, 10), question, named: (ext.mentioned[r.engine] ?? []).slice(0, 6), appeared: r.appeared }
    } catch (err) {
      console.error(`[personal] fresh answer via ${engine} failed:`, err)
    }
  }
  return null
}

// ── stored data ──────────────────────────────────────────────────────────────

export type LeadRow = {
  id: string
  email: string
  businessName: string | null
  businessUrl: string | null
  city: string | null
  aiSearchStatus: unknown
  ogData: unknown
  engineResponses: unknown
  createdAt: Date
}

const LEAD_SELECT = {
  id: true, email: true, businessName: true, businessUrl: true, city: true,
  aiSearchStatus: true, ogData: true, engineResponses: true, createdAt: true,
} as const

function rivalsFromInsights(insights: Record<string, unknown>, selfName: string, selfHost: string | null): Rival[] {
  const out: Rival[] = []
  if (Array.isArray(insights.competitorDetails)) {
    for (const c of insights.competitorDetails) {
      if (!isRecord(c) || typeof c.name !== "string" || !c.name.trim()) continue
      out.push({
        name: c.name.trim(),
        domain: typeof c.domain === "string" ? hostOf(c.domain) : null,
        aiMentions: typeof c.aiMentions === "number" ? c.aiMentions : null,
        googleRank: typeof c.googleRank === "number" ? c.googleRank : null,
      })
    }
  } else if (Array.isArray(insights.competitors)) {
    for (const c of insights.competitors) if (typeof c === "string" && c.trim()) out.push({ name: c.trim(), domain: null, aiMentions: null, googleRank: null })
  }
  return out
    .filter((r) => r.name.toLowerCase() !== selfName.toLowerCase() && (!selfHost || r.domain !== selfHost))
    .sort((a, b) => (b.aiMentions ?? 0) - (a.aiMentions ?? 0) || (a.googleRank ?? 99) - (b.googleRank ?? 99))
    .slice(0, 5)
}

function scanFacts(lead: LeadRow, d: Dossier, insights: Record<string, unknown>): Fact[] {
  const facts: Fact[] = []
  const name = d.business.name
  const scanDate = humanDate(lead.createdAt)
  const og = isRecord(lead.ogData) ? lead.ogData : {}

  if (d.question) facts.push({ key: "scan:question", text: `The customer question I asked the 4 AIs on ${scanDate}: "${d.question}"` })

  // Per engine: did it name them, and who it named instead.
  const responses = isRecord(lead.engineResponses) ? lead.engineResponses : {}
  const rows = scanEngineRows({ aiSearchStatus: lead.aiSearchStatus, engineResponses: lead.engineResponses })
  const keyOf: Record<string, EngineKey> = { ChatGPT: "chatgpt", Gemini: "gemini", Claude: "claude", Perplexity: "perplexity" }
  const named: string[] = []
  const missed: string[] = []
  for (const row of rows) {
    if (row.status === "unknown") continue
    const ek = keyOf[row.name]
    const raw = responses[ek]
    const instead = isRecord(raw) && Array.isArray(raw.mentioned) ? raw.mentioned.filter((m): m is string => typeof m === "string").slice(0, 4) : []
    if (row.status === "found") named.push(row.name)
    else missed.push(row.name)
    const verdict = row.status === "found" ? `named ${name}` : `did not name ${name}`
    facts.push({
      key: `scan:${ek}`,
      text: `In my check on ${scanDate}, ${row.name} ${verdict}.${instead.length ? ` It named ${list(instead)}${row.status === "found" ? " too" : " instead"}.` : ""}`,
    })
  }
  if (named.length || missed.length) {
    const total = named.length + missed.length
    facts.push({
      key: "scan:summary",
      text: named.length === 0
        ? `On ${scanDate}, none of the ${total} AIs I checked named ${name}.`
        : `On ${scanDate}, ${named.length} of the ${total} AIs I checked named ${name} (${list(named)}).`,
    })
  }

  // Rivals: AI mentions and Google rank.
  const kw = typeof insights.keyword === "string" && insights.keyword.trim() ? insights.keyword.trim() : null
  for (const r of d.rivals) {
    const id = r.domain ?? slug(r.name)
    if (r.aiMentions) facts.push({ key: `rival:${id}:ai`, text: `${r.name}${r.domain ? ` (${r.domain})` : ""} was named by ${r.aiMentions} of the 4 AIs for that question.` })
    if (r.googleRank && kw) facts.push({ key: `rival:${id}:google`, text: `${r.name} is at position ${r.googleRank} on Google for "${kw}".` })
  }

  // Google: their own position for the keyword vs the top results.
  const serp = isRecord(insights.serp) ? insights.serp : null
  const results = serp && Array.isArray(serp.results) ? serp.results.filter(isRecord) : []
  if (kw && results.length) {
    const own = results.find((r) => typeof r.domain === "string" && d.business.domain && hostOf(r.domain) === d.business.domain)
    facts.push({
      key: "google:own",
      text: own && typeof own.position === "number"
        ? `${name} is at position ${own.position} on Google for "${kw}" (checked ${scanDate}).`
        : `${name} is not on Google's first page for "${kw}" (checked ${scanDate}).`,
    })
    const top = results.slice(0, 3).map((r) => `${r.position}. ${hostOf(String(r.domain ?? r.url ?? "")) ?? r.title}`).join("; ")
    if (top) facts.push({ key: "google:top", text: `The top Google results for "${kw}" on ${scanDate}: ${top}.` })
  }

  // Site gaps vs rivals, and what rival sites have.
  for (const g of siteGaps(og.siteChecks)) {
    facts.push({ key: `gap:${g.key}`, text: `Rival websites have this and ${name}'s does not: ${g.text}.` })
  }
  const sc = isRecord(og.siteChecks) ? og.siteChecks : null
  if (sc && Array.isArray(sc.competitors)) {
    for (const site of sc.competitors.filter(isRecord).slice(0, 3)) {
      const domain = typeof site.domain === "string" ? hostOf(site.domain) : null
      if (!domain) continue
      const rival = d.rivals.find((r) => r.domain === domain)
      const label = rival ? `${rival.name} (${domain})` : domain
      const checks = Array.isArray(site.checks) ? site.checks.filter(isRecord) : []
      const ok = (k: string) => checks.find((c) => c.key === k)?.ok === true
      if (ok("faq")) facts.push({ key: `rival:${domain}:faq`, text: `${label} has an FAQ on its website that answers customer questions directly.` })
      if (ok("schema")) facts.push({ key: `rival:${domain}:schema`, text: `${label} has the code on its website that tells AI its business details.` })
      const blog = isRecord(site.blog) ? site.blog : null
      if (blog && blog.found === true && typeof blog.posts === "number" && blog.posts > 0) {
        const last = typeof blog.lastDate === "string" ? humanDate(blog.lastDate) : null
        facts.push({ key: `rival:${domain}:blog`, text: `${label} has a blog with ${blog.posts} posts${last ? `, the latest from ${last}` : ""}.` })
      }
    }
  }

  // The drafted fix.
  const lf = d.leadFacts
  if (lf.draft) facts.push({ key: "draft:faq", text: `I already drafted an FAQ answer for ${name}. Question: "${lf.draft.question}" Answer: "${lf.draft.answer}"` })
  return facts
}

async function accountFacts(userId: string, d: Dossier, websiteUrl: string | null): Promise<{ facts: Fact[]; rivals: Rival[]; question: string | null }> {
  const facts: Fact[] = []
  const rivals: Rival[] = []
  let question: string | null = null
  const name = d.business.name
  const since = new Date(Date.now() - 28 * DAY)
  const [audit, competitors, gap, rankings] = await Promise.all([
    db.audit.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, include: { aiEngineResults: true } }),
    db.competitor.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.contentGap.findFirst({ where: { userId }, orderBy: { analyzedAt: "desc" } }),
    db.keywordRanking.findMany({ where: { userId, date: { gte: since } }, select: { query: true, clicks: true, impressions: true, position: true } }),
  ])

  for (const c of competitors) {
    const domain = hostOf(c.url)
    const cname = c.name?.trim() || domain || c.url
    rivals.push({ name: cname, domain, aiMentions: null, googleRank: null })
    const cd = isRecord(c.crawlData) ? c.crawlData : {}
    if (typeof cd.pagesFound === "number" && cd.pagesFound > 0) {
      facts.push({ key: `rival:${domain ?? slug(cname)}:pages`, text: `${cname} (a competitor you track) has ${cd.pagesFound} pages on its website.` })
    }
  }

  if (audit && audit.aiEngineResults.length) {
    const date = humanDate(audit.createdAt)
    const results = audit.aiEngineResults.filter((r) => r.response?.trim())
    question = results[0]?.query ?? null
    const ext = results.length
      ? await extractMentionedBusinesses(results.map((r) => ({ engine: r.engine as EngineResult["engine"], query: r.query, response: r.response })), name, websiteUrl ?? "").catch(() => null)
      : null
    for (const r of audit.aiEngineResults) {
      const ek = r.engine as EngineKey
      if (!(ek in ENGINE_NAME)) continue
      const instead = (ext?.mentioned[ek] ?? []).slice(0, 4)
      facts.push({
        key: `audit:${ek}`,
        text: `In my check on ${date}, ${ENGINE_NAME[ek]} ${r.appeared ? "named" : "did not name"} ${name} when asked "${r.query}".${instead.length ? ` It named ${list(instead)}${r.appeared ? " too" : " instead"}.` : ""}`,
      })
    }
  }

  const gaps = gap && Array.isArray(gap.gaps) ? (gap.gaps as unknown[]).filter((g): g is Record<string, unknown> => isRecord(g)) : []
  const gapHost = gap ? hostOf(gap.competitorUrl) : null
  for (const g of gaps.slice(0, 3)) {
    const topic = typeof g.suggestedTitle === "string" ? g.suggestedTitle : typeof g.topic === "string" ? g.topic : null
    if (topic) facts.push({ key: `contentgap:${slug(topic)}`, text: `A topic ${gapHost ?? "your competitor"} covers that ${name}'s site does not: "${clean(topic)}".` })
  }

  // GSC: roll the last 28 days up per query.
  const byQ = new Map<string, { clicks: number; impressions: number; posW: number }>()
  for (const r of rankings) {
    const q = r.query.trim().toLowerCase()
    if (!q) continue
    const a = byQ.get(q) ?? { clicks: 0, impressions: 0, posW: 0 }
    a.clicks += r.clicks
    a.impressions += r.impressions
    a.posW += r.position * Math.max(1, r.impressions)
    byQ.set(q, a)
  }
  const agg = [...byQ.entries()].map(([q, a]) => ({ q, clicks: a.clicks, impressions: a.impressions, pos: Math.round(a.posW / Math.max(1, a.impressions)) }))
  const near = agg.filter((a) => a.pos >= 8 && a.pos <= 30 && a.impressions >= 10).sort((a, b) => b.impressions - a.impressions).slice(0, 3)
  for (const n of near) {
    facts.push({ key: `gsc:near:${slug(n.q)}`, text: `In the last 28 days Google showed ${name} ${n.impressions} times for "${n.q}", at about position ${n.pos}${n.pos > 10 ? " (page two or lower)" : ""}.` })
  }
  const top = agg.filter((a) => a.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 2)
  for (const t of top) {
    facts.push({ key: `gsc:top:${slug(t.q)}`, text: `In the last 28 days "${t.q}" brought ${name} ${t.clicks} clicks from Google, at about position ${t.pos}.` })
  }
  return { facts, rivals, question }
}

// ── fresh facts ──────────────────────────────────────────────────────────────

function freshFacts(f: FreshResearch, d: Dossier): Fact[] {
  const facts: Fact[] = []
  const name = d.business.name
  if (f.freshAnswer) {
    const a = f.freshAnswer
    const when = humanDate(a.date)
    const eng = ENGINE_NAME[a.engine]
    facts.push({
      key: `fresh:${a.engine}:${a.date}`,
      text: `On ${when} I asked ${eng} again: "${a.question}". ${a.named.length ? `It named ${list(a.named)}.` : "It named no specific business."} ${a.appeared ? `It named ${name}.` : `It did not name ${name}.`}`,
    })
  }
  for (const r of f.rivalActivity) {
    if (!r.newest) continue
    const n = r.newest
    const when = humanDate(n.lastmod)
    facts.push({
      key: `rival:${r.domain}:new:${shortHash(n.url)}`,
      text: n.kind === "post"
        ? `${r.name} (${r.domain}) published or updated a post on ${when}${n.title ? `: "${n.title}"` : ""} (${n.url}).`
        : `${r.name} (${r.domain}) updated a page on its website on ${when}${n.title ? `: "${n.title}"` : ""} (${n.url}).`,
    })
  }
  const own = f.ownActivity
  if (own.newest) {
    const n = own.newest
    facts.push({
      key: `own:new:${shortHash(n.url)}`,
      text: `${name}'s newest ${n.kind === "post" ? "post" : "updated page"} is from ${humanDate(n.lastmod)}${n.title ? `: "${n.title}"` : ""} (${n.url}).`,
    })
  }
  const socials = Object.entries(own.social)
  if (socials.length) {
    facts.push({ key: "own:social", text: `${name}'s homepage links to these profiles: ${socials.map(([p, u]) => `${p} (${u})`).join(", ")}.` })
  }
  for (const p of f.social?.posts ?? []) {
    facts.push({
      key: `social:${p.platform}:${shortHash(p.url ?? p.text)}`,
      text: `${name} posted on ${p.platform === "instagram" ? "Instagram" : "Facebook"}${p.date ? ` on ${humanDate(p.date)}` : ""}: "${p.text}"${p.likes != null ? ` (${p.likes} likes)` : ""}.`,
    })
  }
  return facts
}

async function research(d: Dossier, website: string | null, prev: FreshResearch | null, opts: ResearchOptions): Promise<FreshResearch> {
  const now = Date.now()
  const prevAge = prev ? now - Date.parse(prev.fetchedAt) : Infinity
  const prevFresh = prev && prevAge < FRESH_TTL_DAYS * DAY ? prev : null

  // Fresh answer: reuse within the TTL unless the step needs today's answer.
  let freshAnswer = prevFresh?.freshAnswer ?? null
  const answerAge = freshAnswer ? now - Date.parse(freshAnswer.date) : Infinity
  if (d.question && (!freshAnswer || (opts.forceFreshAnswer && answerAge > 20 * 60 * 60 * 1000))) {
    freshAnswer = (await askFresh(opts.rotation ?? 0, d.business, d.question, website ?? "")) ?? freshAnswer
  }

  let rivalActivity = prevFresh?.rivalActivity ?? null
  let ownActivity = prevFresh?.ownActivity ?? null
  if (!rivalActivity || !ownActivity) {
    const rivalDomains = d.rivals.filter((r) => r.domain).slice(0, 2)
    const [rivals, ownNewest, home] = await Promise.all([
      Promise.all(rivalDomains.map(async (r) => ({ name: r.name, domain: r.domain!, newest: await newestSitemapEntry(r.domain!).catch(() => null) }))),
      d.business.domain ? newestSitemapEntry(d.business.domain).catch(() => null) : Promise.resolve(null),
      d.business.domain ? fetchText(`https://${d.business.domain}/`) : Promise.resolve(null),
    ])
    rivalActivity = rivals
    ownActivity = { newest: ownNewest, social: home?.text ? socialLinks(home.text) : {} }
  }

  let social = prev?.social ?? null
  if (!social || now - Date.parse(social.fetchedAt) > SOCIAL_TTL_DAYS * DAY) {
    const posts = process.env.APIFY_TOKEN && (ownActivity.social.instagram || ownActivity.social.facebook) ? await fetchSocialPosts(ownActivity.social).catch(() => []) : []
    social = { fetchedAt: new Date().toISOString(), posts }
  }

  return {
    fetchedAt: prevFresh?.fetchedAt ?? new Date().toISOString(),
    freshAnswer,
    rivalActivity,
    ownActivity,
    social,
  }
}

function cachedFresh(ogData: unknown): FreshResearch | null {
  const og = isRecord(ogData) ? ogData : {}
  const d = isRecord(og.dossier) ? og.dossier : null
  if (!d || d.v !== 1 || typeof d.fetchedAt !== "string") return null
  return d as unknown as FreshResearch
}

async function saveFresh(leadId: string, fresh: FreshResearch): Promise<void> {
  try {
    // Re-read so a concurrent ogData change (nurture state, unsubscribe) is merged.
    const row = await db.scanLead.findUnique({ where: { id: leadId }, select: { ogData: true } })
    const og = isRecord(row?.ogData) ? { ...row!.ogData } : {}
    await db.scanLead.update({ where: { id: leadId }, data: { ogData: { ...og, dossier: { v: 1, ...fresh } } as Prisma.InputJsonValue } })
  } catch (err) {
    console.error(`[personal] dossier cache write failed for lead ${leadId}:`, err)
  }
}

// ── public API ───────────────────────────────────────────────────────────────

function baseDossier(kind: Dossier["kind"], id: string, lead: LeadRow | null, user: { businessName: string | null; businessType: string | null; city: string | null; websiteUrl: string | null } | null): Dossier {
  const leadFacts = extractLeadFacts({
    id: lead?.id ?? id,
    businessName: lead?.businessName ?? user?.businessName ?? null,
    businessUrl: lead?.businessUrl ?? user?.websiteUrl ?? null,
    city: lead?.city ?? user?.city ?? null,
    aiSearchStatus: lead?.aiSearchStatus ?? null,
    ogData: lead?.ogData ?? null,
    engineResponses: lead?.engineResponses ?? null,
  })
  const og = lead && isRecord(lead.ogData) ? lead.ogData : {}
  const insights = isRecord(og.insights) ? og.insights : {}
  const domain = hostOf(user?.websiteUrl ?? lead?.businessUrl ?? null)
  const industry = (typeof insights.industry === "string" && insights.industry.trim()) || user?.businessType?.trim() || null
  const question = typeof insights.query === "string" && insights.query.trim().length > 10 ? insights.query.trim() : null
  const business = { name: leadFacts.name, nameIsGeneric: leadFacts.nameIsGeneric, domain, city: leadFacts.city ?? (user?.city?.trim() || null), industry }
  return {
    kind, id, leadId: lead?.id ?? null, business, question,
    rivals: rivalsFromInsights(insights, business.name, domain),
    facts: [], fresh: null, leadFacts,
  }
}

function finish(d: Dossier, lead: LeadRow | null, extra: Fact[]): Dossier {
  const facts: Fact[] = []
  const b = d.business
  facts.push({
    key: "biz",
    text: `${b.name}${b.domain ? ` (${b.domain})` : ""}${b.industry ? `, ${b.industry}` : ""}${b.city ? `, ${b.city}` : ""}.`,
  })
  if (lead) {
    const og = isRecord(lead.ogData) ? lead.ogData : {}
    facts.push(...scanFacts(lead, d, isRecord(og.insights) ? og.insights : {}))
  }
  facts.push(...extra)
  if (d.fresh) facts.push(...freshFacts(d.fresh, d))
  const seen = new Set<string>()
  d.facts = facts.filter((f) => (seen.has(f.key) ? false : (seen.add(f.key), true)))
  return d
}

export async function buildLeadDossier(leadId: string, opts: ResearchOptions = {}): Promise<Dossier | null> {
  const lead = await db.scanLead.findUnique({ where: { id: leadId }, select: LEAD_SELECT })
  if (!lead) return null
  return buildLeadDossierFromRow(lead, opts)
}

/** Same as buildLeadDossier for a row already in hand (also used by the preview script with an in-memory scan). */
export async function buildLeadDossierFromRow(lead: LeadRow, opts: ResearchOptions = {}): Promise<Dossier> {
  const d = baseDossier("lead", lead.id, lead, null)
  if (!opts.offline) {
    d.fresh = await research(d, lead.businessUrl, cachedFresh(lead.ogData), opts).catch((err) => {
      console.error(`[personal] research failed for lead ${lead.id}:`, err)
      return null
    })
    if (d.fresh && !opts.noCache) await saveFresh(lead.id, d.fresh)
  }
  return finish(d, lead, [])
}

export async function buildAccountDossier(userId: string, opts: ResearchOptions = {}): Promise<Dossier | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, businessName: true, businessType: true, city: true, websiteUrl: true },
  })
  if (!user) return null
  const lead = await db.scanLead.findFirst({
    where: { visibilityScore: { not: null }, OR: [{ userId: user.id }, { email: { equals: user.email, mode: "insensitive" } }] },
    orderBy: { createdAt: "desc" },
    select: LEAD_SELECT,
  })
  const d = baseDossier("account", user.id, lead, user)
  const acct = await accountFacts(user.id, d, user.websiteUrl).catch((err) => {
    console.error(`[personal] account facts failed for ${user.id}:`, err)
    return { facts: [] as Fact[], rivals: [] as Rival[], question: null }
  })
  // Tracked competitors fill in when the scan named nobody.
  for (const r of acct.rivals) if (!d.rivals.some((x) => x.name.toLowerCase() === r.name.toLowerCase() || (r.domain && x.domain === r.domain))) d.rivals.push(r)
  d.question ??= acct.question
  if (!opts.offline) {
    d.fresh = await research(d, user.websiteUrl, lead ? cachedFresh(lead.ogData) : null, opts).catch((err) => {
      console.error(`[personal] research failed for user ${user.id}:`, err)
      return null
    })
    if (d.fresh && lead && !opts.noCache) await saveFresh(lead.id, d.fresh)
  }
  return finish(d, lead, acct.facts)
}

/** Every proper name a subject line may lead with: the business, its rivals, who an AI named today. */
export function dossierNames(d: Dossier): string[] {
  const names = new Set<string>()
  if (!d.business.nameIsGeneric) names.add(d.business.name)
  if (d.business.domain) names.add(d.business.domain)
  for (const r of d.rivals) {
    names.add(r.name)
    if (r.domain) names.add(r.domain)
  }
  for (const n of d.fresh?.freshAnswer?.named ?? []) names.add(n)
  return [...names].filter((n) => n.length >= 3)
}
