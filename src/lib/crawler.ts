// eslint-disable-next-line @typescript-eslint/no-require-imports
import { load } from "cheerio"

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

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("text/html")) return null
    return await res.text()
  } catch {
    clearTimeout(timer)
    return null
  }
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

  // Internal links
  const internalLinks: string[] = []
  $("a[href]").each((_: number, el: AnyElement) => {
    const href = $(el).attr("href") ?? ""
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
    const normalized = normalizeUrl(href, url)
    if (!normalized) return
    try {
      const parsed = new URL(normalized)
      const base = new URL(url)
      if (parsed.origin === base.origin && !isSkippable(normalized)) {
        internalLinks.push(normalized)
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

export async function crawlWebsite(url: string, maxPages = 40): Promise<CrawlOutput> {
  // Normalize the seed URL
  const seedUrl = normalizeUrl(url, url) ?? url
  const baseOrigin = new URL(seedUrl).origin

  const queue: string[] = [seedUrl]
  const visited = new Set<string>()
  const seenDedupeKeys = new Set<string>()
  const pages: PageData[] = []

  seenDedupeKeys.add(dedupeKey(seedUrl))

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift()!

    if (visited.has(currentUrl)) continue
    visited.add(currentUrl)

    const html = await fetchPage(currentUrl)
    if (!html) continue

    const pageData = parsePage(currentUrl, html, baseOrigin)
    pages.push(pageData)

    // Enqueue discovered internal links
    for (const link of pageData.internalLinks) {
      const key = dedupeKey(link)
      if (!seenDedupeKeys.has(key) && !visited.has(link)) {
        seenDedupeKeys.add(key)
        queue.push(link)
      }
    }
  }

  const issues = buildIssues(pages)

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
  }

  return {
    pagesScanned: pages.length,
    issues,
    schemaFound,
    schemaMissing,
    metaIssues,
  }
}
