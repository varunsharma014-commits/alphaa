export const dynamic = "force-dynamic"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { DashboardTopBar } from "@/components/layout/DashboardTopBar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  if (!user.onboardingCompleted) redirect("/onboarding")

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardTopBar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
