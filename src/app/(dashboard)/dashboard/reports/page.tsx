export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { pageTitle } from "@/lib/page-title"
import { getReportsData } from "@/lib/workspace/reports"
import { ReportsView } from "@/components/workspace/ReportsView"

export const metadata = { title: pageTitle("Weekly reports") }

export default async function ReportsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true, email: true } })
  if (!user) redirect("/login")
  return <ReportsView data={await getReportsData(user)} />
}
