export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasGrowth } from "@/lib/billing"
import { getAdsData } from "@/lib/workspace/ads"
import { AdsView } from "@/components/workspace/AdsView"
import { pageTitle } from "@/lib/page-title"

export const metadata = { title: pageTitle("Ads") }

export default async function AdsPage({ searchParams }: { searchParams: Promise<{ tab?: string; note?: string }> }) {
  const { tab, note } = await searchParams
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return hasGrowth(user) ? <AdsView data={await getAdsData(user)} initialTab={tab ?? null} note={note?.slice(0, 200) ?? null} /> : <AdsView data={null} />
}
