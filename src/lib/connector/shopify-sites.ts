import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { shopifySubMarker } from "@/lib/billing"
import { MAX_SITES, newSiteIdentity, sitePrefix } from "@/lib/sites"

// Which of the owner's websites a Shopify store belongs to (one login, many websites, lib/sites.ts).
// An install or "Open app" from the Shopify admin must land on the store's own website — never
// overwrite a different business the owner already runs in Alphaa (App Store review, 2026-11-04:
// the reviewer's store was shown under another business's name).

const host = (url: string | null | undefined) =>
  (url ?? "").replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/^www\./, "").toLowerCase() || null

type Row = { id: string; clerkId: string; email: string; fullName: string | null; websiteUrl: string | null; stripeSubscriptionId: string | null; onboardingCompleted: boolean }

/**
 * The row id to connect `shop` to, and whether it's a new website.
 * 1. A website already billed through, set up for, or connected to this store (and not since
 *    pointed at another business) → that one.
 * 2. The open website if it's still blank (fresh signup straight from the Shopify install).
 * 3. Otherwise a new website for this store, under the same login and on its own plan.
 */
export async function siteForShop(ownerClerk: string, active: Row, shop: string): Promise<{ id: string; created: boolean }> {
  const rows: Row[] = await db.user.findMany({
    where: { OR: [{ clerkId: ownerClerk }, { clerkId: { startsWith: sitePrefix(ownerClerk) } }] },
    select: { id: true, clerkId: true, email: true, fullName: true, websiteUrl: true, stripeSubscriptionId: true, onboardingCompleted: true },
    orderBy: { createdAt: "asc" },
  })
  // The open website first, so a store connected twice resolves to the one in use.
  rows.sort((a, b) => Number(b.id === active.id) - Number(a.id === active.id))

  const settings = new Map<string, Awaited<ReturnType<typeof getAgentSettings>>>()
  for (const r of rows) {
    const web = host(r.websiteUrl)
    if (r.stripeSubscriptionId === shopifySubMarker(shop) || web === shop) return { id: r.id, created: false }
    const s = await getAgentSettings(r.id)
    settings.set(r.id, s)
    const site = s.site
    if (site?.platform === "shopify" && site.config?.shop === shop && (!web || web === host(site.siteUrl))) return { id: r.id, created: false }
  }

  const activeSite = settings.get(active.id)?.site
  if (!host(active.websiteUrl) && !activeSite && !active.onboardingCompleted) return { id: active.id, created: false }

  if (rows.length >= MAX_SITES) return { id: active.id, created: false } // at the cap: previous behaviour

  const id = newSiteIdentity({ clerkId: ownerClerk, email: active.email })
  const site = await db.user.create({
    data: { clerkId: id.clerkId, email: id.email, fullName: active.fullName, websiteUrl: shop, subscriptionStatus: "none" },
    select: { id: true },
  })
  return { id: site.id, created: true }
}
