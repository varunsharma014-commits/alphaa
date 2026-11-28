// Signed, expiring, revocable links to a read-only ad report (/w/ads/<token>). The token names
// one brand + one report link id + its expiry; the link's date range and revocation live in agent
// settings `adReports` (so revoking works even though the token itself stays valid-looking).
// Signed with AD_REPORT_SECRET, else CRON_SECRET (like lib/approve-token.ts); without either, no
// links are issued. Pure crypto, no database: tested in scripts/test-ad-features.ts.
import { createHmac, randomBytes, timingSafeEqual } from "crypto"

export type ReportRange = { from: string; to: string; label: string }
export type ReportLink = {
  id: string
  from: string // YYYY-MM-DD, inclusive
  to: string // YYYY-MM-DD, inclusive
  label: string
  createdAt: string
  expiresAt: string
  revokedAt?: string | null
  /** "owner" = made on the Ads page, "monthly" = the monthly email. */
  by: "owner" | "monthly"
}
type Claim = { u: string; r: string; e: number }

export const MAX_LINKS = 20
export const TTL_DAYS = [7, 30, 90] as const

function key(): string | null {
  const s = process.env.AD_REPORT_SECRET || process.env.CRON_SECRET
  return s && s.length >= 16 ? s : null
}
const sign = (k: string, payload: string) => createHmac("sha256", k).update(`adreport:${payload}`).digest("base64url").slice(0, 43)

export const newLinkId = () => randomBytes(9).toString("base64url")

export function makeReportToken(userId: string, linkId: string, expiresAt: Date): string | null {
  const k = key()
  if (!k) return null
  const payload = Buffer.from(JSON.stringify({ u: userId, r: linkId, e: expiresAt.getTime() } satisfies Claim)).toString("base64url")
  return `${payload}.${sign(k, payload)}`
}

/** The claim, or null when the signature is wrong or the link has expired. */
export function readReportToken(token: string, now = Date.now()): Claim | null {
  const k = key()
  if (!k || typeof token !== "string" || token.length > 400) return null
  const [payload, mac, extra] = token.split(".")
  if (!payload || !mac || extra !== undefined) return null
  const want = Buffer.from(sign(k, payload))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const c = JSON.parse(Buffer.from(payload, "base64url").toString()) as Claim
    if (typeof c.e !== "number" || c.e < now || typeof c.u !== "string" || typeof c.r !== "string") return null
    return c
  } catch {
    return null
  }
}

/** The stored link for a claim, only while it's live (not revoked, not expired). */
export function liveLink(links: ReportLink[] | undefined, claim: Claim, now = Date.now()): ReportLink | null {
  const l = (links ?? []).find((x) => x.id === claim.r)
  if (!l || l.revokedAt || Date.parse(l.expiresAt) < now) return null
  return l
}

export const reportUrl = (token: string) => `${process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"}/w/ads/${token}`

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** "last7" / "last30" end yesterday (today's numbers are still moving); "month" = last calendar month. */
export function rangeFor(kind: "last7" | "last30" | "month", now = new Date()): ReportRange {
  const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
  if (kind === "month") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
    return { from: iso(from), to: iso(to), label: from.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) }
  }
  const days = kind === "last7" ? 7 : 30
  const from = new Date(y.getTime() - (days - 1) * 86_400_000)
  return { from: iso(from), to: iso(y), label: `${fmtDay(iso(from))} to ${fmtDay(iso(y))}` }
}

export const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
export const daysIn = (r: { from: string; to: string }) => Math.round((Date.parse(`${r.to}T00:00:00Z`) - Date.parse(`${r.from}T00:00:00Z`)) / 86_400_000) + 1

/** "In November 2026" for a calendar month, else "From Nov 1, 2026 to Nov 7, 2026". */
export function periodPhrase(r: { from: string; to: string }): string {
  const f = new Date(`${r.from}T00:00:00Z`), t = new Date(`${r.to}T00:00:00Z`)
  const lastDay = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate()
  if (f.getUTCDate() === 1 && t.getUTCDate() === lastDay && f.getUTCMonth() === t.getUTCMonth() && f.getUTCFullYear() === t.getUTCFullYear()) return `In ${f.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}`
  return `From ${fmtDay(r.from)} to ${fmtDay(r.to)}`
}
