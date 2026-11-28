// Structured data validator: Google's rich-result requirements encoded in code (pure, client-safe).
//
// Every rule cites the Google Search Central page it comes from. "error" = Google says the property
// is required (the block can't get the rich result, or is invalid). "warning" = recommended by
// Google (the block works, but gives less). "note" = worth knowing, not counted.
// What Google reads is a subset of schema.org; we only judge the types Google documents.
//
// Docs (checked 2026-11):
//   Organization   https://developers.google.com/search/docs/appearance/structured-data/organization
//   LocalBusiness  https://developers.google.com/search/docs/appearance/structured-data/local-business
//   Product        https://developers.google.com/search/docs/appearance/structured-data/product-snippet
//                  https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
//   FAQPage        https://developers.google.com/search/docs/appearance/structured-data/faqpage
//   HowTo          https://developers.google.com/search/blog/2023/08/howto-faq-changes (HowTo rich results retired)
//   Article        https://developers.google.com/search/docs/appearance/structured-data/article
//   Breadcrumb     https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
//   Review/Rating  https://developers.google.com/search/docs/appearance/structured-data/review-snippet
//   General        https://developers.google.com/search/docs/appearance/structured-data/sd-policies

export type SdLevel = "error" | "warning" | "note"
export type SdIssue = { level: SdLevel; type: string; property: string; message: string; doc: string }
export type SdNode = { types: string[]; path: string; node: Record<string, unknown>; nested: boolean; parentTypes: string[] }
export type NodeReport = { types: string[]; path: string; name: string | null; issues: SdIssue[] }
export type BlocksReport = { nodes: NodeReport[]; errors: number; warnings: number; types: string[] }

const G = "https://developers.google.com/search/docs/appearance/structured-data"
export const DOC = {
  organization: `${G}/organization`,
  localBusiness: `${G}/local-business`,
  product: `${G}/product-snippet`,
  merchant: `${G}/merchant-listing`,
  faq: `${G}/faqpage`,
  howto: "https://developers.google.com/search/blog/2023/08/howto-faq-changes",
  article: `${G}/article`,
  breadcrumb: `${G}/breadcrumb`,
  review: `${G}/review-snippet`,
  general: `${G}/sd-policies`,
  syntax: `${G}/intro-structured-data`,
} as const

// schema.org LocalBusiness subtypes (https://schema.org/LocalBusiness "More specific Types"), the ones
// small businesses use. Google treats any of them as a LocalBusiness.
export const LOCAL_BUSINESS_TYPES = new Set([
  "LocalBusiness",
  "AnimalShelter", "ArchiveOrganization", "ChildCare", "Dentist", "DryCleaningOrLaundry", "EmploymentAgency", "GovernmentOffice", "InternetCafe", "Library", "ProfessionalService", "RadioStation", "RealEstateAgent", "RecyclingCenter", "SelfStorage", "ShoppingCenter", "TelevisionStation", "TouristInformationCenter", "TravelAgency",
  "AutomotiveBusiness", "AutoBodyShop", "AutoDealer", "AutoPartsStore", "AutoRental", "AutoRepair", "AutoWash", "GasStation", "MotorcycleDealer", "MotorcycleRepair",
  "EmergencyService", "FireStation", "Hospital", "PoliceStation",
  "EntertainmentBusiness", "AdultEntertainment", "AmusementPark", "ArtGallery", "Casino", "ComedyClub", "MovieTheater", "NightClub",
  "FinancialService", "AccountingService", "AutomatedTeller", "BankOrCreditUnion", "InsuranceAgency",
  "FoodEstablishment", "Bakery", "BarOrPub", "Brewery", "CafeOrCoffeeShop", "Distillery", "FastFoodRestaurant", "IceCreamShop", "Restaurant", "Winery",
  "HealthAndBeautyBusiness", "BeautySalon", "DaySpa", "HairSalon", "HealthClub", "NailSalon", "TattooParlor",
  "HomeAndConstructionBusiness", "Electrician", "GeneralContractor", "HVACBusiness", "HousePainter", "Locksmith", "MovingCompany", "Plumber", "RoofingContractor",
  "LegalService", "Attorney", "Notary",
  "LodgingBusiness", "BedAndBreakfast", "Campground", "Hostel", "Hotel", "Motel", "Resort", "VacationRental",
  "MedicalBusiness", "CommunityHealth", "Dermatology", "DietNutrition", "Gynecologic", "MedicalClinic", "Midwifery", "Nursing", "Obstetric", "Oncologic", "Optician", "Optometric", "Otolaryngologic", "Pediatric", "Pharmacy", "Physician", "Physiotherapy", "PlasticSurgery", "Podiatric", "PrimaryCare", "Psychiatric", "PublicHealth",
  "SportsActivityLocation", "BowlingAlley", "ExerciseGym", "GolfCourse", "PublicSwimmingPool", "SkiResort", "SportsClub", "StadiumOrArena", "TennisComplex",
  "Store", "BikeStore", "BookStore", "ClothingStore", "ComputerStore", "ConvenienceStore", "DepartmentStore", "ElectronicsStore", "Florist", "FurnitureStore", "GardenStore", "GroceryStore", "HardwareStore", "HobbyShop", "HomeGoodsStore", "JewelryStore", "LiquorStore", "MensClothingStore", "MobilePhoneStore", "MovieRentalStore", "MusicStore", "OfficeEquipmentStore", "OutletStore", "PawnShop", "PetStore", "ShoeStore", "SportingGoodsStore", "TireShop", "ToyStore", "WholesaleStore",
])
export const ORGANIZATION_TYPES = new Set(["Organization", "Corporation", "OnlineBusiness", "OnlineStore", "NGO", "EducationalOrganization", "MedicalOrganization", "NewsMediaOrganization", "SportsOrganization", "PerformingGroup", "Project", "ResearchOrganization", "Airline", "Consortium", "FundingScheme", "GovernmentOrganization", "LibrarySystem", "WorkersUnion"])
export const ARTICLE_TYPES = new Set(["Article", "NewsArticle", "BlogPosting", "AdvertiserContentArticle", "Report", "ScholarlyArticle", "TechArticle", "SatiricalArticle", "AnalysisNewsArticle", "OpinionNewsArticle", "ReportageNewsArticle", "ReviewNewsArticle"])
export const PRODUCT_TYPES = new Set(["Product", "IndividualProduct", "ProductModel", "ProductGroup", "SomeProducts", "Vehicle", "Car"])

// ── value helpers ─────────────────────────────────────────────────────────────────────────────
type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
export const arr = (v: unknown): unknown[] => (v == null ? [] : Array.isArray(v) ? v : [v])
const text = (v: unknown): string | null => {
  if (typeof v === "string") return v.trim() || null
  if (typeof v === "number") return String(v)
  if (isObj(v) && typeof v["@value"] === "string") return (v["@value"] as string).trim() || null
  return null
}
const has = (o: Obj, k: string) => arr(o[k]).some((v) => text(v) != null || isObj(v))
const firstObj = (v: unknown): Obj | null => (arr(v).find(isObj) as Obj | undefined) ?? null
const isUrl = (v: unknown) => { const t = text(v) ?? (isObj(v) ? text(v.url) ?? text(v["@id"]) ?? text(v.contentUrl) : null); return !!t && /^(https?:)?\/\//i.test(t) || (!!t && t.startsWith("/")) }
const numOf = (v: unknown): number | null => { const t = text(v); if (t == null) return null; const n = Number(t.replace(",", ".")); return Number.isFinite(n) ? n : null }
// ISO 8601 date or date-time (what Google asks for in datePublished/dateModified).
const ISO = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/

/** "http://schema.org/Dentist" / "schema:Dentist" / "Dentist" → "Dentist". */
export function typesOf(o: Obj): string[] {
  return arr(o["@type"]).map((t) => String(t).replace(/^https?:\/\/schema\.org\//i, "").replace(/^schema:/i, "").trim()).filter(Boolean)
}
const anyIn = (types: string[], set: Set<string>) => types.some((t) => set.has(t))

/** Every entity in the blocks: top-level items, @graph members and nested typed objects. */
export function flattenJsonLd(blocks: unknown[]): SdNode[] {
  const out: SdNode[] = []
  const walk = (v: unknown, path: string, nested: boolean, parentTypes: string[], depth: number) => {
    if (depth > 8) return
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`, nested, parentTypes, depth + 1)); return }
    if (!isObj(v)) return
    if (Array.isArray(v["@graph"])) (v["@graph"] as unknown[]).forEach((x, i) => walk(x, `${path}.@graph[${i}]`, false, [], depth + 1))
    const types = typesOf(v)
    if (types.length) out.push({ types, path: path || "$", node: v, nested, parentTypes })
    for (const [k, child] of Object.entries(v)) {
      if (k === "@graph" || k === "@context" || k === "@type") continue
      if (isObj(child) || Array.isArray(child)) walk(child, `${path}.${k}`, types.length > 0 || nested, types.length ? types : parentTypes, depth + 1)
    }
  }
  blocks.forEach((b, i) => walk(b, `block${i + 1}`, false, [], 0))
  return out
}

// ── rules per type ────────────────────────────────────────────────────────────────────────────
function push(out: SdIssue[], level: SdLevel, type: string, property: string, message: string, doc: string) {
  out.push({ level, type, property, message, doc })
}

function checkAddress(o: Obj, type: string, out: SdIssue[], required: boolean) {
  const a = firstObj(o.address)
  if (!a) {
    if (typeof o.address === "string" && o.address.trim()) push(out, "warning", type, "address", "The address is plain text. Google wants a PostalAddress with streetAddress, addressLocality, addressRegion, postalCode and addressCountry.", DOC.localBusiness)
    else if (required) push(out, "error", type, "address", "Missing the address. Google requires it for a LocalBusiness.", DOC.localBusiness)
    return
  }
  // Recommended PostalAddress fields (local-business doc, "address" row).
  for (const k of ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"]) {
    if (!has(a, k)) push(out, "warning", type, `address.${k}`, `The address has no ${k}.`, DOC.localBusiness)
  }
}

function checkRating(r: Obj, type: string, prop: string, out: SdIssue[], doc: string) {
  const value = numOf(r.ratingValue)
  if (value == null) { push(out, "error", type, `${prop}.ratingValue`, "The rating has no ratingValue (a number). Google requires it.", doc); return }
  const best = numOf(r.bestRating) ?? 5
  const worst = numOf(r.worstRating) ?? 1
  if (value > best || value < worst) push(out, "error", type, `${prop}.ratingValue`, `ratingValue ${value} is outside ${worst}-${best}. Set bestRating/worstRating if your scale isn't 1-5.`, doc)
}

function checkReview(o: Obj, nested: boolean, out: SdIssue[]) {
  const T = "Review"
  if (!nested && !has(o, "itemReviewed")) push(out, "error", T, "itemReviewed", "A standalone Review needs itemReviewed (what is being reviewed).", DOC.review)
  const author = firstObj(o.author)
  if (!author && !text(o.author)) push(out, "error", T, "author", "The review has no author. Google requires the reviewer's name.", DOC.review)
  else if (author && !text(author.name)) push(out, "error", T, "author.name", "The review's author has no name.", DOC.review)
  else if (!author && text(o.author)) push(out, "warning", T, "author", "The author is plain text. Use a Person or Organization with a name.", DOC.review)
  const rating = firstObj(o.reviewRating)
  if (!rating) push(out, "error", T, "reviewRating", "The review has no reviewRating. Google requires one for review snippets.", DOC.review)
  else checkRating(rating, T, "reviewRating", out, DOC.review)
  if (!has(o, "datePublished")) push(out, "warning", T, "datePublished", "Add datePublished (when the review was written).", DOC.review)
}

function checkAggregateRating(o: Obj, nested: boolean, out: SdIssue[]) {
  const T = "AggregateRating"
  if (!nested && !has(o, "itemReviewed")) push(out, "error", T, "itemReviewed", "A standalone AggregateRating needs itemReviewed.", DOC.review)
  checkRating(o, T, "aggregateRating", out, DOC.review)
  const count = numOf(o.ratingCount) ?? numOf(o.reviewCount)
  if (count == null) push(out, "error", T, "ratingCount", "Missing ratingCount or reviewCount. Google requires one of them.", DOC.review)
  else if (count < 1) push(out, "error", T, "ratingCount", "ratingCount/reviewCount must be at least 1.", DOC.review)
}

function checkOrganization(o: Obj, type: string, out: SdIssue[], doc: string) {
  // No required properties for Organization; these are Google's recommended ones.
  if (!text(o.name)) push(out, doc === DOC.localBusiness ? "error" : "warning", type, "name", doc === DOC.localBusiness ? "Missing the business name. Google requires it." : "Add the organization's name.", doc)
  if (!has(o, "url")) push(out, "warning", type, "url", "Add url (the homepage).", doc)
  if (doc === DOC.organization && !has(o, "logo")) push(out, "warning", type, "logo", "Add logo (an image URL) so Google can show it.", doc)
  if (has(o, "logo") && !isUrl(firstObj(o.logo) ?? o.logo)) push(out, "error", type, "logo", "logo must be an image URL (or an ImageObject with a url).", DOC.organization)
  if (!has(o, "telephone") && doc === DOC.localBusiness) push(out, "warning", type, "telephone", "Add telephone (with country code, like +1-613-555-0100).", doc)
  if (has(o, "sameAs") && !arr(o.sameAs).every(isUrl)) push(out, "error", type, "sameAs", "sameAs must be a list of profile URLs.", DOC.organization)
}

function checkLocalBusiness(o: Obj, type: string, out: SdIssue[]) {
  checkOrganization(o, type, out, DOC.localBusiness)
  checkAddress(o, type, out, true)
  const geo = firstObj(o.geo)
  if (geo) {
    const lat = numOf(geo.latitude), lng = numOf(geo.longitude)
    if (lat == null || lng == null) push(out, "error", type, "geo", "geo needs a latitude and a longitude (numbers).", DOC.localBusiness)
    else if (Math.abs(lat) > 90 || Math.abs(lng) > 180) push(out, "error", type, "geo", "geo latitude/longitude are out of range.", DOC.localBusiness)
  } else push(out, "warning", type, "geo", "Add geo (latitude and longitude) so maps place you exactly.", DOC.localBusiness)
  if (has(o, "openingHoursSpecification")) {
    for (const s of arr(o.openingHoursSpecification).filter(isObj) as Obj[]) {
      if (!has(s, "dayOfWeek") && !has(s, "validFrom")) push(out, "warning", type, "openingHoursSpecification.dayOfWeek", "An opening hours entry has no dayOfWeek.", DOC.localBusiness)
      if (!has(s, "opens") || !has(s, "closes")) push(out, "error", type, "openingHoursSpecification", "An opening hours entry needs both opens and closes (like 09:00 and 17:00).", DOC.localBusiness)
    }
  } else if (!has(o, "openingHours")) push(out, "warning", type, "openingHoursSpecification", "Add your opening hours (openingHoursSpecification).", DOC.localBusiness)
  if (!has(o, "priceRange")) push(out, "warning", type, "priceRange", "Add priceRange (like $$ or $50-$200).", DOC.localBusiness)
}

function checkProduct(o: Obj, type: string, out: SdIssue[]) {
  if (!text(o.name)) push(out, "error", type, "name", "The product has no name. Google requires it.", DOC.product)
  const offers = arr(o.offers).filter(isObj) as Obj[]
  if (!offers.length && !has(o, "review") && !has(o, "aggregateRating")) push(out, "error", type, "offers", "A product needs at least one of offers, review or aggregateRating to show a rich result.", DOC.product)
  for (const off of offers) {
    const t = typesOf(off)
    if (t.includes("AggregateOffer")) {
      if (numOf(off.lowPrice) == null) push(out, "error", type, "offers.lowPrice", "An AggregateOffer needs lowPrice.", DOC.product)
    } else {
      const price = numOf(off.price) ?? numOf(firstObj(off.priceSpecification)?.price)
      if (price == null) push(out, "error", type, "offers.price", "The offer has no price (a number like 29.99, no currency sign).", DOC.product)
      else if (typeof off.price === "string" && /[^0-9.,\s]/.test(off.price)) push(out, "error", type, "offers.price", `The price “${off.price}” must be a plain number (put the currency in priceCurrency).`, DOC.merchant)
    }
    if (!has(off, "priceCurrency") && !has(firstObj(off.priceSpecification) ?? {}, "priceCurrency")) push(out, "warning", type, "offers.priceCurrency", "Add priceCurrency (like USD). Google Shopping listings require it.", DOC.merchant)
    if (!has(off, "availability")) push(out, "warning", type, "offers.availability", "Add availability (InStock / OutOfStock).", DOC.merchant)
  }
  if (!has(o, "image")) push(out, "warning", type, "image", "Add image (product photo URLs). Google Shopping listings require one.", DOC.merchant)
  if (!has(o, "description")) push(out, "warning", type, "description", "Add a description.", DOC.product)
  if (!has(o, "brand")) push(out, "warning", type, "brand", "Add brand.", DOC.product)
  if (!has(o, "sku") && !has(o, "gtin") && !has(o, "gtin13") && !has(o, "gtin12") && !has(o, "mpn")) push(out, "warning", type, "sku", "Add an identifier (sku, gtin or mpn).", DOC.merchant)
}

function checkFaq(o: Obj, out: SdIssue[]) {
  const T = "FAQPage"
  const qs = arr(o.mainEntity).filter(isObj) as Obj[]
  if (!qs.length) { push(out, "error", T, "mainEntity", "The FAQPage has no questions (mainEntity with Question items).", DOC.faq); return }
  qs.forEach((q, i) => {
    if (!typesOf(q).includes("Question")) push(out, "error", T, `mainEntity[${i}]`, "Each mainEntity item must be a Question.", DOC.faq)
    if (!text(q.name)) push(out, "error", T, `mainEntity[${i}].name`, "A question has no text (name).", DOC.faq)
    const a = firstObj(q.acceptedAnswer)
    if (!a) push(out, "error", T, `mainEntity[${i}].acceptedAnswer`, `“${text(q.name)?.slice(0, 60) ?? "A question"}” has no acceptedAnswer.`, DOC.faq)
    else if (!text(a.text)) push(out, "error", T, `mainEntity[${i}].acceptedAnswer.text`, `The answer to “${text(q.name)?.slice(0, 60) ?? "a question"}” has no text.`, DOC.faq)
  })
  push(out, "note", T, "", "Google now shows FAQ rich results only for government and health sites, but AI assistants still read FAQ markup.", DOC.howto)
}

function checkHowTo(o: Obj, out: SdIssue[]) {
  const T = "HowTo"
  if (!text(o.name)) push(out, "error", T, "name", "The HowTo has no name.", DOC.howto)
  const steps = arr(o.step)
  if (!steps.length) push(out, "error", T, "step", "The HowTo has no steps.", DOC.howto)
  for (const s of steps.filter(isObj) as Obj[]) if (!text(s.text) && !text(s.name) && !has(s, "itemListElement")) push(out, "error", T, "step.text", "A step has no text.", DOC.howto)
  push(out, "note", T, "", "Google stopped showing HowTo rich results in 2023. It's harmless, but it won't add anything on Google.", DOC.howto)
}

function checkArticle(o: Obj, type: string, out: SdIssue[]) {
  // Article has no required properties; all of these are Google's recommended ones.
  if (!text(o.headline) && !text(o.name)) push(out, "warning", type, "headline", "Add headline (the article's title).", DOC.article)
  for (const k of ["datePublished", "dateModified"]) {
    const v = text(o[k])
    if (!v) push(out, "warning", type, k, `Add ${k} (ISO 8601, like 2026-11-28T09:00:00-05:00).`, DOC.article)
    else if (!ISO.test(v)) push(out, "error", type, k, `${k} “${v.slice(0, 40)}” isn't an ISO 8601 date.`, DOC.article)
  }
  if (!has(o, "image")) push(out, "warning", type, "image", "Add image (at least one image URL).", DOC.article)
  const authors = arr(o.author)
  if (!authors.length) push(out, "warning", type, "author", "Add author (a Person or Organization with a name).", DOC.article)
  for (const a of authors) {
    if (typeof a === "string") push(out, "warning", type, "author", "The author is plain text. Use a Person or Organization with a name.", DOC.article)
    else if (isObj(a) && !text(a.name)) push(out, "error", type, "author.name", "The author has no name.", DOC.article)
    else if (isObj(a) && !has(a, "url") && !has(a, "sameAs")) push(out, "warning", type, "author.url", "Add the author's url (an about or profile page).", DOC.article)
  }
}

function checkBreadcrumb(o: Obj, out: SdIssue[]) {
  const T = "BreadcrumbList"
  const items = arr(o.itemListElement).filter(isObj) as Obj[]
  if (!items.length) { push(out, "error", T, "itemListElement", "The breadcrumb has no items.", DOC.breadcrumb); return }
  if (items.length < 2) push(out, "warning", T, "itemListElement", "Google recommends at least two breadcrumb items.", DOC.breadcrumb)
  items.forEach((it, i) => {
    if (numOf(it.position) == null) push(out, "error", T, `itemListElement[${i}].position`, "A breadcrumb item has no position (1, 2, 3…).", DOC.breadcrumb)
    const inner = firstObj(it.item)
    if (!text(it.name) && !text(inner?.name)) push(out, "error", T, `itemListElement[${i}].name`, "A breadcrumb item has no name.", DOC.breadcrumb)
    // item (URL) is required except on the last item.
    if (i < items.length - 1 && !has(it, "item")) push(out, "error", T, `itemListElement[${i}].item`, "A breadcrumb item (not the last) has no item URL.", DOC.breadcrumb)
  })
}

/** Issues for one entity. `nested` = inside another entity (itemReviewed comes from the parent). */
export function validateNode(n: SdNode): SdIssue[] {
  const out: SdIssue[] = []
  const t = n.types
  const main = t[0]
  const o = n.node
  // Nested businesses (a Service's provider, a review's itemReviewed) are judged by their own page.
  if (anyIn(t, LOCAL_BUSINESS_TYPES) && !n.nested) checkLocalBusiness(o, main, out)
  else if (anyIn(t, ORGANIZATION_TYPES) && !n.nested) checkOrganization(o, main, out, DOC.organization)
  if (anyIn(t, PRODUCT_TYPES)) checkProduct(o, main, out)
  if (t.includes("FAQPage")) checkFaq(o, out)
  if (t.includes("HowTo")) checkHowTo(o, out)
  if (anyIn(t, ARTICLE_TYPES)) checkArticle(o, main, out)
  if (t.includes("BreadcrumbList")) checkBreadcrumb(o, out)
  if (t.includes("Review") && !anyIn(n.parentTypes, ARTICLE_TYPES)) checkReview(o, n.nested, out)
  if (t.includes("AggregateRating")) checkAggregateRating(o, n.nested, out)
  // Self-serving reviews: a business's own ratings of itself on its own site don't get stars.
  if (!n.nested && (anyIn(t, LOCAL_BUSINESS_TYPES) || anyIn(t, ORGANIZATION_TYPES)) && (has(o, "aggregateRating") || has(o, "review"))) {
    push(out, "note", main, "aggregateRating", "Google doesn't show star ratings for reviews a business publishes about itself on its own site.", DOC.review)
  }
  return out
}

/** Validates a page's JSON-LD blocks (already parsed). Top-level @context is checked per block. */
export function validateBlocks(blocks: unknown[]): BlocksReport {
  const nodes: NodeReport[] = []
  blocks.forEach((b, i) => {
    for (const top of arr(b).filter(isObj) as Obj[]) {
      const ctx = arr(top["@context"]).map((c) => (typeof c === "string" ? c : isObj(c) ? String(c["@vocab"] ?? "") : ""))
      if (!ctx.some((c) => /schema\.org/i.test(c))) {
        nodes.push({ types: typesOf(top).length ? typesOf(top) : ["(no type)"], path: `block${i + 1}`, name: null, issues: [{ level: "error", type: typesOf(top)[0] ?? "JSON-LD", property: "@context", message: "Missing \"@context\": \"https://schema.org\", so Google can't read this block.", doc: DOC.syntax }] })
      }
    }
  })
  for (const n of flattenJsonLd(blocks)) {
    const issues = validateNode(n)
    const judged = issues.length || anyIn(n.types, LOCAL_BUSINESS_TYPES) || anyIn(n.types, ORGANIZATION_TYPES) || anyIn(n.types, PRODUCT_TYPES) || anyIn(n.types, ARTICLE_TYPES) || ["FAQPage", "HowTo", "BreadcrumbList", "Review", "AggregateRating"].some((x) => n.types.includes(x))
    if (!judged) continue
    if (n.nested && !issues.length) continue
    nodes.push({ types: n.types, path: n.path, name: text(n.node.name) ?? text(n.node.headline), issues })
  }
  const all = nodes.flatMap((x) => x.issues)
  return {
    nodes,
    errors: all.filter((x) => x.level === "error").length,
    warnings: all.filter((x) => x.level === "warning").length,
    types: [...new Set(flattenJsonLd(blocks).filter((n) => !n.nested).flatMap((n) => n.types))],
  }
}

/** True when a block has no errors (what we require before offering a generated block). */
export const passes = (block: unknown) => validateBlocks([block]).errors === 0

// ── facts vs the brand's real data ────────────────────────────────────────────────────────────
export type BrandFacts = { name?: string | null; phones?: string[]; streets?: string[]; cities?: string[]; postalCodes?: string[]; regions?: string[] }
export type Mismatch = { field: "name" | "telephone" | "streetAddress" | "addressLocality" | "postalCode"; onSite: string; ours: string; type: string }

const normName = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/\b(inc|llc|ltd|limited|corp|corporation|co|company|the|pllc|pc)\b\.?/g, " ").replace(/[^a-z0-9]+/g, " ").trim()
const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "")
const normPostal = (s: string) => s.toUpperCase().replace(/\s+/g, "")
const normPlace = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
const streetKey = (s: string) => { const m = normPlace(s).match(/^(\d+[a-z]?)\s+(\w+)/); return m ? `${m[1]} ${m[2]}` : normPlace(s) }

/**
 * Facts on the site's own Organization/LocalBusiness blocks that disagree with what the owner told
 * us (profile + locations). Only fields we know on our side are compared; nothing is guessed.
 */
export function factMismatches(blocks: unknown[], brand: BrandFacts): Mismatch[] {
  const out: Mismatch[] = []
  const seen = new Set<string>()
  const add = (m: Mismatch) => { const k = `${m.field}|${m.onSite}`; if (!seen.has(k)) { seen.add(k); out.push(m) } }
  for (const n of flattenJsonLd(blocks)) {
    if (n.nested || !(anyIn(n.types, LOCAL_BUSINESS_TYPES) || anyIn(n.types, ORGANIZATION_TYPES))) continue
    const o = n.node
    const type = n.types[0]
    const name = text(o.name)
    if (name && brand.name?.trim()) {
      const a = normName(name), b = normName(brand.name)
      if (a && b && !a.includes(b) && !b.includes(a)) add({ field: "name", onSite: name, ours: brand.name.trim(), type })
    }
    const phones = (brand.phones ?? []).map(digits).filter((p) => p.length >= 7)
    for (const t of arr(o.telephone).map(text).filter(Boolean) as string[]) {
      if (phones.length && !phones.some((p) => digits(t).endsWith(p.slice(-10)) || p.endsWith(digits(t).slice(-10)))) add({ field: "telephone", onSite: t, ours: brand.phones![0], type })
    }
    const a = firstObj(o.address)
    if (!a) continue
    const street = text(a.streetAddress), city = text(a.addressLocality), postal = text(a.postalCode)
    const streets = (brand.streets ?? []).filter(Boolean)
    if (street && streets.length && !streets.some((s) => streetKey(s) === streetKey(street))) add({ field: "streetAddress", onSite: street, ours: streets[0], type })
    const cities = (brand.cities ?? []).filter(Boolean)
    if (city && cities.length && !cities.some((c) => normPlace(c) === normPlace(city))) add({ field: "addressLocality", onSite: city, ours: cities[0], type })
    const codes = (brand.postalCodes ?? []).filter(Boolean)
    if (postal && codes.length && !codes.some((c) => normPostal(c) === normPostal(postal))) add({ field: "postalCode", onSite: postal, ours: codes[0], type })
  }
  return out
}
