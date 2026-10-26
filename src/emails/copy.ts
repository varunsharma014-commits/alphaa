// Shared fallbacks for email copy. The owner's notation "[X / Y]" means: use X
// when it's known, otherwise Y. Everything here returns a finished phrase, so
// no template can print "there", "Welcome, ,", "Your business" mid-sentence or
// an empty name.

/** Trimmed value, or null when missing/blank. */
export function known(v: string | null | undefined): string | null {
  const s = typeof v === "string" ? v.trim() : ""
  return s ? s : null
}

/** First word of a full name, or null. */
export function firstNameOf(fullName: string | null | undefined): string | null {
  return known(fullName)?.split(/\s+/)[0] ?? null
}

/** "Hi Sarah," or, with no name, "Hi,". */
export function hi(firstName: string | null | undefined): string {
  const n = known(firstName)
  return n ? `Hi ${n},` : "Hi,"
}

/** [Business / you] */
export const orYou = (biz: string | null | undefined) => known(biz) ?? "you"

/** [Business / your business] */
export const orYourBusiness = (biz: string | null | undefined) => known(biz) ?? "your business"

/** [Business / your website] */
export const orYourWebsite = (biz: string | null | undefined) => known(biz) ?? "your website"

/** " in Austin" or "" (never "in your area" or "in "). */
export function inCity(city: string | null | undefined): string {
  const c = known(city)
  return c && !/^your area$/i.test(c) ? ` in ${c}` : ""
}

/** A scan lead's display name: business name, else the site's domain, else null. */
export function leadName(businessName: string | null | undefined, businessUrl: string | null | undefined): string | null {
  const name = known(businessName)
  if (name) return name
  const url = known(businessUrl)
  if (!url) return null
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "") || null
  } catch {
    return null
  }
}

export const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
