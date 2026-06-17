// Generate LocalBusiness / Organization JSON-LD from a business profile.
// Served live via the tag.js snippet (so it auto-updates when the profile
// changes) and shown for copy-paste on Website Health.

export interface BusinessSchemaUser {
  businessName?: string | null
  businessType?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  websiteUrl?: string | null
  voiceDescription?: string | null
}

function clean(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined
  const t = value.trim()
  return t.length > 0 ? t : undefined
}

export function generateBusinessSchema(user: BusinessSchemaUser): Record<string, unknown> {
  const name = clean(user.businessName)
  const description = clean(user.voiceDescription)
  const url = clean(user.websiteUrl)
  const city = clean(user.city)
  const state = clean(user.state)
  const zip = clean(user.zip)

  // A business with a city reads as a LocalBusiness; otherwise an Organization.
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": city ? "LocalBusiness" : "Organization",
  }
  if (name) schema.name = name
  if (description) schema.description = description
  if (url) schema.url = url

  if (city || state || zip) {
    const address: Record<string, unknown> = { "@type": "PostalAddress" }
    if (city) address.addressLocality = city
    if (state) address.addressRegion = state
    if (zip) address.postalCode = zip
    schema.address = address
  }

  return schema
}
