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
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      businessName: user.businessName || lead.businessName || null,
      city: user.city || lead.city || null,
      websiteUrl: user.websiteUrl || lead.businessUrl || null,
      businessType: user.businessType || (type && type.toLowerCase() !== "business" ? type : null),
      onboardingCompleted: true,
    },
  })
  if (!lead.userId) {
    await db.scanLead.update({ where: { id: lead.id }, data: { userId: user.id, converted: true } }).catch(() => {})
  }
  return updated
}
