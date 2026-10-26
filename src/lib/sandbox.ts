// Shared constants/helpers for the Live AI Sandbox (/dashboard/sandbox).
// Kept framework-free so both the server page and the API route can import it.

// Each sandbox question costs 4 live engine calls + 1 haiku extraction call,
// so this is a real spend cap, not a UX nicety.
export const SANDBOX_DAILY_LIMIT = 10

// Logged via logActivity() into the MockActivity ledger — this doubles as the
// rate-limit counter, which is why it must stay stable.
export const SANDBOX_ACTIVITY_TYPE = "sandbox_query"

export function sandboxWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000)
}

// A realistic question a customer of THIS business would type into an AI
// assistant. Falls back gracefully when onboarding left fields blank.
export function suggestedQuestion(businessType?: string | null, city?: string | null): string {
  const type = (businessType ?? "").trim()
  const where = (city ?? "").trim()
  if (type && where) return `Who is the best ${type} in ${where}?`
  if (type) return `Who is the best ${type} near me?`
  if (where) return `What are the best local businesses in ${where}?`
  return "Who is the best local business near me?"
}

/**
 * The question to ask the AIs for this account: the customer question its /start scan used
 * (written from the site, so it names what the business actually sells), else the template.
 */
export async function accountQuestion(user: { id: string; email: string; businessType: string | null; city: string | null }): Promise<string> {
  const { db } = await import("@/lib/db")
  const lead = await db.scanLead.findFirst({
    where: { OR: [{ userId: user.id }, ...(user.email ? [{ email: user.email }] : [])] },
    orderBy: { createdAt: "desc" },
    select: { ogData: true },
  })
  const q = (lead?.ogData as { insights?: { query?: unknown } } | null)?.insights?.query
  return typeof q === "string" && q.trim().length > 10 ? q.trim() : suggestedQuestion(user.businessType, user.city)
}
