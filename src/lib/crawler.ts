// eslint-disable-next-line @typescript-eslint/no-require-imports
import { load } from "cheerio"
import { safeFetch } from "@/lib/safe-fetch"
import { checkLinks, classify, stateText, type LinkCheck } from "@/lib/seo/links"

type CheerioRoot = ReturnType<typeof load>
// Use the element type that works with both old @types/cheerio and new cheerio
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyElement = any

export type CrawlIssue = {
  type: string
  severity: "critical" | "warning" | "improvement"
  url: string
  description: string
  fix: string
  // Set on AI-crawler-block issues so the UI can render a per-engine card.
  engine?: string
  // Link issues (broken_internal_link / broken_outbound_link / redirect_chain): the link
  // itself, what it answered, the redirect hops and the pages on the site that link to it.
  target?: string
  status?: number | null
  hops?: string[]
  finalUrl?: string
  sources?: string[]
}

export type CrawlOutput = {
  pagesScanned: number
  issues: CrawlIssue[]
  schemaFound: string[]
  schemaMissing: string[]
  metaIssues: {
    missingTitles: number
    missingDescriptions: number
    missingH1: number
    imagesWithoutAlt: number
    /** Set when links were checked (own-site crawl): how many internal / outbound links. */
    linksChecked?: number
    outboundChecked?: number
  }
}

const STANDARD_SCHEMA_TYPES = ["LocalBusiness", "WebSite", "BreadcrumbList", "FAQPage", "Article"]
const USER_AGENT = "AlphaaBot/1.0 (SEO audit; +https://alphaa.app)"
const FETCH_TIMEOUT_MS = 5000

interface PageData {
  url: string
  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  h1Count: number
  schemaTypes: string[]
  hasCanonical: boolean
  totalImages: number
  imagesWithoutAlt: number
  internalLinksCount: number
  internalLinks: string[]
  /** Links to other websites (http/https only). */
  outboundLinks: string[]
}

function normalizeUrl(rawUrl: string, base: string): string | null {
  try {
    const parsed = new URL(rawUrl, base)
    // Only http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    // Remove hash
    parsed.hash = ""
    // Remove trailing slash (except root)
    let href = parsed.href
    if (href.endsWith("/") && parsed.pathname !== "/") {
      href = href.slice(0, -1)
    }
    return href
  } catch {
    return null
  }
}

function dedupeKey(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.search = ""
    parsed.hash = ""
    let href = parsed.href
    if (href.endsWith("/") && parsed.pathname !== "/") {
      href = href.slice(0, -1)
    }
    return href.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

function isSkippable(url: string): boolean {
  const lower = url.toLowerCase()
  // Skip images, PDFs, documents
  if (/\.(jpg|jpeg|png|gif|webp|svg|ico|pdf|doc|docx|xls|xlsx|zip|mp4|mp3|css|js|woff|woff2|ttf)(\?|$)/.test(lower)) {
    return true
  }
  return false
}

type Fetched = { html: string | null; check: LinkCheck }

/** GET a page, following redirects hop by hop so redirect chains and error statuses are kept. */
async function fetchPage(url: string): Promise<Fetched> {
  const hops: string[] = []
  let cur = url
  for (let i = 0; i <= 6; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await safeFetch(cur, { headers: { "User-Agent": USER_AGENT }, signal: controller.signal, redirect: "manual" })
    } catch (e) {
      clearTimeout(timer)
      const error = e instanceof Error ? `${e.name}: ${e.message}${(e as { cause?: { code?: string } }).cause?.code ? ` ${(e as { cause?: { code?: string } }).cause!.code}` : ""}` : String(e)
      return { html: null, check: { url, status: null, state: classify(null, error), hops, finalUrl: cur, error } }
    }
    const location = res.headers.get("location")
    if (res.status >= 300 && res.status < 400 && location) {
      clearTimeout(timer)
      await res.body?.cancel().catch(() => {})
      try {
        cur = new URL(location, cur).toString()
      } catch {
        return { html: null, check: { url, status: res.status, state: "broken", hops, finalUrl: cur, error: "bad redirect" } }
      }
      hops.push(cur)
      continue
    }
    const check: LinkCheck = { url, status: res.status, state: classify(res.status), hops, finalUrl: cur }
    try {
      if (!res.ok) {
        await res.body?.cancel().catch(() => {})
        return { html: null, check }
      }
      const contentType = res.headers.get("content-type") ?? ""
      if (!contentType.includes("text/html")) {
        await res.body?.cancel().catch(() => {})
        return { html: null, check }
      }
      return { html: await res.text(), check }
    } catch {
      return { html: null, check: { ...check, state: "unreachable", error: "timed out reading the page" } }
    } finally {
      clearTimeout(timer)
    }
  }
  return { html: null, check: { url, status: null, state: "broken", hops, finalUrl: cur, error: "Too many redirects" } }
}

function extractSchemaTypes($: CheerioRoot): string[] {
  const types: string[] = []
  $('script[type="application/ld+json"]').each((_: number, el: AnyElement) => {
    try {
      const raw = $(el).html() ?? ""
      const parsed = JSON.parse(raw)
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      for (const entry of entries) {
        if (entry["@type"]) {
          const t = entry["@type"]
          if (Array.isArray(t)) {
            types.push(...t.map(String))
          } else {
            types.push(String(t))
          }
        }
        // Check @graph
        if (entry["@graph"] && Array.isArray(entry["@graph"])) {
          for (const node of entry["@graph"]) {
            if (node["@type"]) {
              const nt = node["@type"]
              if (Array.isArray(nt)) {
                types.push(...nt.map(String))
              } else {
                types.push(String(nt))
              }
            }
          }
        }
      }
    } catch {
      // Malformed JSON-LD — skip
    }
  })
  return types
}

function parsePage(url: string, html: string, baseOrigin: string): PageData {
  const $ = load(html)

  // Title
  const titleEl = $("title").first().text().trim()
  const title = titleEl.length > 0 ? titleEl : null
  const titleLength = title ? title.length : 0

  // Meta description
  const metaDescEl = $('meta[name="description"]').attr("content")
  const metaDescription = metaDescEl !== undefined ? metaDescEl.trim() : null
  const metaDescriptionLength = metaDescription ? metaDescription.length : 0

  // H1
  const h1Count = $("h1").length

  // Schema
  const schemaTypes = extractSchemaTypes($)

  // Canonical
  const hasCanonical = $('link[rel="canonical"]').length > 0

  // Images
  let totalImages = 0
  let imagesWithoutAlt = 0
  $("img").each((_: number, el: AnyElement) => {
    totalImages++
    const alt = $(el).attr("alt")
    if (alt === undefined || alt === null || alt.trim() === "") {
      imagesWithoutAlt++
    }
  })

  // Internal links (crawled) and outbound links (only checked)
  const internalLinks: string[] = []
  const outboundLinks: string[] = []
  const bare = (h: string) => h.toLowerCase().replace(/^www\./, "")
  $("a[href]").each((_: number, el: AnyElement) => {
    const href = $(el).attr("href") ?? ""
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
    const normalized = normalizeUrl(href, url)
    if (!normalized) return
    try {
      const parsed = new URL(normalized)
      const base = new URL(url)
      if (parsed.origin === base.origin) {
        if (!isSkippable(normalized)) internalLinks.push(normalized)
      } else if (bare(parsed.hostname) !== bare(base.hostname)) {
        outboundLinks.push(normalized)
      }
    } catch {
      // ignore
    }
  })

  return {
    url,
    title,
    titleLength,
    metaDescription,
    metaDescriptionLength,
    h1Count,
    schemaTypes,
    hasCanonical,
    totalImages,
    imagesWithoutAlt,
    internalLinksCount: internalLinks.length,
    internalLinks,
    outboundLinks: Array.from(new Set(outboundLinks)),
  }
}

function buildIssues(pages: PageData[]): CrawlIssue[] {
  const issues: CrawlIssue[] = []
  const allSchemaTypes = new Set<string>()

  for (const page of pages) {
    page.schemaTypes.forEach((t) => allSchemaTypes.add(t))

    // Title checks
    if (!page.title) {
      issues.push({
        type: "missing_title",
        severity: "critical",
        url: page.url,
        description: "This page has no title tag. Title tags are one of the most important on-page SEO signals and are what search engines display in results.",
        fix: "Add a descriptive <title> tag between 30–60 characters that includes your primary keyword for this page.",
      })
    } else if (page.titleLength < 30) {
      issues.push({
        type: "title_too_short",
        severity: "warning",
        url: page.url,
        description: `The title tag on this page is only ${page.titleLength} characters — too short to rank well. Short titles miss opportunities to include keywords.`,
        fix: "Expand the title to 30–60 characters, including your main keyword and location if relevant.",
      })
    } else if (page.titleLength > 60) {
      issues.push({
        type: "title_too_long",
        severity: "warning",
        url: page.url,
        description: `The title tag is ${page.titleLength} characters, which exceeds the ~60-character limit Google displays. The end will be cut off in search results.`,
        fix: "Shorten the title to under 60 characters while keeping the most important keywords near the front.",
      })
    }

    // Meta description checks
    if (!page.metaDescription) {
      issues.push({
        type: "missing_meta_description",
        severity: "critical",
        url: page.url,
        description: "This page is missing a meta description. Without one, Google will auto-generate a snippet from page content — often poorly — reducing click-through rates.",
        fix: "Write a compelling meta description of 100–160 characters that summarizes the page and includes a call to action.",
      })
    } else if (page.metaDescriptionLength < 100) {
      issues.push({
        type: "meta_description_too_short",
        severity: "warning",
        url: page.url,
        description: `The meta description is only ${page.metaDescriptionLength} characters. Short descriptions don't use the full space search engines show, reducing visibility.`,
        fix: "Expand the meta description to 100–160 characters with more detail about what the page offers.",
      })
    } else if (page.metaDescriptionLength > 160) {
      issues.push({
        type: "meta_description_too_long",
        severity: "warning",
        url: page.url,
        description: `The meta description is ${page.metaDescriptionLength} characters — over the 160-character limit. Google will truncate it in search results.`,
        fix: "Trim the meta description to 160 characters or fewer, keeping the most compelling text first.",
      })
    }

    // H1 checks
    if (page.h1Count === 0) {
      issues.push({
        type: "missing_h1",
        severity: "critical",
        url: page.url,
        description: "This page has no H1 heading. The H1 is a primary signal to search engines about what the page is about.",
        fix: "Add a single H1 tag that clearly states the main topic of the page, including your primary keyword.",
      })
    } else if (page.h1Count > 1) {
      issues.push({
        type: "multiple_h1s",
        severity: "warning",
        url: page.url,
        description: `This page has ${page.h1Count} H1 headings. Multiple H1s dilute the signal to search engines about the page's primary topic.`,
        fix: "Reduce to a single H1 tag. Convert additional headings to H2 or H3 as appropriate.",
      })
    }

    // Canonical
    if (!page.hasCanonical) {
      issues.push({
        type: "missing_canonical",
        severity: "improvement",
        url: page.url,
        description: "This page doesn't have a canonical tag. Without one, search engines may index duplicate versions of the page and split ranking signals.",
        fix: 'Add <link rel="canonical" href="[page URL]"> to the <head> section of this page.',
      })
    }

    // Image alt text
    if (page.totalImages > 0 && page.imagesWithoutAlt / page.totalImages > 0.2) {
      const missing = page.imagesWithoutAlt
      const total = page.totalImages
      issues.push({
        type: "images_missing_alt",
        severity: "warning",
        url: page.url,
        description: `${missing} of ${total} images on this page are missing alt text. Alt text helps search engines understand image content and improves accessibility.`,
        fix: "Add descriptive alt attributes to all images. Include relevant keywords naturally, but describe the image accurately.",
      })
    }

    // Internal links
    if (page.internalLinksCount === 0) {
      issues.push({
        type: "no_internal_links",
        severity: "warning",
        url: page.url,
        description: "This page has no internal links to other pages on your site. Internal links help search engines discover and understand the structure of your website.",
        fix: "Add 2–5 relevant internal links to other pages on your site, using descriptive anchor text.",
      })
    }
  }

  // Sitewide schema checks
  if (allSchemaTypes.size === 0) {
    issues.push({
      type: "no_schema_markup",
      severity: "critical",
      url: "sitewide",
      description: "Your website has no structured data (schema markup) at all. Schema markup helps search engines understand your business and can unlock rich results like star ratings, FAQs, and business info in search.",
      fix: "Add JSON-LD schema markup starting with LocalBusiness and WebSite schemas on your homepage.",
    })
  }

  if (!allSchemaTypes.has("LocalBusiness")) {
    issues.push({
      type: "missing_local_business_schema",
      severity: "critical",
      url: "sitewide",
      description: "Your website is missing LocalBusiness schema markup. This is the most important structured data type for local businesses — it tells search engines your name, address, phone, and hours.",
      fix: "Add LocalBusiness JSON-LD schema to your homepage with your business name, address, phone number, business hours, and service area.",
    })
  }

  if (!allSchemaTypes.has("FAQPage")) {
    issues.push({
      type: "missing_faqpage_schema",
      severity: "improvement",
      url: "sitewide",
      description: "You're not using FAQPage schema markup. FAQ schema can earn your site an expanded result in Google with questions and answers visible directly in search — increasing click-through rates significantly.",
      fix: "Add FAQPage JSON-LD schema to pages that answer common customer questions.",
    })
  }

  return issues
}

// ── AI crawler / robots.txt audit ──────────────────────────────────────────
// Detect whether the site's robots.txt blocks the major AI crawlers from
// reading the content (Disallow: / for their user-agent). This is the single
// most impactful AEO problem — if blocked, the engine literally can't see them.

const AI_CRAWLERS: { userAgent: string; engine: string }[] = [
  { userAgent: "GPTBot", engine: "ChatGPT" },
  { userAgent: "OAI-SearchBot", engine: "ChatGPT" },
  { userAgent: "ClaudeBot", engine: "Claude" },
  { userAgent: "anthropic-ai", engine: "Claude" },
  { userAgent: "Google-Extended", engine: "Gemini" },
  { userAgent: "PerplexityBot", engine: "Perplexity" },
  { userAgent: "cohere-ai", engine: "Cohere" },
]

type RobotsGroup = { agents: string[]; disallow: string[]; allow: string[] }

function parseRobots(txt: string): RobotsGroup[] {
  const groups: RobotsGroup[] = []
  let current: RobotsGroup | null = null
  let lastWasAgent = false
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim()
    if (!line) continue
    const idx = line.indexOf(":")
    if (idx === -1) continue
    const field = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()
    if (field === "user-agent") {
      // Consecutive user-agent lines share the following rule block.
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [], allow: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else if (field === "disallow") {
      if (current) current.disallow.push(value)
      lastWasAgent = false
    } else if (field === "allow") {
      if (current) current.allow.push(value)
      lastWasAgent = false
    } else {
      lastWasAgent = false
    }
  }
  return groups
}

function groupForAgent(groups: RobotsGroup[], agent: string): RobotsGroup | null {
  const a = agent.toLowerCase()
  const specific = groups.find((g) => g.agents.includes(a))
  if (specific) return specific
  return groups.find((g) => g.agents.includes("*")) ?? null
}

// "Disallow: /" with no overriding "Allow: /" = the whole site is blocked.
function isFullyBlocked(group: RobotsGroup | null): boolean {
  if (!group) return false
  const blocksRoot = group.disallow.some((d) => d === "/")
  const allowsRoot = group.allow.some((a) => a === "/")
  return blocksRoot && !allowsRoot
}

async function checkAiCrawlerBlocks(
  origin: string,
): Promise<{ engine: string; agents: string[] }[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let txt = ""
  try {
    const res = await safeFetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    })
    clearTimeout(timer)
    // No robots.txt (or unreadable) means nothing is blocked — AI can crawl.
    if (!res.ok) return []
    txt = await res.text()
  } catch {
    clearTimeout(timer)
    return []
  }

  const groups = parseRobots(txt)
  const byEngine = new Map<string, string[]>()
  for (const { userAgent, engine } of AI_CRAWLERS) {
    if (isFullyBlocked(groupForAgent(groups, userAgent))) {
      const arr = byEngine.get(engine) ?? []
      arr.push(userAgent)
      byEngine.set(engine, arr)
    }
  }
  return Array.from(byEngine, ([engine, agents]) => ({ engine, agents }))
}

// ── Broken links + redirect chains ─────────────────────────────────────────

const shortPath = (u: string) => {
  try {
    const p = new URL(u)
    return `${p.pathname}${p.search}` || "/"
  } catch {
    return u
  }
}

/** Exported for tests: turn link check results into fix items naming the pages that link there. */
export function buildLinkIssues(
  internalFrom: Map<string, { target: string; sources: Set<string> }>,
  fetched: Map<string, LinkCheck>,
  outboundFrom: Map<string, Set<string>>,
  outbound: Map<string, LinkCheck>,
): CrawlIssue[] {
  const out: CrawlIssue[] = []
  const list = (s: Set<string>) => [...s].slice(0, 10)
  const on = (s: string[]) => (s.length === 1 ? `on ${shortPath(s[0])}` : `on ${s.length} pages (${s.slice(0, 3).map(shortPath).join(", ")}${s.length > 3 ? "…" : ""})`)
  for (const [key, { target, sources }] of internalFrom) {
    const c = fetched.get(key)
    if (!c || !sources.size) continue
    const src = list(sources)
    if (c.state === "broken" || c.state === "unreachable") {
      out.push({
        type: "broken_internal_link",
        severity: "critical",
        url: target,
        target,
        status: c.status,
        sources: src,
        description: `A link ${on(src)} goes to ${shortPath(target)}, which ${stateText(c)}. Visitors and search engines hit a dead end there.`,
        fix: `Point the link to the right page, remove it, or redirect ${shortPath(target)} to the page that replaced it.`,
      })
    } else if (c.state === "ok" && c.hops.length > 1) {
      out.push({
        type: "redirect_chain",
        severity: "improvement",
        url: target,
        target,
        status: c.status,
        hops: c.hops,
        finalUrl: c.finalUrl,
        sources: src,
        description: `A link ${on(src)} to ${shortPath(target)} bounces through ${c.hops.length} redirects before it lands on ${shortPath(c.finalUrl)}. Each hop slows the page and wastes Google’s crawl.`,
        fix: `Change the link to go straight to ${c.finalUrl}.`,
      })
    }
  }
  for (const [target, c] of outbound) {
    const sources = outboundFrom.get(target)
    if (!sources?.size) continue
    const src = list(sources)
    if (c.state === "broken" || (c.state === "unreachable" && c.status !== null)) {
      out.push({
        type: "broken_outbound_link",
        severity: "warning",
        url: target,
        target,
        status: c.status,
        sources: src,
        description: `A link ${on(src)} to ${target} ${stateText(c)}. Dead links to other sites make a page look out of date to Google and AI assistants.`,
        fix: "Replace it with a working source, or remove the link.",
      })
    } else if (c.state === "ok" && c.hops.length > 1) {
      out.push({
        type: "redirect_chain",
        severity: "improvement",
        url: target,
        target,
        status: c.status,
        hops: c.hops,
        finalUrl: c.finalUrl,
        sources: src,
        description: `A link ${on(src)} to ${target} goes through ${c.hops.length} redirects before it lands on ${c.finalUrl}.`,
        fix: `Change the link to go straight to ${c.finalUrl}.`,
      })
    }
  }
  return out
}

export type CrawlOptions = {
  /** Own-site audit: also check every link (broken internal/outbound, redirect chains). Off for competitor crawls. */
  checkLinks?: boolean
  /** Time budget for the extra link checks, ms (default 20s). */
  linkBudgetMs?: number
}

export async function crawlWebsite(url: string, maxPages = 40, opts: CrawlOptions = {}): Promise<CrawlOutput> {
  // Users type their site as "growthturbine.com" — without a protocol,
  // `new URL()` throws and every crawl 500s before fetching a single page
  // (which is why "Check my site now" always failed and Website health showed
  // "0 pages checked" forever). Default to https before anything else.
  const withProtocol = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
  // Normalize the seed URL
  const seedUrl = normalizeUrl(withProtocol, withProtocol) ?? withProtocol
  const baseOrigin = new URL(seedUrl).origin

  const queue: string[] = [seedUrl]
  const visited = new Set<string>()
  const seenDedupeKeys = new Set<string>()
  const pages: PageData[] = []
  // Link bookkeeping: what each fetched internal URL answered, and which pages link where.
  const fetched = new Map<string, LinkCheck>() // dedupeKey → result
  const internalFrom = new Map<string, { target: string; sources: Set<string> }>()
  const outboundFrom = new Map<string, Set<string>>()
  const bareHost = (u: string) => {
    try {
      return new URL(u).hostname.toLowerCase().replace(/^www\./, "")
    } catch {
      return ""
    }
  }

  seenDedupeKeys.add(dedupeKey(seedUrl))

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift()!

    if (visited.has(currentUrl)) continue
    visited.add(currentUrl)

    const { html, check } = await fetchPage(currentUrl)
    fetched.set(dedupeKey(currentUrl), check)
    if (!html) continue

    // A redirect to the same site (http → https, example.com → www.example.com): read the page
    // at its real address, so its links count as internal.
    const pageUrl = check.finalUrl !== currentUrl && bareHost(check.finalUrl) === bareHost(currentUrl) ? normalizeUrl(check.finalUrl, check.finalUrl) ?? currentUrl : currentUrl
    if (pageUrl !== currentUrl) {
      visited.add(pageUrl)
      seenDedupeKeys.add(dedupeKey(pageUrl))
    }

    const pageData = parsePage(pageUrl, html, baseOrigin)
    pages.push(pageData)

    for (const link of pageData.outboundLinks) {
      const set = outboundFrom.get(link) ?? new Set<string>()
      set.add(pageData.url)
      outboundFrom.set(link, set)
    }

    // Enqueue discovered internal links
    for (const link of pageData.internalLinks) {
      const key = dedupeKey(link)
      const from = internalFrom.get(key) ?? { target: link, sources: new Set<string>() }
      if (dedupeKey(pageData.url) !== key) from.sources.add(pageData.url)
      internalFrom.set(key, from)
      if (!seenDedupeKeys.has(key) && !visited.has(link)) {
        seenDedupeKeys.add(key)
        queue.push(link)
      }
    }
  }

  const linkIssues: CrawlIssue[] = []
  let linksChecked: number | undefined
  let outboundChecked: number | undefined
  if (opts.checkLinks) {
    const deadline = Date.now() + (opts.linkBudgetMs ?? 20_000)
    // Internal links the crawl didn't reach (page limit): a quick check, our own host first.
    const unvisited = [...internalFrom.entries()].filter(([k]) => !fetched.has(k)).slice(0, 40).map(([, v]) => v.target)
    const outbound = [...outboundFrom.keys()].slice(0, 80)
    const [extra, out] = await Promise.all([
      checkLinks(unvisited, { concurrency: 1, perHost: 40, gapMs: 150, deadline }),
      checkLinks(outbound, { concurrency: 4, perHost: 5, gapMs: 300, deadline }),
    ])
    for (const [u, c] of extra) fetched.set(dedupeKey(u), c)
    linksChecked = [...internalFrom.keys()].filter((k) => fetched.has(k)).length
    outboundChecked = out.size
    linkIssues.push(...buildLinkIssues(internalFrom, fetched, outboundFrom, out))
  }

  const issues = [...buildIssues(pages), ...linkIssues]

  // robots.txt AI-crawler audit — surfaced first as the most critical finding.
  const aiBlocks = await checkAiCrawlerBlocks(baseOrigin)
  for (const { engine, agents } of aiBlocks) {
    const agentList = agents.map((a) => `"User-agent: ${a}"`).join(" and ")
    issues.unshift({
      type: "ai_crawler_blocked",
      severity: "critical",
      url: "robots.txt",
      engine,
      description: `Your website is blocking ${engine} from reading your content. This means ${engine} literally cannot see your website — which is why you don't appear in its results.`,
      fix: `In your robots.txt file, change the "Disallow: /" rule under ${agentList} to "Allow: /" (or remove it). If a developer manages your website, forward them this note.`,
    })
  }

  // Aggregate schema info
  const schemaFoundSet = new Set<string>()
  for (const page of pages) {
    page.schemaTypes.forEach((t) => schemaFoundSet.add(t))
  }
  const schemaFound = Array.from(schemaFoundSet)
  const schemaMissing = STANDARD_SCHEMA_TYPES.filter((t) => !schemaFoundSet.has(t))

  // Aggregate meta issues
  const metaIssues = {
    missingTitles: pages.filter((p) => !p.title).length,
    missingDescriptions: pages.filter((p) => !p.metaDescription).length,
    missingH1: pages.filter((p) => p.h1Count === 0).length,
    imagesWithoutAlt: pages.reduce((sum, p) => sum + p.imagesWithoutAlt, 0),
    ...(linksChecked !== undefined ? { linksChecked, outboundChecked } : {}),
  }

  return {
    pagesScanned: pages.length,
    issues,
    schemaFound,
    schemaMissing,
    metaIssues,
  }
}
