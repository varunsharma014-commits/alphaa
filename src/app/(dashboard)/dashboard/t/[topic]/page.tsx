export const dynamic = "force-dynamic"
export const maxDuration = 60

import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { buildThread, isTopic, TOPICS } from "@/lib/agent/threads"
import { agent, type Message } from "@/lib/agent/types"
import { DashboardAgent } from "@/components/agent/DashboardAgent"

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  return { title: `${TOPICS.find((t) => t.key === topic)?.label ?? "Alphaa"} — alphaa` }
}

// Every rail topic is a thread in the same conversation as Today — the agent
// reports, asks, and hands you approval cards. Legacy pages stay under
// "Full reports" for anyone who wants the raw tables.
const PLATFORM_NAME: Record<string, string> = { webflow: "Webflow", shopify: "Shopify", wix: "Wix", wordpress: "WordPress" }

// Result of a website-connect round trip (?connected=… / ?connect_error=… / ?connect=<platform>-unavailable).
function connectMessage(q: Record<string, string | string[] | undefined>): Message | null {
  const one = (k: string) => (Array.isArray(q[k]) ? q[k]![0] : q[k]) as string | undefined
  const ok = one("connected"), err = one("connect_error"), na = one("connect")
  if (ok) return agent([{ kind: "text", text: `I’m connected to your ${PLATFORM_NAME[ok] ?? ok} site. ✓`, big: true }, { kind: "text", text: "From now on, when you approve a post or page, I publish it there myself — and every change has an Undo." }], "connect-result")
  if (err) return agent([{ kind: "text", text: `That didn’t connect: ${err.slice(0, 300)}` }, { kind: "chips", items: [{ label: "Try again", action: { type: "wp-connect" }, primary: true }] }], "connect-result")
  if (na?.endsWith("-unavailable")) return agent([{ kind: "text", text: `Connecting ${PLATFORM_NAME[na.replace("-unavailable", "")] ?? "that platform"} isn’t switched on yet. In the meantime I’ll email your web person exactly what to change, or our team can do it.` }], "connect-result")
  return null
}

export default async function TopicPage({ params, searchParams }: { params: Promise<{ topic: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { topic } = await params
  const notice = connectMessage(await searchParams)
  if (!isTopic(topic)) notFound()
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, businessName: true, businessType: true, city: true } })
  if (!user) redirect("/login")
  const thread = await buildThread(topic, user.id)
  return (
    <DashboardAgent
      key={topic}
      initial={notice ? [notice, ...thread.messages] : thread.messages}
      autorun={thread.autorun}
      businessName={user.businessName ?? "your business"}
      current={`/dashboard/t/${topic}`}
      context={{ businessType: user.businessType, city: user.city }}
    />
  )
}
