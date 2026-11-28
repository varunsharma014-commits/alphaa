// Which brand a signed-in person has open, and in which role. THE security boundary for teams:
// `auth()` (lib/auth.ts) swaps the Clerk id for the resolved brand's clerkId, so every
// `where: { clerkId }` lookup in the app loads that brand. The `alphaa_site` cookie (a User.id)
// is only ever accepted when it is:
//   1. one of the login's own brands (its first row, or an extra `site:<clerkId>:` row), or
//   2. a brand where this exact Clerk id is an ACTIVE TeamMember with a known role.
// Anything else (another brand's id, a removed or invited-only member, a bad role, a missing
// row) falls back to the login's own first brand, exactly like before teams existed.
// Tests: scripts/test-team.ts (resolveBrand with an in-memory lookup).

import { isMemberRole, type MemberRole, type Role } from "./permissions"
import { sitePrefix } from "@/lib/sites"

export type Resolved = {
  /** The brand row's clerkId (what auth() returns as userId). */
  clerkId: string
  role: Role
  /** Only for members: the brand row id, the TeamMember row and who they are. */
  brandId?: string
  memberId?: string
  email?: string
  name?: string | null
}

export type Membership = { brandClerkId: string; memberId: string; role: string; status: string; clerkId: string | null; email: string; name: string | null }

export interface BrandLookup {
  /** The row's clerkId when `siteId` is a User row this login owns, else null. */
  ownRow(realClerkId: string, siteId: string): Promise<string | null>
  /** The TeamMember row for (brand = siteId, member = realClerkId), whatever its status, else null. */
  membership(realClerkId: string, siteId: string): Promise<Membership | null>
}

export async function resolveBrand(realClerkId: string, siteId: string | null | undefined, lookup: BrandLookup): Promise<Resolved> {
  const self: Resolved = { clerkId: realClerkId, role: "owner" }
  if (!realClerkId || !siteId || typeof siteId !== "string" || siteId.length > 64) return self
  const own = await lookup.ownRow(realClerkId, siteId)
  if (own) return { clerkId: own, role: "owner" }
  const m = await lookup.membership(realClerkId, siteId)
  // Every condition re-checked here, not only in the query: a lookup bug must not open a brand.
  if (!m || m.status !== "active" || m.clerkId !== realClerkId || !isMemberRole(m.role) || !m.brandClerkId) return self
  // A member row can never point back at the login's own brands (those are always "owner").
  if (m.brandClerkId === realClerkId || m.brandClerkId.startsWith(sitePrefix(realClerkId))) return self
  return { clerkId: m.brandClerkId, role: m.role as MemberRole, brandId: siteId, memberId: m.memberId, email: m.email, name: m.name }
}

/** The database lookup used in production. */
export async function dbLookup(): Promise<BrandLookup> {
  const { db } = await import("@/lib/db")
  return {
    async ownRow(realClerkId, siteId) {
      const row = await db.user.findFirst({ where: { id: siteId, OR: [{ clerkId: realClerkId }, { clerkId: { startsWith: sitePrefix(realClerkId) } }] }, select: { clerkId: true } })
      return row?.clerkId ?? null
    },
    async membership(realClerkId, siteId) {
      const m = await db.teamMember.findFirst({
        where: { brandId: siteId, clerkId: realClerkId, status: "active" },
        select: { id: true, role: true, status: true, clerkId: true, email: true, name: true, brand: { select: { clerkId: true } } },
      })
      return m ? { brandClerkId: m.brand.clerkId, memberId: m.id, role: m.role, status: m.status, clerkId: m.clerkId, email: m.email, name: m.name } : null
    },
  }
}
