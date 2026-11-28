// Team members of a brand: invites, roles, removal, the signed accept link and seat caps.
// The owner is the brand's own User row and never appears here (lib/team/permissions.ts).
import { createHmac, timingSafeEqual } from "crypto"
import type { TeamMember, User } from "@prisma/client"
import { db } from "@/lib/db"
import { isComped } from "@/lib/billing"
import { seatCap } from "@/lib/quota-rules"
import { ownerClerkId, realEmail } from "@/lib/sites"
import { logActivity } from "@/lib/activity"
import { isMemberRole, ROLE_HINT, ROLE_LABEL, type MemberRole } from "./permissions"

const TTL_MS = 14 * 86_400_000
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const base = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
export const cleanEmail = (e: string) => e.trim().toLowerCase()

/** Seats this brand's plan includes (people besides the owner). Starter and no plan: 0. */
export function seatsFor(brand: Pick<User, "plan" | "email">): number {
  return seatCap(brand.plan, isComped(brand.email))
}

export type TeamRow = { id: string; email: string; name: string | null; role: MemberRole; status: "invited" | "active"; briefing: boolean; invitedAt: string; acceptedAt: string | null }
const row = (m: TeamMember): TeamRow => ({ id: m.id, email: m.email, name: m.name, role: (isMemberRole(m.role) ? m.role : "creator"), status: m.status === "active" ? "active" : "invited", briefing: m.briefing, invitedAt: m.invitedAt.toISOString(), acceptedAt: m.acceptedAt?.toISOString() ?? null })

/** Everyone on the brand besides the owner (removed people left out), invited first then by name. */
export async function listTeam(brandId: string): Promise<TeamRow[]> {
  const rows = await db.teamMember.findMany({ where: { brandId, status: { in: ["invited", "active"] } }, orderBy: { invitedAt: "asc" } })
  return rows.map(row)
}

export async function hasTeam(brandId: string): Promise<boolean> {
  return (await db.teamMember.count({ where: { brandId, status: { in: ["invited", "active"] } } })) > 0
}

// ── The accept link ────────────────────────────────────────────────────────────────────────
// payload = base64url({ m: memberId, e: email, t: invitedAt ms, x: expiry }). Re-sending an
// invite moves invitedAt, so older links stop working; removing the member kills them too.
type Claim = { m: string; e: string; t: number; x: number }
function key(): string | null {
  const s = process.env.CRON_SECRET
  return s && s.length >= 16 ? s : null
}
const sign = (k: string, payload: string) => createHmac("sha256", k).update(`team-invite:${payload}`).digest("base64url").slice(0, 43)

export function makeInviteToken(m: Pick<TeamMember, "id" | "email" | "invitedAt">, now = Date.now()): string | null {
  const k = key()
  if (!k) return null
  const payload = Buffer.from(JSON.stringify({ m: m.id, e: m.email, t: m.invitedAt.getTime(), x: now + TTL_MS } satisfies Claim)).toString("base64url")
  return `${payload}.${sign(k, payload)}`
}

export function readInviteToken(token: string, now = Date.now()): Claim | null {
  const k = key()
  const [payload, mac, extra] = String(token ?? "").split(".")
  if (!k || !payload || !mac || extra !== undefined) return null
  const want = Buffer.from(sign(k, payload))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const c = JSON.parse(Buffer.from(payload, "base64url").toString()) as Claim
    if (typeof c.m !== "string" || typeof c.e !== "string" || typeof c.t !== "number" || typeof c.x !== "number" || c.x < now) return null
    return c
  } catch {
    return null
  }
}

export const inviteUrl = (token: string) => `${base()}/team/accept?t=${encodeURIComponent(token)}`

// ── Changes (owner or admin; the route checks can(actor, "team")) ─────────────────────────
export type TeamResult<T = TeamRow> = { ok: true; member: T; url?: string | null; emailed?: boolean } | { ok: false; error: string; status: number }

export async function inviteMember(brand: User, by: { clerkId: string; name: string }, rawEmail: string, role: string): Promise<TeamResult> {
  const email = cleanEmail(rawEmail)
  if (!EMAIL.test(email) || email.length > 200) return { ok: false, error: "That email doesn’t look right.", status: 400 }
  if (!isMemberRole(role)) return { ok: false, error: "Pick a role: admin, publisher, reviewer or creator.", status: 400 }
  if (email === cleanEmail(realEmail(brand.email))) return { ok: false, error: "That’s the owner’s own email. The owner already has every right.", status: 400 }
  const cap = seatsFor(brand)
  if (cap === 0) return { ok: false, error: "Teams come with Pro and Growth. On Starter it’s just you.", status: 402 }
  const existing = await db.teamMember.findUnique({ where: { brandId_email: { brandId: brand.id, email } } })
  if (existing && existing.status !== "removed") return { ok: false, error: existing.status === "active" ? "They’re already on your team. Change their role instead." : "They’re already invited. Send the invite again instead.", status: 409 }
  const used = await db.teamMember.count({ where: { brandId: brand.id, status: { in: ["invited", "active"] } } })
  if (used >= cap) return { ok: false, error: `Your plan includes ${cap} team ${cap === 1 ? "seat" : "seats"} and ${cap === 1 ? "it’s" : "they’re all"} taken. Remove someone first, or write to hi@alphaa.app.`, status: 402 }
  const now = new Date()
  const m = existing
    ? await db.teamMember.update({ where: { id: existing.id }, data: { role, status: "invited", clerkId: null, invitedBy: by.clerkId, invitedAt: now, acceptedAt: null, briefing: false } })
    : await db.teamMember.create({ data: { brandId: brand.id, email, role, status: "invited", invitedBy: by.clerkId, invitedAt: now } })
  const emailed = await emailInvite(brand, m, by.name)
  await logActivity(brand.id, "team_change", `Invited ${email} as ${ROLE_LABEL[role].toLowerCase()}`, undefined, { op: "invite", memberId: m.id, email, role })
  return { ok: true, member: row(m), emailed: emailed.sent, url: emailed.url }
}

async function emailInvite(brand: User, m: TeamMember, inviter: string): Promise<{ sent: boolean; url: string | null }> {
  const token = makeInviteToken(m)
  if (!token) return { sent: false, url: null }
  const url = inviteUrl(token)
  try {
    const { sendTeamInviteEmail } = await import("@/lib/email")
    const role = isMemberRole(m.role) ? m.role : "creator"
    await sendTeamInviteEmail(m.email, { inviter, brand: brand.businessName?.trim() || brand.websiteUrl || "a brand", role: ROLE_LABEL[role], roleHint: ROLE_HINT[role], acceptUrl: url })
    return { sent: true, url }
  } catch (e) {
    console.error("[team] invite email failed", m.id, e)
    return { sent: false, url }
  }
}

export async function resendInvite(brand: User, memberId: string, inviter: string): Promise<TeamResult> {
  const m = await db.teamMember.findFirst({ where: { id: memberId, brandId: brand.id, status: "invited" } })
  if (!m) return { ok: false, error: "That invite isn’t open any more.", status: 404 }
  const fresh = await db.teamMember.update({ where: { id: m.id }, data: { invitedAt: new Date() } })
  const emailed = await emailInvite(brand, fresh, inviter)
  return { ok: true, member: row(fresh), emailed: emailed.sent, url: emailed.url }
}

export async function setMemberRole(brandId: string, memberId: string, role: string): Promise<TeamResult> {
  if (!isMemberRole(role)) return { ok: false, error: "Pick a role: admin, publisher, reviewer or creator.", status: 400 }
  const m = await db.teamMember.findFirst({ where: { id: memberId, brandId, status: { in: ["invited", "active"] } } })
  if (!m) return { ok: false, error: "They’re not on your team any more.", status: 404 }
  const u = await db.teamMember.update({ where: { id: m.id }, data: { role } })
  await logActivity(brandId, "team_change", `Changed ${m.email} to ${ROLE_LABEL[role].toLowerCase()}`, undefined, { op: "role", memberId: m.id, email: m.email, role, was: m.role })
  return { ok: true, member: row(u) }
}

/** Removes access at once: the next request they make resolves to their own brand (lib/team/resolve.ts). */
export async function removeMember(brandId: string, memberId: string): Promise<TeamResult<{ id: string }>> {
  const m = await db.teamMember.findFirst({ where: { id: memberId, brandId, status: { in: ["invited", "active"] } } })
  if (!m) return { ok: false, error: "They’re not on your team any more.", status: 404 }
  await db.teamMember.update({ where: { id: m.id }, data: { status: "removed", briefing: false } })
  await logActivity(brandId, "team_change", `Removed ${m.email} from the team`, undefined, { op: "remove", memberId: m.id, email: m.email, role: m.role })
  return { ok: true, member: { id: m.id } }
}

export async function setBriefing(brandId: string, memberId: string, on: boolean): Promise<boolean> {
  const r = await db.teamMember.updateMany({ where: { id: memberId, brandId, status: "active" }, data: { briefing: on } })
  return r.count === 1
}

// ── Accepting ──────────────────────────────────────────────────────────────────────────────
export type InviteView = { ok: true; member: TeamMember; brand: Pick<User, "id" | "clerkId" | "businessName" | "websiteUrl"> } | { ok: false; error: string }

/** What a token points at, if it is still open. No login needed (the accept page shows the brand). */
export async function openInvite(token: string): Promise<InviteView> {
  const c = readInviteToken(token)
  if (!c) return { ok: false, error: "This invite link has expired. Ask for a new one." }
  const m = await db.teamMember.findUnique({ where: { id: c.m }, include: { brand: { select: { id: true, clerkId: true, businessName: true, websiteUrl: true } } } })
  if (!m || m.email !== c.e || m.invitedAt.getTime() !== c.t) return { ok: false, error: "This invite link has expired. Ask for a new one." }
  if (m.status === "removed") return { ok: false, error: "This invite was cancelled." }
  return { ok: true, member: m, brand: m.brand }
}

/**
 * Accept: the signed-in Clerk login must own a VERIFIED email equal to the invited address, and
 * must not be the brand's owner. A link forwarded to someone else does nothing.
 */
export async function acceptInvite(token: string, clerk: { id: string; verifiedEmails: string[]; name: string | null }): Promise<{ ok: true; brandId: string } | { ok: false; error: string; status: number }> {
  const v = await openInvite(token)
  if (!v.ok) return { ok: false, error: v.error, status: 410 }
  const { member, brand } = v
  if (member.status === "active") {
    if (member.clerkId === clerk.id) return { ok: true, brandId: brand.id }
    return { ok: false, error: "This invite was already accepted.", status: 409 }
  }
  const mine = clerk.verifiedEmails.map(cleanEmail)
  if (!mine.includes(member.email)) return { ok: false, error: `This invite is for ${member.email}. Sign in with that email to accept it.`, status: 403 }
  if (ownerClerkId(brand.clerkId) === clerk.id) return { ok: false, error: "This is your own brand. You already have every right.", status: 409 }
  const r = await db.teamMember.updateMany({ where: { id: member.id, status: "invited", invitedAt: member.invitedAt }, data: { status: "active", clerkId: clerk.id, acceptedAt: new Date(), name: clerk.name?.slice(0, 80) || null } })
  if (r.count !== 1) return { ok: false, error: "This invite link has expired. Ask for a new one.", status: 410 }
  await logActivity(brand.id, "team_change", `${clerk.name || member.email} joined the team as ${ROLE_LABEL[isMemberRole(member.role) ? member.role : "creator"].toLowerCase()}`, undefined, { op: "join", memberId: member.id, email: member.email, role: member.role })
  return { ok: true, brandId: brand.id }
}

/** Brands this Clerk login is an active member of (the site switcher). */
export async function membershipsFor(realClerkId: string): Promise<{ id: string; name: string; url: string | null; role: MemberRole; ready: boolean }[]> {
  const rows = await db.teamMember.findMany({
    where: { clerkId: realClerkId, status: "active" },
    select: { role: true, brand: { select: { id: true, clerkId: true, businessName: true, websiteUrl: true, onboardingCompleted: true } } },
    orderBy: { acceptedAt: "asc" },
  })
  return rows
    .filter((r) => isMemberRole(r.role) && ownerClerkId(r.brand.clerkId) !== realClerkId)
    .map((r) => ({ id: r.brand.id, name: r.brand.businessName?.trim() || r.brand.websiteUrl || "A brand", url: r.brand.websiteUrl, role: r.role as MemberRole, ready: r.brand.onboardingCompleted }))
}

/** Active members who opted in to the weekly briefing. */
export async function briefingMembers(brandId: string): Promise<{ id: string; email: string; name: string | null; role: MemberRole }[]> {
  const rows = await db.teamMember.findMany({ where: { brandId, status: "active", briefing: true }, select: { id: true, email: true, name: true, role: true } })
  return rows.filter((r) => isMemberRole(r.role)).map((r) => ({ ...r, role: r.role as MemberRole }))
}
