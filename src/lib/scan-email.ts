// Sends the "your report is ready" email for a completed public scan and
// records that the link reached the visitor (the results gate keys off it).
// Used by /api/scan (classic form, email known up front) and /api/scan/claim
// (the /start conversation attaches the address after the result).
import { db } from "@/lib/db"
import { sendAuditResultsEmail } from "@/lib/email"
import { scanResultsUrl } from "@/lib/scan-token"

export async function sendScanReadyEmail(leadId: string) {
  const lead = await db.scanLead.findUnique({ where: { id: leadId } })
  if (!lead || !lead.visibilityScore || !lead.email) return

  const status = (lead.aiSearchStatus ?? {}) as Record<string, string>
  const engines = [
    { key: "chatgpt", name: "ChatGPT" },
    { key: "google_ai", name: "Claude" },
    { key: "perplexity", name: "Perplexity" },
    { key: "gemini", name: "Gemini" },
  ].map((e) => ({
    name: e.name,
    found: status[e.key] === "occasionally" || status[e.key] === "frequently",
    snippet: "",
  }))

  const issues = Array.isArray(lead.issues) ? (lead.issues as unknown[]) : []
  const first = issues[0] as Record<string, unknown> | undefined
  const topIssue =
    (first && typeof first.explanation === "string" && first.explanation) ||
    (first && typeof first.headline === "string" && first.headline) ||
    "Your business is missing from most AI answers about your area."

  await sendAuditResultsEmail(lead.email, {
    businessName: lead.businessName || lead.businessUrl || "Your business",
    city: lead.city ?? "",
    overallScore: lead.visibilityScore,
    engines,
    topIssue,
    isSubscriber: false,
    resultsUrl: scanResultsUrl(lead.id, lead.email),
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

