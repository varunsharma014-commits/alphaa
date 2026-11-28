export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { pageTitle } from "@/lib/page-title"
import { getCitationsData } from "@/lib/workspace/citations"
import { CitationsView } from "@/components/workspace/CitationsView"

// Revived 2026-11-28 with real data: the pages each AI cites for the owner's customer questions,
// share of voice vs competitors, stance, and Google AI Overviews. (The old "Where AI looks you up"
// outreach list, retired 2026-11-17, stays retired.)
export const metadata = { title: pageTitle("Where AI gets its answers") }

export default async function CitationsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return <CitationsView data={await getCitationsData(user)} />
}
