import { anthropic } from "@/lib/claude"

export type SchemaItem = {
  type: string   // "LocalBusiness", "FAQPage", etc.
  pageUrl: string // e.g. "/" or "/contact"
  jsonLd: object
}

// Derive addressCountry from the state/province the user typed, instead of the
// old hardcoded "US" (which shipped wrong facts for Canadian businesses). If we
// can't tell, we omit the field — schema.org allows a PostalAddress without a
// country, and an omitted fact is honest where a guessed one is not.
const CA_PROVINCES = new Set(["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "NU", "YT"])
const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
])

function inferCountry(state: string): string | null {
  const s = state.trim().toUpperCase()
  if (CA_PROVINCES.has(s)) return "CA"
  if (US_STATES.has(s)) return "US"
  return null
}

// The one canonical PostalAddress we allow into generated schema — built only
// from fields the user actually entered. Returns null when there's nothing
// real to say, in which case address is omitted entirely (never "", never a
// defaulted country).
function buildAddress(city: string, state: string): Record<string, string> | null {
  const locality = city.trim()
  const region = state.trim()
  if (!locality && !region) return null
  const address: Record<string, string> = { "@type": "PostalAddress" }
  if (locality) address.addressLocality = locality
  if (region) address.addressRegion = region
  const country = inferCountry(region)
  if (country) address.addressCountry = country
  return address
}

function hostOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

// Recursively sanitize model-generated JSON-LD:
// - Drop `sameAs` links that aren't on the business's own domain. The model
//   used to volunteer guessed social URLs (twitter.com/<slug> etc.) — profiles
//   that may not exist or belong to someone else. Feeding AI engines invented
//   facts is exactly what alphaa promises not to do.
// - Replace any `address` object with the canonical one built from real user
//   data (or remove it when we have none).
function sanitizeNode(node: unknown, ownHost: string | null, address: Record<string, string> | null): unknown {
  if (Array.isArray(node)) return node.map((n) => sanitizeNode(n, ownHost, address))
  if (typeof node !== "object" || node === null) return node
  const obj = { ...(node as Record<string, unknown>) }

  if ("sameAs" in obj) {
    const links = (Array.isArray(obj.sameAs) ? obj.sameAs : [obj.sameAs]).filter(
      (l): l is string => typeof l === "string" && hostOf(l) !== null && hostOf(l) === ownHost
    )
    if (links.length > 0) obj.sameAs = links
    else delete obj.sameAs
  }

  if ("address" in obj) {
    if (address) obj.address = address
    else delete obj.address
  }

  for (const key of Object.keys(obj)) {
    if (key === "address" || key === "sameAs") continue
    obj[key] = sanitizeNode(obj[key], ownHost, address)
  }
  return obj
}

export async function generateSchemaMarkup(
  businessName: string,
  businessType: string,
  city: string,
  state: string,
  websiteUrl: string,
  phone?: string
): Promise<SchemaItem[]> {
  const address = buildAddress(city, state)
  const ownHost = hostOf(websiteUrl)
  const locality = city.trim()

  const addressExample = address
    ? `,
      "address": ${JSON.stringify(address)}`
    : ""

  const prompt = `You are a technical SEO expert specializing in JSON-LD structured data. Generate schema markup for a business website.

Business details:
- Name: ${businessName}
- Type: ${businessType}
${locality ? `- City: ${locality}` : ""}
${state.trim() ? `- State/Province: ${state.trim()}` : ""}
- Website: ${websiteUrl}
${phone ? `- Phone: ${phone}` : ""}

Generate 3-4 schema types relevant to this ${businessType}. Always include LocalBusiness. Then add 2-3 more schema types that are most relevant, for example:
- Restaurant → MenuSection, Restaurant (extends LocalBusiness), FAQPage
- Dental/Medical → MedicalBusiness, FAQPage, Service
- Legal → LegalService, FAQPage, Service
- HVAC/Plumber/Electrician → HomeAndConstructionBusiness, Service, FAQPage
- Salon/Spa → BeautySalon, Service, FAQPage
- Retail → Store, Product (sample), FAQPage
- Generic service business → ProfessionalService, Service, FAQPage

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
[
  {
    "type": "LocalBusiness",
    "pageUrl": "/",
    "jsonLd": {
      "@context": "https://schema.org",
      "@type": "<most specific type>",
      "name": "${businessName}",
      "url": "${websiteUrl}"${addressExample}${phone ? `,\n      "telephone": "${phone}"` : ""}
    }
  },
  {
    "type": "<SchemaType>",
    "pageUrl": "/<relevant-page>",
    "jsonLd": { ... complete valid JSON-LD ... }
  }
]

Rules:
- Use the most specific @type for LocalBusiness (e.g., "Plumber", "Restaurant", "Dentist")
- NEVER invent facts. Do not include sameAs or any social-media links. Do not invent street addresses, phone numbers, opening hours, prices, ratings, or reviews. Only use the details provided above; omit any field you don't have.
- FAQPage should include 3-5 realistic FAQs specific to a ${businessType}${locality ? ` in ${locality}` : ""}
- Service schemas should list real services a ${businessType} would offer
- All jsonLd objects must be valid, complete JSON-LD with @context and @type
- pageUrl should be the most relevant page on the site for each schema type`

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    const parsed: unknown[] = JSON.parse(cleaned)

    const schemas: SchemaItem[] = parsed.map((s: unknown) => {
      const item = s as Record<string, unknown>
      return {
        type: String(item.type ?? "LocalBusiness"),
        pageUrl: String(item.pageUrl ?? "/"),
        jsonLd: (sanitizeNode(item.jsonLd ?? {}, ownHost, address) as object) ?? {},
      }
    })

    return schemas
  } catch (err) {
    console.error("generateSchemaMarkup error:", err)
    // Fallback: basic LocalBusiness schema built only from known-true fields
    const fallback: SchemaItem = {
      type: "LocalBusiness",
      pageUrl: "/",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: businessName,
        url: websiteUrl,
        ...(address ? { address } : {}),
        ...(phone ? { telephone: phone } : {}),
      },
    }
    return [fallback]
  }
}
