export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { pageTitle } from "@/lib/page-title"
import { GoogleListingView } from "@/components/workspace/GoogleListingView"

export const metadata = { title: pageTitle("Google listing posts") }

export default async function PostsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  const user = await db.user.findUnique({
    where: { clerkId },
    include: { gbpPosts: { orderBy: { createdAt: "desc" }, take: 120 }, integration: true },
  })
  if (!user) redirect("/login")

  return (
    <GoogleListingView
      data={{
        connected: !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId),
        canPost: hasPro(user),
        posts: user.gbpPosts.map((p) => ({
          id: p.id,
          content: p.content,
          type: p.postType,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          postedAt: p.postedAt?.toISOString() ?? null,
          scheduledFor: p.scheduledFor?.toISOString() ?? null,
        })),
      }}
    />
  )
}
