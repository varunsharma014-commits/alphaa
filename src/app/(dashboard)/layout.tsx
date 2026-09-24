export const dynamic = "force-dynamic"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AgentShell } from "@/components/agent/AgentShell"
import { getFeed } from "@/lib/agent/feed"
import { ConversionTracker } from "@/components/common/ConversionTracker"
import { THEME_COOKIE, type DashboardTheme } from "@/lib/theme"
import { ClerkProvider } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  let user = await db.user.findUnique({ where: { clerkId: userId } })

  // Auto-create DB record if the Clerk webhook was missed (e.g. first deploy, misconfigured endpoint)
  if (!user) {
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
      user = await db.user.create({ data: { clerkId: userId, email, fullName } })
    } catch {
      redirect("/login")
    }
  }

  if (!user.onboardingCompleted) redirect("/onboarding")

  // Card-upfront trial gate: onboarded users who never started a Stripe trial
  // go to /start-trial (outside this layout — no redirect loop). The webhook
  // sets stripeSubscriptionId + "trialing" seconds after checkout completes.
  // Founder account bypasses so the owner can always dogfood.
  const FOUNDER_EMAILS = ["varunsharma014@gmail.com"]
  if (
    !["active", "trialing"].includes(user.subscriptionStatus) &&
    !user.stripeSubscriptionId &&
    !FOUNDER_EMAILS.includes(user.email)
  ) {
    redirect("/start-trial")
  }

  // App theme is a cookie so the server paints the right one immediately (no
  // flash) and it stays scoped to the dashboard. Light is now the default;
  // the cookie only matters once a user explicitly picks dark.
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value
  const theme: DashboardTheme = themeCookie === "dark" ? "dark" : "light"

  // Rail data (verdict count, waiting items) comes from the same feed build
  // the /dashboard page uses — React's cache() makes that one query set.
  const feed = await getFeed(user.id)
  const rail = feed?.rail ?? {
    businessName: user.businessName ?? "your business",
    location: [user.city, user.state].filter(Boolean).join(", "),
    dayNumber: 1,
    named: 0,
    checked: 0,
    states: ["unknown", "unknown", "unknown", "unknown"],
    waiting: { reviews: 0, posts: 0 },
    googleConnected: false,
  }
  const trialDaysLeft =
    user.subscriptionStatus === "trialing" && user.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
      : null

  return (
    // Provider lives here, not at the app root, so marketing pages never ship
    // Clerk's ~300 KiB browser SDK. <UserButton>/<UserProfile> need it.
    <ClerkProvider appearance={clerkAppearance}>
      <div data-dashboard-root="" data-agent="" data-theme={theme} data-brand="blue">
        {/* GA4: fires trial_start once when landing with ?upgraded=true (Stripe success redirect) */}
        <ConversionTracker event="trial_start" metaEvent="StartTrial" whenQueryParam="upgraded" />
        <AgentShell rail={rail} theme={theme} trialDaysLeft={trialDaysLeft}>
          {children}
        </AgentShell>
      </div>
    </ClerkProvider>
  )
}
