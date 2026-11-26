export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasGrowth } from "@/lib/billing"
import { getAdsData } from "@/lib/workspace/ads"
import { AdsView } from "@/components/workspace/AdsView"

export const metadata = { title: "Ads — Alphaa" }

export default async function AdsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return hasGrowth(user) ? <AdsView data={await getAdsData(user)} /> : <AdsView data={null} />
}
