import { randomBytes } from "crypto"
import { db } from "@/lib/db"

/**
 * One login, many websites (Varun, 2026-11-12). Each website is its own User row, so every
 * existing per-user table, cron, plan and Stripe subscription works per website unchanged.
 *
 * - The owner's first website is their normal row (clerkId = the real Clerk user id).
 * - Each extra website is a row with clerkId `site:<ownerClerkId>:<tag>` and the owner's
 *   email tagged `name+as-<tag>@domain` (User.email is unique). `realEmail()` strips the tag
 *   wherever mail is sent or the owner is identified; the tag never reaches an inbox.
 * - The website being worked on lives in the `alphaa_site` cookie (a row id). `auth()` in
 *   `@/lib/auth` swaps in that row's clerkId, so `where: { clerkId }` lookups everywhere
 *   resolve to the active website. Only the owner's own rows are ever accepted.
 * - No schema change: owner = the clerkId prefix.
 */

export const SITE_COOKIE = "alphaa_site"
const PREFIX = "site:"
export const MAX_SITES = 25

export const isSiteClerkId = (clerkId: string) => clerkId.startsWith(PREFIX)
export const sitePrefix = (ownerClerkId: string) => `${PREFIX}${ownerClerkId}:`

/** The real Clerk user id behind a row (itself for the owner's first website). */
export function ownerClerkId(clerkId: string): string {
  if (!isSiteClerkId(clerkId)) return clerkId
  return clerkId.slice(PREFIX.length, clerkId.lastIndexOf(":"))
}

const TAG = /\+as-[a-z0-9]{6,16}@/i

/** The deliverable address: strips an extra website's `+as-<tag>` (any other + part stays). */
export function realEmail(email: string): string {
  return email.replace(TAG, "@")
}

export function newSiteIdentity(owner: { clerkId: string; email: string }) {
  const tag = randomBytes(6).toString("hex").slice(0, 10)
  const base = realEmail(owner.email)
  const at = base.lastIndexOf("@")
  return {
    clerkId: `${sitePrefix(owner.clerkId)}${tag}`,
    email: at > 0 ? `${base.slice(0, at)}+as-${tag}${base.slice(at)}` : `${base}+as-${tag}@sites.alphaa.app`,
  }
}

/** Plain "example.com" from whatever the owner typed. */
export function cleanSiteUrl(raw: string): string | null {
  const t = raw.trim().toLowerCase()
  if (!t) return null
  try {
    const u = new URL(/^https?:\/\//.test(t) ? t : `https://${t}`)
    if (!u.hostname.includes(".")) return null
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname.replace(/\/$/, "") : "")
  } catch {
    return null
  }
}

export type SiteSummary = { id: string; name: string; url: string | null; paid: boolean; ready: boolean; email: string }

/** All of an owner's websites, the first one first. */
export async function listSites(ownerClerk: string): Promise<SiteSummary[]> {
  const rows = await db.user.findMany({
    where: { OR: [{ clerkId: ownerClerk }, { clerkId: { startsWith: sitePrefix(ownerClerk) } }] },
    select: { id: true, clerkId: true, email: true, businessName: true, websiteUrl: true, stripeSubscriptionId: true, subscriptionStatus: true, onboardingCompleted: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  rows.sort((a, b) => Number(isSiteClerkId(a.clerkId)) - Number(isSiteClerkId(b.clerkId)))
  return rows.map((r) => ({
    id: r.id,
    name: r.businessName?.trim() || r.websiteUrl || "New website",
    url: r.websiteUrl,
    paid: !!r.stripeSubscriptionId && ["active", "trialing"].includes(r.subscriptionStatus),
    ready: r.onboardingCompleted,
    email: r.email,
  }))
}

/** The clerkId of the website the owner is working on (the cookie's row if it's theirs). */
export async function activeClerkId(ownerClerk: string, siteId: string | undefined): Promise<string> {
  if (!siteId) return ownerClerk
  const row = await db.user.findFirst({ where: { id: siteId, clerkId: { startsWith: sitePrefix(ownerClerk) } }, select: { clerkId: true } })
  return row?.clerkId ?? ownerClerk
}
