export const dynamic = "force-dynamic"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getFeed } from "@/lib/agent/feed"
import { DashboardAgent } from "@/components/agent/DashboardAgent"

export const metadata = { title: "Today — alphaa" }

// The home screen is a conversation with the agent, built from real rows:
// verdicts, reviews waiting, drafts to approve, where AI looks, this week's
// receipt. See lib/agent/feed.ts. Legacy tile dashboard: _legacy-home.tsx.txt.
export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, businessName: true } })
  if (!user) redirect("/login")
  const feed = await getFeed(user.id)
  return <DashboardAgent initial={feed?.messages ?? []} businessName={user.businessName ?? "your business"} />
}
