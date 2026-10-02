export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPaidPlan } from "@/lib/billing"
import { completeOnboardingFromScan } from "@/lib/onboarding"
import { StartAgent } from "@/components/agent/StartAgent"

export const metadata = { title: "Getting started — Alphaa", robots: { index: false, follow: false } }

// Setup is the agent conversation from /start, not a form wizard: the agent
// asks for the website, scans it, fills the profile from what it found and
// opens checkout. Arriving with ?scan= (signed up from /start) the business is
// already known, so it skips straight to the last step.
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ scan?: string; paid?: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")

  // No row yet (Clerk webhook still in flight): the dashboard layout creates
  // it and sends the user back here.
  let user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/dashboard")
  const { scan, paid } = await searchParams

  // Back from Stripe: the webhook usually lands first, but give it a few
  // seconds so a fresh customer isn't shown the "Start today" step again.
  if (paid && !hasPaidPlan(user)) {
    for (let i = 0; i < 8 && user && !hasPaidPlan(user); i++) {
      await new Promise((r) => setTimeout(r, 1000))
      user = await db.user.findUnique({ where: { clerkId } })
    }
    if (!user) redirect("/dashboard")
  }
  if (hasPaidPlan(user)) redirect(paid ? "/dashboard?upgraded=true" : "/dashboard")

  if (scan && !user.onboardingCompleted) {
    user = (await completeOnboardingFromScan(clerkId, scan)) ?? user
  }

  const mode = user.onboardingCompleted ? "resume" : "setup"
  return (
    <div data-agent="" data-theme="light" data-brand="blue" style={{ minHeight: "100dvh" }}>
      <StartAgent mode={mode} resumeName={user.businessName ?? undefined} />
    </div>
  )
}
