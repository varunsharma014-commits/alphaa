// Structured data we offer the owner to install (LocalBusiness/Organization, WebSite, FAQPage).
//
// Rewritten 2026-11-28: built in CODE from real data only, no AI. The old version asked a model for
// "3-5 realistic FAQs" and "real services a <type> would offer", which were invented facts. Now:
//   - the business block comes from the profile + the owner's locations + the brand kit logo,
//   - FAQPage only from questions AND answers that are really on the site (homepage / FAQ page),
//   - every block must pass our validator (lib/schema/rules.ts) with zero errors before it's offered.
// §10 rule 20 still holds: addressCountry only from the state/province, unknown fields omitted, no
// sameAs except links on the business's own domain (sanitizeNode strips the rest).
import type { User } from "@prisma/client"
import { getAgentSettings } from "@/lib/agent/settings"
import { readSitemap } from "@/lib/page-reader"
import { businessLd, faqLdFrom, onlyValid, websiteLd } from "@/lib/schema/build"
import { extractFaq } from "@/lib/schema/extract"
import { fetchHtml, latestSchemaAudit } from "@/lib/schema/audit"
import { filterSuggestions, isOnlineBusiness } from "@/lib/schema/suggest"

export type SchemaItem = {
  type: string   // "LocalBusiness", "FAQPage", etc.
  pageUrl: string // e.g. "/" or "/contact"
  jsonLd: object
  /** The page was read when this block was made (older AI-made records don't have it). */
  checked?: boolean
}

function hostOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

// Recursively drop `sameAs` links that aren't on the business's own domain (guessed social URLs are
// invented facts). Kept as a last line of defence on everything we offer.
export function sanitizeNode(node: unknown, ownHost: string | null): unknown {
  if (Array.isArray(node)) return node.map((n) => sanitizeNode(n, ownHost))
  if (typeof node !== "object" || node === null) return node
  const obj = { ...(node as Record<string, unknown>) }
  if ("sameAs" in obj) {
    const links = (Array.isArray(obj.sameAs) ? obj.sameAs : [obj.sameAs]).filter(
      (l): l is string => typeof l === "string" && hostOf(l) !== null && hostOf(l) === ownHost
    )
    if (links.length > 0) obj.sameAs = links
    else delete obj.sameAs
  }
  for (const key of Object.keys(obj)) if (key !== "sameAs") obj[key] = sanitizeNode(obj[key], ownHost)
  return obj
}

// Placeholder names the old AI generator wrote when the profile had no name ("My Business").
const PLACEHOLDER_NAME = /^(my|your|the|sample|example)\s+(business|company|brand|store|shop)$/i

/**
 * The stored blocks that are safe to show, install or serve. Records written by the old AI generator
 * (before 2026-11-28) have no `checked` flag and carry invented FAQ answers, services and the
 * placeholder name "My Business", so they are never offered again: the owner rewrites them, and the
 * new generator only uses real facts. Also drops any block still named like a placeholder.
 */
export function trustedSchemas(raw: unknown): SchemaItem[] {
  if (!Array.isArray(raw)) return []
  return (raw as SchemaItem[]).filter((i) => {
    if (!i || typeof i !== "object" || !i.jsonLd || i.checked !== true) return false
    const name = (i.jsonLd as Record<string, unknown>).name
    return !(typeof name === "string" && PLACEHOLDER_NAME.test(name.trim()))
  })
}

const typeOf = (ld: object) => String((ld as Record<string, unknown>)["@type"] ?? "Thing")
const pathOf = (u: string) => { try { return new URL(u).pathname || "/" } catch { return "/" } }

/** The blocks for this brand, each validated. `dropped` lists anything that failed (shouldn't happen; logged). */
export async function generateSchemaFor(user: User): Promise<{ schemas: SchemaItem[]; faqFrom: string | null }> {
  const site = user.websiteUrl?.trim() ? (/^https?:\/\//i.test(user.websiteUrl) ? user.websiteUrl.trim() : `https://${user.websiteUrl.trim()}`) : null
  const settings = await getAgentSettings(user.id)
  const locs = settings.locations ?? []
  const main = locs.find((l) => l.city?.trim().toLowerCase() === user.city?.trim().toLowerCase()) ?? (user.city?.trim() ? null : locs[0]) ?? null
  const items: SchemaItem[] = []
  const online = isOnlineBusiness(user.businessType)

  const biz = businessLd({
    name: user.businessName,
    businessType: user.businessType,
    url: site,
    description: user.voiceDescription,
    logo: settings.brand?.logo ?? null,
    phone: main?.phone ?? null,
    street: main?.street ?? null,
    city: main?.city || user.city,
    region: main?.state || user.state,
    postal: main?.zip || user.zip,
    online,
  })
  items.push({ type: typeOf(biz), pageUrl: "/", jsonLd: biz, checked: true })
  const web = websiteLd(user.businessName, site)
  if (web) items.push({ type: "WebSite", pageUrl: "/", jsonLd: web, checked: true })

  // FAQPage: only the site's own questions with their own answers (homepage, else an FAQ page).
  let faqFrom: string | null = null
  if (site) {
    const map = await readSitemap(site, 300).catch(() => ({ urls: [] as { url: string }[] }))
    const faqPage = map.urls.map((u) => u.url).find((u) => /faq|questions/i.test(pathOf(u)))
    for (const url of [faqPage, new URL(site).origin + "/"].filter((u): u is string => !!u)) {
      const got = await fetchHtml(url)
      const qas = got.html ? extractFaq(got.html).filter((q) => q.source !== "jsonld") : []
      const faq = qas.length >= 2 ? faqLdFrom(qas) : null
      if (faq) { items.push({ type: "FAQPage", pageUrl: pathOf(got.finalUrl), jsonLd: faq, checked: true }); faqFrom = got.finalUrl; break }
    }
  }

  // Never a type the page already has (from the newest structured data audit of the live site).
  const audit = await latestSchemaAudit(user.id).catch(() => null)
  const offered = filterSuggestions(items, { pages: [], existing: (audit?.pages ?? []).map((p) => ({ url: p.url, types: p.types })), online })

  const own = hostOf(site ?? "")
  const clean = offered.map((i) => ({ ...i, jsonLd: sanitizeNode(i.jsonLd, own) as object }))
  const { kept, dropped } = onlyValid(clean)
  for (const d of dropped) console.error("[schema] dropped a block that failed validation", d.item.type, d.reasons.slice(0, 3))
  return { schemas: kept, faqFrom }
}
