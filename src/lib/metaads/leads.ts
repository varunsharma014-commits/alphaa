// New leads from the instant forms on my lead campaigns (leads_retrieval). Stored with only the
// name, email and phone the form sent, encrypted; never written to a log. Each lead counts as a
// conversion in the ads report.
import { listAccounts, dec } from "@/lib/social/store"
import { leadContact, leadsSince } from "./graph"
import { addLead, decToken, getAccess, knownLeadIds, listCampaigns, saveCampaign } from "./store"

export async function pollLeads(userId: string): Promise<number> {
  const access = await getAccess(userId)
  if (!access) return 0
  const campaigns = (await listCampaigns(userId, 50)).filter((c) => c.plan.goal === "OUTCOME_LEADS" && c.built?.formId && (c.status === "active" || c.status === "paused"))
  if (!campaigns.length) return 0
  const pages = (await listAccounts(userId)).filter((a) => a.platform === "facebook" && a.status === "active")
  let added = 0
  for (const c of campaigns) {
    const page = pages.find((p) => p.externalId === c.pageId)
    const token = page ? dec(page.tokenEnc) : decToken(access)
    // Look back a day past the last poll so nothing is missed at the edge; ids dedupe.
    const since = c.lastLeadPollAt ? Math.floor(Date.parse(c.lastLeadPollAt) / 1000) - 86_400 : 0
    try {
      const raw = await leadsSince(token, c.built!.formId!, since)
      const known = await knownLeadIds(userId, c.id)
      for (const l of raw) {
        if (known.has(l.id)) continue
        await addLead(userId, { leadId: l.id, campaignRowId: c.id, formId: c.built!.formId!, adId: l.ad_id ?? null, createdTime: l.created_time, contact: leadContact(l) })
        added++
      }
      c.lastLeadPollAt = new Date().toISOString()
      await saveCampaign(userId, c)
    } catch (err) {
      console.error("[metaads] leads", err instanceof Error ? err.message : "failed")
    }
  }
  return added
}
