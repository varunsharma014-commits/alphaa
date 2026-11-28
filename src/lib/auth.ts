import { auth as clerkAuth } from "@clerk/nextjs/server"
import { cookies, headers } from "next/headers"
import { cache } from "react"
import { SITE_COOKIE } from "@/lib/sites"
import { usageCtx } from "@/lib/usage"
import { dbLookup, resolveBrand, type Resolved } from "@/lib/team/resolve"
import { memberRequestAllowed } from "@/lib/team/routes"

/** Clerk's own session: `userId` is always the real Clerk user id. */
export const realAuth = clerkAuth

/** Set by middleware.ts on every request ("METHOD /path"); auth() gates team members with it. */
export const ROUTE_HEADER = "x-alphaa-route"

const resolve = cache(async (clerkId: string, siteId: string | undefined): Promise<Resolved> => resolveBrand(clerkId, siteId, await dbLookup()))

async function siteCookie(): Promise<string | undefined> {
  try {
    return (await cookies()).get(SITE_COOKIE)?.value || undefined
  } catch {
    return undefined
  }
}

/** The open brand and the signed-in person's role on it (lib/team/resolve.ts), or null signed out. */
export async function resolveActive(): Promise<(Resolved & { realClerkId: string }) | null> {
  const a = await clerkAuth()
  if (!a.userId) return null
  return { ...(await resolve(a.userId, await siteCookie())), realClerkId: a.userId }
}

/**
 * Clerk's `auth()`, with `userId` pointing at the brand being worked on: one of the login's own
 * websites (lib/sites.ts) or a brand it is an active team member of (lib/team). Every
 * `db.user.findUnique({ where: { clerkId } })` therefore loads the open brand's row. Use
 * `realAuth()` where the real Clerk id is needed.
 *
 * Team members also pass the central gate (lib/team/routes.ts): a request their role can't make
 * (e.g. a creator POSTing to /api/stripe/checkout, or any mutating route nobody classified yet)
 * gets `userId: null`, so the route answers 401 and nothing runs. Owners are never gated.
 */
export async function auth(): Promise<Awaited<ReturnType<typeof clerkAuth>>> {
  const usage = usageCtx() // before any await, so the caller sees it (lib/usage.ts)
  const a = await clerkAuth()
  if (!a.userId) return a
  const r = await resolve(a.userId, await siteCookie())
  usage.actor = { clerkId: a.userId, role: r.role, ...(r.email ? { email: r.email, name: r.name ?? null, memberId: r.memberId } : {}) }
  if (r.role !== "owner") {
    let route: string | null = null
    try {
      route = (await headers()).get(ROUTE_HEADER)
    } catch {
      route = null
    }
    const [method, path] = (route ?? "").split(" ")
    if (!memberRequestAllowed(r.role, method, path).ok) {
      console.warn(`[team] refused ${route ?? "(no route)"} for ${r.role} ${r.memberId} on ${r.brandId}`)
      return { ...a, userId: null, isAuthenticated: false } as unknown as typeof a
    }
  }
  if (!usage.userId) usage.clerkId = r.clerkId // AI usage in this request counts for this brand
  return r.clerkId === a.userId ? a : ({ ...a, userId: r.clerkId } as typeof a)
}
