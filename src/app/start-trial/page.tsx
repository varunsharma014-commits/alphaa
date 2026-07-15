export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sparkles, Check } from "lucide-react"
import { db } from "@/lib/db"
import { STRIPE_PRICE_IDS } from "@/lib/stripe"
import { StartTrialButton } from "./StartTrialButton"

export const metadata = { title: "Start your free trial — alphaa" }

// Card-upfront trial: users who finished onboarding but never started a
// Stripe trial land here (redirected from the dashboard layout). $0 today,
// first charge after day 14, cancel anytime.
export default async function StartTrialPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")
  if (!user.onboardingCompleted) redirect("/onboarding")
  if (["active", "trialing"].includes(user.subscriptionStatus) || user.stripeSubscriptionId) {
    redirect("/dashboard")
  }

  const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })

  const reassurances = [
    "$0 today — your card isn't charged until " + trialEnds,
    "Cancel anytime in two clicks from Billing. We email you before day 15.",
    "alphaa starts working immediately — first Google post within 24 hours",
  ]

  return (
    <div data-theme="dark" className="radial-bg min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-bg-primary">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-brand-orange" />
        <span className="text-white font-semibold text-xl">alphaa</span>
      </div>

      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-white font-semibold text-2xl mb-2 text-center">
            Start your 14-day free trial
          </h1>
          <p className="text-white/50 text-sm text-center mb-7">
            Your setup is done{user.businessName ? ` for ${user.businessName}` : ""} — this switches the
            autopilot on.
          </p>

          <ul className="space-y-3 mb-7">
            {reassurances.map((r) => (
              <li key={r} className="flex gap-2.5 items-start text-sm text-white/70">
                <Check className="w-4 h-4 text-brand-orange mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>

          <StartTrialButton
            priceId={STRIPE_PRICE_IDS.starter.monthly}
            label="Start free trial — $99/mo after day 14"
          />
          <p className="text-white/30 text-xs text-center mt-4">
            Need the Pro plan ($199/mo) or have a question? Email{" "}
            <a href="mailto:hi@alphaa.app" className="text-brand-orange hover:underline">
              hi@alphaa.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
