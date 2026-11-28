// Reading structured data and real Q&A out of a page's HTML (pure; cheerio only, no network).
import { load } from "cheerio"
import { arr, flattenJsonLd } from "@/lib/schema/rules"

export type Extracted = { blocks: unknown[]; parseErrors: { snippet: string; error: string }[] }

/** Every <script type="application/ld+json"> on the page, parsed. Broken JSON is reported, not guessed at. */
export function extractJsonLd(html: string): Extracted {
  const $ = load(html)
  const blocks: unknown[] = []
  const parseErrors: Extracted["parseErrors"] = []
  $('script[type="application/ld+json" i]').each((_, el) => {
    const raw = ($(el).html() ?? "").replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").replace(/^\s*<!--|-->\s*$/g, "").trim()
    if (!raw) return
    try {
      blocks.push(JSON.parse(raw))
    } catch (e) {
      // Google's parser is as strict as JSON.parse: a broken block is reported as it is.
      parseErrors.push({ snippet: raw.slice(0, 120), error: e instanceof Error ? e.message.slice(0, 160) : "invalid JSON" })
    }
  })
  return { blocks, parseErrors }
}

export type QA = { q: string; a: string; source: "jsonld" | "details" | "heading" }

const clean = (s: string) => s.replace(/\s+/g, " ").trim()
const words = (s: string) => clean(s).split(" ").filter(Boolean).length

/**
 * Questions AND their answers that are really on the page: an existing FAQPage block, <details>
 * with a <summary> question, or a heading ending in "?" followed by its answer text. Nothing is
 * written here: an FAQPage we generate repeats the page's own words only.
 */
export function extractFaq(html: string, max = 10): QA[] {
  const out: QA[] = []
  const seen = new Set<string>()
  const add = (q: string, a: string, source: QA["source"]) => {
    const Q = clean(q).slice(0, 300), A = clean(a).slice(0, 1200)
    const k = Q.toLowerCase()
    if (!/\?$/.test(Q) || Q.length < 8 || words(A) < 6 || seen.has(k) || out.length >= max) return
    seen.add(k)
    out.push({ q: Q, a: A, source })
  }
  const { blocks } = extractJsonLd(html)
  for (const n of flattenJsonLd(blocks)) {
    if (!n.types.includes("FAQPage")) continue
    for (const q of arr(n.node.mainEntity)) {
      const o = q as Record<string, unknown>
      const ans = arr(o?.acceptedAnswer)[0] as Record<string, unknown> | undefined
      if (typeof o?.name === "string" && typeof ans?.text === "string") add(o.name, load(`<div>${ans.text}</div>`)("div").text(), "jsonld")
    }
  }
  const $ = load(html)
  $("script, style, noscript, nav, footer").remove()
  $("details").each((_, d) => {
    const summary = $(d).children("summary").first()
    const q = summary.text()
    const a = $(d).clone().children("summary").remove().end().text()
    add(q, a, "details")
  })
  $("h2, h3, h4").each((_, h) => {
    const q = $(h).text()
    if (!/\?\s*$/.test(clean(q))) return
    const parts: string[] = []
    let el = $(h).next()
    let hops = 0
    while (el.length && hops < 6 && !/^h[1-4]$/i.test(el.prop("tagName") ?? "")) {
      const t = clean(el.text())
      if (t) parts.push(t)
      el = el.next()
      hops++
    }
    // Accordion markup often wraps the answer in the heading's parent: use the parent's text minus the heading.
    if (!parts.length) {
      const parentText = clean($(h).parent().text()).replace(clean(q), "")
      if (words(parentText) <= 160) parts.push(parentText)
    }
    add(q, parts.join(" "), "heading")
  })
  return out
}

/** The page's main language-independent bits a Product block needs, from Shopify's public JSON. */
export type ShopifyProductJs = {
  title?: string
  handle?: string
  description?: string
  vendor?: string
  images?: string[]
  featured_image?: string
  variants?: { id?: number; sku?: string | null; barcode?: string | null; price?: number | string; available?: boolean; title?: string }[]
}
