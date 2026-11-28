// Structured data audit of the owner's own site: every JSON-LD block on the key pages, checked
// against Google's rich-result rules (lib/schema/rules.ts) and against the brand's real data
// (name / phone / address from the profile and locations). Weekly with the site vitals cron and on
// demand. Stored as MockActivity "schema_audit" (one row per run).
import type { Prisma, User } from "@prisma/client"
import { db } from "@/lib/db"
import { safeFetch } from "@/lib/safe-fetch"
import { readSitemap } from "@/lib/page-reader"
import { getAgentSettings, type AgentSettings } from "@/lib/agent/settings"
import { latestPageSnapshot } from "@/lib/seo/page-stats"
import { extractJsonLd, type ShopifyProductJs } from "@/lib/schema/extract"
import { factMismatches, flattenJsonLd, PRODUCT_TYPES, validateBlocks, type BrandFacts, type Mismatch, type SdIssue } from "@/lib/schema/rules"
import { productLdFromShopify } from "@/lib/schema/build"

export const SCHEMA_AUDIT = "schema_audit"
const UA = "AlphaaBot/1.0 (SEO audit; +https://alphaa.app)"
const MAX_PAGES = 8

export type PageAudit = {
  url: string
  /** null = the page couldn't be read. */
  status: number | null
  blocks: number
  types: string[]
  errors: number
  warnings: number
  issues: (SdIssue & { node: string })[]
  parseErrors: { snippet: string; error: string }[]
}
export type ProductSuggestion = { pageUrl: string; name: string; jsonLd: object }
export type SchemaAudit = {
  at: string
  pages: PageAudit[]
  mismatches: (Mismatch & { url: string })[]
  /** Shopify product pages with no valid Product block: one built from the store's own product data. */
  products: ProductSuggestion[]
  totals: { errors: number; warnings: number; blocks: number }
  /** Mismatches that weren't there last time (the Briefing shows these). */
  alerts: string[]
  reason: "weekly" | "owner"
}

const withHttps = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`)
const keyOf = (u: string) => u.replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase()
const bare = (u: string) => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, "") } catch { return "" } }

export async function fetchHtml(url: string, ms = 12_000): Promise<{ status: number | null; html: string | null; finalUrl: string }> {
  try {
    const res = await safeFetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" }, redirect: "follow", signal: AbortSignal.timeout(ms) })
    if (!res.ok || !/html/i.test(res.headers.get("content-type") ?? "")) { await res.body?.cancel().catch(() => {}); return { status: res.status, html: null, finalUrl: res.url || url } }
    return { status: res.status, html: (await res.text()).slice(0, 2_000_000), finalUrl: res.url || url }
  } catch {
    return { status: null, html: null, finalUrl: url }
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await safeFetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, redirect: "follow", signal: AbortSignal.timeout(10_000) })
    if (!res.ok) { await res.body?.cancel().catch(() => {}); return null }
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** What the owner told us: profile + locations. Only these are compared with the site. */
export function brandFactsOf(user: Pick<User, "businessName" | "city" | "state" | "zip">, settings: Pick<AgentSettings, "locations">): BrandFacts {
  const locs = settings.locations ?? []
  const list = (xs: (string | null | undefined)[]) => [...new Set(xs.map((x) => x?.trim()).filter((x): x is string => !!x))]
  return {
    name: user.businessName,
    phones: list(locs.map((l) => l.phone)),
    streets: list(locs.map((l) => l.street)),
    cities: list([user.city, ...locs.map((l) => l.city)]),
    postalCodes: list([user.zip, ...locs.map((l) => l.zip)]),
    regions: list([user.state, ...locs.map((l) => l.state)]),
  }
}

/** Homepage, top Search Console pages, and from the sitemap: about/contact/FAQ/services, a blog post, a product. */
export async function keyPages(userId: string, site: string): Promise<string[]> {
  const home = new URL(withHttps(site)).origin + "/"
  const host = bare(home)
  const out: string[] = [home]
  const add = (u: string | undefined) => { if (u && bare(u) === host && out.length < MAX_PAGES && !out.some((x) => keyOf(x) === keyOf(u))) out.push(u) }
  const snap = await latestPageSnapshot(userId).catch(() => null)
  for (const r of [...(snap?.rows ?? [])].sort((a, b) => b.clicks - a.clicks).slice(0, 3)) add(r.page)
  const map = await readSitemap(home, 400).catch(() => ({ urls: [] as { url: string }[] }))
  const urls = map.urls.map((u) => u.url)
  const path = (u: string) => { try { return new URL(u).pathname.toLowerCase() } catch { return "" } }
  for (const re of [/^\/(about|about-us|our-story|company)\/?$/, /^\/(contact|contact-us|locations?)\/?$/, /faq/, /^\/(services?|what-we-do|solutions?)\/?$/]) add(urls.find((u) => re.test(path(u))))
  add(urls.find((u) => /\/(blog|blogs|news|articles?)\/[^/]+/.test(path(u))))
  add(urls.find((u) => /^\/products\/[^/]+\/?$/.test(path(u))))
  return out
}

export async function latestSchemaAudit(userId: string, skip = 0): Promise<(SchemaAudit & { id: string }) | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: SCHEMA_AUDIT }, orderBy: { createdAt: "desc" }, skip, select: { id: true, metadata: true } })
  const m = row?.metadata as SchemaAudit | null
  return m && Array.isArray(m.pages) ? { ...m, id: row!.id } : null
}

const inFlight = new Set<string>()
export const schemaAuditRunning = (userId: string) => inFlight.has(userId)

export async function runSchemaAudit(user: User, reason: SchemaAudit["reason"]): Promise<SchemaAudit | null> {
  if (!user.websiteUrl?.trim() || inFlight.has(user.id)) return null
  inFlight.add(user.id)
  try {
    const [settings, urls, prev] = await Promise.all([getAgentSettings(user.id), keyPages(user.id, user.websiteUrl), latestSchemaAudit(user.id)])
    const brand = brandFactsOf(user, settings)
    const isShopify = settings.site?.platform === "shopify"
    const pages: PageAudit[] = []
    const mismatches: SchemaAudit["mismatches"] = []
    const products: ProductSuggestion[] = []
    let currency: string | null | undefined
    for (const url of urls) {
      const got = await fetchHtml(url)
      if (!got.html) { pages.push({ url, status: got.status, blocks: 0, types: [], errors: 0, warnings: 0, issues: [], parseErrors: [] }); continue }
      const { blocks, parseErrors } = extractJsonLd(got.html)
      const report = validateBlocks(blocks)
      const issues = report.nodes.flatMap((n) => n.issues.map((i) => ({ ...i, node: n.name ? `${n.types[0]} “${n.name.slice(0, 60)}”` : n.types[0] })))
      pages.push({
        url,
        status: got.status,
        blocks: blocks.length,
        types: report.types,
        errors: report.errors + parseErrors.length,
        warnings: report.warnings,
        issues: issues.slice(0, 40),
        parseErrors,
      })
      for (const m of factMismatches(blocks, brand)) if (!mismatches.some((x) => x.field === m.field && x.onSite === m.onSite)) mismatches.push({ ...m, url })
      // Shopify product page without a valid Product block: build one from the store's public product JSON.
      const handle = (() => { try { return new URL(got.finalUrl).pathname.match(/^\/products\/([^/]+)\/?$/)?.[1] ?? null } catch { return null } })()
      if (isShopify && handle) {
        const product = flattenJsonLd(blocks).find((n) => n.types.some((t) => PRODUCT_TYPES.has(t)))
        const productOk = product && validateBlocks([product.node]).errors === 0
        if (!productOk) {
          const origin = new URL(got.finalUrl).origin
          if (currency === undefined) currency = (await fetchJson<{ currency?: string }>(`${origin}/meta.json`))?.currency ?? (await fetchJson<{ currency?: string }>(`${origin}/cart.js`))?.currency ?? null
          const p = await fetchJson<ShopifyProductJs>(`${origin}/products/${handle}.js`)
          const ld = p ? productLdFromShopify(p, `${origin}/products/${handle}`, currency) : null
          if (ld && validateBlocks([ld]).errors === 0) products.push({ pageUrl: `${origin}/products/${handle}`, name: String(ld.name), jsonLd: ld })
        }
      }
    }
    const known = new Set((prev?.mismatches ?? []).map((m) => `${m.field}|${m.onSite}`))
    const label: Record<Mismatch["field"], string> = { name: "name", telephone: "phone number", streetAddress: "street address", addressLocality: "city", postalCode: "postal code" }
    const alerts = mismatches.filter((m) => !known.has(`${m.field}|${m.onSite}`)).map((m) => `Your website tells Google and AI your ${label[m.field]} is “${m.onSite}”, but your profile says “${m.ours}”.`)
    const audit: SchemaAudit = {
      at: new Date().toISOString(),
      pages,
      mismatches,
      products,
      totals: { errors: pages.reduce((n, p) => n + p.errors, 0), warnings: pages.reduce((n, p) => n + p.warnings, 0), blocks: pages.reduce((n, p) => n + p.blocks, 0) },
      alerts,
      reason,
    }
    if (pages.every((p) => p.status == null)) return null // the site didn't answer at all: nothing to store
    await db.mockActivity.create({ data: { userId: user.id, type: SCHEMA_AUDIT, title: "Checked the structured data on your key pages", metadata: audit as unknown as Prisma.InputJsonValue } })
    return audit
  } finally {
    inFlight.delete(user.id)
  }
}
