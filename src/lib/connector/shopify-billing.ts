// Shopify Managed Pricing: merchants who install from the Shopify App Store pay Alphaa's
// $99/mo plan through Shopify, not Stripe. The plan lives in the Partner Dashboard and Shopify
// hosts the plan-selection page; we only read the result (currentAppInstallation.activeSubscriptions)
// and the app_subscriptions/update webhook.
//
// Paid state is stored without a schema change: User.stripeSubscriptionId = "shopify:<shop>",
// subscriptionStatus "active", plan "starter" (see lib/billing.ts for why that can't clash with Stripe).
//
// Test charges (`test: true`, e.g. development stores) count as paid only outside production,
// or for FOUNDER_EMAILS (owner + COMP_ACCESS_EMAILS app-review logins). Everyone else needs a real charge.
import { db } from "@/lib/db"
import type { AgentSettings } from "@/lib/agent/settings"
import { FOUNDER_EMAILS, hasStripePlan, shopifyBilledShop, shopifySubMarker } from "@/lib/billing"
import { shopifyActiveSubscriptionsFor, type ShopifyAppSubscription } from "@/lib/connector/shopify"

/** The app's handle in the Shopify admin URL (Partner Dashboard → app → handle). */
export const shopifyAppHandle = () => process.env.SHOPIFY_APP_HANDLE?.trim() || "alphaa"

/** Shopify-hosted plan picker for this shop (Managed Pricing). Also where merchants change/cancel. */
export function shopifyPricingUrl(shop: string): string {
  const store = shop.replace(/\.myshopify\.com$/, "")
  return `https://admin.shopify.com/store/${encodeURIComponent(store)}/charges/${encodeURIComponent(shopifyAppHandle())}/pricing_plans`
}

const isComped = (email: string) => FOUNDER_EMAILS.includes(email.toLowerCase())

/** Does this subscription pay for Alphaa? ACTIVE, and a real charge unless test charges are allowed here. */
export function subscriptionCountsAsPaid(sub: ShopifyAppSubscription, email: string): boolean {
  if (sub.status !== "ACTIVE") return false
  return !sub.test || process.env.NODE_ENV !== "production" || isComped(email)
}

type BillingUser = { id: string; email: string; stripeSubscriptionId: string | null; subscriptionStatus: string }

/**
 * Apply what Shopify says about this shop's subscriptions to one user.
 * Returns true when the user is now paid through Shopify.
 * A live Stripe subscription is never overwritten (the merchant is already paying us there).
 */
export async function applyShopifySubscriptions(user: BillingUser, shop: string, subs: ShopifyAppSubscription[]): Promise<boolean> {
  const paid = subs.some((s) => subscriptionCountsAsPaid(s, user.email))
  const markedHere = shopifyBilledShop(user) === shop
  if (paid) {
    if (hasStripePlan(user)) return false
    if (markedHere && user.subscriptionStatus === "active") return true
    const name = subs.find((s) => subscriptionCountsAsPaid(s, user.email))?.name ?? "Shopify plan"
    await db.user.update({
      where: { id: user.id },
      data: { stripeSubscriptionId: shopifySubMarker(shop), subscriptionStatus: "active", plan: "starter", trialEndsAt: null },
    })
    await db.mockActivity.create({
      data: { userId: user.id, type: "shopify_billing", title: `Plan active through Shopify (${shop})`, metadata: { shop, status: "ACTIVE", plan: name } },
    })
    return true
  }
  if (markedHere) await clearShopifyPaidUser(user.id, shop, "Shopify reports no active Alphaa plan")
  return false
}

async function clearShopifyPaidUser(userId: string, shop: string, reason: string) {
  // Conditional on the marker so a Stripe checkout that landed meanwhile is left alone.
  const { count } = await db.user.updateMany({
    where: { id: userId, stripeSubscriptionId: shopifySubMarker(shop) },
    data: { stripeSubscriptionId: null, subscriptionStatus: "cancelled", plan: "none" },
  })
  if (count) {
    await db.mockActivity.create({
      data: { userId, type: "shopify_billing", title: `Shopify plan ended for ${shop} (${reason})`, metadata: { shop, status: "CANCELLED", reason } },
    })
  }
}

/** Uninstall / redact / cancelled: everyone billed through this shop loses Shopify-paid state. */
export async function clearShopifyPaid(shop: string, reason: string): Promise<number> {
  const users = await db.user.findMany({ where: { stripeSubscriptionId: shopifySubMarker(shop) }, select: { id: true } })
  for (const u of users) await clearShopifyPaidUser(u.id, shop, reason)
  return users.length
}

const ENDED = ["CANCELLED", "EXPIRED", "DECLINED", "FROZEN"]

/**
 * app_subscriptions/update: re-read the shop's subscriptions with each connected user's token
 * (the payload has no `test` flag, and on a plan change the old sub's CANCELLED can arrive after the
 * new one's ACTIVE). Without a usable token we fall back to the payload status: an ended status
 * clears; ACTIVE can't be confirmed, so it throws for Shopify to retry.
 */
export async function reconcileShopifyBilling(shop: string, payloadStatus: string): Promise<void> {
  const rows = await db.mockActivity.findMany({
    where: { type: "agent_settings", metadata: { path: ["site", "config", "shop"], equals: shop } },
  })
  const seen = new Set<string>()
  let unconfirmedActive = false
  for (const row of rows) {
    const site = ((row.metadata ?? {}) as AgentSettings).site
    if (site?.platform !== "shopify" || seen.has(row.userId)) continue
    seen.add(row.userId)
    const user = await db.user.findUnique({
      where: { id: row.userId },
      select: { id: true, email: true, stripeSubscriptionId: true, subscriptionStatus: true },
    })
    if (!user) continue
    try {
      await applyShopifySubscriptions(user, shop, await shopifyActiveSubscriptionsFor(site))
    } catch (e) {
      console.error("[shopify billing] could not read subscriptions for", shop, e instanceof Error ? e.message : e)
      if (ENDED.includes(payloadStatus)) await clearShopifyPaidUser(user.id, shop, `Shopify status ${payloadStatus}`)
      else if (payloadStatus === "ACTIVE") unconfirmedActive = true
    }
  }
  // Billed through this shop but no longer connected to it (e.g. switched site): trust the payload.
  if (ENDED.includes(payloadStatus)) {
    const marked = await db.user.findMany({ where: { stripeSubscriptionId: shopifySubMarker(shop) }, select: { id: true } })
    for (const u of marked) if (!seen.has(u.id)) await clearShopifyPaidUser(u.id, shop, `Shopify status ${payloadStatus}`)
  }
  if (unconfirmedActive) throw new Error(`couldn't confirm the ACTIVE subscription for ${shop}`)
}
