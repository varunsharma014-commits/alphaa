export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPaidPlan, isComped } from "@/lib/billing"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { GROWTH_CTA, GROWTH_EARLY_ACCESS_HREF, GROWTH_ON_SALE } from "@/lib/growth"
import { GROWTH_FEATURES, PRO_FEATURES } from "@/lib/plan-features"
import { PLAN_PRICES, EXTRA_AD_ACCOUNT_PRICE } from "@/lib/constants"
import { UpgradeButton } from "./UpgradeButton"

// Moving an existing customer up a plan (plans set 2026-11-26): Starter (AI search only) → Pro
// (everything except ads: social, Google listing posts, review replies, email, lead tracking,
// 3 locations, auto-approve) or → Growth (Pro + Google and Meta ads; early access, no charge). The checkout route
// switches the price on their current Stripe subscription (prorated), so they never end up
// with two subscriptions. `?plan=pro|growth`; without it, the next plan up.
export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/dashboard")
  const asked = (await searchParams).plan
  const onGrowth = /growth/i.test(user.plan)
  const onPro = /pro|full/i.test(user.plan) || onGrowth
  const target: "pro" | "growth" = asked === "growth" || asked === "pro" ? asked : onPro ? "growth" : "pro"
  if (!hasPaidPlan(user) && !isComped(user.email)) redirect(`/onboarding?plan=${target}`)

  const shop = await shopifyMerchantShop(user)
  const already = target === "growth" ? onGrowth : onPro
  const price = PLAN_PRICES[target].monthly
  const h = { fontSize: "22px", fontWeight: 500, color: "var(--ds-text)", marginBottom: "6px" } as const
  const p = { fontSize: "14px", color: "var(--ds-text-mute)", lineHeight: 1.7 } as const
  const btn = { display: "inline-block", padding: "10px 18px", borderRadius: 999, background: "#000", color: "#fff", fontSize: 14, textDecoration: "none" } as const
  const fine = "Your plan switches today. You pay only the difference for the rest of this billing period, then the new price. Cancel online any time."

  if (target === "pro") {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <h1 style={h}>{already ? "You’re on Pro." : "All your marketing, handled. Except ads."}</h1>
        <p style={p}>Everything you have now, plus I write your social posts with images in your brand, keep your Google listing fresh, reply to your reviews, email your past customers and show you which calls and forms your marketing brought in. Up to 3 locations, and posts that can publish on their own. You decide what goes live. {already ? "" : `$${price} a month, or $${PLAN_PRICES.pro.annual} a month billed yearly.`}</p>
        <ul style={{ ...p, margin: "16px 0 20px", paddingLeft: "18px", color: "var(--ds-text)" }}>
          {PRO_FEATURES.map((f) => <li key={f}>{f}</li>)}
        </ul>
        {already ? (
          <a href="/dashboard/upgrade?plan=growth" style={{ color: "var(--ds-accent)", fontSize: 14 }}>See the Growth plan (early access) →</a>
        ) : shop ? (
          <a href={shopifyPricingUrl(shop)} style={btn}>Change my plan in Shopify</a>
        ) : (
          <>
            <UpgradeButton plan="pro" value={price} />
            <p style={{ ...p, fontSize: "12px", marginTop: "10px" }}>{fine}</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <h1 style={h}>{already ? "You’re on Growth." : "Your ads, handled too."}</h1>
      <p style={p}>Everything in Pro, plus I build and tune your Google and Meta ads for 1 ad account when ads open, so more people looking for what you sell find you. Nothing spends until you approve it. {already ? "" : `$${price} a month, plus $${EXTRA_AD_ACCOUNT_PRICE.monthly} a month for each extra ad account.`}</p>
      <ul style={{ ...p, margin: "16px 0 20px", paddingLeft: "18px", color: "var(--ds-text)" }}>
        {GROWTH_FEATURES.map((f) => <li key={f}>{f}</li>)}
      </ul>
      {already ? null : shop ? (
        <p style={p}>Growth isn’t available for Shopify stores yet. Email <a href="mailto:hi@alphaa.app" style={{ color: "var(--ds-accent)" }}>hi@alphaa.app</a> and we’ll let you know when it is.</p>
      ) : GROWTH_ON_SALE ? (
        <>
          <UpgradeButton plan="growth" value={price} addon={{ monthly: EXTRA_AD_ACCOUNT_PRICE.monthly }} />
          <p style={{ ...p, fontSize: "12px", marginTop: "10px" }}>{fine}</p>
        </>
      ) : (
        <>
          <a href={GROWTH_EARLY_ACCESS_HREF} style={btn}>{GROWTH_CTA}</a>
          <p style={{ ...p, fontSize: "12px", marginTop: "10px" }}>Growth opens as Google and Meta approve our access. Nothing is charged until then.</p>
        </>
      )}
    </div>
  )
}
