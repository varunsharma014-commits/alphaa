// Sends the "your report is ready" email for a completed public scan and
// records that the link reached the visitor (the results gate keys off it).
// Used by /api/scan (classic form, email known up front) and /api/scan/claim
// (the /start conversation attaches the address after the result).
import { db } from "@/lib/db"
import { sendAuditResultsEmail } from "@/lib/email"
import { scanResultsUrl } from "@/lib/scan-token"
import { scanEngineRows } from "@/lib/scan-engines"
import { leadName } from "@/emails/copy"

export async function sendScanReadyEmail(leadId: string) {
  const lead = await db.scanLead.findUnique({ where: { id: leadId } })
  if (!lead || !lead.visibilityScore || !lead.email) return

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  await sendAuditResultsEmail(lead.email, {
    businessName: leadName(lead.businessName, lead.businessUrl),
    city: lead.city,
    overallScore: lead.visibilityScore,
    engines: scanEngineRows(lead),
    variant: "ready",
    resultsUrl: scanResultsUrl(lead.id, lead.email),
    hireUrl: `${base}/signup?scan=${lead.id}&utm_source=email&utm_medium=report&utm_campaign=scan-report`,
  })

  // Record that the link actually reached them. The results gate keys off this:
  // if the send failed we must NOT lock the visitor out of their own report.
  const og = (lead.ogData && typeof lead.ogData === "object" && !Array.isArray(lead.ogData))
    ? (lead.ogData as Record<string, unknown>)
    : {}
  await db.scanLead
    .update({ where: { id: lead.id }, data: { ogData: { ...og, reportEmailed: true } as object } })
    .catch(() => {})
}

