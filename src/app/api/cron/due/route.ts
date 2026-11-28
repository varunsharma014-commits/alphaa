export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { publishDueGbpPosts, sendDueEmails } from "@/lib/calendar/due"

// Every 10 minutes: content-calendar times for Google listing posts and customer emails
// (social posts and website posts have their own 10-minute crons). lib/calendar/due.ts.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const [gbp, email] = await Promise.all([publishDueGbpPosts(), sendDueEmails()])
  return NextResponse.json({ gbp, email })
}
