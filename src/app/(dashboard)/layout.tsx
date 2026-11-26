export const dynamic = "force-dynamic"
import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPaidPlan, isAdmin, isComped } from "@/lib/billing"
import { ConversionTracker } from "@/components/common/ConversionTracker"
import { THEME_COOKIE, type DashboardTheme } from "@/lib/theme"
import { ClerkProvider } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell"
import { getShellData } from "@/lib/workspace/shell"
import "./workspace.css"

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
      user = await db.user.create({ data: { clerkId: userId, email, fullName, subscriptionStatus: "none" } })
    } catch {
      redirect("/login")
    }
  }

  if (!user.onboardingCompleted) redirect("/onboarding")

  // Paywall: onboarded users without a real Stripe subscription go to
  // /onboarding (outside this layout — no redirect loop), where the agent's
  // resume step opens checkout. The webhook sets
  // stripeSubscriptionId + status seconds after checkout completes. Status
  // alone isn't trusted: the column's DB default is "trialing".
  // Founder account bypasses so the owner can always dogfood.
  if (!hasPaidPlan(user) && !isComped(user.email)) {
    redirect("/onboarding")
  }

  // App theme is a cookie so the server paints the right one immediately (no flash) and it stays
  // scoped to the dashboard. Light is the default; "Spatial" (dark) once the owner picks it.
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value
  const theme: DashboardTheme = themeCookie === "dark" ? "dark" : "light"

  // Sidebar badges, the status island and the chat greeting (cheap DB reads only).
  const shell = await getShellData(user)

  return (
    // Provider lives here, not at the app root, so marketing pages never ship
    // Clerk's ~300 KiB browser SDK. <UserButton>/<UserProfile> need it.
    <ClerkProvider appearance={clerkAppearance} signInUrl="/login" signUpUrl="/signup">
      {/* Funnel's last step: fires once when Stripe's success redirect lands (?upgraded=true).
          GA4 gets a real `purchase` (no trial since Oct 2026). Meta keeps StartTrial so any ad set
          already optimizing on it doesn't lose its signal. */}
      <ConversionTracker event="purchase" metaEvent="StartTrial" whenQueryParam="upgraded" params={{ value: 99, currency: "USD" }} />
      <WorkspaceShell data={shell} theme={theme} admin={isAdmin(user.email)}>
        {children}
      </WorkspaceShell>
    </ClerkProvider>
  )
}
