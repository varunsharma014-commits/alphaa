export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSiteHealth, getTrackingData } from "@/lib/workspace/tracking"
import { TrackingView } from "@/components/workspace/TrackingView"
import { getUpkeep } from "@/lib/seo/upkeep"
import { getSiteVitals } from "@/lib/seo/site-vitals"
import { pageTitle } from "@/lib/page-title"

export const metadata = { title: pageTitle("Tracking & Setup") }

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  const [data, health, upkeep, vitals] = await Promise.all([
    getTrackingData(user, { wait: true }),
    getSiteHealth(user).catch((e) => { console.error("[tracking] health", e); return null }),
    getUpkeep(user).catch((e) => { console.error("[tracking] upkeep", e); return null }),
    user.websiteUrl?.trim() ? getSiteVitals(user).catch((e) => { console.error("[tracking] vitals", e); return null }) : Promise.resolve(null),
  ])
  return <TrackingView data={data} health={health} upkeep={upkeep} vitals={vitals} initialTab={tab ?? null} />
}
