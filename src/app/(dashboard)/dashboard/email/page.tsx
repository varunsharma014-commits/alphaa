export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasGrowth } from "@/lib/billing"
import { getEmailData } from "@/lib/workspace/email"
import { EmailView } from "@/components/workspace/EmailView"

export const metadata = { title: "Email & Flows — Alphaa" }

export default async function EmailPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return hasGrowth(user) ? <EmailView data={await getEmailData(user)} /> : <EmailView data={null} />
}
