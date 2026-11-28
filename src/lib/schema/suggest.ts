// Which structured data blocks to offer ("What I'd add" on Tracking & Setup). Pure, tested in
// scripts/test-schema-validate.ts. Rules (2026-11-28, after alphaa.app was offered LocalBusiness,
// SoftwareApplication for /product and FAQPage for /faq, pages it doesn't have):
//   - only pages that exist (read from the site at generation time, or seen in the sitemap/audit),
//   - never a type the page already has,
//   - the business type from the profile: online software / SaaS / online shops are an
//     Organization; LocalBusiness only for a place customers visit or a service area.
import { LOCAL_BUSINESS_TYPES, ORGANIZATION_TYPES } from "./rules"

export type Suggestion = { type: string; pageUrl: string; jsonLd: object; /** The page was read when this block was made. */ checked?: boolean }

const ONLINE = /\b(saas|software|web ?app|mobile app|\bapps?\b|online|e-?commerce|ecommerce|digital product|platform|api|cloud|plugin|chrome extension|marketplace)\b/i
const PLACE = /\b(clinic|salon|spa\b|restaurant|caf[eé]|storefront|gym\b|dental|dentist|plumb|electric|hvac|roof|contractor|clean|landscap|mover|moving|repair|law firm|lawyer|attorney|realtor|real estate|bakery|bar\b|pub\b|hotel|daycare|vet\b|veterinar)/i

/** An online business (software, SaaS, online store): no place customers visit, no service area. */
export function isOnlineBusiness(businessType: string | null | undefined): boolean {
  const bt = (businessType ?? "").trim()
  if (!bt) return false
  if (PLACE.test(bt)) return false
  if (ONLINE.test(bt)) return true
  return false
}

const pathKey = (u: string) => {
  let p = u
  try { p = /^https?:\/\//i.test(u) ? new URL(u).pathname : u } catch {}
  p = (p || "/").replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase()
  return p || "/"
}
const isBusinessType = (t: string) => LOCAL_BUSINESS_TYPES.has(t) || ORGANIZATION_TYPES.has(t) || t === "LocalBusiness"

/**
 * Keep the blocks worth offering. `pages` = URLs or paths known to exist (sitemap, audit, crawl);
 * `existing` = types already on each page (from the structured data audit).
 */
export function filterSuggestions<T extends Suggestion>(items: T[], ctx: { pages: string[]; existing: { url: string; types: string[] }[]; online: boolean }): T[] {
  const known = new Set(ctx.pages.map(pathKey))
  known.add("/")
  const has = new Map<string, Set<string>>()
  for (const e of ctx.existing) {
    const k = pathKey(e.url)
    const s = has.get(k) ?? new Set<string>()
    for (const t of e.types) s.add(t)
    has.set(k, s)
  }
  return items.filter((i) => {
    const page = pathKey(i.pageUrl || "/")
    if (!i.checked && !known.has(page)) return false
    if (ctx.online && (LOCAL_BUSINESS_TYPES.has(i.type) || i.type === "LocalBusiness")) return false
    const there = has.get(page)
    if (there?.has(i.type)) return false
    // The page already describes the business (any LocalBusiness subtype or Organization): a second business block is a duplicate.
    if (isBusinessType(i.type) && there && [...there].some(isBusinessType)) return false
    return true
  })
}
