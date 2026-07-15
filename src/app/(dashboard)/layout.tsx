export const dynamic = "force-dynamic"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { DashboardTopBar } from "@/components/layout/DashboardTopBar"
import { ConversionTracker } from "@/components/common/ConversionTracker"

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

  return (
    <div data-theme="dark" className="flex h-screen bg-bg-primary overflow-hidden">
      {/* GA4: fires trial_start once when landing with ?upgraded=true (Stripe success redirect) */}
      <ConversionTracker event="trial_start" whenQueryParam="upgraded" />
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
