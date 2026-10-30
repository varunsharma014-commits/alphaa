// The same trade's page in each market, so search engines can show the right
// country/language version (hreflang). "us" = the English /for/<slug> pages.
// Only pages that are genuinely the same topic are grouped.
type Where = "us" | "uk" | "de" | "fr" | "it" | "ae" | "ar"

const GROUPS: Partial<Record<Where, string>>[] = [
  { us: "dentists", uk: "dental-practices", de: "zahnarzt", fr: "dentiste", it: "dentisti", ae: "dental-clinics", ar: "dental-clinics" },
  { us: "lawyers", uk: "solicitors", de: "rechtsanwalt", fr: "avocat", it: "avvocati" },
  { us: "plumbers", uk: "plumbers-heating-engineers", de: "heizung-sanitaer", fr: "plombier-chauffagiste", it: "idraulici" },
  { us: "med-spas", uk: "aesthetics-clinics", fr: "institut-de-beaute", it: "centri-estetici", ae: "salons-spas", ar: "salons-spas" },
  { de: "physiotherapie" },
  { ae: "real-estate-brokers", ar: "real-estate-brokers" },
  { ae: "car-service", ar: "car-service" },
]

const HREFLANG: Record<Where, string> = { us: "en-US", uk: "en-GB", de: "de-DE", fr: "fr-FR", it: "it-IT", ae: "en-AE", ar: "ar-AE" }

function pathOf(where: Where, slug: string): string {
  if (where === "us") return `/for/${slug}`
  if (where === "ar") return `/ae/ar/${slug}`
  return `/${where}/${slug}`
}

/** hreflang → path for a trade page, or undefined when it has no other versions. */
export function tradeAlternates(where: Where, slug: string): Record<string, string> | undefined {
  const g = GROUPS.find((x) => x[where] === slug)
  if (!g || Object.keys(g).length < 2) return undefined
  const out: Record<string, string> = {}
  for (const [w, s] of Object.entries(g) as [Where, string][]) out[HREFLANG[w]] = pathOf(w, s)
  if (g.us) out["x-default"] = pathOf("us", g.us)
  return out
}
