export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { getEmailData } from "@/lib/workspace/email"
import { EmailView } from "@/components/workspace/EmailView"

export const metadata = { title: "Email & Flows — Alphaa" }

export default async function EmailPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/login")
  return hasPro(user) ? <EmailView data={await getEmailData(user)} /> : <EmailView data={null} />
}
