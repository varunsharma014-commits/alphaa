// Pure payload builders for telling Google and Meta about a sale (a lead the owner marked won).
// No network here, so every payload is unit-tested (scripts/test-roas.ts).
//
// Checked 2026-11-28:
// - Google Ads ConversionUploadService.UploadClickConversions (REST, v26):
//   POST /v26/customers/{customerId}:uploadClickConversions
//   { conversions: [ClickConversion], partialFailure: true (required), validateOnly }
//   ClickConversion: exactly one of gclid | gbraid | wbraid, conversionAction
//   ("customers/{cid}/conversionActions/{id}", an UPLOAD_CLICKS action), conversionDateTime
//   "yyyy-mm-dd hh:mm:ss+|-hh:mm", conversionValue, currencyCode, orderId (dedupes re-uploads).
//   validateOnly: true checks the request and changes nothing (our dry run).
// - Meta Conversions API: POST /{pixel_id}/events { data: [ServerEvent] }. A sale closed outside
//   the website is action_source "system_generated" (CRM). user_data needs one match key: lead_id
//   (instant-form leads, from the Leads API) or fbc (the click id cookie). custom_data value +
//   currency; event_source "crm" + lead_event_source name the CRM. event_id dedupes.
import type { Click } from "./rules"

export type SaleInput = { ref: string; value: number; currency: string; at: string }

const pad = (n: number) => String(n).padStart(2, "0")
/** Google's conversionDateTime, in UTC. */
export function googleDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00:00`
}

const money = (v: number) => Math.round(v * 100) / 100
const currencyOk = (c: string) => /^[A-Z]{3}$/.test(c)

/** The one click id Google accepts, gclid first. */
export function googleClickId(c: Click | undefined): { gclid: string } | { gbraid: string } | { wbraid: string } | null {
  if (c?.gclid) return { gclid: c.gclid }
  if (c?.gbraid) return { gbraid: c.gbraid }
  if (c?.wbraid) return { wbraid: c.wbraid }
  return null
}

export function googleUploadBody(o: { customerId: string; conversionAction: string; click: Click | undefined; sale: SaleInput; validateOnly: boolean }) {
  const id = googleClickId(o.click)
  if (!id) throw new Error("No Google click id on this lead.")
  if (!/^customers\/\d+\/conversionActions\/\d+$/.test(o.conversionAction)) throw new Error("That isn’t a Google Ads conversion action.")
  if (!(o.sale.value > 0) || !currencyOk(o.sale.currency)) throw new Error("A sale needs an amount and a currency.")
  return {
    path: `/customers/${o.customerId.replace(/\D/g, "")}:uploadClickConversions`,
    body: {
      conversions: [{
        ...id,
        conversionAction: o.conversionAction,
        conversionDateTime: googleDateTime(o.sale.at),
        conversionValue: money(o.sale.value),
        currencyCode: o.sale.currency,
        orderId: `alphaa-${o.sale.ref}`.slice(0, 64),
      }],
      partialFailure: true,
      validateOnly: o.validateOnly,
    },
  }
}

export function metaSaleEvent(o: { leadId?: string | null; fbc?: string | null; sale: SaleInput; nowMs?: number }) {
  if (!o.leadId && !o.fbc) throw new Error("No Meta lead id or click id on this lead.")
  if (!(o.sale.value > 0) || !currencyOk(o.sale.currency)) throw new Error("A sale needs an amount and a currency.")
  const t = Math.floor(Math.min(Date.parse(o.sale.at), o.nowMs ?? Date.now()) / 1000)
  return {
    data: [{
      event_name: "Purchase",
      event_time: t,
      event_id: `won_${o.sale.ref}`.slice(0, 100),
      action_source: "system_generated",
      user_data: o.leadId ? { lead_id: o.leadId } : { fbc: o.fbc },
      custom_data: { value: money(o.sale.value), currency: o.sale.currency, event_source: "crm", lead_event_source: "Alphaa" },
    }],
  }
}

export type UploadSettings = { google?: boolean; meta?: boolean; googleAction?: string | null }
export type UploadPlan = { google: string | null; meta: string | null }

/**
 * Pure: may this sale go to Google / Meta? A string = the reason it won't (shown to the owner),
 * null = it will. The owner has to turn each one on; the visitor's Global Privacy Control is
 * respected (we never kept click ids for them, and never send them).
 */
export function uploadPlan(o: { settings: UploadSettings | undefined; gpc?: boolean; click?: Click; leadId?: string | null; googleConnected: boolean; capi: boolean }): UploadPlan {
  const s = o.settings ?? {}
  const google = !s.google ? "off" : o.gpc ? "The visitor asked not to be tracked." : !googleClickId(o.click) ? "No Google click on this lead." : !o.googleConnected ? "Google Ads isn’t connected." : !s.googleAction ? "Pick the Google Ads conversion action first." : null
  const meta = !s.meta ? "off" : o.gpc ? "The visitor asked not to be tracked." : !o.leadId && !o.click?.fbc ? "No Meta click on this lead." : !o.capi ? "Add your Meta Conversions API token first." : null
  return { google, meta }
}
