// Consent for the scan-lead nurture series (the up-to-12 follow-up emails in
// lib/nurture.ts). Client-safe: no server imports.
//
// Visitors in Europe / the UK / the UAE (same detection as the cookie banner:
// window.__ccEu from the root layout, set by time zone or by the /uk /de /fr
// /it /ae pages) get an unticked box and are enrolled only if they tick it.
// German visitors (/de pages or a Europe/Berlin time zone) are not enrolled at
// all, ticked or not: the German market expects double opt-in, which we don't
// run. Everyone else gets the notice. Stored on the lead as
// ScanLead.ogData.nurtureConsent and checked by /api/cron/nurture.

export type NurtureConsent = { optIn: boolean; eu: boolean; de: boolean; at?: string }

export const NURTURE_NOTICE =
  "We’ll email your report and up to 12 emails, written for your business using public info about it. Unsubscribe anytime."
export const NURTURE_EU_FINE = "We’ll email your report. Nothing else unless you tick the box. Unsubscribe anytime."
export const NURTURE_OPTIN_LABEL =
  "Also send me up to 12 emails, written for my business using public info about it."

/** Where the visitor is, for the consent rule above. Browser only. */
export function visitorConsentRegion(): { eu: boolean; de: boolean } {
  if (typeof window === "undefined") return { eu: false, de: false }
  let tz = ""
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
  } catch {}
  const seg = window.location.pathname.split("/")[1] || ""
  const de = seg === "de" || tz === "Europe/Berlin" || tz === "Europe/Busingen"
  const eu = de || !!(window as Window & { __ccEu?: boolean }).__ccEu
  return { eu, de }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/** Reads a client-sent consent object; anything malformed counts as no opt-in. */
export function parseNurtureConsent(v: unknown): NurtureConsent | null {
  if (!isRecord(v)) return null
  return { optIn: v.optIn === true, eu: v.eu === true, de: v.de === true, at: new Date().toISOString() }
}

/**
 * May the nurture series email this lead? Leads stored before consent was
 * recorded (no nurtureConsent) keep the old rule: the notice at the email field.
 */
export function nurtureAllowed(ogData: unknown): boolean {
  const c = isRecord(ogData) && isRecord(ogData.nurtureConsent) ? ogData.nurtureConsent : null
  if (!c) return true
  if (c.de === true) return false
  if (c.eu === true) return c.optIn === true
  return true
}
