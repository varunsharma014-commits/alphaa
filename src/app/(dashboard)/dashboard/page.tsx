export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getFeed } from "@/lib/agent/feed"
import { buildBriefing } from "@/lib/agent/briefing"
import { connectMessage } from "@/lib/agent/connect-notice"
import { DashboardAgent } from "@/components/agent/DashboardAgent"
import { setupMessages, setupPending } from "@/lib/agent/setup"
import { getAgentSettings } from "@/lib/agent/settings"
import { dashV2Enabled } from "@/lib/dash-v2"

export const metadata = { title: "Your briefing — Alphaa" }

// The home screen is the owner's morning briefing (lib/agent/briefing.ts):
// am I winning, what's waiting for my OK, what did you do. The detail behind
// it (lib/agent/feed.ts) sits under "Show me why". Legacy tile dashboard: _legacy-home.tsx.txt.
export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId }, })
  if (!user) redirect("/login")
  const v2 = dashV2Enabled(user, await getAgentSettings(user.id))
  const [feed, briefing, setup] = await Promise.all([getFeed(user.id), buildBriefing(user.id, { v2 }), setupPending(user).then((p) => (p ? setupMessages(user) : []))])
  // Back from connecting a website (?connected= / ?connect_error= / ?connect=): say how it went.
  const notice = connectMessage(await searchParams)
  return <DashboardAgent initial={feed?.messages ?? []} notice={notice ?? undefined} businessName={user.businessName ?? "your business"} status={feed?.status} briefing={briefing ?? undefined} setup={setup} v2={v2} />
}
