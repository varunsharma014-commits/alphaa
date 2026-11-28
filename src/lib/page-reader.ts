// Reads real pages for the content pipeline (gap analysis + briefs): a site's sitemap, one
// article's title / headings / word count / words, with robots.txt respected for our crawler
// (AlphaaBot, same user agent as lib/crawler.ts), size and time caps, and SSRF-safe fetches
// (lib/safe-fetch.ts). Best effort: a page we may not or cannot read is skipped, never guessed.
import { safeFetch } from "@/lib/safe-fetch"

export const READER_UA = "AlphaaBot/1.0 (SEO audit; +https://alphaa.app)"
const AGENT = "alphaabot"
const PAGE_BYTES = 800_000
const SITEMAP_BYTES = 3_000_000

// ── robots.txt ──────────────────────────────────────────────────────────────────────────────
export type RobotsGroup = { agents: string[]; rules: { allow: boolean; path: string }[] }

export function parseRobotsTxt(txt: string): RobotsGroup[] {
  const groups: RobotsGroup[] = []
  let cur: RobotsGroup | null = null
  let lastAgent = false
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim()
    const i = line.indexOf(":")
    if (i < 0) continue
    const field = line.slice(0, i).trim().toLowerCase()
    const value = line.slice(i + 1).trim()
    if (field === "user-agent") {
      if (!cur || !lastAgent) { cur = { agents: [], rules: [] }; groups.push(cur) }
      cur.agents.push(value.toLowerCase())
      lastAgent = true
    } else {
      lastAgent = false
      if (cur && (field === "allow" || field === "disallow") && (value || field === "allow")) cur.rules.push({ allow: field === "allow", path: value })
    }
  }
  return groups
}

const ruleRe = (p: string) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$")}`)

/** Google's rules: our own group (else *), the longest matching path wins, a tie goes to Allow. */
export function robotsAllows(groups: RobotsGroup[], path: string, agent = AGENT): boolean {
  const a = agent.toLowerCase()
  const g = groups.find((x) => x.agents.some((n) => n !== "*" && a.includes(n))) ?? groups.find((x) => x.agents.includes("*"))
  if (!g) return true
  let best: { allow: boolean; len: number } | null = null
  for (const r of g.rules) {
    if (!r.path) continue
    if (!ruleRe(r.path).test(path)) continue
    const len = r.path.length
    if (!best || len > best.len || (len === best.len && r.allow)) best = { allow: r.allow, len }
  }
  return best ? best.allow : true
}

const robotsCache = new Map<string, { at: number; groups: RobotsGroup[] | "all" | "none" }>()

/** The site's robots rules (cached an hour). 4xx = no rules; unreachable or 5xx = don't read it. */
async function robotsFor(origin: string): Promise<RobotsGroup[] | "all" | "none"> {
  const hit = robotsCache.get(origin)
  if (hit && Date.now() - hit.at < 3_600_000) return hit.groups
  let groups: RobotsGroup[] | "all" | "none" = "none"
  try {
    const r = await safeFetch(`${origin}/robots.txt`, { headers: { "User-Agent": READER_UA }, redirect: "follow", signal: AbortSignal.timeout(6000) })
    if (r.ok) groups = parseRobotsTxt((await r.text()).slice(0, 500_000))
    else if (r.status >= 400 && r.status < 500) groups = "all"
  } catch {
    groups = "none"
  }
  if (robotsCache.size > 500) robotsCache.clear()
  robotsCache.set(origin, { at: Date.now(), groups })
  return groups
}

export async function mayRead(url: string): Promise<boolean> {
  let u: URL
  try { u = new URL(url) } catch { return false }
  const g = await robotsFor(u.origin)
  if (g === "all") return true
  if (g === "none") return false
  return robotsAllows(g, `${u.pathname}${u.search}`)
}

// ── fetching ────────────────────────────────────────────────────────────────────────────────
export const withHttps = (site: string) => (/^https?:\/\//i.test(site.trim()) ? site.trim() : `https://${site.trim()}`)
export const hostOf = (u: string): string | null => {
  try { return new URL(withHttps(u)).hostname.replace(/^www\./, "").toLowerCase() } catch { return null }
}

/** Body text up to `max` bytes (the rest is never downloaded). */
async function capped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return (await res.text()).slice(0, max)
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < max) {
    const { done, value } = await reader.read()
    if (done || !value) break
    chunks.push(value)
    size += value.length
  }
  reader.cancel().catch(() => {})
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).subarray(0, max).toString("utf8")
}

async function get(url: string, opts: { max: number; ms: number; html?: boolean }): Promise<{ text: string; finalUrl: string } | null> {
  try {
    const res = await safeFetch(url, { headers: { "User-Agent": READER_UA, Accept: opts.html ? "text/html,application/xhtml+xml" : "*/*" }, redirect: "follow", signal: AbortSignal.timeout(opts.ms) })
    if (!res.ok) return null
    const type = res.headers.get("content-type") ?? ""
    if (opts.html && !/html/i.test(type)) return null
    return { text: await capped(res, opts.max), finalUrl: res.url || url }
  } catch {
    return null
  }
}

// ── one article ─────────────────────────────────────────────────────────────────────────────
export type Article = {
  url: string
  title: string
  description: string
  h1: string
  headings: { level: 2 | 3; text: string }[]
  words: number
  /** The words people read (main content, no menus/footers), capped. */
  text: string
  /** Links to other pages on the same site (absolute, no #fragments). */
  links: { url: string; text: string }[]
  /** Questions the page answers in its own headings (FAQ-style). */
  questions: string[]
}

export async function readArticle(url: string, textCap = 6000): Promise<{ ok: true; page: Article } | { ok: false; reason: "robots" | "fetch" | "thin" }> {
  if (!(await mayRead(url))) return { ok: false, reason: "robots" }
  const got = await get(url, { max: PAGE_BYTES, ms: 10_000, html: true })
  if (!got) return { ok: false, reason: "fetch" }
  const { load } = await import("cheerio")
  const $ = load(got.text)
  const clean = (s: string) => s.replace(/\s+/g, " ").trim()
  const host = hostOf(got.finalUrl)
  const links: { url: string; text: string }[] = []
  const seen = new Set<string>()
  $("a[href]").each((_, a) => {
    try {
      const u = new URL($(a).attr("href") || "", got.finalUrl)
      if (!/^https?:$/.test(u.protocol) || u.hostname.replace(/^www\./, "").toLowerCase() !== host) return
      u.hash = ""
      const key = u.toString().replace(/\/+$/, "")
      if (seen.has(key)) return
      seen.add(key)
      links.push({ url: u.toString(), text: clean($(a).text()).slice(0, 100) })
    } catch {}
  })
  const title = clean($("title").first().text()).slice(0, 200)
  const description = clean($('meta[name="description" i]').attr("content") || $('meta[property="og:description"]').attr("content") || "").slice(0, 300)
  $("script, style, noscript, svg, template, iframe, form").remove()
  const main = $("main").length ? $("main").first() : $("article").length ? $("article").first() : $("body")
  // Inside <main>/<article> a <header> is often the article itself (Webflow hero sections): keep it.
  const isBody = !$("main").length && !$("article").length
  main.find(`nav, footer, aside, [role=navigation], .menu, .nav, .footer, .sidebar${isBody ? ", header" : ""}`).remove()
  const h1 = clean(main.find("h1").first().text() || $("h1").first().text()).slice(0, 200)
  const headings = main.find("h2, h3").map((_, h) => ({ level: (($(h).prop("tagName") ?? "").toString().toLowerCase() === "h2" ? 2 : 3) as 2 | 3, text: clean($(h).text()).slice(0, 160) })).get().filter((h) => h.text && h.text.length > 2).slice(0, 40)
  const body = clean(main.text())
  const words = body ? body.split(/\s+/).length : 0
  if (words < 80) return { ok: false, reason: "thin" }
  const questions = headings.map((h) => h.text).filter((t) => /\?$/.test(t)).slice(0, 15)
  return { ok: true, page: { url: got.finalUrl, title, description, h1, headings, words, text: body.slice(0, textCap), links: links.slice(0, 200), questions } }
}

// ── sitemap ─────────────────────────────────────────────────────────────────────────────────
export type SitemapUrl = { url: string; lastmod?: string }

const sitemapCache = new Map<string, { at: number; p: Promise<{ urls: SitemapUrl[]; source: string }> }>()

/** Page URLs from the site's sitemap (robots-declared, /sitemap.xml, /sitemap_index.xml; index children up to 4). Cached 30 min. */
export function readSitemap(site: string, cap = 500): Promise<{ urls: SitemapUrl[]; source: string }> {
  const host = hostOf(site)
  if (!host) return Promise.resolve({ urls: [], source: "none" })
  const key = `${host}:${cap}`
  const hit = sitemapCache.get(key)
  if (hit && Date.now() - hit.at < 1_800_000) return hit.p
  if (sitemapCache.size > 200) sitemapCache.clear()
  const p = readSitemapNow(host, cap).catch(() => ({ urls: [], source: "none" }))
  sitemapCache.set(key, { at: Date.now(), p })
  return p
}

async function readSitemapNow(host: string, cap: number): Promise<{ urls: SitemapUrl[]; source: string }> {
  const origin = `https://${host}`
  const robots = await get(`${origin}/robots.txt`, { max: 200_000, ms: 6000 })
  const declared = robots ? [...robots.text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]).slice(0, 3) : []
  const tries = [...declared, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `https://www.${host}/sitemap.xml`]
  const parse = (xml: string) => ({
    index: /<sitemapindex/i.test(xml),
    entries: [...xml.matchAll(/<(?:url|sitemap)>([\s\S]*?)<\/(?:url|sitemap)>/gi)].map((m) => ({
      url: (m[1].match(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)/i)?.[1] ?? "").replace(/&amp;/g, "&"),
      lastmod: m[1].match(/<lastmod>\s*([^<\s]+)/i)?.[1],
    })).filter((e) => /^https?:\/\//i.test(e.url)),
  })
  for (const t of [...new Set(tries)]) {
    const got = await get(t, { max: SITEMAP_BYTES, ms: 8000 })
    if (!got || !/<urlset|<sitemapindex/i.test(got.text)) continue
    const top = parse(got.text)
    if (!top.index) return { urls: sameHost(top.entries, host).slice(0, cap), source: t }
    // An index: page/post sitemaps first (skip images, tags, authors, categories), up to 4.
    const kids = top.entries
      .filter((e) => !/(image|video|tag|author|category|product_cat|attachment)/i.test(e.url))
      .sort((a, b) => score(b.url) - score(a.url))
      .slice(0, 4)
    const all: SitemapUrl[] = []
    for (const k of kids) {
      const sub = await get(k.url, { max: SITEMAP_BYTES, ms: 8000 })
      if (sub && /<urlset/i.test(sub.text)) all.push(...parse(sub.text).entries)
      if (all.length >= cap) break
    }
    return { urls: sameHost(all, host).slice(0, cap), source: t }
  }
  return { urls: [], source: "none" }
  function score(u: string) { return /post|blog|article|page|service|guide/i.test(u) ? 2 : /product/i.test(u) ? 0 : 1 }
}

const sameHost = (list: SitemapUrl[], host: string) => {
  const seen = new Set<string>()
  return list.filter((e) => {
    const h = hostOf(e.url)
    const k = e.url.replace(/\/+$/, "")
    if (h !== host || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// ── picking pages ───────────────────────────────────────────────────────────────────────────
const JUNK = /\/(tag|tags|category|categories|author|authors|page\/\d+|feed|wp-|cart|checkout|account|login|signin|sign-in|register|privacy|terms|cookie|legal|disclaimer|search|thank|thanks|sitemap|cdn-cgi|amp)(\/|$|-)|\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|xml|json)$/i
const CONTENT = /\/(blog|blogs|articles?|guides?|resources|learn|insights|faq|faqs|help|knowledge|news|tips|services?|solutions?|treatments?|what-we-do|how-|what-|why-|when-|which-|best-|cost|price|pricing)/i
const STOP = new Set(["the", "and", "for", "with", "your", "you", "how", "what", "why", "does", "can", "are", "our", "from", "that", "this", "into", "near", "best", "much", "who", "when", "which", "should", "about", "a", "an", "of", "to", "in", "on", "is", "do", "i", "my", "or", "vs"])
export const topicWords = (s: string) => [...new Set(s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/).filter((w) => w.length > 2 && !STOP.has(w)))]

/** "https://x.com/blog/how-much-does-a-roof-cost/" → "how much does a roof cost". */
export function slugTitle(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean)
    const last = parts[parts.length - 1] ?? ""
    return decodeURIComponent(last).replace(/\.(html?|php|aspx?)$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
  } catch {
    return ""
  }
}

/** Content-looking pages, scored by topic overlap, content path and freshness. */
export function pickCompetitorPages(urls: SitemapUrl[], o: { max: number; topic?: string }): (SitemapUrl & { title: string; overlap: number })[] {
  const want = topicWords(o.topic ?? "")
  const scored = urls
    .filter((u) => !JUNK.test(new URL(u.url).pathname) && new URL(u.url).pathname !== "/")
    .map((u) => {
      const title = slugTitle(u.url)
      const words = topicWords(title)
      const overlap = want.filter((w) => words.some((x) => x === w || (w.length > 4 && x.startsWith(w.slice(0, -1))))).length
      const depth = new URL(u.url).pathname.split("/").filter(Boolean).length
      const fresh = u.lastmod ? Math.max(0, 1 - (Date.now() - Date.parse(u.lastmod)) / (730 * 86_400_000)) : 0
      return { ...u, title, overlap, score: overlap * 3 + (CONTENT.test(u.url) ? 2 : 0) + (depth <= 3 ? 0.5 : 0) + (words.length >= 3 ? 0.5 : 0) + fresh }
    })
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, o.max).map(({ score: _s, ...r }) => r)
}
