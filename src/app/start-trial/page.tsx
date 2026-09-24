export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sparkles, Check } from "lucide-react"
import { db } from "@/lib/db"
import { STRIPE_PRICE_IDS } from "@/lib/stripe"
import { StartTrialButton } from "./StartTrialButton"

export const metadata = { title: "Start today — alphaa" }

// Users who finished onboarding but have no subscription land here (redirected
// from the dashboard layout). Month to month, first charge today, cancel any time.
export default async function StartTrialPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")
  if (!user.onboardingCompleted) redirect("/onboarding")
  if (["active", "trialing"].includes(user.subscriptionStatus) || user.stripeSubscriptionId) {
    redirect("/dashboard")
  }

  const reassurances = [
    "$99 a month. Month to month — no contract, cancel in two clicks from Billing.",
    "No technical skills needed. I do the work; you tap approve.",
    "I start today: your llms.txt, FAQ page and first Google post this week.",
  ]

  return (
    <div data-theme="light" data-brand="blue" className="radial-bg min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-bg-primary">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-brand-orange" />
        <span className="text-fg font-semibold text-xl">alphaa</span>
      </div>

      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-fg font-semibold text-[1.65rem]/[2.2rem] mb-2 text-center">
            Start today
          </h1>
          <p className="text-muted text-sm text-center mb-7">
            Setup is done{user.businessName ? ` for ${user.businessName}` : ""}. This puts your agent to work.
          </p>

          <ul className="space-y-3 mb-7">
            {reassurances.map((r) => (
              <li key={r} className="flex gap-2.5 items-start text-sm text-fg/70">
                <Check className="w-4 h-4 text-brand-orange mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>

          <StartTrialButton
            priceId={STRIPE_PRICE_IDS.starter.monthly}
            label="Start today — $99/month"
          />
          <p className="text-fg/30 text-xs text-center mt-4">
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
