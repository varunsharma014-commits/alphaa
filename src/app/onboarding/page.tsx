export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getAgentSettings } from "@/lib/agent/settings"
import { db } from "@/lib/db"
import { hasPaidPlan, FOUNDER_EMAILS } from "@/lib/billing"
import { completeOnboardingFromScan } from "@/lib/onboarding"
import { StartAgent } from "@/components/agent/StartAgent"

export const metadata = { title: "Getting started", robots: { index: false, follow: false } }

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
  if (hasPaidPlan(user)) {
    // Paid without finishing the agent setup (e.g. billed through Shopify, which never runs
    // completeOnboardingFromScan): mark it done, or the dashboard layout bounces back here forever.
    if (!user.onboardingCompleted) await db.user.update({ where: { id: user.id }, data: { onboardingCompleted: true } })
    redirect(paid ? "/dashboard?upgraded=true" : "/dashboard")
  }
  // Comped accounts (founder, app-store reviewers) skip payment once set up.
  const comped = FOUNDER_EMAILS.includes(user.email.toLowerCase())
  if (comped && user.onboardingCompleted) redirect("/dashboard")

  if (scan && !user.onboardingCompleted) {
    user = (await completeOnboardingFromScan(clerkId, scan)) ?? user
  }

  const mode = user.onboardingCompleted ? "resume" : "setup"
  // A store connected before setup (e.g. installed from the Webflow Marketplace, then signed up)
  // must be visible here, so the owner knows it carried over and never authorizes twice.
  const site = (await getAgentSettings(user.id)).site
  const PLATFORM: Record<string, string> = { webflow: "Webflow", shopify: "Shopify", wix: "Wix", wordpress: "WordPress" }
  return (
    <div data-agent="" data-theme="light" data-brand="blue" style={{ minHeight: "100dvh" }}>
      {site?.platform && site.siteUrl ? (
        <div role="status" style={{ maxWidth: 640, margin: "16px auto 0", padding: "10px 14px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, fontSize: 14, background: "#fff", color: "#111" }}>
          ✓ Your {PLATFORM[site.platform] ?? site.platform} site <strong>{site.label || site.siteUrl}</strong> is connected. Alphaa publishes there once you approve a change.
        </div>
      ) : null}
      <StartAgent mode={mode} resumeName={user.businessName ?? undefined} />
    </div>
  )
}
