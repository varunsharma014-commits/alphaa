export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getTrackingData } from "@/lib/workspace/tracking"
import { TrackingView } from "@/components/workspace/TrackingView"

export const metadata = { title: "Tracking & Setup — Alphaa" }

export default async function TrackingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return <TrackingView data={await getTrackingData(user)} />
}
