export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isAdmin } from "@/lib/billing"
import { pageTitle } from "@/lib/page-title"
import { DsGallery } from "@/components/workspace/ds/Gallery"

// Admins only: the shared workspace components in every state (sample content). Not in the nav.
export const metadata = { title: pageTitle("Design system"), robots: { index: false, follow: false } }

export default async function DesignSystemPage() {
  const { userId } = await realAuth()
  if (!userId) notFound()
  const me = await db.user.findUnique({ where: { clerkId: userId }, select: { email: true } })
  if (!me || !isAdmin(me.email)) notFound()
  return <DsGallery />
}
