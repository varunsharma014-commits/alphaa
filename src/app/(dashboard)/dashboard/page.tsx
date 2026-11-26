export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { connectMessage } from "@/lib/agent/connect-notice"
import { getBriefingData } from "@/lib/workspace/briefing"
import { BriefingView } from "@/components/workspace/BriefingView"

export const metadata = { title: "Your briefing — Alphaa" }

// The home screen: calls and leads from real sources, one question at most, what goes out on
// its own (with Stop), and what I did (lib/workspace/briefing.ts). The chat lives in the shell's
// ⌘K panel. The older agent-feed home is components/agent/DashboardAgent (now the chat panel).
export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  const data = await getBriefingData(user)
  // Back from connecting a website (?connected= / ?connect_error= / ?connect=): said in the chat.
  const notice = connectMessage(await searchParams)
  return <BriefingView data={data} notice={notice} />
}
