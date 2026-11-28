// JSON-LD builders from REAL data only (pure, client-safe). Nothing here writes a fact: each field
// comes from the owner's profile/locations, the brand kit, the page's own text or the store's own
// product data, and is left out when we don't have it (CLAUDE.md §10 rule 20).
import { LOCAL_BUSINESS_TYPES, passes, validateBlocks } from "@/lib/schema/rules"
import type { QA, ShopifyProductJs } from "@/lib/schema/extract"

type Obj = Record<string, unknown>
const t = (v: string | null | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined)
const prune = <T extends Obj>(o: T): T => { for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === null || o[k] === "") delete o[k]; return o }

const CA = new Set(["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "NU", "YT"])
const US = new Set(["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"])
/** Country from the state/province the owner typed; null when we can't tell (never a default). */
export function countryOf(region: string | null | undefined): string | null {
  const s = (region ?? "").trim().toUpperCase()
  return CA.has(s) ? "CA" : US.has(s) ? "US" : null
}

// Business type words → the most specific schema.org LocalBusiness subtype. Checked in order.
const SUBTYPE: [RegExp, string][] = [
  [/dentist|dental|orthodont/i, "Dentist"],
  [/plumb/i, "Plumber"],
  [/electric/i, "Electrician"],
  [/hvac|heating|air condition|furnace/i, "HVACBusiness"],
  [/roof/i, "RoofingContractor"],
  [/paint(er|ing)/i, "HousePainter"],
  [/locksmith/i, "Locksmith"],
  [/mover|moving/i, "MovingCompany"],
  [/contractor|renovat|construction|remodel/i, "GeneralContractor"],
  [/lawyer|attorney|law firm|legal/i, "Attorney"],
  [/notary/i, "Notary"],
  [/account|bookkeep|\bcpa\b|tax prep/i, "AccountingService"],
  [/insurance/i, "InsuranceAgency"],
  [/real estate|realtor|realty/i, "RealEstateAgent"],
  [/restaurant|bistro|diner|pizz|sushi|grill/i, "Restaurant"],
  [/caf[eé]|coffee/i, "CafeOrCoffeeShop"],
  [/bakery|bakeshop/i, "Bakery"],
  [/\bbar\b|pub|tavern/i, "BarOrPub"],
  [/brewer/i, "Brewery"],
  [/winery|vineyard/i, "Winery"],
  [/hair|barber/i, "HairSalon"],
  [/nail/i, "NailSalon"],
  [/\bspa\b|day spa/i, "DaySpa"],
  [/salon|beauty|esthetic|lash|brow/i, "BeautySalon"],
  [/gym|fitness|crossfit|yoga|pilates/i, "ExerciseGym"],
  [/physio|physical therap/i, "Physiotherapy"],
  [/optomet|optician|eye care/i, "Optician"],
  [/pharmac/i, "Pharmacy"],
  [/chiropract|clinic|medical|doctor|physician|dermatolog|pediatric|med ?spa/i, "MedicalClinic"],
  [/veterinar|vet clinic|animal hospital/i, "MedicalBusiness"],
  [/auto ?repair|mechanic|garage|tire/i, "AutoRepair"],
  [/car wash|auto ?detail/i, "AutoWash"],
  [/car dealer|auto dealer/i, "AutoDealer"],
  [/hotel|inn\b|lodge/i, "Hotel"],
  [/daycare|child ?care|preschool/i, "ChildCare"],
  [/travel agen/i, "TravelAgency"],
  [/florist|flower/i, "Florist"],
  [/jewel/i, "JewelryStore"],
  [/furniture/i, "FurnitureStore"],
  [/pet store|pet shop|pet supply/i, "PetStore"],
  [/clothing|boutique|apparel/i, "ClothingStore"],
  [/hardware/i, "HardwareStore"],
  [/grocery|market/i, "GroceryStore"],
  [/store|shop|retail/i, "Store"],
  [/agency|consult|marketing|design|studio|software|it services|seo/i, "ProfessionalService"],
]
export function localSubtype(businessType: string | null | undefined): string {
  const bt = businessType ?? ""
  for (const [re, type] of SUBTYPE) if (re.test(bt) && LOCAL_BUSINESS_TYPES.has(type)) return type
  return "LocalBusiness"
}

export type BusinessFacts = {
  name: string | null
  businessType?: string | null
  url: string | null
  description?: string | null
  logo?: string | null
  phone?: string | null
  street?: string | null
  city?: string | null
  region?: string | null
  postal?: string | null
  /** Profile URLs on the business's OWN site (sameAs is only kept for these; never guessed). */
  sameAs?: string[]
  /** An online business (software, SaaS, online store; lib/schema/suggest.ts isOnlineBusiness): always an Organization. */
  online?: boolean
}

/**
 * LocalBusiness (most specific subtype) when there is a real address with a city, else
 * Organization. Google requires name + address for a LocalBusiness, so without an address we
 * don't pretend to be one.
 */
export function businessLd(f: BusinessFacts): Obj {
  const city = t(f.city), region = t(f.region), postal = t(f.postal), street = t(f.street)
  const country = countryOf(region)
  const address = city ? prune({ "@type": "PostalAddress", streetAddress: street, addressLocality: city, addressRegion: region, postalCode: postal, addressCountry: country ?? undefined }) : undefined
  const url = t(f.url) ? (/^https?:\/\//i.test(f.url!) ? f.url!.trim() : `https://${f.url!.trim()}`) : undefined
  return prune({
    "@context": "https://schema.org",
    // No place customers visit (online) or no address = Organization; its address is still listed.
    "@type": address && !f.online ? localSubtype(f.businessType) : "Organization",
    name: t(f.name),
    url,
    description: t(f.description),
    logo: t(f.logo),
    telephone: t(f.phone),
    address,
    sameAs: f.sameAs?.length ? f.sameAs : undefined,
  })
}

export function websiteLd(name: string | null, url: string | null): Obj | null {
  if (!t(name) || !t(url)) return null
  return { "@context": "https://schema.org", "@type": "WebSite", name: name!.trim(), url: /^https?:\/\//i.test(url!) ? url!.trim() : `https://${url!.trim()}` }
}

/** FAQPage from questions and answers that are really on the page (lib/schema/extract.ts extractFaq). */
export function faqLdFrom(qas: Pick<QA, "q" | "a">[]): Obj | null {
  const items = qas.filter((x) => x.q.trim() && x.a.trim())
  if (!items.length) return null
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((x) => ({ "@type": "Question", name: x.q.trim(), acceptedAnswer: { "@type": "Answer", text: x.a.trim() } })) }
}

export type ArticleFacts = {
  headline: string
  datePublished: string
  dateModified?: string | null
  /** Public URL of the cover image we publish with the post. */
  image?: string | null
  description?: string | null
  url?: string | null
  businessName: string | null
  siteUrl?: string | null
  logo?: string | null
}

/** BlogPosting for a post we publish: headline, dates, cover image, the business as author + publisher. */
export function articleLd(a: ArticleFacts): Obj {
  const site = t(a.siteUrl) ? (/^https?:\/\//i.test(a.siteUrl!) ? a.siteUrl!.trim() : `https://${a.siteUrl!.trim()}`) : undefined
  const org = (withLogo: boolean) => prune({ "@type": "Organization", name: t(a.businessName), url: site, logo: withLogo && t(a.logo) ? { "@type": "ImageObject", url: a.logo!.trim() } : undefined })
  return prune({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.headline.trim().slice(0, 200),
    description: t(a.description)?.slice(0, 300),
    image: t(a.image) ? [a.image!.trim()] : undefined,
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    mainEntityOfPage: t(a.url) ? { "@type": "WebPage", "@id": a.url!.trim() } : undefined,
    author: t(a.businessName) ? org(false) : undefined,
    publisher: t(a.businessName) ? org(true) : undefined,
  })
}

/**
 * Product from the store's own public product JSON (Shopify /products/<handle>.js: price in cents)
 * and the shop's currency (/meta.json). No reviews or ratings: we don't have the real ones.
 */
export function productLdFromShopify(p: ShopifyProductJs, pageUrl: string, currency: string | null): Obj | null {
  if (!t(p.title)) return null
  const variants = (p.variants ?? []).filter((v) => v.price != null)
  const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
  const img = (u: string) => (u.startsWith("//") ? `https:${u}` : u)
  const price = (v: (typeof variants)[number]) => {
    const n = typeof v.price === "number" ? v.price / 100 : Number(String(v.price).replace(/[^0-9.]/g, ""))
    return Number.isFinite(n) ? n.toFixed(2) : null
  }
  const offers = variants.map((v) => prune({
    "@type": "Offer",
    price: price(v) ?? undefined,
    priceCurrency: currency ?? undefined,
    availability: v.available === false ? "https://schema.org/OutOfStock" : v.available === true ? "https://schema.org/InStock" : undefined,
    sku: t(v.sku ?? undefined),
    url: variants.length > 1 && v.id ? `${pageUrl}${pageUrl.includes("?") ? "&" : "?"}variant=${v.id}` : pageUrl,
  })).filter((o) => o.price)
  const first = variants[0]
  return prune({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title!.trim(),
    description: p.description ? strip(p.description).slice(0, 5000) || undefined : undefined,
    image: (p.images?.length ? p.images : p.featured_image ? [p.featured_image] : []).slice(0, 5).map(img),
    brand: t(p.vendor) ? { "@type": "Brand", name: p.vendor!.trim() } : undefined,
    sku: variants.length === 1 ? t(first?.sku ?? undefined) : undefined,
    gtin: variants.length === 1 && /^\d{8,14}$/.test(first?.barcode ?? "") ? first!.barcode! : undefined,
    url: pageUrl,
    offers: offers.length ? offers : undefined,
  })
}

/** Keep only blocks with zero validator errors; report what was dropped and why. */
export function onlyValid<T extends { jsonLd: unknown }>(items: T[]): { kept: T[]; dropped: { item: T; reasons: string[] }[] } {
  const kept: T[] = []
  const dropped: { item: T; reasons: string[] }[] = []
  for (const it of items) {
    if (passes(it.jsonLd)) kept.push(it)
    else dropped.push({ item: it, reasons: validateBlocks([it.jsonLd]).nodes.flatMap((n) => n.issues.filter((i) => i.level === "error").map((i) => i.message)) })
  }
  return { kept, dropped }
}
