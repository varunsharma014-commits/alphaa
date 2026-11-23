// Email outreach (Growth): the owner's own customer list, opt-outs and campaigns.
// No schema change, all MockActivity rows per brand:
//   email_contacts  one row, metadata { contacts: Contact[] } (cap MAX_CONTACTS)
//   email_import    one row per import: how many, from where, and the consent the owner gave (proof for CASL / CAN-SPAM)
//   email_optout    one row per person who unsubscribed from THIS business, metadata { to: sha256(email) }
//   email_campaign  one row per email, metadata Campaign
import { createHash } from "crypto"
import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"

export const MAX_CONTACTS = 2000
export const SEND_GAP_DAYS = 7 // at most one campaign per brand per week
export const CONSENT_TEXT = "Everyone on this list bought from me or asked to hear from me, and I can show it if asked."

export type Contact = { e: string; n?: string; at: string; src: "paste" | "csv" }

export type Campaign = {
  v: 1
  status: "draft" | "sending" | "sent" | "failed" | "deleted"
  subject: string
  preview: string
  paragraphs: string[]
  cta?: { label: string; url: string }
  topic?: string
  auto?: boolean // drafted by the monthly cron
  /** Fingerprint-free snapshot of who it goes to, frozen when sending starts so a restart can resume. */
  to?: { e: string; n?: string }[]
  done?: number
  sent?: number
  skipped?: number
  failed?: number
  startedAt?: string
  sentAt?: string
  error?: string
  bounced?: number // addresses that hard-bounced (taken off the list by the Resend webhook)
  complained?: number // people who marked it as spam (taken off the list)
  tests?: string[] // ISO times test copies went to the owner
  touchedAt?: string // last write (MockActivity has no updatedAt)
}

const EMAIL_RE = /^[^@\s,;<>"]+@[^@\s,;<>"]+\.[a-z]{2,}$/i
export const fingerprint = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex")

/** Reads "Name, email" / "email" / CSV rows (any column order, header optional) into contacts. */
export function parseContacts(raw: string, src: Contact["src"]): { contacts: Contact[]; bad: number } {
  const at = new Date().toISOString()
  const out = new Map<string, Contact>()
  let bad = 0
  const lines = raw.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean)
  // A header row tells us which column is the name.
  const header = lines[0] && !EMAIL_RE.test(lines[0].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, "")).find((c) => c.includes("@")) ?? "") ? lines[0].toLowerCase().split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, "")) : null
  const nameCol = header ? header.findIndex((h) => /^(first[ _]?name|name|full[ _]?name|customer)$/.test(h)) : -1
  for (const line of header ? lines.slice(1) : lines) {
    const cells = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, "").trim())
    // "Jane Doe <jane@x.com>" also works.
    const angle = /^(.*?)<([^>]+)>$/.exec(line)
    const email = (angle ? angle[2] : cells.find((c) => EMAIL_RE.test(c)))?.trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email)) { bad++; continue }
    let name = angle ? angle[1].replace(/["',]/g, "").trim() : nameCol >= 0 ? cells[nameCol] : cells.find((c) => c && !c.includes("@") && /^[\p{L}][\p{L}\p{M} .'’-]{0,60}$/u.test(c))
    name = name && !name.includes("@") ? name.trim().slice(0, 60) || undefined : undefined
    if (!out.has(email)) out.set(email, { e: email, n: name, at, src })
  }
  return { contacts: [...out.values()], bad }
}

export async function getContacts(userId: string): Promise<Contact[]> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: "email_contacts" }, orderBy: { createdAt: "desc" } })
  const m = row?.metadata as { contacts?: Contact[] } | null
  return Array.isArray(m?.contacts) ? m!.contacts : []
}

async function saveContacts(userId: string, contacts: Contact[]) {
  const row = await db.mockActivity.findFirst({ where: { userId, type: "email_contacts" }, orderBy: { createdAt: "desc" } })
  const metadata = { contacts } as unknown as Prisma.InputJsonValue
  if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata } })
  else await db.mockActivity.create({ data: { userId, type: "email_contacts", title: "Customer email list", metadata } })
}

/** Adds new contacts (existing addresses keep their first entry). People who opted out are not re-added. */
export async function addContacts(userId: string, incoming: Contact[], source: string): Promise<{ added: number; already: number; optedOut: number; overCap: number; total: number }> {
  const [current, optouts] = await Promise.all([getContacts(userId), optedOutSet(userId)])
  const have = new Set(current.map((c) => c.e))
  let added = 0, already = 0, optedOut = 0, overCap = 0
  const next = [...current]
  for (const c of incoming) {
    if (have.has(c.e)) { already++; continue }
    if (optouts.has(fingerprint(c.e))) { optedOut++; continue }
    if (next.length >= MAX_CONTACTS) { overCap++; continue }
    next.push(c)
    have.add(c.e)
    added++
  }
  if (added) await saveContacts(userId, next)
  await db.mockActivity.create({ data: { userId, type: "email_import", title: `Added ${added} customer${added === 1 ? "" : "s"} to your email list`, metadata: { added, already, optedOut, overCap, source, consent: CONSENT_TEXT, consentAt: new Date().toISOString() } } })
  return { added, already, optedOut, overCap, total: next.length }
}

export async function clearContacts(userId: string) {
  await saveContacts(userId, [])
}

export async function optedOutSet(userId: string): Promise<Set<string>> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "email_optout" }, select: { metadata: true } })
  return new Set(rows.map((r) => (r.metadata as { to?: string } | null)?.to).filter((x): x is string => !!x))
}

/** Records an opt-out for this business and drops the address from its list. Idempotent. */
export async function optOut(userId: string, fp: string, reason: "unsubscribed" | "bounced" | "complained" = "unsubscribed"): Promise<boolean> {
  const already = await db.mockActivity.findFirst({ where: { userId, type: "email_optout", metadata: { path: ["to"], equals: fp } }, select: { id: true } })
  const title = reason === "bounced" ? "An address on your list doesn’t exist any more" : reason === "complained" ? "A customer marked your email as spam" : "A customer unsubscribed from your emails"
  if (!already) await db.mockActivity.create({ data: { userId, type: "email_optout", title, metadata: { to: fp, reason } } })
  const contacts = await getContacts(userId)
  const left = contacts.filter((c) => fingerprint(c.e) !== fp)
  if (left.length !== contacts.length) await saveContacts(userId, left)
  return !already
}

export type CampaignRow = { id: string; createdAt: Date; updatedAt: Date; c: Campaign }

export async function listCampaigns(userId: string, take = 10): Promise<CampaignRow[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "email_campaign" }, orderBy: { createdAt: "desc" }, take: take + 10 })
  return rows
    .map((r) => { const c = r.metadata as unknown as Campaign; return { id: r.id, createdAt: r.createdAt, updatedAt: c?.touchedAt ? new Date(c.touchedAt) : r.createdAt, c } })
    .filter((r) => r.c && r.c.status !== "deleted")
    .slice(0, take)
}

export async function getCampaign(userId: string, id: string): Promise<CampaignRow | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: "email_campaign" } })
  if (!r) return null
  const c = r.metadata as unknown as Campaign
  return c && c.status !== "deleted" ? { id: r.id, createdAt: r.createdAt, updatedAt: c.touchedAt ? new Date(c.touchedAt) : r.createdAt, c } : null
}

export async function createCampaign(userId: string, c: Campaign): Promise<CampaignRow> {
  const r = await db.mockActivity.create({ data: { userId, type: "email_campaign", title: c.subject.slice(0, 180), metadata: c as unknown as Prisma.InputJsonValue } })
  return { id: r.id, createdAt: r.createdAt, updatedAt: r.createdAt, c }
}

export async function updateCampaign(id: string, patch: Partial<Campaign>): Promise<Campaign | null> {
  const r = await db.mockActivity.findUnique({ where: { id } })
  if (!r) return null
  const next = { ...(r.metadata as unknown as Campaign), ...patch, touchedAt: new Date().toISOString() }
  await db.mockActivity.update({ where: { id }, data: { metadata: next as unknown as Prisma.InputJsonValue, ...(patch.subject ? { title: patch.subject.slice(0, 180) } : {}) } })
  return next
}

/** The last time this brand sent a campaign (or started one). */
export async function lastSentAt(userId: string): Promise<Date | null> {
  const rows = await listCampaigns(userId, 20)
  const t = rows.map((r) => r.c.startedAt).filter((x): x is string => !!x).sort().pop()
  return t ? new Date(t) : null
}

export function nextAllowedSend(last: Date | null): Date | null {
  if (!last) return null
  const next = new Date(last.getTime() + SEND_GAP_DAYS * 86_400_000)
  return next > new Date() ? next : null
}
