import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity"
import type { Prisma } from "@prisma/client"

// One-click unsubscribe for marketing email (scan-lead nurture, abandoned
// checkout). No schema change: suppression lives in ScanLead.ogData.nurture
// for leads, and as a MockActivity row (type "email_unsubscribed") for users.
//
// A link identifies a *subject*: "l_<scanLeadId>" or "u_<userId>". The email
// address never appears in the URL; the token is an HMAC over the subject and
// the address it was sent to, so a link can't be forged or replayed for
// someone else. Same signing key as scan-token.ts (CRON_SECRET); without it we
// fail closed and issue no links (and the senders then send nothing).

const UNSUB_TYPE = "email_unsubscribed"

function key(): string | null {
  const s = process.env.CRON_SECRET
  return s && s.length >= 16 ? s : null
}

const base = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"

export function makeUnsubToken(subject: string, email: string): string | null {
  const k = key()
  if (!k) return null
  return createHmac("sha256", k)
    .update(`unsub:${subject}:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 32)
}

function verify(subject: string, email: string, token: string): boolean {
  const expected = makeUnsubToken(subject, email)
  if (!expected) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export interface UnsubLinks {
  /** Human link for the email footer: a page that confirms in plain words. */
  pageUrl: string
  /** RFC 8058 one-click target for the List-Unsubscribe header (POST). */
  oneClickUrl: string
}

export function unsubscribeLinks(subject: string, email: string): UnsubLinks | null {
  const t = makeUnsubToken(subject, email)
  if (!t) return null
  const q = `s=${encodeURIComponent(subject)}&t=${t}`
  return { pageUrl: `${base()}/unsubscribe?${q}`, oneClickUrl: `${base()}/api/unsubscribe?${q}` }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/** Merge a patch into ogData.nurture without touching any other key. */
export function mergeNurture(ogData: unknown, patch: Record<string, unknown>): Prisma.InputJsonValue {
  const og = isRecord(ogData) ? { ...ogData } : {}
  const prev = isRecord(og.nurture) ? og.nurture : {}
  return { ...og, nurture: { ...prev, ...patch } } as Prisma.InputJsonValue
}

export function leadIsUnsubscribed(ogData: unknown): boolean {
  return isRecord(ogData) && isRecord(ogData.nurture) && ogData.nurture.unsubscribed === true
}

/** Resolve a signed link to the address it was sent to, or null if invalid. */
async function resolve(subject: string, token: string): Promise<string | null> {
  if (!/^[lu]_[a-z0-9]{10,64}$/i.test(subject) || !/^[a-f0-9]{32}$/.test(token)) return null
  const id = subject.slice(2)
  const email =
    subject[0] === "l"
      ? (await db.scanLead.findUnique({ where: { id }, select: { email: true } }))?.email
      : (await db.user.findUnique({ where: { id }, select: { email: true } }))?.email
  if (!email) return null
  return verify(subject, email, token) ? email.trim().toLowerCase() : null
}

/**
 * Suppress every marketing email to the address behind a signed link: all of
 * its scan leads (read-modify-write per row so other ogData keys survive) and
 * any account with that address. Idempotent. Returns false for a bad link.
 */
export async function unsubscribeBySignedLink(subject: string, token: string): Promise<boolean> {
  const email = await resolve(subject, token)
  if (!email) return false
  const now = new Date().toISOString()

  const leads = await db.scanLead.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, ogData: true },
  })
  for (const lead of leads) {
    if (leadIsUnsubscribed(lead.ogData)) continue
    await db.scanLead
      .update({ where: { id: lead.id }, data: { ogData: mergeNurture(lead.ogData, { unsubscribed: true, unsubscribedAt: now }) } })
      .catch((e) => console.error("[unsubscribe] lead update failed", lead.id, e))
  }

  const users = await db.user.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  })
  for (const u of users) {
    const already = await db.mockActivity.findFirst({ where: { userId: u.id, type: UNSUB_TYPE }, select: { id: true } })
    if (!already) {
      await logActivity(u.id, UNSUB_TYPE, "You unsubscribed from marketing email", "Account and billing email still arrives.")
    }
  }
  return true
}

/** True when this address opted out anywhere (any lead or any account). */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const address = email.trim().toLowerCase()
  const leads = await db.scanLead.findMany({
    where: { email: { equals: address, mode: "insensitive" } },
    select: { ogData: true },
  })
  if (leads.some((l) => leadIsUnsubscribed(l.ogData))) return true
  const hit = await db.mockActivity.findFirst({
    where: { type: UNSUB_TYPE, user: { email: { equals: address, mode: "insensitive" } } },
    select: { id: true },
  })
  return Boolean(hit)
}
