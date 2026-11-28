// Structured data validator + builders + extraction (lib/schema/*). Pure: no network, no database.
//   npx tsx scripts/test-schema-validate.ts
//   npx tsx scripts/test-schema-validate.ts --live <url> [url…]   also checks real pages (prints the report)
import { filterSuggestions, isOnlineBusiness } from "../src/lib/schema/suggest"
import assert from "node:assert/strict"
import { factMismatches, flattenJsonLd, passes, validateBlocks, type BlocksReport } from "../src/lib/schema/rules"
import { extractFaq, extractJsonLd } from "../src/lib/schema/extract"
import { articleLd, businessLd, countryOf, faqLdFrom, localSubtype, onlyValid, productLdFromShopify, websiteLd } from "../src/lib/schema/build"

let passed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`ok  ${name}`) } catch (e) { console.error(`FAIL ${name}`); throw e }
}
const C = "https://schema.org"
const props = (r: BlocksReport, level: "error" | "warning" | "note") => r.nodes.flatMap((n) => n.issues.filter((i) => i.level === level).map((i) => i.property))

test("LocalBusiness: name + address required, PostalAddress parts and geo/hours recommended", () => {
  const bad = validateBlocks([{ "@context": C, "@type": "Dentist", telephone: "+1-613-555-0100" }])
  assert.deepEqual(props(bad, "error").sort(), ["address", "name"])
  const ok = validateBlocks([{ "@context": C, "@type": "Plumber", name: "Bright Pipes", url: "https://brightpipes.ca", telephone: "+1-613-555-0100", priceRange: "$$", geo: { "@type": "GeoCoordinates", latitude: 45.35, longitude: -75.92 }, openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "08:00", closes: "17:00" }], address: { "@type": "PostalAddress", streetAddress: "12 Main St", addressLocality: "Kanata", addressRegion: "ON", postalCode: "K2K 1A1", addressCountry: "CA" } }])
  assert.equal(ok.errors, 0)
  assert.equal(ok.warnings, 0)
  const hours = validateBlocks([{ "@context": C, "@type": "LocalBusiness", name: "X", address: { "@type": "PostalAddress", addressLocality: "Ottawa" }, openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00" } }])
  assert.ok(props(hours, "error").includes("openingHoursSpecification"))
  assert.ok(props(hours, "warning").includes("address.postalCode"))
})

test("Organization: nothing required; logo must be a URL; sameAs must be URLs", () => {
  assert.equal(validateBlocks([{ "@context": C, "@type": "Organization", name: "Acme", url: "https://acme.com", logo: "https://acme.com/logo.png" }]).errors, 0)
  const r = validateBlocks([{ "@context": C, "@type": "Organization", name: "Acme", logo: "logo", sameAs: ["acme on twitter"] }])
  assert.deepEqual(props(r, "error").sort(), ["logo", "sameAs"])
})

test("Product: name + one of offers/review/aggregateRating; offer price is a plain number", () => {
  assert.deepEqual(props(validateBlocks([{ "@context": C, "@type": "Product", name: "Mug" }]), "error"), ["offers"])
  const r = validateBlocks([{ "@context": C, "@type": "Product", name: "Mug", offers: { "@type": "Offer", price: "$12.00", priceCurrency: "USD" } }])
  assert.ok(props(r, "error").includes("offers.price"))
  const good = validateBlocks([{ "@context": C, "@type": "Product", name: "Mug", image: ["https://x.com/m.jpg"], description: "A mug", brand: { "@type": "Brand", name: "X" }, sku: "M1", offers: { "@type": "Offer", price: "12.00", priceCurrency: "USD", availability: "https://schema.org/InStock" } }])
  assert.equal(good.errors, 0)
  assert.equal(good.warnings, 0)
  assert.equal(validateBlocks([{ "@context": C, "@type": "Product", name: "Mug", offers: { "@type": "AggregateOffer", lowPrice: 10, priceCurrency: "USD" } }]).errors, 0)
})

test("FAQPage: every Question needs name + acceptedAnswer.text; FAQ rich-result limits are a note", () => {
  const r = validateBlocks([{ "@context": C, "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Do you do weekends?" }, { "@type": "Question", name: "Cost?", acceptedAnswer: { "@type": "Answer" } }] }])
  assert.deepEqual(props(r, "error"), ["mainEntity[0].acceptedAnswer", "mainEntity[1].acceptedAnswer.text"])
  assert.equal(props(r, "note").length, 1)
  assert.equal(validateBlocks([{ "@context": C, "@type": "FAQPage" }]).errors, 1)
})

test("HowTo: name + steps; Google retired the rich result (note)", () => {
  const r = validateBlocks([{ "@context": C, "@type": "HowTo", name: "Unclog a drain", step: [{ "@type": "HowToStep", text: "Pour hot water." }] }])
  assert.equal(r.errors, 0)
  assert.equal(props(r, "note").length, 1)
  assert.deepEqual(props(validateBlocks([{ "@context": C, "@type": "HowTo" }]), "error").sort(), ["name", "step"])
})

test("Article/BlogPosting: dates must be ISO 8601; author needs a name", () => {
  const r = validateBlocks([{ "@context": C, "@type": "BlogPosting", headline: "Hi", datePublished: "November 3, 2026", author: { "@type": "Person" } }])
  assert.deepEqual(props(r, "error").sort(), ["author.name", "datePublished"])
  assert.ok(props(r, "warning").includes("image"))
  assert.ok(props(r, "warning").includes("dateModified"))
})

test("BreadcrumbList: position + name on every item, item URL except on the last", () => {
  const r = validateBlocks([{ "@context": C, "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home" }, { "@type": "ListItem", position: 2, name: "Blog" }] }])
  assert.deepEqual(props(r, "error"), ["itemListElement[0].item"])
  const ok = validateBlocks([{ "@context": C, "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://x.com/" }, { "@type": "ListItem", position: 2, name: "Blog" }] }])
  assert.equal(ok.errors, 0)
})

test("Review + AggregateRating: required parts; nested ones get itemReviewed from the parent", () => {
  const standalone = validateBlocks([{ "@context": C, "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: 7 } }])
  assert.deepEqual(props(standalone, "error").sort(), ["author", "itemReviewed", "reviewRating.ratingValue"])
  const nested = validateBlocks([{ "@context": C, "@type": "Product", name: "Mug", aggregateRating: { "@type": "AggregateRating", ratingValue: 4.6, reviewCount: 12 }, review: { "@type": "Review", author: { "@type": "Person", name: "Sam" }, reviewRating: { "@type": "Rating", ratingValue: 5 }, datePublished: "2026-10-01" } }])
  assert.equal(nested.errors, 0)
  const noCount = validateBlocks([{ "@context": C, "@type": "Product", name: "Mug", aggregateRating: { "@type": "AggregateRating", ratingValue: 4.6 } }])
  assert.ok(props(noCount, "error").includes("ratingCount"))
})

test("self-serving ratings on the business itself = note; missing @context = error; @graph and type URLs read", () => {
  const r = validateBlocks([{ "@context": C, "@type": "LocalBusiness", name: "X", address: { "@type": "PostalAddress", addressLocality: "Ottawa" }, aggregateRating: { "@type": "AggregateRating", ratingValue: 5, ratingCount: 3 } }])
  assert.ok(r.nodes.some((n) => n.issues.some((i) => i.level === "note" && i.property === "aggregateRating")))
  assert.equal(validateBlocks([{ "@type": "Organization", name: "X" }]).nodes[0].issues[0].property, "@context")
  const g = validateBlocks([{ "@context": C, "@graph": [{ "@type": "http://schema.org/WebSite", name: "X", url: "https://x.com" }, { "@type": ["Organization"], name: "X", url: "https://x.com", logo: { "@type": "ImageObject", url: "https://x.com/l.png" } }] }])
  assert.equal(g.errors, 0)
  assert.ok(g.types.includes("WebSite") && g.types.includes("Organization"))
  assert.equal(flattenJsonLd([{ "@context": C, "@graph": [{ "@type": "Thing" }, { "@type": "Thing" }] }]).length, 2)
})

test("facts vs the brand's real data (name, phone, street, city, postal)", () => {
  const blocks = [{ "@context": C, "@type": "Dentist", name: "Smile Studio Inc.", telephone: "(613) 555-0199", address: { "@type": "PostalAddress", streetAddress: "40 Elm Street", addressLocality: "Nepean", postalCode: "k2k1a1" } }]
  const m = factMismatches(blocks, { name: "Bright Smile Dental", phones: ["+1 613 555 0100"], streets: ["12 Main St"], cities: ["Kanata"], postalCodes: ["K2K 1A1"] })
  assert.deepEqual(m.map((x) => x.field).sort(), ["addressLocality", "name", "streetAddress", "telephone"])
  // Same facts written differently: no mismatch.
  const same = factMismatches([{ "@context": C, "@type": "Dentist", name: "Bright Smile Dental Inc.", telephone: "613-555-0100", address: { "@type": "PostalAddress", streetAddress: "12 Main Street, Unit 3", addressLocality: "kanata", postalCode: "K2K1A1" } }], { name: "Bright Smile Dental", phones: ["+1 (613) 555-0100"], streets: ["12 Main St"], cities: ["Kanata"], postalCodes: ["K2K 1A1"] })
  assert.deepEqual(same, [])
  // Nothing known on our side = nothing compared.
  assert.deepEqual(factMismatches(blocks, {}), [])
})

test("extract JSON-LD from HTML; broken JSON is reported, not guessed", () => {
  const html = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"A"}</script><script type="application/ld+json">{"@type": "FAQPage", "mainEntity": [}</script></head></html>`
  const x = extractJsonLd(html)
  assert.equal(x.blocks.length, 1)
  assert.equal(x.parseErrors.length, 1)
})

test("FAQ only from real on-page Q&A (details/summary, question headings, existing FAQ markup)", () => {
  const html = `<main>
    <h2>Our services</h2><p>We fix drains.</p>
    <h2>Do you work on weekends?</h2><p>Yes, we answer calls on Saturday and Sunday from 9am to 5pm across Kanata.</p>
    <details><summary>How fast can you come?</summary>Most calls in Kanata get a plumber the same day, usually within four hours.</details>
    <h3>What areas?</h3><p>Short.</p>
  </main>`
  const qa = extractFaq(html)
  assert.deepEqual(qa.map((q) => q.q), ["How fast can you come?", "Do you work on weekends?"])
  assert.ok(qa[1].a.startsWith("Yes, we answer calls"))
  const ld = faqLdFrom(qa)!
  assert.ok(passes(ld))
  assert.equal(faqLdFrom([]), null)
})

test("builders: business block from real data passes; no address = Organization (never a fake LocalBusiness)", () => {
  assert.equal(localSubtype("Family dentist"), "Dentist")
  assert.equal(localSubtype("Emergency plumbing"), "Plumber")
  assert.equal(localSubtype("Something unusual"), "LocalBusiness")
  assert.equal(countryOf("on"), "CA")
  assert.equal(countryOf("Bavaria"), null)
  const lb = businessLd({ name: "Bright Pipes", businessType: "plumber", url: "brightpipes.ca", phone: "+1-613-555-0100", street: "12 Main St", city: "Kanata", region: "ON", postal: "K2K 1A1" })
  assert.equal(lb["@type"], "Plumber")
  assert.equal((lb.address as Record<string, string>).addressCountry, "CA")
  assert.equal(lb.url, "https://brightpipes.ca")
  assert.ok(passes(lb))
  const org = businessLd({ name: "Alphaa", url: "https://alphaa.app" })
  assert.equal(org["@type"], "Organization")
  assert.equal("address" in org, false)
  assert.ok(passes(org))
  const noRegion = businessLd({ name: "X", url: "x.com", city: "Berlin", region: "Bavaria" })
  assert.equal("addressCountry" in (noRegion.address as object), false) // never a defaulted country
  assert.ok(passes(websiteLd("X", "x.com")))
})

test("Article markup for posts we publish: dates, cover, author/publisher; validates", () => {
  const a = articleLd({ headline: "How much does a drain cost?", datePublished: "2026-11-28T10:00:00.000Z", image: "https://alphaa.app/api/img/1", businessName: "Bright Pipes", siteUrl: "brightpipes.ca", logo: "https://brightpipes.ca/logo.png", description: "Prices in Kanata." })
  const r = validateBlocks([a])
  assert.equal(r.errors, 0)
  assert.deepEqual(props(r, "warning"), [])
  assert.equal(a.dateModified, a.datePublished)
  const noBiz = articleLd({ headline: "x", datePublished: "2026-11-28", businessName: null })
  assert.equal("author" in noBiz, false) // no invented author
})

test("Product from Shopify's public product JSON: cents → price, currency from the shop, no ratings", () => {
  const p = productLdFromShopify({ title: "Cedar Candle", handle: "cedar-candle", description: "<p>Hand poured <b>soy</b> candle.</p>", vendor: "North Wick", images: ["//cdn.shopify.com/s/files/1/candle.jpg"], variants: [{ id: 111, sku: "CC-1", price: 2400, available: true, barcode: "0123456789012" }] }, "https://northwick.com/products/cedar-candle", "CAD")!
  assert.equal((p.offers as Record<string, string>[])[0].price, "24.00")
  assert.equal((p.offers as Record<string, string>[])[0].priceCurrency, "CAD")
  assert.equal((p.image as string[])[0], "https://cdn.shopify.com/s/files/1/candle.jpg")
  assert.equal(p.description, "Hand poured soy candle.")
  assert.equal("aggregateRating" in p, false)
  assert.ok(passes(p))
  const two = productLdFromShopify({ title: "Mug", variants: [{ id: 1, price: 1000, available: false }, { id: 2, price: 1200 }] }, "https://x.com/products/mug", null)!
  assert.equal((two.offers as Record<string, string>[])[1].url, "https://x.com/products/mug?variant=2")
  assert.equal(productLdFromShopify({ title: "" }, "https://x.com/products/a", "USD"), null)
})

test("onlyValid drops a block with errors and says why", () => {
  const { kept, dropped } = onlyValid([{ type: "LocalBusiness", jsonLd: { "@context": C, "@type": "LocalBusiness", name: "X" } }, { type: "WebSite", jsonLd: websiteLd("X", "x.com")! }])
  assert.equal(kept.length, 1)
  assert.equal(dropped.length, 1)
  assert.ok(dropped[0].reasons[0].includes("address"))
})

test("suggestions: only real pages, no type the page has, online = Organization", () => {
  assert.equal(isOnlineBusiness("SaaS / Software Services"), true)
  assert.equal(isOnlineBusiness("Online store"), true)
  assert.equal(isOnlineBusiness("Plumbing"), false)
  assert.equal(isOnlineBusiness("Dental clinic"), false)
  assert.equal(isOnlineBusiness("Physiotherapy"), false)
  assert.equal(isOnlineBusiness(""), false)
  const saas = businessLd({ name: "Alphaa", businessType: "SaaS / Software Services", url: "alphaa.app", city: "Kanata", region: "ON", online: true })
  assert.equal(saas["@type"], "Organization")
  assert.equal((saas.address as Record<string, string>).addressLocality, "Kanata")
  assert.equal(businessLd({ name: "P", businessType: "Plumbing", url: "p.com", city: "Ottawa", region: "ON" })["@type"], "Plumber")
  // The old AI-made record for alphaa.app.
  const old = [
    { type: "LocalBusiness", pageUrl: "/", jsonLd: {} },
    { type: "SoftwareApplication", pageUrl: "/product", jsonLd: {} },
    { type: "FAQPage", pageUrl: "/faq", jsonLd: {} },
    { type: "WebSite", pageUrl: "/", jsonLd: {} },
  ]
  const kept = filterSuggestions(old, { pages: ["https://alphaa.app/", "https://alphaa.app/pricing"], existing: [{ url: "https://alphaa.app/", types: ["WebSite"] }], online: true })
  assert.deepEqual(kept.map((k) => k.type), [])
  // A page read at generation time counts even when the audit didn't see it; a page's own types are skipped.
  const fresh = [
    { type: "Organization", pageUrl: "/", jsonLd: {}, checked: true },
    { type: "FAQPage", pageUrl: "/help", jsonLd: {}, checked: true },
    { type: "FAQPage", pageUrl: "/pricing", jsonLd: {} },
  ]
  const k2 = filterSuggestions(fresh, { pages: ["https://x.com/pricing/"], existing: [{ url: "https://x.com/pricing", types: ["FAQPage"] }], online: false })
  assert.deepEqual(k2.map((k) => `${k.type} ${k.pageUrl}`), ["Organization /", "FAQPage /help"])
  // The homepage already describes the business: no second business block.
  assert.equal(filterSuggestions([{ type: "Plumber", pageUrl: "/", jsonLd: {}, checked: true }], { pages: [], existing: [{ url: "https://p.com/", types: ["LocalBusiness"] }], online: false }).length, 0)
})

console.log(`\n${passed} passed`)

const live = process.argv.indexOf("--live")
if (live > 0) void (async () => {
  for (const u of process.argv.slice(live + 1)) {
    const res = await fetch(u, { headers: { "User-Agent": "AlphaaBot/1.0 (SEO audit; +https://alphaa.app)" }, signal: AbortSignal.timeout(15_000) }).catch(() => null)
    if (!res?.ok) { console.log(`${u}: ${res?.status ?? "no answer"}`); continue }
    const html = await res.text()
    const x = extractJsonLd(html)
    const r = validateBlocks(x.blocks)
    console.log(`${u}: ${x.blocks.length} blocks (${x.parseErrors.length} broken), types ${r.types.join(", ") || "none"}, ${r.errors} errors, ${r.warnings} warnings`)
    for (const n of r.nodes) for (const i of n.issues.filter((i) => i.level !== "note").slice(0, 6)) console.log(`   ${i.level} ${n.types[0]} ${i.property}: ${i.message}`)
    const faq = extractFaq(html)
    if (faq.length) console.log(`   on-page Q&A: ${faq.map((q) => q.q).slice(0, 4).join(" | ")}`)
  }
})()
