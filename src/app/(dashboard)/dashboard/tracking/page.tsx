export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getTrackingData } from "@/lib/workspace/tracking"
import { TrackingView } from "@/components/workspace/TrackingView"
import { SiteUpkeep } from "@/components/workspace/SiteUpkeep"
import { SiteVitals } from "@/components/workspace/SiteVitals"
import { getUpkeep } from "@/lib/seo/upkeep"
import { getSiteVitals } from "@/lib/seo/site-vitals"

export const metadata = { title: "Tracking & Setup — Alphaa" }

export default async function TrackingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  const [data, upkeep, vitals] = await Promise.all([
    getTrackingData(user, { wait: true }),
    getUpkeep(user).catch((e) => { console.error("[tracking] upkeep", e); return null }),
    user.websiteUrl?.trim() ? getSiteVitals(user).catch((e) => { console.error("[tracking] vitals", e); return null }) : Promise.resolve(null),
  ])
  return (
    <>
      <TrackingView data={data} />
      {upkeep && <SiteUpkeep data={upkeep} />}
      {vitals && <SiteVitals data={vitals} />}
    </>
  )
}
