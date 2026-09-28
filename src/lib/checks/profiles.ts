// Finds the business's social/directory profiles (linked from its homepage or
// JSON-LD sameAs, plus any the owner gives us) and reads each one the way an
// AI assistant would: does the name match, the phone match, does it link
// back? Networks that block automated visits are reported as unreadable,
// never as a fabricated mismatch. Nothing here throws.

import { apifyEnabled, facebookPage, instagramProfile, type SocialData } from "./apify"
import { checkAppearance } from "@/lib/ai-engines"
import { fetchPage, jsonLdNodes, mapLimit } from "./fetch-page"

export type ProfileNetwork = "facebook" | "instagram" | "linkedin" | "yelp" | "youtube" | "tiktok" | "x" | "nextdoor" | "google"

export type ProfileFinding = {
  network: ProfileNetwork
  url: string
  source: "website" | "owner"
  readable: boolean
  nameMatches: boolean | null
  phoneMatches: boolean | null
  linksToWebsite: boolean | null
  bio: string | null
  issues: string[]
}

const LABEL: Record<ProfileNetwork, string> = {
  facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", yelp: "Yelp", youtube: "YouTube",
  tiktok: "TikTok", x: "X", nextdoor: "Nextdoor", google: "Google",
}

const NETWORKS: [RegExp, ProfileNetwork][] = [
  [/^(www\.|m\.|web\.)?facebook\.com$|^fb\.com$|^fb\.me$/i, "facebook"],
  [/^(www\.)?instagram\.com$/i, "instagram"],
  [/^([a-z]{2,3}\.)?linkedin\.com$/i, "linkedin"],
  [/^(www\.|m\.)?yelp\.[a-z.]+$/i, "yelp"],
  [/^(www\.|m\.)?youtube\.com$|^youtu\.be$/i, "youtube"],
  [/^(www\.)?tiktok\.com$/i, "tiktok"],
  [/^(www\.|mobile\.)?(twitter|x)\.com$/i, "x"],
  [/^(www\.)?nextdoor\.com$/i, "nextdoor"],
  [/^(maps\.app\.goo\.gl|g\.page|goo\.gl|business\.google\.com|g\.co|maps\.google\.[a-z.]+|(www\.)?google\.[a-z.]+)$/i, "google"],
]

// Share buttons, pixels, embeds, single posts — not the business's profile.
const NOT_PROFILE =
  /\/(sharer|share|dialog|plugins|tr|intent|share\.php|home\.php|login|signup|hashtag|search|p|reel|reels|watch|embed|status|explore|feed|shareArticle|oauth|v\d+\.\d+)(\/|\.php|$|\?)|[?&](u|url|text)=/i

export function networkOf(raw: string): ProfileNetwork | null {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (!/^https?:$/.test(u.protocol)) return null
  const host = u.hostname.toLowerCase()
  const hit = NETWORKS.find(([re]) => re.test(host))
  if (!hit) return null
  const net = hit[1]
  const path = u.pathname + u.search
  if (net === "google") {
    // Only Maps / Business Profile links count, not google.com/search etc.
    if (/^(www\.)?google\./i.test(host) && !/^\/maps/i.test(u.pathname)) return null
    if (host === "goo.gl" && !/^\/maps/i.test(u.pathname)) return null
    return net
  }
  if (net === "youtube" && /\/(watch|embed|shorts)\b/i.test(u.pathname)) return null
  if (NOT_PROFILE.test(path)) return null
  if (u.pathname.replace(/\/+$/, "") === "") return null // bare network homepage
  if (net === "yelp" && !/^\/biz\//i.test(u.pathname)) return null
  return net
}

function cleanUrl(raw: string): string {
  try {
    const u = new URL(raw)
    u.hash = ""
    // Tracking params only; keep ids like ?id= / profile.php?id=
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|igshid|ref|fref|hl|si)/i.test(k)) u.searchParams.delete(k)
    return u.toString().replace(/\/+$/, "")
  } catch {
    return raw
  }
}

function withScheme(site: string): string {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`
}

export async function findProfileUrls(siteUrl: string): Promise<{ network: ProfileNetwork; url: string }[]> {
  try {
    const home = await fetchPage(withScheme(siteUrl))
    if (!home.html) return []
    const { load } = await import("cheerio")
    const $ = load(home.html)
    const candidates: string[] = []
    // JSON-LD sameAs first: it's the business's own declaration.
    for (const o of jsonLdNodes(home.html, load)) {
      const s = o.sameAs
      for (const x of Array.isArray(s) ? s : s ? [s] : []) if (typeof x === "string") candidates.push(x)
    }
    $("a[href]").each((_, el) => {
      const h = $(el).attr("href")
      if (!h) return
      try {
        candidates.push(new URL(h, home.finalUrl).toString())
      } catch {}
    })
    const seen = new Map<ProfileNetwork, string>()
    for (const c of candidates) {
      const net = networkOf(c.trim())
      if (net && !seen.has(net)) seen.set(net, cleanUrl(c.trim()))
    }
    return [...seen].map(([network, url]) => ({ network, url }))
  } catch {
    return []
  }
}

const digits = (s: string) => s.replace(/\D/g, "").slice(-10)

function phonesIn(text: string, $tel: string[]): string[] {
  const found = new Set<string>()
  for (const t of $tel) if (digits(t).length === 10) found.add(digits(t))
  const re = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
  for (const m of text.match(re) || []) {
    const d = digits(m)
    if (d.length === 10 && !/^(\d)\1+$/.test(d)) found.add(d)
  }
  return [...found]
}

function domainOf(site: string): string | null {
  try {
    return new URL(withScheme(site)).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return null
  }
}

const BLOCKED_ISSUE = "Couldn’t read it — the network blocks automated visits"

async function readProfile(
  p: { network: ProfileNetwork; url: string; source: "website" | "owner" },
  ctx: { businessName: string; phone: string | null; domain: string | null; load: typeof import("cheerio").load }
): Promise<ProfileFinding> {
  const base: ProfileFinding = { ...p, readable: false, nameMatches: null, phoneMatches: null, linksToWebsite: null, bio: null, issues: [BLOCKED_ISSUE] }
  try {
    // Facebook and Instagram need a real scraper; Apify returns structured data.
    if ((p.network === "facebook" || p.network === "instagram") && apifyEnabled()) {
      const d = p.network === "facebook" ? await facebookPage(p.url) : await instagramProfile(p.url)
      if (d) return fromSocialData(p, d, ctx)
    }
    const page = await fetchPage(p.url)
    if (!page.readable) return base
    const $ = ctx.load(page.html)
    const name = LABEL[p.network]
    const meta = (sel: string) => ($(sel).attr("content") || "").trim()
    const title = meta('meta[property="og:title"]') || $("title").first().text().trim()
    const bioRaw = meta('meta[property="og:description"]') || meta('meta[name="description" i]')
    const bio = bioRaw ? bioRaw.replace(/\s+/g, " ").slice(0, 300) : null
    // A logged-out app shell (Instagram, TikTok) returns 200 with no profile
    // data at all — reading it as "name doesn't match" would be a false finding.
    const shellTitle =
      !title ||
      title.toLowerCase() === name.toLowerCase() ||
      /^(log ?in|sign ?(in|up))\b|^tiktok - make your day$|^(x|twitter)$|^(instagram|facebook|linkedin|youtube|nextdoor)( - .*)?$/i.test(title)
    if (!meta('meta[property="og:title"]') && !bioRaw && shellTitle) return base
    $("script, style, noscript, template").remove()
    const text = $("body").text().replace(/\s+/g, " ")
    const tels = $('a[href^="tel:"]').map((_, el) => $(el).attr("href") || "").get()

    const nameMatches = title ? checkAppearance(title, ctx.businessName).appeared : null
    const pagePhones = phonesIn(`${title} ${bio ?? ""} ${text}`, tels)
    const known = ctx.phone ? digits(ctx.phone) : ""
    const phoneMatches = known.length === 10 && pagePhones.length ? pagePhones.includes(known) : null
    const lowerHtml = page.html.toLowerCase()
    const linksToWebsite = ctx.domain
      ? lowerHtml.includes(ctx.domain) || lowerHtml.includes(encodeURIComponent(ctx.domain).toLowerCase())
      : null

    const issues: string[] = []
    if (nameMatches === false) issues.push(`The name on ${name} doesn’t match your website`)
    if (phoneMatches === false) issues.push(`The phone number on ${name} doesn’t match your website`)
    if (linksToWebsite === false) issues.push("Doesn’t link to your website")
    if (!bio) issues.push(`No description on your ${name} profile`)
    return { ...p, readable: true, nameMatches, phoneMatches, linksToWebsite, bio, issues }
  } catch {
    return base
  }
}

function fromSocialData(
  p: { network: ProfileNetwork; url: string; source: "website" | "owner" },
  d: SocialData,
  ctx: { businessName: string; phone: string | null; domain: string | null }
): ProfileFinding {
  const name = LABEL[p.network]
  const nameMatches = d.name ? checkAppearance(d.name, ctx.businessName).appeared : null
  const known = ctx.phone ? digits(ctx.phone) : ""
  const theirs = d.phone ? digits(d.phone).slice(-10) : ""
  const phoneMatches = known.length === 10 && theirs.length === 10 ? known === theirs : null
  const linksToWebsite = ctx.domain ? (d.website ? d.website.toLowerCase().includes(ctx.domain) : false) : null
  const bio = d.bio ? d.bio.replace(/\s+/g, " ").slice(0, 300) : null
  const issues: string[] = []
  if (nameMatches === false) issues.push(`The name on ${name} (“${d.name}”) doesn’t match your business name`)
  if (phoneMatches === false) issues.push(`${name} shows ${d.phone} — not your phone number`)
  if (linksToWebsite === false) issues.push(d.website ? `${name} links to ${d.website}, not your website` : `Your ${name} profile doesn’t link to your website`)
  if (!bio) issues.push(`No description on your ${name} profile`)
  return { ...p, readable: true, nameMatches, phoneMatches, linksToWebsite, bio, issues }
}

export async function checkProfiles(input: {
  siteUrl: string
  businessName: string
  phone: string | null
  extraUrls?: string[]
}): Promise<ProfileFinding[]> {
  try {
    const fromSite = await findProfileUrls(input.siteUrl)
    const list: { network: ProfileNetwork; url: string; source: "website" | "owner" }[] = fromSite.map((x) => ({ ...x, source: "website" }))
    const have = new Set(list.map((x) => x.url.toLowerCase()))
    for (const raw of input.extraUrls ?? []) {
      const url = cleanUrl(withScheme(raw.trim()))
      const network = networkOf(url)
      if (!network || have.has(url.toLowerCase())) continue
      have.add(url.toLowerCase())
      list.push({ network, url, source: "owner" })
    }
    if (!list.length) return []
    const { load } = await import("cheerio")
    const ctx = { businessName: input.businessName, phone: input.phone, domain: domainOf(input.siteUrl), load }
    return await mapLimit(list, 3, (p) => readProfile(p, ctx))
  } catch {
    return []
  }
}

const VISUAL = /restaurant|cafe|café|coffee|bakery|bar\b|pub|salon|spa\b|barber|nail|beauty|boutique|retail|store|shop|florist|gym|fitness|yoga|tattoo|bridal|jewel/i
const PROFESSIONAL = /law|legal|attorney|lawyer|account|cpa|tax|bookkeep|consult|financial|advis|insurance|architect|engineer|agency|marketing|real estate|realtor|recruit|staffing/i

export function missingNetworks(found: ProfileNetwork[], businessType: string | null): ProfileNetwork[] {
  const t = businessType ?? ""
  const wanted: ProfileNetwork[] = ["google", "facebook", "yelp"]
  if (VISUAL.test(t)) wanted.push("instagram")
  if (PROFESSIONAL.test(t)) wanted.splice(2, 0, "linkedin") // LinkedIn outranks Yelp for professional services
  const have = new Set(found)
  return wanted.filter((n) => !have.has(n)).slice(0, 3)
}
