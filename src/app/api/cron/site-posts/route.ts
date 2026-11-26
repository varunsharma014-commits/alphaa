export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { publishDueSitePosts } from "@/lib/workspace/site-posts"

// Every 10 minutes: publish website posts the owner put on the schedule (lib/workspace/site-posts.ts).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await publishDueSitePosts())
}
