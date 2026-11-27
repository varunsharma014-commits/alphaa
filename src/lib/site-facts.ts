// What a business's own website says about it: homepage, pricing page and About page, read
// the way a person would (title, Google summary, headings, the words on the page, prices).
// Used to ground public drafts (the /start FAQ) in the site's own facts, so a writer never
// has to guess what the business is (gigaboost.ai was described as fundraising for
// "nonprofits, political campaigns, schools" on 2026-11-27 because it only had a one-word
// industry). Best-effort and HTTP only: a page that doesn't load is simply missing.
import { safeFetch } from "@/lib/safe-fetch"

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

export type SitePage = {
  url: string
  path: string
  title: string
  description: string
  h1: string[]
  h2: string[]
  text: string
  prices: string[]
  /** Social profiles the page links to (platform names). */
  social: string[]
}

export type SiteFacts = { home: SitePage | null; pricing: SitePage | null; about: SitePage | null }

const PRICE_RE = /(?:US)?[$€£]\s?\d[\d,]*(?:\.\d{1,2})?(?:\s?[kK])?(?:\s?(?:\/|per\s)\s?(?:mo|month|yr|year|user|seat|hour|hr|session|visit))?/g

async function fetchHtml(url: string, ms: number): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await safeFetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" }, redirect: "follow", signal: AbortSignal.timeout(ms) })
    if (!res.ok) return null
    const html = (await res.text()).slice(0, 2_000_000)
    return html.trim().length > 200 ? { html, finalUrl: res.url || url } : null
  } catch {
    return null
  }
}

async function readPage(url: string, ms: number, textCap: number): Promise<{ page: SitePage; hrefs: { href: string; words: string }[] } | null> {
  const got = await fetchHtml(url, ms)
  if (!got) return null
  const { load } = await import("cheerio")
  const $ = load(got.html)
  const clean = (s: string) => s.replace(/\s+/g, " ").trim()
  const hrefs = $("a[href]").map((_, a) => ({ href: $(a).attr("href") || "", words: clean($(a).text()) })).get()
  const title = clean($("title").first().text())
  const description = clean($('meta[name="description" i]').attr("content") || $('meta[property="og:description"]').attr("content") || "")
  const h1 = $("h1").map((_, h) => clean($(h).text())).get().filter(Boolean).slice(0, 3)
  const h2 = $("h2").map((_, h) => clean($(h).text())).get().filter((t) => t && t.length < 140).slice(0, 14)
  $("script, style, noscript, svg, template, iframe").remove()
  // The words people read: main content first, without the menu and footer when they're marked up.
  const body = $("main").length ? $("main") : $("body")
  body.find("nav, footer, header [role=navigation]").remove()
  const text = clean(body.text()).slice(0, textCap)
  const prices = [...new Set([...`${title} ${description} ${text}`.matchAll(PRICE_RE)].map((m) => m[0].replace(/\s+/g, " ").trim()))].slice(0, 12)
  const SOCIAL: [RegExp, string][] = [[/facebook\.com\/(?!sharer|share|dialog)/i, "Facebook"], [/instagram\.com\//i, "Instagram"], [/linkedin\.com\/(company|in|school)\//i, "LinkedIn"], [/(twitter\.com|\/\/(www\.)?x\.com)\/(?!intent|share)/i, "X"], [/youtube\.com\/(@|c\/|channel|user)/i, "YouTube"], [/tiktok\.com\/@/i, "TikTok"]]
  const social = SOCIAL.filter(([re]) => hrefs.some((a) => re.test(a.href))).map(([, n]) => n)
  let path = "/"
  try { path = new URL(got.finalUrl).pathname } catch {}
  return { page: { url: got.finalUrl, path, title, description, h1, h2, text, prices, social }, hrefs }
}

// The /start flow reads the same site 2-3 times within a minute (snapshot, FAQ): one read per 10 min.
const cache = new Map<string, { at: number; p: Promise<SiteFacts> }>()

/** Homepage + pricing + About, in about 10 seconds at most (cached 10 minutes per site). */
export function readSiteFacts(site: string): Promise<SiteFacts> {
  const key = site.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < 600_000) return hit.p
  if (cache.size > 300) for (const [k, v] of cache) if (Date.now() - v.at >= 600_000) cache.delete(k)
  const p = readSiteFactsNow(site).catch(() => ({ home: null, pricing: null, about: null }))
  cache.set(key, { at: Date.now(), p })
  return p
}

async function readSiteFactsNow(site: string): Promise<SiteFacts> {
  const origin = (() => {
    try {
      const u = new URL(/^https?:\/\//i.test(site) ? site : `https://${site}`)
      return `${u.protocol}//${u.hostname}`
    } catch {
      return null
    }
  })()
  if (!origin) return { home: null, pricing: null, about: null }
  const host = new URL(origin).hostname.replace(/^www\./, "")
  const home = await readPage(`${origin}/`, 8000, 3500)
  if (!home) return { home: null, pricing: null, about: null }

  const same = (h: string) => {
    try {
      const u = new URL(h, home.page.url)
      return u.hostname.replace(/^www\./, "") === host && u.pathname !== "/" ? u.toString().split("#")[0] : null
    } catch {
      return null
    }
  }
  const pick = (path: RegExp, words: RegExp, fallback: string) =>
    home.hrefs.map((a) => ({ url: same(a.href), a })).find(({ url, a }) => !!url && (path.test(new URL(url).pathname) || words.test(a.words)))?.url ?? `${origin}${fallback}`
  const pricingUrl = pick(/\/(pricing|prices|plans|rates)(\/|$)/i, /^(pricing|prices|plans( (&|and) pricing)?|rates)$/i, "/pricing")
  const aboutUrl = pick(/\/(about(-us)?|company|our-story|team|who-we-are)(\/|$)/i, /^(about( us)?|company|our story|team|who we are)$/i, "/about")

  // A single-page site answers every address with its homepage shell: that isn't a pricing page.
  const real = (p: SitePage | null) =>
    p && p.path !== "/" && (p.title !== home.page.title || p.text.slice(0, 300) !== home.page.text.slice(0, 300)) ? p : null
  const [pricing, about] = await Promise.all([
    readPage(pricingUrl, 6000, 2500).then((r) => real(r?.page ?? null)).catch(() => null),
    readPage(aboutUrl, 6000, 1500).then((r) => real(r?.page ?? null)).catch(() => null),
  ])
  return { home: home.page, pricing, about }
}

/** The facts as a plain block for a prompt. */
export function siteFactsText(f: SiteFacts): string {
  const one = (label: string, p: SitePage | null) =>
    p
      ? [
          `## ${label} (${p.path})`,
          p.title && `Title: ${p.title}`,
          p.description && `Google summary: ${p.description}`,
          p.h1.length ? `Main heading: ${p.h1.join(" | ")}` : "",
          p.h2.length ? `Section headings: ${p.h2.join(" | ")}` : "",
          p.prices.length ? `Prices on the page: ${p.prices.join(", ")}` : "",
          `Words on the page: ${p.text}`,
        ].filter(Boolean).join("\n")
      : ""
  return [one("Homepage", f.home), one("Pricing page", f.pricing), one("About page", f.about)].filter(Boolean).join("\n\n")
}
