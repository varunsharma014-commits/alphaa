import { anthropic } from "@/lib/claude"

export type SchemaItem = {
  type: string   // "LocalBusiness", "FAQPage", etc.
  pageUrl: string // e.g. "/" or "/contact"
  jsonLd: object
}

export async function generateSchemaMarkup(
  businessName: string,
  businessType: string,
  city: string,
  state: string,
  websiteUrl: string,
  phone?: string
): Promise<SchemaItem[]> {
  const prompt = `You are a technical SEO expert specializing in JSON-LD structured data. Generate schema markup for a local business website.

Business details:
- Name: ${businessName}
- Type: ${businessType}
- City: ${city}
- State: ${state}
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
      "url": "${websiteUrl}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${city}",
        "addressRegion": "${state}",
        "addressCountry": "US"
      }${phone ? `,\n      "telephone": "${phone}"` : ""}
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
- FAQPage should include 3-5 realistic FAQs specific to a ${businessType} in ${city}
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
        jsonLd: (item.jsonLd as object) ?? {},
      }
    })

    return schemas
  } catch (err) {
    console.error("generateSchemaMarkup error:", err)
    // Fallback: basic LocalBusiness schema
    const fallback: SchemaItem = {
      type: "LocalBusiness",
      pageUrl: "/",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: businessName,
        url: websiteUrl,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressRegion: state,
          addressCountry: "US",
        },
        ...(phone ? { telephone: phone } : {}),
      },
    }
    return [fallback]
  }
}
