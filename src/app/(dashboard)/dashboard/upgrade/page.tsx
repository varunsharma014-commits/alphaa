export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPaidPlan, isComped } from "@/lib/billing"
import { shopifyMerchantShop } from "@/lib/connector/shopify-billing"
import { GROWTH_EARLY_ACCESS_HREF, GROWTH_FEATURES, GROWTH_ON_SALE } from "@/lib/growth"
import { UpgradeButton } from "./UpgradeButton"

// Moving an existing customer up to Growth. The checkout route switches the price on their
// current Stripe subscription (prorated), so they never end up with two subscriptions.
export default async function UpgradePage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/dashboard")
  if (!hasPaidPlan(user) && !isComped(user.email)) redirect("/onboarding?plan=growth")

  const shop = await shopifyMerchantShop(user)
  const already = /growth/i.test(user.plan)
  const h = { fontSize: "22px", fontWeight: 500, color: "var(--ds-text)", marginBottom: "6px" } as const
  const p = { fontSize: "14px", color: "var(--ds-text-mute)", lineHeight: 1.7 } as const

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <h1 style={h}>{already ? "You’re on Growth." : "Growth: $499 a month"}</h1>
      <p style={p}>Everything you have now, plus I handle your social posts and your Google and Meta ads. Nothing posts and no ad spends until you approve it.</p>
      <ul style={{ ...p, margin: "16px 0 20px", paddingLeft: "18px", color: "var(--ds-text)" }}>
        {GROWTH_FEATURES.map((f) => <li key={f}>{f}</li>)}
      </ul>
      {already ? null : shop ? (
        <p style={p}>Growth isn’t available for Shopify stores yet. Email <a href="mailto:hi@alphaa.app" style={{ color: "var(--ds-accent)" }}>hi@alphaa.app</a> and we’ll let you know when it is.</p>
      ) : GROWTH_ON_SALE ? (
        <>
          <UpgradeButton />
          <p style={{ ...p, fontSize: "12px", marginTop: "10px" }}>Your plan switches today. You pay only the difference for the rest of this month, then $499 a month. Cancel online any time.</p>
        </>
      ) : (
        <>
          <a href={GROWTH_EARLY_ACCESS_HREF} style={{ display: "inline-block", padding: "10px 18px", borderRadius: 999, background: "#000", color: "#fff", fontSize: 14, textDecoration: "none" }}>Get early access</a>
          <p style={{ ...p, fontSize: "12px", marginTop: "10px" }}>Growth opens as Google and Meta approve our access. Nothing is charged until then.</p>
        </>
      )}
    </div>
  )
}
