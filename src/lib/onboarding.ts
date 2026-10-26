import { db } from "@/lib/db"

// Fills the business profile from a /start scan and marks onboarding done.
// Returns null when the scan doesn't exist. Only copies fields the user hasn't
// already set, and links the scan to the user (converted).
export async function completeOnboardingFromScan(clerkId: string, scanId: string, businessType?: string) {
  if (!/^[a-z0-9]{10,64}$/i.test(scanId)) return null
  const [user, lead] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.scanLead.findUnique({ where: { id: scanId } }),
  ])
  if (!user || !lead) return null

  const type = businessType?.trim()
  // /start sends the placeholder "your area" when it can't read a city off the site; never store it.
  const leadCity = lead.city && !/^your area$/i.test(lead.city.trim()) ? lead.city.trim() : null
  // websiteUrl is stored without protocol or trailing slash (see CLAUDE.md gotcha 21).
  const insights = (lead.ogData as { insights?: { industry?: string } } | null)?.insights
  const leadType = insights?.industry?.trim() || null
  const leadSite = lead.businessUrl ? lead.businessUrl.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "") || null : null
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      businessName: user.businessName || lead.businessName || null,
      city: user.city || leadCity,
      websiteUrl: user.websiteUrl || leadSite,
      businessType: user.businessType || (type && type.toLowerCase() !== "business" ? type : null) || leadType,
      onboardingCompleted: true,
    },
  })
  if (!lead.userId) {
    await db.scanLead.update({ where: { id: lead.id }, data: { userId: user.id, converted: true } }).catch(() => {})
  }
  return updated
}
