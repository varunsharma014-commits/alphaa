import { auth as clerkAuth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { cache } from "react"
import { SITE_COOKIE, activeClerkId } from "@/lib/sites"
import { asClerk } from "@/lib/usage"

/** Clerk's own session: `userId` is always the real Clerk user id. */
export const realAuth = clerkAuth

const resolve = cache(async (clerkId: string, siteId: string | undefined) => activeClerkId(clerkId, siteId))

/**
 * Clerk's `auth()`, with `userId` pointing at the website the owner is working on (see
 * lib/sites.ts). Every `db.user.findUnique({ where: { clerkId } })` therefore loads the
 * active website's row. Use `realAuth()` where the real Clerk id is needed.
 */
export async function auth(): Promise<Awaited<ReturnType<typeof clerkAuth>>> {
  const a = await clerkAuth()
  if (!a.userId) return a
  const res = await siteAuth(a)
  if (res.userId) asClerk(res.userId) // AI usage in this request counts for this brand (lib/usage.ts)
  return res
}

async function siteAuth(a: Awaited<ReturnType<typeof clerkAuth>>): Promise<Awaited<ReturnType<typeof clerkAuth>>> {
  let siteId: string | undefined
  try {
    siteId = (await cookies()).get(SITE_COOKIE)?.value || undefined
  } catch {
    siteId = undefined
  }
  if (!siteId || !a.userId) return a
  const userId = await resolve(a.userId, siteId)
  return userId === a.userId ? a : ({ ...a, userId } as typeof a)
}
