// What an AI assistant finds when it reads a website — ~23 plain HTTP checks,
// no LLM. Run for the scanned business and its top competitors so the /start
// conversation can say "they have it, you don't" with evidence. Every check
// is best-effort: a fetch failure yields ok=null ("couldn't check"), never a
// fabricated fail.

// Server-only (fetches + Anthropic). Client code imports the labels from
// lib/site-check-labels.ts so the SDK never lands in a browser bundle.
import { claudeFor } from "@/lib/claude"
import { safeFetch } from "@/lib/safe-fetch"
import type { CheckKey } from "@/lib/site-check-labels"

const anthropic = claudeFor("site-check")
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
  /** Set when the homepage refused an automated reader (403/5xx/challenge/no response) — itself the finding. */
  blocked?: { status: number | null; redirectedTo: string | null }
}

export interface SiteChecks {
  you: SiteCheck | null
  competitors: SiteCheck[]
}

// Bots that fetch pages to ANSWER a user (blocking them removes you from that
// assistant's answers) vs bots that only collect TRAINING data (blocking them
// is a legitimate choice and doesn't hide you from AI search).
const SEARCH_BOTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Bingbot", "Googlebot"]
const TRAINING_BOTS = ["GPTBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Applebot-Extended", "CCBot"]
// The user agents the real AI crawlers send. A firewall/CDN that serves them a
// 403 or a challenge page hides the site from that assistant. We call from our
// own IPs, so this is reported as "likely" — Cloudflare also checks IPs.
// Structural fetches (homepage, robots, sitemap, redirects) go out as a normal
// browser: many hosts 403 unknown bots, which would turn into false "missing"
// findings. Only the AI-crawler test below uses the crawlers' own identities.
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
const UA = BROWSER_UA
const BOT_UAS: Record<string, string> = {
  ChatGPT: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
  Claude: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  Perplexity: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
}

type Fetched = { ok: boolean; status: number; text: string; ms: number; finalUrl: string; headers: Headers; location: string | null }

async function get(url: string, ms = 7000, ua = UA, redirect: RequestRedirect = "follow"): Promise<Fetched | null> {
  const t0 = Date.now()
  try {
    const res = await safeFetch(url, { headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml,*/*" }, redirect, signal: AbortSignal.timeout(ms) })
    const text = res.ok ? (await res.text()).slice(0, 3_000_000) : ""
    return { ok: res.ok, status: res.status, text, ms: Date.now() - t0, finalUrl: res.url || url, headers: res.headers, location: res.headers.get("location") }
  } catch {
    return null
  }
}

// Cloudflare / Sucuri / Imperva "checking your browser" pages come back with
// no real content. Treat them as a closed door.
function isChallenge(f: Fetched | null): boolean {
  if (!f) return false
  if (f.headers.get("cf-mitigated") === "challenge") return true
  if ([202, 401, 403, 429, 503].includes(f.status)) return true
  // An "OK" with an empty body is a JavaScript challenge (AWS WAF, Sucuri…), not a page.
  if (f.ok && f.text.trim().length < 200) return true
  return f.text.length < 60_000 && /cf-chl-|challenge-platform|<title>Just a moment\.\.\.|Attention Required! \| Cloudflare|sucuri_cloudproxy|_Incapsula_Resource|captcha-delivery/i.test(f.text)
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

function robotsFindings(robots: string): { search: string[]; training: string[]; signalNo: boolean } {
  // A "User-agent: X" group with "Disallow: /" blocks X. "User-agent: *" +
  // "Disallow: /" blocks every bot that has no group of its own.
  const search = new Set<string>()
  const training = new Set<string>()
  const named = new Set<string>()
  let starBlocked = false
  for (const g of robots.split(/\n(?=\s*user-agent:)/i)) {
    const agents = [...g.matchAll(/user-agent:\s*([^\n#]+)/gi)].map((m) => m[1].trim())
    agents.forEach((a) => named.add(a.toLowerCase()))
    if (!/^\s*disallow:\s*\/\s*$/im.test(g)) continue
    for (const a of agents) {
      if (a === "*") starBlocked = true
      const s = SEARCH_BOTS.find((b) => b.toLowerCase() === a.toLowerCase())
      const t = TRAINING_BOTS.find((b) => b.toLowerCase() === a.toLowerCase())
      if (s) search.add(s)
      if (t) training.add(t)
    }
  }
  if (starBlocked) SEARCH_BOTS.filter((b) => !named.has(b.toLowerCase())).forEach((b) => search.add(b))
  // Cloudflare's managed robots.txt: "Content-Signal: search=yes, ai-input=no".
  const signalNo = /content-signal:[^\n]*ai-input\s*=\s*no/i.test(robots)
  return { search: [...search], training: [...training], signalNo }
}

const LABELS: Record<CheckKey, string> = {
  aibots: "AI can open your site",
  robots: "Your site’s settings let AI in",
  indexable: "Google is allowed to show your pages",
  render: "Words show up without extra code",
  canonical: "Each page is treated as the original",
  https: "One secure address",
  bing: "Set up with Bing (ChatGPT search uses it)",
  llms: "Summary file for AI assistants",
  sitemap: "A list of your pages for Google",
  speed: "Loads fast",
  schema: "Business facts in a form AI reads",
  schemaFacts: "Those business facts are complete",
  facts: "Phone, address and hours on the page",
  local: "Says which city you serve",
  meta: "Clear page title and Google summary",
  headings: "Clear main heading",
  depth: "Enough words to quote",
  pages: "Pages for each service",
  faq: "Answers to customer questions (FAQ)",
  reviews: "Reviews AI can read on your site",
  profiles: "Links to your Google, Yelp and social profiles",
  about: "About page — who you are",
  blog: "Fresh content AI can quote",
}

const ORDER: CheckKey[] = [
  "aibots", "robots", "indexable", "render", "canonical", "https", "bing", "llms", "sitemap", "speed",
  "schema", "schemaFacts", "facts", "local", "meta", "headings", "depth", "pages", "faq",
  "reviews", "profiles", "about", "blog",
]

const PROFILE_HOSTS: [RegExp, string][] = [
  [/(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|g\.page|goo\.gl\/maps|business\.google\.com|g\.co\/kgs|maps\.google\.)/i, "Google"],
  [/yelp\.[a-z.]+/i, "Yelp"],
  [/facebook\.com/i, "Facebook"],
  [/instagram\.com/i, "Instagram"],
  [/linkedin\.com/i, "LinkedIn"],
  [/(twitter\.com|\/\/(www\.)?x\.com)/i, "X"],
  [/youtube\.com/i, "YouTube"],
  [/tiktok\.com/i, "TikTok"],
  [/bbb\.org/i, "BBB"],
  [/tripadvisor\./i, "Tripadvisor"],
  [/(healthgrades|zocdoc|vitals\.com|webmd)/i, "health directory"],
  [/(avvo|justia|martindale|findlaw)/i, "legal directory"],
  [/(angi\.com|angieslist|homeadvisor|houzz|thumbtack|porch\.com|nextdoor)/i, "home-services directory"],
  [/(opentable|resy\.com)/i, "OpenTable/Resy"],
  [/(trustpilot|g2\.com|capterra)/i, "review site"],
]

function normUrl(u: string, base: string): string | null {
  try {
    const x = new URL(u, base)
    return `${x.hostname.replace(/^www\./, "")}${x.pathname.replace(/\/+$/, "")}`
  } catch {
    return null
  }
}

function jsonLdObjects($: ReturnType<typeof import("cheerio").load>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const walk = (n: unknown) => {
        if (!n || typeof n !== "object") return
        if (Array.isArray(n)) return n.forEach(walk)
        const o = n as Record<string, unknown>
        out.push(o)
        if (Array.isArray(o["@graph"])) walk(o["@graph"])
      }
      walk(JSON.parse($(el).text()))
    } catch {}
  })
  return out
}

function typesOf(o: Record<string, unknown>): string[] {
  const t = o["@type"]
  return typeof t === "string" ? [t] : Array.isArray(t) ? t.filter((x): x is string => typeof x === "string") : []
}

const LOCAL_TYPES = /LocalBusiness|Dentist|Restaurant|Plumber|Electrician|HVAC|Roofing|Medical|Physician|Attorney|Legal|Store|AutoRepair|HomeAndConstruction|HealthAndBeauty|FoodEstablishment|ProfessionalService|Organization/i
const ONLINE_TYPES = /Organization|SoftwareApplication|Product|Corporation/i

function finish(domain: string, items: SiteCheckItem[], blog: SiteCheck["blog"], blocked?: SiteCheck["blocked"]): SiteCheck {
  const checks = ORDER.map((k) => items.find((c) => c.key === k)).filter((c): c is SiteCheckItem => !!c)
  return { domain, checks, passed: checks.filter((c) => c.ok === true).length, total: checks.length, blog, ...(blocked ? { blocked } : {}) }
}

export async function checkSite(input: string, opts: { isLocal: boolean; city?: string }): Promise<SiteCheck | null> {
  const origin = normalizeSite(input)
  if (!origin) return null
  const host = new URL(origin).hostname
  const domain = host.replace(/^www\./, "")
  const altHost = host.startsWith("www.") ? domain : `www.${domain}`

  const [home, llms, robots, sitemapStd, gpt, claude, pplx, plain, alt, bingAuth] = await Promise.all([
    get(`${origin}/`, 9000),
    get(`${origin}/llms.txt`),
    get(`${origin}/robots.txt`),
    get(`${origin}/sitemap.xml`),
    get(`${origin}/`, 8000, BOT_UAS.ChatGPT),
    get(`${origin}/`, 8000, BOT_UAS.Claude),
    get(`${origin}/`, 8000, BOT_UAS.Perplexity),
    get(`http://${host}/`, 6000, UA, "manual"),
    get(`https://${altHost}/`, 6000, UA, "manual"),
    get(`${origin}/BingSiteAuth.xml`, 5000),
  ])
  const usable = (f: Fetched | null) => !!f && f.ok && !isChallenge(f)

  // Sitemap: /sitemap.xml, else whatever robots.txt declares, else the WordPress index.
  let sitemap = sitemapStd
  if (!sitemap || !sitemap.ok || !/<urlset|<sitemapindex/i.test(sitemap.text)) {
    const declared = robots && robots.ok ? [...robots.text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]) : []
    const tries = await Promise.all([...declared.slice(0, 2), `${origin}/sitemap_index.xml`].map((u) => get(u, 5000)))
    sitemap = tries.find((f) => f && f.ok && /<urlset|<sitemapindex/i.test(f.text)) ?? sitemap
  }

  const items: SiteCheckItem[] = []
  const push = (key: CheckKey, ok: boolean | null, detail: string, label?: string) => items.push({ key, label: label ?? LABELS[key], ok, detail })

  // robots.txt — computable even when the homepage turns us away.
  const rf = robots && robots.ok && !/<html/i.test(robots.text) ? robotsFindings(robots.text) : { search: [], training: [], signalNo: false }
  const robotsItem = () => {
    if (rf.search.length) return push("robots", false, `Blocks ${rf.search.slice(0, 4).join(", ")} — ${rf.search.length > 1 ? "those assistants" : "that assistant"} can’t use your site in answers`)
    if (rf.signalNo) return push("robots", false, "Tells AI not to use your pages in answers (ai-input=no)")
    if (rf.training.length) return push("robots", true, `Search allowed · blocks training only (${rf.training.slice(0, 3).join(", ")}) — fine`)
    push("robots", true, robots && robots.ok ? "Allowed" : "No robots.txt — allowed by default")
  }
  const llmsOk = !!(llms && llms.ok && /^#|\w/.test(llms.text.trim()) && !/<html/i.test(llms.text))

  // A site that turns away an automated reader is a finding, not a missing
  // data point — some AI crawlers get the same door. Report it as such.
  if (!home || !usable(home)) {
    const finalHost = home?.finalUrl ? new URL(home.finalUrl).hostname.replace(/^www\./, "") : null
    const redirectedTo = finalHost && finalHost !== domain ? finalHost : null
    const status = home?.status ?? null
    push(
      "aibots",
      false,
      status && status < 300
        ? `Your site showed a bot check instead of the page${redirectedTo ? ` after redirecting to ${redirectedTo}` : ""}`
        : status ? `Your site refused an automated visitor (HTTP ${status})${redirectedTo ? ` after redirecting to ${redirectedTo}` : ""}` : "Your site didn’t respond to an automated visitor",
      "AI can read your site"
    )
    robotsItem()
    push("llms", llms ? llmsOk : null, llms ? (llmsOk ? "Present" : "Missing") : "Couldn’t check — site blocked the reader")
    for (const k of ORDER) if (!items.some((c) => c.key === k)) push(k, null, "Couldn’t check — site blocked the reader")
    return finish(domain, items, { found: false, posts: 0, lastDate: null }, { status, redirectedTo })
  }

  const html = home.text
  const { load } = await import("cheerio")
  const $ = load(html)
  const text = $("body").clone().find("script,style,noscript,template").remove().end().text().replace(/\s+/g, " ").trim()
  const words = text.split(" ").filter((w) => /[a-z]{2,}/i.test(w)).length
  const hrefs = $("a[href]").map((_, a) => $(a).attr("href") || "").get()
  const ld = jsonLdObjects($)
  const types = new Set(ld.flatMap(typesOf))

  // ── Can AI get in? ─────────────────────────────────────────────────────────
  const bots = { ChatGPT: gpt, Claude: claude, Perplexity: pplx }
  const turnedAway = Object.entries(bots).filter(([, f]) => f !== null && (!f.ok || isChallenge(f))).map(([n]) => n)
  const allUnknown = Object.values(bots).every((f) => f === null)
  push(
    "aibots",
    allUnknown ? null : turnedAway.length === 0,
    allUnknown ? "Couldn’t test" : turnedAway.length ? `${turnedAway.join(", ")}’s crawler${turnedAway.length > 1 ? "s" : ""} likely blocked by your firewall or CDN` : "ChatGPT, Claude and Perplexity crawlers get in"
  )

  robotsItem()

  const metaRobots = [$('meta[name="robots" i]').attr("content"), $('meta[name="googlebot" i]').attr("content"), home.headers.get("x-robots-tag")].filter(Boolean).join(",").toLowerCase()
  const noindex = /noindex|\bnone\b/.test(metaRobots)
  const nosnippet = /nosnippet|max-snippet\s*:\s*(0|[1-4]\d?)\b/.test(metaRobots)
  push("indexable", !noindex && !nosnippet, noindex ? "Your homepage says “noindex” — search and AI search are told to skip it" : nosnippet ? "Your homepage blocks snippets — Google’s AI answers can’t quote it" : "Allowed")

  push("render", words >= 100, words >= 100 ? `${words.toLocaleString("en-US")} words readable` : `Only ${words} words readable before JavaScript runs — ChatGPT, Claude and Perplexity don’t run it`)

  // Canonical: the homepage must point at itself, and inner pages must not
  // point at the homepage (that silently de-indexes them — it happened to us).
  const homeNorm = normUrl(home.finalUrl, home.finalUrl)
  const canonHref = $('link[rel="canonical" i]').attr("href")
  const canonNorm = canonHref ? normUrl(canonHref, home.finalUrl) : null
  let canonical: { ok: boolean | null; detail: string } = { ok: true, detail: "Not set — search engines choose" }
  if (canonHref && canonNorm && homeNorm && canonNorm !== homeNorm) {
    const canonHost = canonNorm.split("/")[0]
    canonical = canonHost !== domain
      ? { ok: false, detail: `Your homepage says its real version is on ${canonHost} — that site gets the credit` }
      : { ok: false, detail: `Your homepage says its real version is ${canonNorm.slice(canonHost.length) || "/"}` }
  } else if (canonHref) {
    canonical = { ok: true, detail: "Correct" }
  }

  // ── Stage 2 (parallel): blog page, one inner page from the sitemap. ─────────
  const smText = sitemap && sitemap.ok ? sitemap.text : ""
  const smIsIndex = /<sitemapindex/i.test(smText)
  const locs = (t: string) => [...t.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"))
  // Index page first ("/blog", "/blogs", "/news"…), else the section of a linked post.
  const BLOG_SECTION = "blogs?|news|articles?|insights|journal"
  const blogLink =
    hrefs.find((h) => new RegExp(`/(${BLOG_SECTION})/?(\\?|#|$)`, "i").test(h)) ??
    hrefs.map((h) => h.match(new RegExp(`^(.*?/(?:${BLOG_SECTION}))/[a-z0-9-]{6,}`, "i"))?.[1]).find(Boolean)

  // `paths`: every page path the sitemap lists (all child sitemaps of an index, up to 4), so a
  // page the homepage doesn't link to (an About page only in the footer of inner pages, a /faq)
  // still counts. A false "you don't have X" costs more trust than a missed pass.
  type Inner = { count: number | null; innerPath: string | null; innerCanon: string | null; paths: string[] }
  const innerTask: Promise<Inner> = (async () => {
    let urls = locs(smText)
    let count: number | null = smIsIndex ? null : urls.length || null
    if (smIsIndex && urls.length) {
      const children = await Promise.all(urls.slice(0, 4).map((u) => get(u, 5000)))
      urls = children.flatMap((c) => (c && c.ok ? locs(c.text) : []))
      count = urls.length || null
    }
    const paths = urls.flatMap((u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") === domain ? [x.pathname.replace(/\/+$/, "") || "/"] : [] } catch { return [] } })
    const inner = urls.find((u) => {
      const n = normUrl(u, origin)
      return !!n && n !== homeNorm && n.startsWith(domain) && !/\.(xml|pdf|jpe?g|png|webp)$/i.test(n)
    })
    if (!inner) return { count, innerPath: null, innerCanon: null, paths }
    const page = await get(inner, 6000)
    if (!page || !page.ok) return { count, innerPath: null, innerCanon: null, paths }
    const c = load(page.text)('link[rel="canonical" i]').attr("href")
    return { count, innerPath: new URL(inner).pathname, innerCanon: c ? normUrl(c, page.finalUrl) : null, paths }
  })().catch(() => ({ count: null, innerPath: null, innerCanon: null, paths: [] as string[] }))

  const blogTask: Promise<SiteCheck["blog"]> = (async () => {
    // No blog link on the homepage: the sitemap's blog section ("/blog/my-post" → "/blog").
    const link = blogLink ?? (await innerTask).paths.map((p) => p.match(new RegExp(`^(/(?:${BLOG_SECTION}))/[a-z0-9-]{6,}`, "i"))?.[1]).find(Boolean)
    if (!link) return { found: false, posts: 0, lastDate: null }
    const url = link.startsWith("http") ? link : `${origin}${link.startsWith("/") ? "" : "/"}${link}`
    const page = await get(url, 6000)
    if (!page || !page.ok) return { found: false, posts: 0, lastDate: null }
    const $$ = load(page.text)
    const links = new Set<string>()
    $$("a[href]").each((_, a) => {
      const h = $$(a).attr("href") || ""
      if (new RegExp(`/(${BLOG_SECTION}|posts?)/[a-z0-9-]{6,}`, "i").test(h)) links.add(h)
    })
    const dates = [...page.text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+(20\d{2})\b/gi)]
      .map((m) => new Date(m[0]))
      .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() <= Date.now() + 86_400_000)
      .sort((a, b) => b.getTime() - a.getTime())
    return { found: true, posts: links.size, lastDate: dates[0] ? dates[0].toISOString().slice(0, 10) : null }
  })().catch(() => ({ found: false, posts: 0, lastDate: null }))

  const [innerRes, blog] = await Promise.all([innerTask, blogTask])

  if (canonical.ok !== false && innerRes.innerPath && innerRes.innerCanon && homeNorm && innerRes.innerCanon === homeNorm) {
    canonical = { ok: false, detail: `Inner pages (like ${innerRes.innerPath}) say they’re copies of your homepage — Google drops them` }
  }
  push("canonical", canonical.ok, canonical.detail)

  // One secure address: http → https, and www / non-www collapse to one.
  const finalHttps = home.finalUrl.startsWith("https://")
  const httpRedirects = !plain || (plain.status >= 300 && plain.status < 400 && /^https:/i.test(plain.location || ""))
  const altCanon = alt && alt.ok ? load(alt.text)('link[rel="canonical" i]').attr("href") : undefined
  let altCanonHost: string | null = null
  try { altCanonHost = altCanon ? new URL(altCanon, `https://${altHost}/`).hostname : null } catch {}
  // Only a split if the address the site settles on is the one typed AND the
  // other variant serves its own page without pointing back.
  const realHost = new URL(home.finalUrl).hostname
  const altSplit = realHost === host && !!alt && alt.ok && !isChallenge(alt) && altCanonHost !== host
  const httpsProblems = [!finalHttps && "No secure (https) version", finalHttps && !httpRedirects && "http:// doesn’t redirect to https", altSplit && `${altHost} and ${host} load as two separate sites`].filter((x): x is string => !!x)
  push("https", httpsProblems.length === 0, httpsProblems.length ? httpsProblems.join("; ") : "Yes")

  // Bing verification usually leaves no trace on the site (DNS record, or imported from Google
  // Search Console), so a missing tag is "can't tell", never "you're not set up".
  const bingOk = !!$('meta[name="msvalidate.01" i]').attr("content") || !!(bingAuth && bingAuth.ok && /<users>/i.test(bingAuth.text))
  push("bing", bingOk ? true : null, bingOk ? "Verified with Bing Webmaster Tools" : "Can’t tell from your site (Bing is often verified by DNS or through Google Search Console)")

  push("llms", llms ? llmsOk : null, llmsOk ? "Present" : "Missing")

  const smOk = /<urlset|<sitemapindex/i.test(smText)
  push("sitemap", sitemap ? smOk : null, smOk ? (innerRes.count ? `${innerRes.count} ${innerRes.count === 1 ? "page" : "pages"} listed` : "Present") : "Missing")

  push("speed", home.ms < 1500, `${(home.ms / 1000).toFixed(1)}s to first byte`)

  // ── Can AI understand you? ─────────────────────────────────────────────────
  const wanted = opts.isLocal ? LOCAL_TYPES : ONLINE_TYPES
  const biz = ld.filter((o) => typesOf(o).some((t) => wanted.test(t)))
  const hasBiz = biz.length > 0
  push("schema", hasBiz, hasBiz ? [...types].slice(0, 3).join(", ") : types.size ? `Only ${[...types].slice(0, 2).join(", ")}` : "None")

  if (!hasBiz) {
    push("schemaFacts", false, "Nothing to check — no structured facts yet")
  } else {
    const has = (k: string) => biz.some((o) => o[k] != null && o[k] !== "")
    const need: [string, string][] = opts.isLocal
      ? [["address", "address"], ["telephone", "phone"], ["openingHoursSpecification", "hours"], ["geo", "map location"], ["sameAs", "profile links"]]
      : [["url", "website"], ["logo", "logo"], ["sameAs", "profile links"], ["description", "description"]]
    const gaps = need.filter(([k]) => !(has(k) || (k === "openingHoursSpecification" && has("openingHours")))).map(([, n]) => n)
    push("schemaFacts", gaps.length <= 1, gaps.length === 0 ? "Complete" : gaps.length === 1 ? `Mostly complete · no ${gaps[0]}` : `Missing ${gaps.join(", ")}`)
  }

  const phone = /(\+?\d[\d\s().-]{8,}\d)/.test(text) || hrefs.some((h) => /^tel:/i.test(h))
  const address = /\b\d{2,5}\s+([A-Z][a-zA-Z]+\s+){1,3}(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Suite|Ste|Hwy|Highway|Pkwy|Parkway|Ct|Court|Pl|Place)\b/.test(text)
  const hours = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b[^.]{0,40}\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(text) || /opening hours|open (daily|every day)|open 24/i.test(text)
  const price = /\$\s?\d{2,}|\bpricing\b|\bper month\b|\/mo\b/i.test(text)
  const factsOk = opts.isLocal ? phone && (address || hours) : price || hrefs.some((h) => /pric/i.test(h))
  const missing = opts.isLocal ? [!phone && "phone", !address && "address", !hours && "hours"].filter(Boolean) : [!price && "pricing"].filter(Boolean)
  push("facts", factsOk, missing.length === 0 ? "Present" : factsOk ? `Present · no ${missing.join(" or ")}` : `Missing ${missing.join(", ")}`, opts.isLocal ? LABELS.facts : "Pricing on the site")

  const title = $("title").first().text().trim()
  const h1s = $("h1").map((_, h) => $(h).text().trim()).get().filter(Boolean)
  if (opts.isLocal) {
    const city = /^your area$/i.test((opts.city || "").trim()) ? "" : (opts.city || "").split(",")[0].trim()
    if (city.length >= 3) {
      const re = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
      const inTop = re.test(title) || h1s.some((h) => re.test(h))
      const inBody = re.test(text)
      push("local", inTop, inTop ? `${city} is in your title or main heading` : inBody ? `${city} is only in the small print — not your title or heading` : `${city} isn’t mentioned`)
    } else {
      push("local", null, "Couldn’t tell which city you serve")
    }
  }

  const desc = ($('meta[name="description" i]').attr("content") || "").trim()
  const metaOk = title.length >= 15 && title.length <= 70 && desc.length >= 50
  push("meta", metaOk, metaOk ? "Good" : !desc ? "No description" : title.length < 15 ? "Title too short" : title.length > 70 ? `Title is ${title.length} characters; Google shows about 60` : "Description too short")

  push("headings", h1s.length > 0, h1s.length ? `“${h1s[0].slice(0, 60)}”` : "No main heading (H1)")

  push("depth", words >= 100 ? words >= 300 : null, words >= 300 ? `${words.toLocaleString("en-US")} words on the homepage` : words >= 100 ? `Only ${words} words on the homepage` : "See “readable without JavaScript”")

  const navLinks = new Set(hrefs.map((h) => normUrl(h, home.finalUrl)).filter((n): n is string => !!n && n.startsWith(domain) && n !== homeNorm))
  const pageCount = innerRes.count ?? navLinks.size
  if (innerRes.count == null && navLinks.size === 0) push("pages", null, "Couldn’t find your list of pages")
  else push("pages", pageCount >= 6, `${pageCount} ${pageCount === 1 ? "page" : "pages"} ${innerRes.count != null ? "in your sitemap" : "linked from your homepage"}`)

  const faqPage = innerRes.paths.find((p) => /\/(faqs?|frequently-asked-questions)(\/|$)/i.test(p))
  const faqOk = types.has("FAQPage") || /\bFAQs?\b|frequently asked/i.test(text) || hrefs.some((h) => /faq/i.test(h)) || !!faqPage
  push("faq", faqOk, faqOk ? (faqPage && !types.has("FAQPage") ? `Found at ${faqPage}` : "Found") : "None found")

  // ── Can AI trust you? ──────────────────────────────────────────────────────
  // Only reviews in the HTML count: widgets load by script, which AI readers don't run.
  const hasRatingLd = ld.some((o) => o.aggregateRating != null || o.review != null || typesOf(o).some((t) => /Review|AggregateRating/.test(t)))
  const reviewText = /testimonials?|what (our )?(clients|customers|patients|guests) (say|are saying)|what [a-z&' -]{2,30} (say|said|are saying)\b|customer reviews|google reviews|\b[45](\.\d)?\s*(stars?|★)|★★★★/i.test(text)
  // A testimonials section in the HTML itself (heading "What Industry Leaders Say", id/aria
  // "testimonials") with real quote text in it: AI readers can see that.
  const reviewBlock = $('[id*="testimonial" i], [class*="testimonial" i], [aria-label*="testimonial" i], [aria-labelledby*="testimonial" i], [id*="review" i], [class*="reviews" i]')
    .toArray()
    .some((el) => $(el).text().replace(/\s+/g, " ").trim().length >= 80)
  const reviewPage = innerRes.paths.find((p) => /\/(testimonials?|reviews|success-stories|what-(our-)?(clients|customers)-say)(\/|$)/i.test(p))
  const reviewWidget = /elfsight|trustindex|birdeye|podium|reviewsonmywebsite|embedsocial|grade\.us|yotpo|judge\.me|sociablekit/i.test(html)
  const reviewsOk = hasRatingLd || reviewText || reviewBlock || !!reviewPage
  push(
    "reviews",
    reviewsOk,
    hasRatingLd ? "Rating in structured facts" : reviewText || reviewBlock ? "Found on the page" : reviewPage ? `Found at ${reviewPage}` : reviewWidget ? "Only a review widget — AI readers can’t see it" : "None found"
  )

  const sameAs = ld.flatMap((o) => (Array.isArray(o.sameAs) ? o.sameAs : o.sameAs ? [o.sameAs] : [])).filter((x): x is string => typeof x === "string")
  const found = new Set(PROFILE_HOSTS.filter(([re]) => [...hrefs, ...sameAs].some((h) => re.test(h))).map(([, n]) => n))
  const noGoogle = opts.isLocal && !found.has("Google")
  push("profiles", found.size >= 2 && !noGoogle, found.size ? `${[...found].slice(0, 4).join(", ")}${noGoogle ? " — no Google Maps link" : ""}` : "None linked")

  const about = await findAbout($, hrefs, innerRes.paths, text, origin, domain, title)
  push("about", about.ok, about.detail)

  const fresh = blog.lastDate ? Date.now() - new Date(blog.lastDate).getTime() < 90 * 86_400_000 : false
  push(
    "blog",
    blog.found ? (blog.lastDate ? fresh : blog.posts > 0 ? null : false) : false,
    !blog.found ? "No blog or news section" : blog.lastDate ? `${blog.posts || "Some"} posts · last ${blog.lastDate}` : `${blog.posts} posts · no dates found`
  )

  return finish(domain, items, blog)
}

// About page: a homepage link (by address or by its words: "About", "Company", "Our story"…),
// a sitemap entry, or one of the usual addresses answering with a real page. Many sites link
// About only from the footer of inner pages or from a menu built by script (gigaboost.ai/about
// was reported missing on 2026-11-27), so the address probe is what makes this check fair.
const ABOUT_PATH = /\/(about(-us|-me)?|about-[a-z0-9-]+|company|our-company|team|our-team|the-team|our-story|story|who-we-are|meet-(the-)?(team|doctor|doctors|dr|owner|founders?))(\/|$)/i
const ABOUT_WORDS = /^(about( us| me)?|about [\w .&'’-]{1,40}|company|our company|team|our team|the team|meet the (team|doctor|founders?)|our story|who we are)$/i
const ABOUT_PROBES = ["/about", "/about-us", "/company", "/team", "/our-story"]

async function findAbout(
  $: ReturnType<typeof import("cheerio").load>,
  hrefs: string[],
  sitemapPaths: string[],
  text: string,
  origin: string,
  domain: string,
  homeTitle: string
): Promise<{ ok: boolean | null; detail: string }> {
  const pathOf = (h: string) => { try { const u = new URL(h, origin); return u.hostname.replace(/^www\./, "") === domain ? u.pathname : null } catch { return null } }
  const linked = hrefs.map(pathOf).find((p) => !!p && ABOUT_PATH.test(p))
  if (linked) return { ok: true, detail: `Found at ${linked.replace(/\/+$/, "") || "/"}` }
  let byWords: string | null = null
  $("a[href]").each((_, a) => {
    if (byWords) return
    const words = $(a).text().replace(/\s+/g, " ").trim()
    const p = pathOf($(a).attr("href") || "")
    if (p && p !== "/" && ABOUT_WORDS.test(words)) byWords = p
  })
  if (byWords) return { ok: true, detail: `Found at ${byWords}` }
  const listed = sitemapPaths.find((p) => ABOUT_PATH.test(p))
  if (listed) return { ok: true, detail: `Found at ${listed}` }
  if (/\babout us\b|our story|meet the (team|doctor)|who we are/i.test(text)) return { ok: true, detail: "Found on your homepage" }

  // Probe the usual addresses. Single-page sites answer 200 for ANY address with the same shell,
  // so a page only counts when it reads like an About page or differs from a made-up address.
  const { load } = await import("cheerio")
  const [baseline, ...pages] = await Promise.all([
    get(`${origin}/alphaa-check-${Math.random().toString(36).slice(2, 10)}`, 5000),
    ...ABOUT_PROBES.map((p) => get(`${origin}${p}`, 5000)),
  ])
  const titleOf = (f: Fetched | null) => (f && f.ok ? load(f.text)("title").first().text().trim() : "")
  const baseTitle = titleOf(baseline)
  let unknown = pages.every((f) => f === null)
  for (let i = 0; i < pages.length; i++) {
    const f = pages[i]
    if (!f || !f.ok || isChallenge(f)) continue
    let finalHost = ""
    let finalPath = ABOUT_PROBES[i]
    try { const u = new URL(f.finalUrl); finalHost = u.hostname.replace(/^www\./, ""); finalPath = u.pathname.replace(/\/+$/, "") || "/" } catch {}
    if (finalHost && finalHost !== domain) continue
    if (finalPath === "/") continue // redirected home: no About page there
    const $$ = load(f.text)
    const t = $$("title").first().text().trim()
    const h1 = $$("h1").first().text().trim()
    const aboutish = /\babout\b|our story|our team|the team|who we are|company|founder/i.test(`${t} ${h1}`)
    const distinct = !!t && t !== baseTitle && t !== homeTitle
    if (aboutish || distinct) return { ok: true, detail: `Found at ${finalPath}` }
    unknown = false
  }
  return unknown ? { ok: null, detail: "Couldn’t check" } : { ok: false, detail: "None found" }
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

export async function checkSites(you: string, competitorDomains: string[], isLocal: boolean, city = ""): Promise<SiteChecks> {
  const [mine, ...theirs] = await Promise.allSettled([
    checkSite(you, { isLocal, city }),
    ...competitorDomains.slice(0, 2).map((d) => checkSite(d, { isLocal, city })),
  ])
  return {
    you: mine.status === "fulfilled" ? mine.value : null,
    competitors: theirs.filter((r): r is PromiseFulfilledResult<SiteCheck | null> => r.status === "fulfilled").map((r) => r.value).filter((v): v is SiteCheck => !!v),
  }
}
