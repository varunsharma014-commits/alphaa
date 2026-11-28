// Tell Google Ads and Meta about a won sale, so their bidding learns which clicks became customers.
// Only when the owner turned it on per platform (settings.roas.uploads), only for leads that carry a
// click id or Meta lead id (never kept for visitors with Global Privacy Control), and only LIVE when
// ROAS_UPLOADS=live is set on the server. Otherwise every send is a dry run: Google gets
// validateOnly (it checks the request and records nothing), Meta's payload is built and not sent.
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { gadsCall, GadsError } from "@/lib/gads/api"
import { accessToken } from "@/lib/gads/client"
import { getGadsAccount } from "@/lib/gads/store"
import { decryptSecret } from "@/lib/checks/bing-webmaster"
import { META_GRAPH } from "@/lib/tracking-events"
import { googleUploadBody, metaSaleEvent, uploadPlan } from "./payloads"
import { listAdLeads, saveUploads, type UploadResult } from "./leads"

export const uploadMode = (): "live" | "dry_run" => (process.env.ROAS_UPLOADS === "live" ? "live" : "dry_run")

export type UploadOutcome = { google?: UploadResult; meta?: UploadResult }

/** Send one won lead to the platforms the owner turned on. Stores and returns what happened. */
export async function uploadWon(userId: string, ref: string): Promise<UploadOutcome> {
  const [s, leads, gacc] = await Promise.all([getAgentSettings(userId), listAdLeads(userId, 90, 500), getGadsAccount(userId).catch(() => null)])
  const lead = leads.find((l) => l.ref === ref)
  if (!lead?.won) return {}
  const mode = uploadMode()
  const at = new Date().toISOString()
  const plan = uploadPlan({ settings: s.roas?.uploads, click: lead.click, leadId: lead.leadId, googleConnected: !!gacc?.customerId && gacc.status === "active", capi: !!(s.tracking?.capi?.token && s.tracking.capi.pixel) })
  const sale = { ref: ref.replace(":", "_"), value: lead.won.amount, currency: lead.won.currency, at: lead.won.at }
  const out: UploadOutcome = {}

  if (plan.google === null) {
    try {
      const { path, body } = googleUploadBody({ customerId: gacc!.customerId!, conversionAction: s.roas!.uploads!.googleAction!, click: lead.click, sale, validateOnly: mode !== "live" })
      const token = await accessToken(userId, gacc)
      const r = await gadsCall<{ partialFailureError?: { message?: string } }>(path, { method: "POST", body }, { token })
      out.google = r?.partialFailureError?.message ? { ok: false, mode, at, error: r.partialFailureError.message.slice(0, 300) } : { ok: true, mode, at }
    } catch (err) {
      out.google = { ok: false, mode, at, error: (err instanceof GadsError || err instanceof Error ? err.message : "failed").slice(0, 300) }
    }
  } else if (plan.google !== "off") out.google = { ok: false, mode, at, skipped: plan.google }

  if (plan.meta === null) {
    try {
      const body = metaSaleEvent({ leadId: lead.leadId, fbc: lead.click?.fbc, sale })
      if (mode !== "live") out.meta = { ok: true, mode, at }
      else {
        const token = decryptSecret(s.tracking!.capi!.token)
        const res = await fetch(`${META_GRAPH}/${encodeURIComponent(s.tracking!.capi!.pixel)}/events?access_token=${encodeURIComponent(token)}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8_000),
        })
        const j = (await res.json().catch(() => ({}))) as { events_received?: number; error?: { message?: string } }
        out.meta = res.ok && (j.events_received ?? 0) > 0 ? { ok: true, mode, at } : { ok: false, mode, at, error: j.error?.message?.slice(0, 300) ?? `Meta answered ${res.status}` }
      }
    } catch (err) {
      out.meta = { ok: false, mode, at, error: err instanceof Error ? err.message.slice(0, 300) : "failed" }
    }
  } else if (plan.meta !== "off") out.meta = { ok: false, mode, at, skipped: plan.meta }

  if (out.google || out.meta) await saveUploads(userId, ref, out)
  return out
}

type ActionRow = { conversionAction?: { resourceName?: string; name?: string } }

/**
 * Owner turns sending on or off. Google needs an "Import from clicks" conversion action
 * (UPLOAD_CLICKS) in their account: I use the one there (read-only lookup), I never create one.
 */
export async function setUploads(userId: string, o: { google?: boolean; meta?: boolean }): Promise<{ ok: true; note: string | null } | { ok: false; error: string }> {
  const s = await getAgentSettings(userId)
  const cur = s.roas?.uploads ?? {}
  const next = { ...cur, at: new Date().toISOString() }
  let note: string | null = null
  if (o.meta !== undefined) {
    if (o.meta && !(s.tracking?.capi?.token && s.tracking.capi.pixel)) return { ok: false, error: "Add your Meta Conversions API token in Lead tracking first, then turn this on." }
    next.meta = o.meta
  }
  if (o.google !== undefined) {
    if (o.google) {
      const gacc = await getGadsAccount(userId).catch(() => null)
      if (!gacc?.customerId) return { ok: false, error: "Connect your Google Ads account first." }
      try {
        const token = await accessToken(userId, gacc)
        const { searchStream } = await import("@/lib/gads/api")
        const rows = await searchStream<ActionRow>(gacc.customerId, "SELECT conversion_action.resource_name, conversion_action.name FROM conversion_action WHERE conversion_action.type = 'UPLOAD_CLICKS' AND conversion_action.status = 'ENABLED'", { token })
        const a = rows.find((r) => r.conversionAction?.resourceName)?.conversionAction
        if (!a?.resourceName) return { ok: false, error: "Your Google Ads account needs a conversion action for imported sales first. In Google Ads: Goals, Conversions, New conversion action, Import, “Track conversions from clicks”. Then turn this on again." }
        next.googleAction = a.resourceName
        next.googleActionName = a.name ?? null
        if (rows.length > 1) note = `I’ll use “${a.name}”, the first one in your account.`
      } catch (err) {
        return { ok: false, error: err instanceof Error ? `Google Ads said: ${err.message.slice(0, 200)}` : "I couldn’t reach Google Ads." }
      }
    }
    next.google = o.google
  }
  await saveAgentSettings(userId, { roas: { ...s.roas, uploads: next } })
  if (uploadMode() !== "live" && (next.google || next.meta)) note = [note, "Sending is in test mode for now: nothing is recorded in Google or Meta yet."].filter(Boolean).join(" ")
  return { ok: true, note }
}
