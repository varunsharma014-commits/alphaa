export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { getSocialData } from "@/lib/workspace/social"
import { SocialView } from "@/components/workspace/SocialView"
import "../../calendar.css"

export const metadata = { title: "Social Studio — Alphaa" }

export default async function SocialPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return hasPro(user) ? <SocialView data={await getSocialData(user)} /> : <SocialView data={null} />
}
