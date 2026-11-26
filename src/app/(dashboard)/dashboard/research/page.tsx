export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResearchData } from "@/lib/workspace/research"
import { ResearchView } from "@/components/workspace/ResearchView"

export const metadata = { title: "Research & Ideas — Alphaa" }

export default async function ResearchPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return <ResearchView data={await getResearchData(user)} />
}
