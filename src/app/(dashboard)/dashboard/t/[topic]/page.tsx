export const dynamic = "force-dynamic"
export const maxDuration = 60

import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { buildThread, isTopic, TOPICS } from "@/lib/agent/threads"
import { DashboardAgent } from "@/components/agent/DashboardAgent"

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  return { title: `${TOPICS.find((t) => t.key === topic)?.label ?? "Alphaa"} — alphaa` }
}

// Every rail topic is a thread in the same conversation as Today — the agent
// reports, asks, and hands you approval cards. Legacy pages stay under
// "Full reports" for anyone who wants the raw tables.
export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  if (!isTopic(topic)) notFound()
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, businessName: true, businessType: true, city: true } })
  if (!user) redirect("/login")
  const thread = await buildThread(topic, user.id)
  return (
    <DashboardAgent
      key={topic}
      initial={thread.messages}
      autorun={thread.autorun}
      businessName={user.businessName ?? "your business"}
      current={`/dashboard/t/${topic}`}
      context={{ businessType: user.businessType, city: user.city }}
    />
  )
}
