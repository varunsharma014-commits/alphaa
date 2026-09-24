// What an AI assistant finds when it reads a website — nine plain HTTP checks,
// no LLM. Run for the scanned business and its top competitors so the /start
// conversation can say "they have it, you don't" with evidence. Every check
// is best-effort: a fetch failure yields ok=null ("couldn't check"), never a
// fabricated fail.

// Server-only (fetches + Anthropic). Client code imports the labels from
// lib/site-check-labels.ts so the SDK never lands in a browser bundle.
import { anthropic } from "@/lib/claude"
import type { CheckKey } from "@/lib/site-check-labels"
export type { CheckKey } from "@/lib/site-check-labels"

export interface SiteCheckItem {
  key: CheckKey
  label: string
  ok: boolean | null
  detail: string
}

export interface SiteCheck {
  domain: string
  checks: SiteCheckItem[]
  passed: number
  total: number
  blog: { found: boolean; posts: number; lastDate: string | null }
}

export interface SiteChecks {
  you: SiteCheck | null
  competitors: SiteCheck[]
}

const UA = "Mozilla/5.0 (compatible; AlphaaBot/1.0; +https://alphaa.app)"
const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Google-Extended"]

async function get(url: string, ms = 7000): Promise<{ ok: boolean; status: number; text: string; ms: number } | null> {
  const t0 = Date.now()
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(ms) })
    const text = res.ok ? (await res.text()).slice(0, 400_000) : ""
    return { ok: res.ok, status: res.status, text, ms: Date.now() - t0 }
  } catch {
    return null
  }
}

export function normalizeSite(input: string): string | null {
  let s = input.trim()
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`
  try {
    const u = new URL(s)
    return `${u.protocol}//${u.hostname}`
  } catch {
    return null
  }
}

function blockedBots(robots: string): string[] {
  // A "User-agent: X" group followed by "Disallow: /" blocks X.
  const blocked: string[] = []
  const groups = robots.split(/\n(?=user-agent:)/i)
  for (const g of groups) {
    const agents = [...g.matchAll(/user-agent:\s*([^\n#]+)/gi)].map((m) => m[1].trim())
    const disallowAll = /disallow:\s*\/\s*$/im.test(g)
    if (!disallowAll) continue
    for (const a of agents) {
      const hit = AI_BOTS.find((b) => b.toLowerCase() === a.toLowerCase())
      if (hit) blocked.push(hit)
    }
  }
  return blocked
}

export async function checkSite(input: string, opts: { isLocal: boolean }): Promise<SiteCheck | null> {
  const origin = normalizeSite(input)
  if (!origin) return null
  const domain = new URL(origin).hostname.replace(/^www\./, "")

  const [home, llms, robots, sitemap] = await Promise.all([
    get(`${origin}/`, 9000),
    get(`${origin}/llms.txt`),
    get(`${origin}/robots.txt`),
    get(`${origin}/sitemap.xml`),
  ])
  if (!home || !home.ok) return null

  const html = home.text
  const { load } = await import("cheerio")
  const $ = load(html)
  const text = $("body").clone().find("script,style,noscript").remove().end().text().replace(/\s+/g, " ")

  const checks: SiteCheckItem[] = []

  // llms.txt — the file AI assistants read first.
  const llmsOk = !!(llms && llms.ok && /^#|\w/.test(llms.text.trim()) && !/<html/i.test(llms.text))
  checks.push({ key: "llms", label: "llms.txt for AI assistants", ok: llms ? llmsOk : null, detail: llmsOk ? "Present" : "Missing" })

  // robots.txt — are AI crawlers allowed in?
  if (robots && robots.ok) {
    const blocked = blockedBots(robots.text)
    checks.push({ key: "robots", label: "AI crawlers allowed", ok: blocked.length === 0, detail: blocked.length ? `Blocks ${blocked.join(", ")}` : "Allowed" })
  } else {
    checks.push({ key: "robots", label: "AI crawlers allowed", ok: true, detail: "No robots.txt — allowed by default" })
  }

  // sitemap
  const smOk = !!(sitemap && sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text))
  checks.push({ key: "sitemap", label: "Sitemap", ok: sitemap ? smOk : null, detail: smOk ? "Present" : "Missing" })

  // structured facts (JSON-LD)
  const types = new Set<string>()
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = JSON.parse($(el).text())
      const walk = (n: unknown) => {
        if (!n || typeof n !== "object") return
        if (Array.isArray(n)) return n.forEach(walk)
        const o = n as Record<string, unknown>
        const t = o["@type"]
        if (typeof t === "string") types.add(t)
        if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.add(x))
        if (Array.isArray(o["@graph"])) walk(o["@graph"])
      }
      walk(raw)
    } catch {}
  })
  const wanted = opts.isLocal ? ["LocalBusiness", "Dentist", "Restaurant", "Plumber", "MedicalBusiness", "Organization"] : ["Organization", "SoftwareApplication", "Product"]
  const hasBiz = [...types].some((t) => wanted.some((w) => t.includes(w)))
  checks.push({ key: "schema", label: "Structured facts AI can read", ok: hasBiz, detail: hasBiz ? [...types].slice(0, 3).join(", ") : types.size ? `Only ${[...types].slice(0, 2).join(", ")}` : "None" })

  // FAQ
  const faqOk = types.has("FAQPage") || /\bFAQ\b|frequently asked/i.test(text) || $('a[href*="faq" i]').length > 0
  checks.push({ key: "faq", label: "Answers to customer questions (FAQ)", ok: faqOk, detail: faqOk ? "Found" : "None found" })

  // the facts AI needs before it recommends anyone
  const phone = /(\+?\d[\d\s().-]{8,}\d)/.test(text)
  const address = /\b\d{2,5}\s+[A-Z][a-zA-Z]+\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Suite|Ste)\b/.test(text)
  const hours = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b[^.]{0,40}\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(text) || /opening hours|open (daily|every day)/i.test(text)
  const price = /\$\s?\d{2,}|\bpricing\b|\bper month\b|\/mo\b/i.test(text)
  const factsOk = opts.isLocal ? (phone && (address || hours)) : (price || /pricing/i.test($('a[href*="pric" i]').text()))
  const missing = opts.isLocal
    ? [!phone && "phone", !address && "address", !hours && "hours"].filter(Boolean)
    : [!price && "pricing"].filter(Boolean)
  checks.push({ key: "facts", label: opts.isLocal ? "Phone, address and hours on the page" : "Pricing on the site", ok: factsOk, detail: factsOk ? "Present" : `Missing ${missing.join(", ")}` })

  // blog freshness
  const blogLink = $('a[href*="/blog" i], a[href*="/news" i], a[href*="/articles" i], a[href*="/insights" i]').first().attr("href")
  let blog = { found: false, posts: 0, lastDate: null as string | null }
  if (blogLink) {
    const url = blogLink.startsWith("http") ? blogLink : `${origin}${blogLink.startsWith("/") ? "" : "/"}${blogLink}`
    const page = await get(url)
    if (page && page.ok) {
      const $$ = load(page.text)
      const links = new Set<string>()
      $$('a[href]').each((_, a) => {
        const h = $$(a).attr("href") || ""
        if (/\/(blog|news|articles|insights|posts?)\/[a-z0-9-]{6,}/i.test(h)) links.add(h)
      })
      const dates = [...page.text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+(20\d{2})\b/gi)]
        .map((m) => new Date(m[0]))
        .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() <= Date.now() + 86_400_000)
        .sort((a, b) => b.getTime() - a.getTime())
      blog = { found: true, posts: links.size, lastDate: dates[0] ? dates[0].toISOString().slice(0, 10) : null }
    }
  }
  const fresh = blog.lastDate ? Date.now() - new Date(blog.lastDate).getTime() < 90 * 86_400_000 : false
  checks.push({
    key: "blog",
    label: "Fresh content AI can quote",
    ok: blog.found ? (blog.lastDate ? fresh : blog.posts > 0 ? null : false) : false,
    detail: !blog.found ? "No blog or news section" : blog.lastDate ? `${blog.posts || "Some"} posts · last ${blog.lastDate}` : `${blog.posts} posts · no dates found`,
  })

  // title / description
  const title = $("title").first().text().trim()
  const desc = ($('meta[name="description"]').attr("content") || "").trim()
  const metaOk = title.length >= 15 && title.length <= 70 && desc.length >= 50
  checks.push({ key: "meta", label: "Clear page title and description", ok: metaOk, detail: metaOk ? "Good" : !desc ? "No description" : title.length < 15 ? "Title too short" : "Needs work" })

  // speed
  const speedOk = home.ms < 1500
  checks.push({ key: "speed", label: "Loads fast", ok: speedOk, detail: `${(home.ms / 1000).toFixed(1)}s to first byte` })

  const passed = checks.filter((c) => c.ok === true).length
  return { domain, checks, passed, total: checks.length, blog }
}

// When the SERP didn't hand us a competitor's domain, ask Haiku for it and
// VERIFY by fetching: the page must exist and carry the name. A wrong guess
// returns null rather than a stranger's website.
export async function findCompetitorDomain(name: string, city: string): Promise<string | null> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 60,
      messages: [{ role: "user", content: `Official website domain (just the bare domain, e.g. example.com) for the business "${name}"${city ? ` in ${city}` : ""}. If unsure reply exactly: unknown` }],
    })
    const raw = (msg.content[0]?.type === "text" ? msg.content[0].text : "").trim().toLowerCase()
    const m = raw.match(/([a-z0-9-]+\.)+[a-z]{2,}/)
    if (!m || /unknown/.test(raw)) return null
    const domain = m[0].replace(/^www\./, "")
    const page = await get(`https://${domain}/`, 7000)
    if (!page || !page.ok) return null
    const tokens = name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((t) => t.length > 3 && !["restaurant", "dental", "clinic", "the", "and"].includes(t))
    const body = page.text.toLowerCase()
    return tokens.length === 0 || tokens.some((t) => body.includes(t)) ? domain : null
  } catch {
    return null
  }
}

export async function checkSites(you: string, competitorDomains: string[], isLocal: boolean): Promise<SiteChecks> {
  const [mine, ...theirs] = await Promise.allSettled([
    checkSite(you, { isLocal }),
    ...competitorDomains.slice(0, 2).map((d) => checkSite(d, { isLocal })),
  ])
  return {
    you: mine.status === "fulfilled" ? mine.value : null,
    competitors: theirs.filter((r): r is PromiseFulfilledResult<SiteCheck | null> => r.status === "fulfilled").map((r) => r.value).filter((v): v is SiteCheck => !!v),
  }
}
