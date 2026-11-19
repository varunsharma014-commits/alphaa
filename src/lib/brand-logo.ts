// Logo detection for the brand kit (lib/brand-kit.ts). Pure: no network, no database.
import { load } from "cheerio"

// ── Logo ──────────────────────────────────────────────────────────────────────
// Picking "any <img> that says logo" once chose a client's logo from a case-study strip on
// alphaa.app ("Issuance Express"). Every candidate is now scored: the header/nav image linked to
// the home page, schema.org Organization.logo / og:logo on the same site and images named after
// the brand score up; logo strips (clients, partners, "as seen in"), off-site images and alt
// text naming another company score down. Icons are the fallback.

const GENERIC = new Set(["the", "and", "inc", "llc", "ltd", "co", "corp", "company", "group", "www", "com", "app", "net", "org", "io", "ca", "logo", "home", "official", "site", "website", "services", "service", "studio", "shop", "store", "online"])
const STRIP_RE = /client|partner|customer|trusted|featured|press|as-?seen|logos|brands|sponsor|case-?stud|testimonial|marquee|carousel|slider|ticker|portfolio|award|integration|work-with|worked-with/i
// Website builders serve the owner's own logo from their CDN: not "another site".
const BUILDER_CDN = /(^|\.)(wixstatic\.com|squarespace-cdn\.com|squarespace\.com|shopify\.com|shopifycdn\.net|webflow\.com|website-files\.com|wp\.com|wordpress\.com|godaddysites\.com|img1\.wsimg\.com|wsimg\.com|cloudfront\.net|cloudinary\.com|imgix\.net|ctfassets\.net|sanity\.io|framerusercontent\.com|hubspotusercontent[\w-]*\.net|googleusercontent\.com)$/i

const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean)
const flat = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "")
const rootDomain = (host: string) => host.replace(/^www\./, "").split(".").slice(-2).join(".")

/** Brand tokens: the business name's distinctive words + the domain's name ("alphaa" from alphaa.app). */
export function brandTokens(siteUrl: string, name?: string | null): string[] {
  let host = ""
  try { host = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`).hostname } catch { /* ignore */ }
  const label = host.replace(/^www\./, "").split(".")[0] ?? ""
  const fromName = words(name ?? "").filter((w) => w.length >= 3 && !GENERIC.has(w))
  const joined = flat(name ?? "")
  return Array.from(new Set([...fromName, ...(joined.length >= 4 ? [joined] : []), ...(label.length >= 3 && !GENERIC.has(label) ? [label] : [])]))
}

type LogoCandidate = { url: string; score: number; why: string[] }

/** Every logo candidate on the page, best first (exported for scripts/test-brand-kit.ts). */
export function logoCandidates(html: string, pageUrl: string, name?: string | null): LogoCandidate[] {
  const base = pageUrl.startsWith("http") ? pageUrl : `https://${pageUrl}`
  let site: URL
  try { site = new URL(base) } catch { return [] }
  const tokens = brandTokens(base, name)
  const hasBrand = (text: string) => { const f = flat(text); return tokens.some((t) => f.includes(t)) }
  const abs = (u: string | undefined | null) => { if (!u || u.startsWith("data:")) return null; try { return new URL(u.trim(), base).toString() } catch { return null } }
  const host = (u: string) => { try { return new URL(u).hostname.toLowerCase() } catch { return "" } }
  const sameSite = (u: string) => rootDomain(host(u)) === rootDomain(site.hostname)
  const fileOf = (u: string) => { try { return decodeURIComponent(new URL(u).pathname.split("/").pop() ?? "") } catch { return "" } }
  const isHome = (href: string | undefined) => {
    if (!href) return false
    const h = href.trim()
    if (h === "/" || h === "./" || h === "#" || h === "#top") return true
    try { const u = new URL(h, base); return sameSite(u.toString()) && (u.pathname === "/" || u.pathname === "" || /^\/(index\.\w+|home\/?)$/i.test(u.pathname) || /^\/[a-z]{2}(-[a-z]{2})?\/?$/i.test(u.pathname)) } catch { return false }
  }
  const out: LogoCandidate[] = []
  const add = (url: string | null, score: number, why: string[]) => { if (url) out.push({ url, score, why }) }

  const $ = load(html)
  // Images (img src / data-src / first srcset entry).
  $("img").each((i, el) => {
    const img = $(el)
    const raw = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || img.attr("srcset")?.split(/\s+/)[0]
    const url = abs(raw)
    if (!url) return
    const alt = img.attr("alt") ?? ""
    const meta = `${img.attr("class") ?? ""} ${img.attr("id") ?? ""} ${alt} ${fileOf(url)}`
    const why: string[] = []
    let score = 0
    const ancestors = img.parents().toArray()
    const ancText = (n: number) => ancestors.slice(0, n).map((a) => `${$(a).attr("class") ?? ""} ${$(a).attr("id") ?? ""} ${$(a).attr("aria-label") ?? ""}`).join(" ")
    const inTag = (re: RegExp) => ancestors.some((a) => re.test((a as { tagName?: string }).tagName ?? ""))
    const header = inTag(/^(header|nav)$/i) || ancestors.some((a) => $(a).attr("role") === "banner" || /\b(site-?header|navbar|masthead|top-?bar|header)\b/i.test($(a).attr("class") ?? ""))
    if (header) { score += 40; why.push("header") }
    const link = img.closest("a")
    if (link.length && isHome(link.attr("href"))) { score += 40; why.push("links home") }
    if (/logo|brand/i.test(meta) || /logo|brand/i.test(ancText(3))) { score += 20; why.push("says logo") }
    if (hasBrand(`${alt} ${fileOf(url)}`)) { score += 35; why.push("brand name") }
    else if (alt.trim() && tokens.length && !/^(logo|home|site logo|company logo|brand logo|header logo|main logo)$/i.test(alt.trim()) && /logo/i.test(alt)) { score -= 40; why.push("alt names another company") }
    // A logo strip: a near container holding several images, or one named like a client/partner list.
    const strip = ancestors.slice(0, 4).some((a) => $(a).find("img").length >= 3) && !header
    if (strip) { score -= 50; why.push("in a row of images") }
    if (STRIP_RE.test(ancText(6))) { score -= 40; why.push("client/partner section") }
    if (inTag(/^footer$/i)) { score -= 10; why.push("footer") }
    if (!sameSite(url) && !BUILDER_CDN.test(host(url))) { score -= 30; why.push("off-site") }
    const w = Number(img.attr("width")), h = Number(img.attr("height"))
    if ((w && w < 24) || (h && h < 16)) { score -= 20; why.push("tiny") }
    score -= Math.min(i, 20) // earlier on the page = more likely the site's own
    // Only images that look like a logo at all (a hero photo in the header isn't one).
    if (why.some((w) => w === "links home" || w === "says logo" || w === "brand name")) add(url, score, why)
  })

  // schema.org Organization / LocalBusiness logo.
  $("script[type='application/ld+json']").each((_, el) => {
    let data: unknown
    try { data = JSON.parse($(el).contents().text()) } catch { return }
    const walk = (v: unknown, depth = 0) => {
      if (!v || typeof v !== "object" || depth > 6) return
      if (Array.isArray(v)) { v.forEach((x) => walk(x, depth + 1)); return }
      const o = v as Record<string, unknown>
      const logo = o.logo
      const raw = typeof logo === "string" ? logo : logo && typeof logo === "object" ? ((logo as Record<string, unknown>).url ?? (logo as Record<string, unknown>).contentUrl) : null
      const url = typeof raw === "string" ? abs(raw) : null
      if (url) {
        const why = ["schema logo"]
        let score = 60
        if (sameSite(url) || BUILDER_CDN.test(host(url))) score += 10
        else { score -= 30; why.push("off-site") }
        const nm = typeof o.name === "string" ? o.name : ""
        if (nm && tokens.length && !hasBrand(nm)) { score -= 40; why.push("another organization") }
        if (hasBrand(fileOf(url)) || (nm && hasBrand(nm))) { score += 20; why.push("brand name") }
        add(url, score, why)
      }
      for (const k of Object.keys(o)) if (k !== "logo") walk(o[k], depth + 1)
    }
    walk(data)
  })

  // og:logo (non-standard but used), apple-touch-icon, large PNG/SVG icons.
  const ogLogo = abs($("meta[property='og:logo'], meta[name='og:logo']").attr("content"))
  if (ogLogo) add(ogLogo, sameSite(ogLogo) || BUILDER_CDN.test(host(ogLogo)) ? 60 : 30, ["og:logo"])
  $("link[rel]").each((_, el) => {
    const rel = ($(el).attr("rel") ?? "").toLowerCase()
    const url = abs($(el).attr("href"))
    if (!url) return
    const size = Number(($(el).attr("sizes") ?? "").match(/\d+/)?.[0] ?? 0)
    if (rel.includes("apple-touch-icon")) add(url, 30 + Math.min(size, 180) / 18, ["apple-touch-icon"])
    else if (/(^|\s)icon(\s|$)/.test(rel) && !/\.ico(\?|$)/i.test(url)) add(url, 15 + Math.min(size, 512) / 32, ["icon"])
  })

  // Same URL from several places: keep its best score.
  const best = new Map<string, LogoCandidate>()
  for (const c of out) { const b = best.get(c.url); if (!b || c.score > b.score) best.set(c.url, c) }
  return [...best.values()].sort((a, b) => b.score - a.score)
}

/** The site's own logo, or null. An image has to beat the icons to win. */
export function pickLogo(html: string, pageUrl: string, name?: string | null): string | null {
  const top = logoCandidates(html, pageUrl, name)[0]
  return top && top.score > 0 ? top.url : null
}
