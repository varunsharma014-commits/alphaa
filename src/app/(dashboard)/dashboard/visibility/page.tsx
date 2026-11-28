export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { pageTitle } from "@/lib/page-title"
import { getVisibilityData } from "@/lib/workspace/visibility"
import { VisibilityView } from "@/components/workspace/VisibilityView"
import RunScanButton from "./RunScanButton"

export const metadata = { title: pageTitle("AI search") }

export default async function VisibilityPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")
  const data = await getVisibilityData(user)
  return <VisibilityView data={data} action={<RunScanButton primary={data.checked === 0} label={data.checked === 0 ? "Ask the AIs now" : "Check again now"} />} />
}
