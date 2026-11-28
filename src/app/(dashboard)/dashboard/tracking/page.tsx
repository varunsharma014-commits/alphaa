export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getTrackingData } from "@/lib/workspace/tracking"
import { TrackingView } from "@/components/workspace/TrackingView"
import { SiteUpkeep } from "@/components/workspace/SiteUpkeep"
import { getUpkeep } from "@/lib/seo/upkeep"

export const metadata = { title: "Tracking & Setup — Alphaa" }

export default async function TrackingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  const [data, upkeep] = await Promise.all([getTrackingData(user), getUpkeep(user).catch((e) => { console.error("[tracking] upkeep", e); return null })])
  return (
    <>
      <TrackingView data={data} />
      {upkeep && <SiteUpkeep data={upkeep} />}
    </>
  )
}
