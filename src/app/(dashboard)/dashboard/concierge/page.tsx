export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { shopifyMerchantShop } from "@/lib/connector/shopify-billing"
import { ConciergeClient } from "./ConciergeClient"

// The paid human services are sold through Stripe, which Shopify merchants must never see
// (App Store rule 1.2.1: every charge goes through Shopify). They get plain, unpriced help instead.
export default async function ConciergePage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/dashboard")
  if (!(await shopifyMerchantShop(user))) return <ConciergeClient />

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--ds-text)", marginBottom: "6px" }}>Need a hand?</h1>
      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.7 }}>
        Alphaa publishes to your Shopify store for you once you approve a change. If anything gets stuck, email{" "}
        <a href="mailto:hi@alphaa.app" style={{ color: "var(--ds-accent)" }}>hi@alphaa.app</a> and a real person will reply.
        It&apos;s part of your plan.
      </p>
    </div>
  )
}
