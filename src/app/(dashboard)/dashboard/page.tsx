export const dynamic = "force-dynamic"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getFeed } from "@/lib/agent/feed"
import { buildBriefing } from "@/lib/agent/briefing"
import { DashboardAgent } from "@/components/agent/DashboardAgent"

export const metadata = { title: "Today — alphaa" }

// The home screen is the owner's morning briefing (lib/agent/briefing.ts):
// am I winning, what's waiting for my OK, what did you do. The detail behind
// it (lib/agent/feed.ts) sits under "Show me why". Legacy tile dashboard: _legacy-home.tsx.txt.
export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, businessName: true } })
  if (!user) redirect("/login")
  const [feed, briefing] = await Promise.all([getFeed(user.id), buildBriefing(user.id)])
  return <DashboardAgent initial={feed?.messages ?? []} businessName={user.businessName ?? "your business"} status={feed?.status} briefing={briefing ?? undefined} />
}
