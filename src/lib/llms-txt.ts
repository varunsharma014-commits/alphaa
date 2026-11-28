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

// "AI marketing agent" stays as typed; "Dentist" → "dentist". Only a capitalised ordinary word is
// lowered, so acronyms (AI, HVAC, CPA) keep their case ("a ai marketing agent" was the old output).
function typePhrase(type: string): string {
  return type
    .split(/\s+/)
    .map((w) => (/^[A-Z][a-z]+$/.test(w) ? w.toLowerCase() : w))
    .join(" ")
}

// "an AI marketing agent", "a dentist", "an HVAC company".
function withArticle(phrase: string): string {
  const first = phrase.split(/\s+/)[0] ?? ""
  const acronym = /^[A-Z0-9]{2,}$/.test(first)
  const vowelSound = acronym ? /^[AEFHILMNORSX8]/.test(first) : /^[aeiou]/i.test(first) && !/^(uni|use|eu|one)/i.test(first)
  return `${vowelSound ? "an" : "a"} ${phrase}`
}

function siteUrl(url?: string): string | undefined {
  if (!url) return undefined
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// Real facts only (2026-11-28): the owner's own profile fields. The old version filled in "three
// generic services" per business type and stock lines ("providing quality service to the local
// community"), which are invented claims about a real business. Unknown = left out.
export function generateLlmsTxt(user: LlmsTxtUser): string {
  const businessName = clean(user.businessName)
  const businessType = clean(user.businessType)
  const city = clean(user.city)
  const state = clean(user.state)
  const website = siteUrl(clean(user.websiteUrl))
  const description = clean(user.voiceDescription)
  const location = formatLocation(city, state)

  const name = businessName ?? "This business"
  const kind = businessType ? withArticle(typePhrase(businessType)) : null
  const lines: string[] = [`# ${name}`]

  // One-sentence summary (blockquote, per the llms.txt format).
  if (kind && location) lines.push("", `> ${name} is ${kind} in ${location}.`)
  else if (kind) lines.push("", `> ${name} is ${kind}.`)
  else if (location) lines.push("", `> ${name} is based in ${location}.`)

  if (description) lines.push("", "## About", description)
  if (location) lines.push("", "## Location", location)
  if (website) lines.push("", "## Website", website)

  return lines.join("\n") + "\n"
}
