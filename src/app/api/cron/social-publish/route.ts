export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { duePosts } from "@/lib/social/store"
import { publishPost } from "@/lib/social/publish"

// Every 10 minutes: publish scheduled social posts that are due.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const due = await duePosts()
  let published = 0, failed = 0
  for (const d of due.slice(0, 60)) {
    const p = await publishPost(d.userId, d.post.id).catch(() => null)
    if (p?.status === "published" || p?.status === "partial") published++
    else failed++
  }
  return NextResponse.json({ due: due.length, published, failed })
}
