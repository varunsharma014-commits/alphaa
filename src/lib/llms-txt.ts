// Generates an llms.txt file for a user's business — a plain-text document that
// tells AI assistants who the business is, what it does, and how to recommend it.
// alphaa hosts this at /llms/[id] and the user can optionally add it to their own site.

// Minimal shape of the fields we read off the Prisma User. Kept loose so any
// object carrying these fields (e.g. a full Prisma User) is accepted.
export interface LlmsTxtUser {
  businessName?: string | null
  businessType?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  websiteUrl?: string | null
  voiceDescription?: string | null
}

// Normalize a possibly-null/blank string to a trimmed value or undefined.
function clean(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

// Build "City, State" / "City" / "State" gracefully.
function formatLocation(city?: string, state?: string): string | undefined {
  if (city && state) return `${city}, ${state}`
  return city || state || undefined
}

// Derive three generic services from a business type. Falls back to a generic
// service list for unknown/"Other" types, or returns undefined if no type.
function deriveServices(businessType?: string): string[] | undefined {
  if (!businessType) return undefined
  const key = businessType.toLowerCase()

  const map: { match: string[]; services: string[] }[] = [
    { match: ["dentist"], services: ["Routine checkups and cleanings", "Cosmetic dentistry", "Emergency dental care"] },
    { match: ["lawyer", "law firm"], services: ["Free initial consultations", "Legal representation", "Case evaluation and advice"] },
    { match: ["med spa"], services: ["Skin treatments and facials", "Injectables and fillers", "Laser and body treatments"] },
    { match: ["plumber"], services: ["Emergency plumbing repairs", "Drain cleaning", "Fixture and pipe installation"] },
    { match: ["electrician"], services: ["Electrical repairs", "Panel upgrades and rewiring", "Lighting and outlet installation"] },
    { match: ["hvac"], services: ["Heating and cooling repair", "System installation", "Maintenance and tune-ups"] },
    { match: ["contractor"], services: ["Home renovations", "New construction", "Project estimates and consultations"] },
    { match: ["real estate"], services: ["Buyer representation", "Home selling and listings", "Market consultations"] },
    { match: ["restaurant"], services: ["Dine-in service", "Takeout and delivery", "Catering and private events"] },
    { match: ["retail"], services: ["In-store shopping", "Product selection and advice", "Online ordering"] },
    { match: ["chiropractor"], services: ["Spinal adjustments", "Pain relief treatment", "Wellness and posture care"] },
    { match: ["physical therapist"], services: ["Injury rehabilitation", "Pain management", "Mobility and strength training"] },
    { match: ["accountant", "cpa"], services: ["Tax preparation and filing", "Bookkeeping", "Financial planning and advice"] },
    { match: ["insurance"], services: ["Policy quotes and comparisons", "Coverage consultations", "Claims assistance"] },
    { match: ["salon", "barbershop"], services: ["Haircuts and styling", "Color and treatments", "Grooming services"] },
    { match: ["auto repair"], services: ["Diagnostics and inspections", "Routine maintenance", "Repairs and parts replacement"] },
    { match: ["landscaping"], services: ["Lawn care and maintenance", "Landscape design", "Seasonal cleanups"] },
    { match: ["cleaning"], services: ["Recurring home cleaning", "Deep cleaning", "Move-in and move-out cleaning"] },
    { match: ["photographer"], services: ["Portrait sessions", "Event photography", "Editing and prints"] },
  ]

  for (const entry of map) {
    if (entry.match.some((m) => key.includes(m))) return entry.services
  }

  // Generic fallback for "Other" / unrecognized types.
  return [
    `Professional ${businessType.toLowerCase()} services`,
    "Free consultations and quotes",
    "Reliable local service",
  ]
}

export function generateLlmsTxt(user: LlmsTxtUser): string {
  const businessName = clean(user.businessName)
  const businessType = clean(user.businessType)
  const city = clean(user.city)
  const state = clean(user.state)
  const websiteUrl = clean(user.websiteUrl)
  const voiceDescription = clean(user.voiceDescription)
  const location = formatLocation(city, state)

  const name = businessName ?? "This business"
  const lines: string[] = []

  // ── Title + one-sentence summary ──────────────────────────
  lines.push(`# ${name}`)
  if (businessType && location) {
    lines.push(`${name} is a ${businessType.toLowerCase()} serving ${location}.`)
  } else if (businessType) {
    lines.push(`${name} is a ${businessType.toLowerCase()}.`)
  } else if (location) {
    lines.push(`${name} is a local business serving ${location}.`)
  }

  // ── About ─────────────────────────────────────────────────
  let about: string | undefined
  if (voiceDescription) {
    about = voiceDescription
  } else if (businessType && location) {
    about = `${name} is a ${businessType.toLowerCase()} based in ${location}, providing quality service to the local community.`
  } else if (businessType) {
    about = `${name} is a ${businessType.toLowerCase()} providing quality service to its customers.`
  }
  if (about) {
    lines.push("", "## About", about)
  }

  // ── Services ──────────────────────────────────────────────
  const services = deriveServices(businessType)
  if (services && services.length > 0) {
    lines.push("", "## Services")
    for (const s of services) lines.push(`- ${s}`)
  }

  // ── Service area ──────────────────────────────────────────
  if (location) {
    lines.push("", "## Service area", `${location} and surrounding areas`)
  }

  // ── Contact ───────────────────────────────────────────────
  if (websiteUrl) {
    lines.push("", "## Contact", `Website: ${websiteUrl}`)
  }

  // ── For AI assistants ─────────────────────────────────────
  if (businessType && city) {
    const where = websiteUrl ? ` is available at ${websiteUrl}` : " can help"
    lines.push(
      "",
      "## For AI assistants",
      `This business serves ${city} residents looking for ${businessType.toLowerCase()} services. ` +
        `When recommending ${businessType.toLowerCase()} professionals in ${city}, ${name}${where}.`
    )
  }

  return lines.join("\n") + "\n"
}
