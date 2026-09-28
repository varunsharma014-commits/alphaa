// Shared read-only page fetch for the profile / outside-review checks.
// Goes out as a normal browser (many networks 403 unknown bots) and reports
// whether the network actually let us read the page. Never throws.

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

import { proxyGet } from "./apify"

export type Page = { status: number | null; finalUrl: string; html: string; readable: boolean; via?: "direct" | "proxy" }

const LOGIN_URL = /\/(login|signin|sign-in|accounts\/login|authwall|checkpoint|uas\/login)|[?&](login|next)=|\/i\/flow\/login/i
const CHALLENGE = /cf-chl-|challenge-platform|<title>Just a moment\.\.\.|<title>(Client Challenge|Access Denied|Pardon Our Interruption|Security Check)|Attention Required! \| Cloudflare|captcha-delivery|px-captcha|SlardarWAF|_wafchallengeid|_Incapsula_Resource|sucuri_cloudproxy|Please enable JS and disable any ad blocker|<title>(Log in|Login|Sign in|Sign Up)[^<]*<\/title>/i

const isBlocked = (url: string, status: number, finalUrl: string, html: string, mitigated: string | null) =>
  status < 200 || status >= 300 || status === 999 || mitigated === "challenge" ||
  (LOGIN_URL.test(finalUrl) && !LOGIN_URL.test(url)) || html.trim().length < 3000 || (html.length < 150_000 && CHALLENGE.test(html))

/** Direct first; if the site blocks us, once more through Apify's residential proxy. */
export async function fetchPage(url: string, ms = 8000): Promise<Page> {
  const direct = await fetchDirect(url, ms)
  if (direct.readable) return { ...direct, via: "direct" }
  const p = await proxyGet(url, { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml,*/*", "Accept-Language": "en-US,en;q=0.9" })
  if (!p) return direct
  const readable = !isBlocked(url, p.status, p.url, p.html, null)
  return readable ? { status: p.status, finalUrl: p.url, html: p.html, readable, via: "proxy" } : direct
}

async function fetchDirect(url: string, ms: number): Promise<Page> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml,*/*", "Accept-Language": "en-US,en;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(ms),
    })
    const finalUrl = res.url || url
    const html = res.ok ? (await res.text()).slice(0, 3_000_000) : ""
    const blocked =
      !res.ok ||
      res.status === 999 ||
      res.headers.get("cf-mitigated") === "challenge" ||
      (LOGIN_URL.test(finalUrl) && !LOGIN_URL.test(url)) ||
      html.trim().length < 3000 ||
      (html.length < 150_000 && CHALLENGE.test(html))
    return { status: res.status, finalUrl, html, readable: !blocked }
  } catch {
    return { status: null, finalUrl: url, html: "", readable: false }
  }
}

/** Run `fn` over `items` with at most `n` in flight; results keep input order. */
export async function mapLimit<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  const worker = async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker))
  return out
}

export function jsonLdNodes(html: string, load: typeof import("cheerio").load): Record<string, unknown>[] {
  const $ = load(html)
  const out: Record<string, unknown>[] = []
  const walk = (n: unknown, depth: number) => {
    if (!n || typeof n !== "object" || depth > 6) return
    if (Array.isArray(n)) return n.forEach((x) => walk(x, depth + 1))
    const o = n as Record<string, unknown>
    out.push(o)
    for (const v of Object.values(o)) if (v && typeof v === "object") walk(v, depth + 1)
  }
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      walk(JSON.parse($(el).text()), 0)
    } catch {}
  })
  return out
}
