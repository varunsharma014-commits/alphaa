import { fetchPage } from "./fetch-page"
import { checkAppearance } from "../ai-engines"

// NAP consistency: does each directory page show the same Name, Address and
// Phone the business actually uses? AI engines cross-check listings; a Yelp
// page with an old phone number is a reason for an engine to trust the
// business less (or to quote the wrong number to a customer).
//
// Principles, same as citations.ts: "couldn't read the page" is never reported
// as a mismatch, and nothing here throws — every URL gets a finding.

export type NapFacts = { name: string; phone: string | null; street: string | null; city: string | null; zip: string | null }

export type NapFinding = {
  url: string
  domain: string
  readable: boolean
  nameFound: boolean
  phoneOnPage: string | null
  phoneMatches: boolean | null
  addressMatches: boolean | null
  issue: string | null
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
const TIMEOUT_MS = 8000
const CONCURRENCY = 4
/** How far from a mention of the name we look for its phone/address. */
const WINDOW = 600

const SITE_NAMES: [string, string][] = [
  ["yelp.", "Yelp"], ["yellowpages.", "Yellow Pages"], ["bbb.org", "BBB"], ["facebook.com", "Facebook"],
  ["mapquest.", "MapQuest"], ["manta.com", "Manta"], ["foursquare.", "Foursquare"], ["tripadvisor.", "Tripadvisor"],
  ["angi.com", "Angi"], ["nextdoor.", "Nextdoor"], ["google.", "Google"], ["apple.com", "Apple Maps"],
  ["bing.com", "Bing"], ["superpages.", "Superpages"], ["chamberofcommerce.", "Chamber of Commerce"],
  ["thumbtack.", "Thumbtack"], ["homeadvisor.", "HomeAdvisor"], ["houzz.", "Houzz"], ["healthgrades.", "Healthgrades"],
  ["zocdoc.", "Zocdoc"], ["opentable.", "OpenTable"], ["hotfrog.", "Hotfrog"], ["merchantcircle.", "MerchantCircle"],
  ["citysearch.", "Citysearch"], ["brownbook.", "Brownbook"], ["cylex.", "Cylex"], ["porch.com", "Porch"],
  ["waze.com", "Waze"], ["instagram.com", "Instagram"], ["linkedin.com", "LinkedIn"], ["trustpilot.", "Trustpilot"],
]

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return ""
  }
}

function siteLabel(domain: string): string {
  const hit = SITE_NAMES.find(([k]) => domain.includes(k))
  return hit ? hit[1] : domain || "This page"
}

const digits = (s: string) => s.replace(/\D/g, "")
const last10 = (s: string) => digits(s).slice(-10)

function formatPhone(s: string): string {
  const d = last10(s)
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s.trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const c = Number(n)
      return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : " "
    })
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      // Keep click-to-call numbers: they're often the only machine-readable phone.
      .replace(/<a\b[^>]*href=["']tel:([^"']+)["'][^>]*>/gi, (_, t) => ` ${formatPhone(decodeURIComponent(t))} `)
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ")
}

// NANP: (555) 010-1111, 555-010-1111, 555.010.1111, +1 555 010 1111. A
// separator between groups is required so 10-digit IDs and prices don't match.
const PHONE_RE = /(?<![\d-])(?:\+?1[\s.-]?)?(?:\(\d{3}\)\s?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?![\d-])/g

function phonesIn(s: string): { raw: string; index: number }[] {
  const out: { raw: string; index: number }[] = []
  for (const m of s.matchAll(PHONE_RE)) out.push({ raw: m[0], index: m.index ?? 0 })
  return out
}

// ---------------------------------------------------------------------------
// JSON-LD: a LocalBusiness block with telephone/address is the page's own
// structured claim — more reliable than guessing from proximity in text.

type LdBiz = { name: string | null; telephone: string | null; address: string | null }

function ldAddressText(a: unknown): string | null {
  if (!a) return null
  if (typeof a === "string") return a
  if (Array.isArray(a)) return a.map(ldAddressText).filter(Boolean).join(" ") || null
  if (typeof a === "object") {
    const o = a as Record<string, unknown>
    return (
      ["streetAddress", "addressLocality", "addressRegion", "postalCode"]
        .map((k) => (typeof o[k] === "string" ? (o[k] as string) : ""))
        .join(" ")
        .trim() || null
    )
  }
  return null
}

function extractLdBusinesses(html: string): LdBiz[] {
  const out: LdBiz[] = []
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  const walk = (node: unknown, depth: number) => {
    if (!node || typeof node !== "object" || depth > 8) return
    if (Array.isArray(node)) return node.forEach((n) => walk(n, depth + 1))
    const o = node as Record<string, unknown>
    const tel = typeof o.telephone === "string" ? o.telephone : Array.isArray(o.telephone) && typeof o.telephone[0] === "string" ? (o.telephone[0] as string) : null
    const addr = ldAddressText(o.address)
    if (tel || addr) {
      out.push({ name: typeof o.name === "string" ? decodeEntities(o.name) : null, telephone: tel, address: addr ? decodeEntities(addr) : null })
    }
    for (const k of ["@graph", "mainEntity", "itemListElement", "item", "about", "provider", "location"]) {
      if (k in o) walk(o[k], depth + 1)
    }
  }
  for (const b of blocks) {
    try {
      walk(JSON.parse(b[1].trim()), 0)
    } catch {
      // Malformed JSON-LD is common; ignore it and fall back to text.
    }
  }
  return out
}

// ---------------------------------------------------------------------------

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Positions of the business name in the text (exact, then checkAppearance's snippet). */
function nameIndexes(text: string, name: string): number[] {
  const lower = text.toLowerCase()
  const needle = name.toLowerCase().trim()
  const idx: number[] = []
  if (needle) {
    let from = 0
    while (idx.length < 25) {
      const i = lower.indexOf(needle, from)
      if (i === -1) break
      idx.push(i)
      from = i + needle.length
    }
  }
  if (idx.length) return idx
  const { appeared, snippet } = checkAppearance(text, name)
  if (!appeared) return []
  const at = snippet ? text.indexOf(snippet) : -1
  return [at === -1 ? 0 : at + Math.min(50, snippet!.length)]
}

function addressMatchesIn(hay: string, facts: NapFacts): boolean | null {
  const zip = facts.zip?.match(/\d{5}/)?.[0] ?? null
  const street = facts.street?.trim() || ""
  const sm = /^(\d+[a-z]?)\s+(?:(?:n|s|e|w|ne|nw|se|sw|north|south|east|west)\.?\s+)?([a-z0-9]+)/i.exec(street)
  if (!zip && !sm) return null
  if (zip && new RegExp(`\\b${zip}\\b`).test(hay)) return true
  if (sm) {
    const re = new RegExp(`\\b${escapeRe(sm[1])}\\b[^\\d]{0,24}?\\b${escapeRe(sm[2])}`, "i")
    if (re.test(hay)) return true
  }
  // Only call it a mismatch when the page actually shows an address nearby;
  // a listing that just omits the address is "not shown", not "wrong".
  const showsAddress =
    /\b\d{5}(?:-\d{4})?\b/.test(hay) ||
    /\b\d{1,6}\s+(?:[A-Z][a-z]+\s+){1,3}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place|Pkwy|Parkway|Hwy|Highway)\b/.test(hay)
  return showsAddress ? false : null
}

async function checkOne(url: string, facts: NapFacts): Promise<NapFinding> {
  const domain = hostOf(url)
  const site = siteLabel(domain)
  const base: NapFinding = {
    url, domain, readable: false, nameFound: false, phoneOnPage: null, phoneMatches: null, addressMatches: null,
    issue: "Couldn’t read this page",
  }
  try {
    if (!domain) return base
    // Direct, then through Apify's residential proxy if the directory blocks us.
    const page = await fetchPage(url, TIMEOUT_MS)
    if (!page.readable) return base
    const html = page.html
    const text = htmlToText(html)
    // Bot walls return 200 with almost nothing in them.
    if (text.trim().length < 200) return base

    const ourPhone = facts.phone ? last10(facts.phone) : null
    const havePhone = !!ourPhone && ourPhone.length === 10

    // 1) Structured data first.
    const ld = extractLdBusinesses(html).filter((b) => b.name && checkAppearance(b.name, facts.name).appeared)
    let pagePhone: string | null = null
    let phoneMatches: boolean | null = null
    let addressMatches: boolean | null = null
    let nameFound = ld.length > 0

    if (ld.length) {
      const tels = ld.map((b) => b.telephone).filter((t): t is string => !!t && last10(t).length === 10)
      if (tels.length) {
        const hit = havePhone ? tels.find((t) => last10(t) === ourPhone) : undefined
        pagePhone = formatPhone(hit ?? tels[0])
        phoneMatches = havePhone ? !!hit : null
      }
      const addrs = ld.map((b) => b.address).filter((a): a is string => !!a)
      if (addrs.length) addressMatches = addressMatchesIn(addrs.join(" | "), facts)
    }

    // 2) Text near the name fills whatever JSON-LD didn't answer.
    const at = nameIndexes(text, facts.name)
    if (at.length) nameFound = true
    if (!nameFound) {
      return { ...base, readable: true, issue: "Couldn’t find your listing on this page" }
    }

    if (at.length && (pagePhone === null || addressMatches === null)) {
      const windows = at.map((i) => ({ i, s: Math.max(0, i - WINDOW), e: Math.min(text.length, i + WINDOW) }))
      if (pagePhone === null) {
        let best: { raw: string; dist: number } | null = null
        let match: string | null = null
        for (const w of windows) {
          for (const p of phonesIn(text.slice(w.s, w.e))) {
            const d = last10(p.raw)
            if (havePhone && d === ourPhone) match = p.raw
            const dist = Math.abs(w.s + p.index - w.i)
            if (!best || dist < best.dist) best = { raw: p.raw, dist }
          }
        }
        const chosen = match ?? best?.raw ?? null
        if (chosen) {
          pagePhone = formatPhone(chosen)
          phoneMatches = havePhone ? !!match : null
        }
      }
      if (addressMatches === null) {
        addressMatches = addressMatchesIn(windows.map((w) => text.slice(w.s, w.e)).join(" | "), facts)
      }
    }

    let issue: string | null = null
    if (phoneMatches === false && pagePhone) {
      issue = `${site} shows ${pagePhone} — your phone is ${formatPhone(facts.phone!)}`
    } else if (addressMatches === false) {
      const where = [facts.street, facts.city, facts.zip].filter(Boolean).join(", ")
      issue = `${site} shows a different address — yours is ${where}`
    }

    return { url, domain, readable: true, nameFound: true, phoneOnPage: pagePhone, phoneMatches, addressMatches, issue }
  } catch {
    return base
  }
}

async function mapWithLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx])
      }
    })
  )
  return out
}

export async function checkNap(urls: string[], facts: NapFacts): Promise<NapFinding[]> {
  try {
    const list = [...new Set((urls || []).map((u) => (u || "").trim()).filter(Boolean))]
    if (!list.length || !facts?.name?.trim()) return []
    return await mapWithLimit(list, CONCURRENCY, (u) => checkOne(u, facts))
  } catch {
    return []
  }
}

export function napSummary(f: NapFinding[]): { checked: number; mismatched: number; lines: string[] } {
  const readable = f.filter((x) => x.readable)
  const found = readable.filter((x) => x.nameFound)
  const bad = found.filter((x) => x.phoneMatches === false || x.addressMatches === false)
  const lines: string[] = []

  for (const x of bad) if (x.issue) lines.push(x.issue)

  const consistent = found.length - bad.length
  if (found.length) {
    lines.push(
      bad.length
        ? `${consistent} of ${found.length} listing${found.length === 1 ? "" : "s"} match your name, address and phone`
        : `All ${found.length} listing${found.length === 1 ? "" : "s"} we could read match your details`
    )
  }

  const missing = readable.filter((x) => !x.nameFound)
  if (missing.length) {
    lines.push(`Couldn’t find your listing on ${missing.map((x) => siteLabel(x.domain)).join(", ")}`)
  }
  const unread = f.filter((x) => !x.readable)
  if (unread.length) {
    lines.push(`Couldn’t read ${unread.length} page${unread.length === 1 ? "" : "s"} (${unread.map((x) => siteLabel(x.domain)).join(", ")}) — not counted`)
  }

  return { checked: readable.length, mismatched: bad.length, lines }
}
