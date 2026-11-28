// Article HTML helpers for page refreshes and link fixes (pure; tested in scripts/test-seo-upkeep.ts).
//   extractArticle   → the body of a live post/page (the part the CMS stores), cleaned
//   sanitizeArticle  → only safe tags; links only to addresses we allow; images only ones already there
//   fixLinks         → unwrap broken links, point redirect chains straight at their final address
//   stampUpdated     → one "Updated <date>" line at the top (replaces an older one)
//   plainMarkdown    → a read-only Markdown copy (no links, no [brackets]) for previews elsewhere
import { load } from "cheerio"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

const ALLOWED = new Set(["h2", "h3", "h4", "p", "ul", "ol", "li", "a", "strong", "b", "em", "i", "blockquote", "img", "br", "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption"])
const DROP = "script, style, noscript, iframe, form, button, input, select, textarea, svg, template, nav, aside, footer, header, object, embed"

/** Where the body text lives on the common site builders, most specific first. */
const BODY_SELECTORS = [
  ".entry-content", ".post-content", ".article-content", ".post-body", ".blog-post-content", // WordPress & co.
  ".w-richtext", // Webflow rich text
  ".article-template__content", ".article__content", ".rte", // Shopify
  '[data-hook="post-description"]', '[data-id="rich-content-viewer"]', // Wix
  "article", "main",
]

const NOISE = '[class*="related"], [class*="share"], [class*="comment"], [class*="author"], [class*="breadcrumb"], [class*="newsletter"], [class*="subscribe"], [class*="sidebar"], [class*="toc"], [id*="comments"]'

export type Article = { title: string; html: string; text: string; links: string[]; images: string[] }

const squash = (s: string) => s.replace(/\s+/g, " ").trim()

export function toAbs(href: string, base: string): string | null {
  try {
    const u = new URL(href, base)
    if (!/^https?:$/.test(u.protocol)) return null
    u.hash = ""
    return u.toString()
  } catch {
    return null
  }
}

/**
 * Keep only article tags. Links survive when `allowHref(abs)` says so (mailto/tel always), otherwise
 * their words stay as plain text. Images survive only when their address is in `allowImg`.
 */
export function sanitizeArticle(html: string, base: string, opts: { allowHref?: (abs: string) => boolean; allowImg?: Set<string> } = {}): string {
  const $ = load(`<div id="__r">${html.replace(/<!--[\s\S]*?-->/g, "")}</div>`)
  const root = $("#__r")
  root.find(DROP).remove()
  // h1 inside a body = the page title again; demote to h2. h5/h6 → h4.
  root.find("h1").each((_: number, el: Any) => { el.tagName = "h2" })
  root.find("h5, h6").each((_: number, el: Any) => { el.tagName = "h4" })
  root.find("*").each((_: number, el: Any) => {
    const tag = String(el.tagName ?? "").toLowerCase()
    const node = $(el)
    if (!ALLOWED.has(tag)) return
    const attrs = { ...(el.attribs ?? {}) } as Record<string, string>
    for (const k of Object.keys(attrs)) node.removeAttr(k)
    if (tag === "a") {
      const href = attrs.href ?? ""
      if (/^(mailto|tel):/i.test(href)) node.attr("href", href)
      else {
        const abs = toAbs(href, base)
        if (abs && (!opts.allowHref || opts.allowHref(abs))) node.attr("href", abs)
      }
    }
    if (tag === "img") {
      const src = toAbs(attrs.src ?? attrs["data-src"] ?? "", base)
      if (!src || !opts.allowImg?.has(src)) node.remove()
      else {
        node.attr("src", src)
        node.attr("alt", attrs.alt ?? "")
      }
    }
  })
  // Unwrap every tag that isn't allowed (divs, spans, sections…) and links that lost their href.
  for (let pass = 0; pass < 12; pass++) {
    const bad = root.find("*").filter((_: number, el: Any) => !ALLOWED.has(String(el.tagName ?? "").toLowerCase()) || (String(el.tagName).toLowerCase() === "a" && !$(el).attr("href")))
    if (!bad.length) break
    bad.each((_: number, el: Any) => { $(el).replaceWith($(el).contents()) })
  }
  root.find("p, li, h2, h3, h4").each((_: number, el: Any) => { if (!squash($(el).text()) && !$(el).find("img").length) $(el).remove() })
  return (root.html() ?? "").replace(/\n{3,}/g, "\n\n").trim()
}

function linksAndImages(html: string, base: string): { links: string[]; images: string[] } {
  const $ = load(html)
  const links = $("a[href]").map((_: number, a: Any) => toAbs($(a).attr("href") ?? "", base)).get().filter(Boolean) as string[]
  const images = $("img").map((_: number, i: Any) => toAbs($(i).attr("src") ?? $(i).attr("data-src") ?? "", base)).get().filter(Boolean) as string[]
  return { links: [...new Set(links)], images: [...new Set(images)] }
}

/** The page's body as stored in the CMS (best effort from the live HTML), with its title. */
export function extractArticle(pageHtml: string, url: string): Article | null {
  const $ = load(pageHtml)
  const h1 = squash($("h1").first().text())
  const og = squash($('meta[property="og:title"]').attr("content") ?? "")
  const title = h1 || og.split(/\s[|–-]\s/)[0] || squash($("title").first().text()).split(/\s[|–-]\s/)[0]
  let picked: Any = null
  for (const sel of BODY_SELECTORS) {
    const el = $(sel).filter((_: number, e: Any) => squash($(e).text()).length >= 300).first()
    if (el.length) {
      picked = el
      break
    }
  }
  if (!picked) return null
  const box = picked.clone()
  box.find(NOISE).remove()
  box.find("h1").first().remove()
  const raw = box.html() ?? ""
  const { links, images } = linksAndImages(raw, url)
  const html = sanitizeArticle(raw, url, { allowImg: new Set(images) })
  const text = squash(load(html).root().text())
  return text.length >= 300 ? { title, html, text, links, images } : null
}

/** From a WordPress REST answer (content.rendered): the same cleaning as extractArticle. */
export function articleFromHtml(title: string, bodyHtml: string, url: string): Article | null {
  const { links, images } = linksAndImages(bodyHtml, url)
  const html = sanitizeArticle(bodyHtml, url, { allowImg: new Set(images) })
  const text = squash(load(html).root().text())
  return text.length >= 300 ? { title: squash(load(`<p>${title}</p>`).root().text()), html, text, links, images } : null
}

/** Unwrap links to `broken` targets (keep the words) and point `redirects` straight at their final address. */
export function fixLinks(html: string, base: string, broken: Set<string>, redirects: Map<string, string>): { html: string; removed: number; repointed: number } {
  const $ = load(`<div id="__r">${html}</div>`)
  let removed = 0
  let repointed = 0
  const norm = (u: string) => u.replace(/\/+$/, "").toLowerCase()
  const brokenN = new Set([...broken].map(norm))
  const redirectsN = new Map([...redirects].map(([k, v]) => [norm(k), v]))
  $("#__r a[href]").each((_: number, a: Any) => {
    const abs = toAbs($(a).attr("href") ?? "", base)
    if (!abs) return
    const key = norm(abs)
    if (brokenN.has(key)) {
      $(a).replaceWith($(a).contents())
      removed++
    } else if (redirectsN.has(key)) {
      $(a).attr("href", redirectsN.get(key)!)
      repointed++
    }
  })
  return { html: $("#__r").html() ?? html, removed, repointed }
}

const UPDATED_RE = /^\s*<p>\s*<em>\s*(?:Last\s+)?Updated[^<]{0,60}<\/em>\s*<\/p>\s*/i

/** "Updated November 28, 2026" at the top, replacing an older stamp. */
export function stampUpdated(html: string, date = new Date()): string {
  const label = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
  return `<p><em>Updated ${label}</em></p>\n${html.replace(UPDATED_RE, "")}`
}

/** A read-only Markdown copy: ## headings, paragraphs, - lists. Links become their words. */
export function plainMarkdown(html: string): string {
  const $ = load(`<div id="__r">${html}</div>`)
  const out: string[] = []
  $("#__r").children().each((_: number, el: Any) => {
    const tag = String(el.tagName).toLowerCase()
    const t = squash($(el).text()).replace(/\[/g, "(").replace(/\]/g, ")")
    if (!t) return
    if (tag === "h2") out.push(`## ${t}`)
    else if (tag === "h3" || tag === "h4") out.push(`### ${t}`)
    else if (tag === "ul" || tag === "ol") out.push($(el).children("li").map((_i: number, li: Any) => `- ${squash($(li).text()).replace(/\[/g, "(").replace(/\]/g, ")")}`).get().join("\n"))
    else out.push(t)
  })
  return out.join("\n\n")
}

/** Numbers in `out` that appear nowhere in `sources` (so nothing new gets made up). Single digits and this year are fine. */
export function newNumbers(out: string, sources: string): string[] {
  const nums = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, "").replace(/,/g, "")).filter((x) => x.length)
  const have = new Set(nums(sources))
  return [...new Set(nums(out))].filter((n) => !have.has(n) && n !== String(new Date().getUTCFullYear()) && !/^[0-9]$/.test(n))
}
