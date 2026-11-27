// Shopify Managed Pricing: merchants who install from the Shopify App Store pay for Alphaa's
// plans (Starter / Pro / Growth) through Shopify, not Stripe. The plan lives in the Partner Dashboard and Shopify
// hosts the plan-selection page; we only read the result (currentAppInstallation.activeSubscriptions)
// and the app_subscriptions/update webhook.
//
// Paid state is stored without a schema change: User.stripeSubscriptionId = "shopify:<shop>",
// subscriptionStatus "active", plan starter|pro|growth from the Shopify plan's name or price
// (shopifyPlanFor; see lib/billing.ts for why the marker can't clash with Stripe).
//
// Test charges (`test: true`) count as paid: Shopify only issues them on development stores.
import { db } from "@/lib/db"
import { PLAN_PRICES } from "@/lib/constants"
import { getAgentSettings, type AgentSettings } from "@/lib/agent/settings"
import { hasStripePlan, shopifyBilledShop, shopifySubMarker } from "@/lib/billing"
import { isShopDomain, shopifyActiveSubscriptionsFor, type ShopifyAppSubscription } from "@/lib/connector/shopify"

/** The app's handle in the Shopify admin URL (Partner Dashboard → app → handle). */
export const shopifyAppHandle = () => process.env.SHOPIFY_APP_HANDLE?.trim() || "alphaa"

/** Shopify-hosted plan picker for this shop (Managed Pricing). Also where merchants change/cancel. */
export function shopifyPricingUrl(shop: string): string {
  const store = shop.replace(/\.myshopify\.com$/, "")
  return `https://admin.shopify.com/store/${encodeURIComponent(store)}/charges/${encodeURIComponent(shopifyAppHandle())}/pricing_plans`
}

/**
 * The Shopify store an account belongs to: billed through it, connected to it, or set up from it
 * (website is a *.myshopify.com address, which survives an uninstall). Null for everyone else.
 * App Store rule 1.2.1: these accounts must never be offered Stripe — every charge goes through Shopify.
 */
export async function shopifyMerchantShop(user: { id: string; stripeSubscriptionId: string | null; websiteUrl: string | null }): Promise<string | null> {
  const billed = shopifyBilledShop(user)
  if (billed) return billed
  const site = (await getAgentSettings(user.id)).site
  if (site?.platform === "shopify" && isShopDomain(site.config?.shop)) return site.config.shop
  const host = user.websiteUrl?.replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").toLowerCase()
  return isShopDomain(host) ? host : null
}

/**
 * Does this subscription pay for Alphaa? ACTIVE is enough. With Managed Pricing, Shopify only
 * makes test charges on development stores (which can't take real orders), so a test charge is
 * a store that can't be a real customer: App Store reviewers and partners. Refusing them sent a
 * fresh reviewer signup round the plan page forever.
 */
export function subscriptionCountsAsPaid(sub: ShopifyAppSubscription, _email?: string): boolean {
  return sub.status === "ACTIVE"
}

export type ShopifyPlan = "starter" | "pro" | "growth"

/**
 * Which Alphaa plan a Shopify subscription pays for. The plan name (set in the Partner Dashboard)
 * wins: "growth" before "pro" ("Alphaa Growth", "Pro", "Pro (yearly)"). Otherwise the recurring
 * price is matched to PLAN_PRICES (EVERY_30_DAYS vs monthly; ANNUAL vs the yearly total or per-month rate). Default starter, so
 * an unrecognised plan never grants more than the cheapest one.
 */
export function shopifyPlanFor(sub: Pick<ShopifyAppSubscription, "name" | "lineItems">): ShopifyPlan {
  const name = (sub.name ?? "").toLowerCase()
  if (/\bgrowth\b/.test(name)) return "growth"
  if (/\bpro\b/.test(name)) return "pro"
  if (/\bstarter\b/.test(name)) return "starter"
  for (const li of sub.lineItems ?? []) {
    const d = li.plan?.pricingDetails
    const amount = Number(d?.price?.amount)
    if (!d?.price || !Number.isFinite(amount) || amount <= 0) continue
    const annual = d.interval === "ANNUAL"
    const order: ShopifyPlan[] = ["growth", "pro", "starter"]
    for (const plan of order) {
      const p = PLAN_PRICES[plan]
      // Exact interval only: one plan's monthly price can equal another's yearly per-month rate.
      const candidates = annual ? [p.annualTotal, p.annual * 12, p.annual] : [p.monthly]
      if (candidates.some((c) => Math.abs(c - amount) < 0.5)) return plan
    }
  }
  return "starter"
}

type BillingUser = { id: string; email: string; stripeSubscriptionId: string | null; subscriptionStatus: string; plan?: string | null }

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
    // Several active subs can overlap during a plan change: the highest plan wins.
    const rank: Record<ShopifyPlan, number> = { starter: 0, pro: 1, growth: 2 }
    const active = subs.filter((s) => subscriptionCountsAsPaid(s, user.email))
    const best = active.map((s) => ({ s, plan: shopifyPlanFor(s) })).sort((a, b) => rank[b.plan] - rank[a.plan])[0]
    const plan = best?.plan ?? "starter"
    // `plan` undefined = caller didn't load it; keep the old "already marked" short-circuit then.
    if (markedHere && user.subscriptionStatus === "active" && (user.plan === undefined || user.plan === plan)) return true
    const name = best?.s.name ?? "Shopify plan"
    await db.user.update({
      where: { id: user.id },
      data: { stripeSubscriptionId: shopifySubMarker(shop), subscriptionStatus: "active", plan, trialEndsAt: null },
    })
    await db.mockActivity.create({
      data: { userId: user.id, type: "shopify_billing", title: `Plan active through Shopify (${shop})`, metadata: { shop, status: "ACTIVE", plan: name, alphaaPlan: plan } },
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
      select: { id: true, email: true, stripeSubscriptionId: true, subscriptionStatus: true, plan: true },
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
