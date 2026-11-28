export const dynamic = "force-dynamic"
export const maxDuration = 120

// Research → "Who links to you vs competitors" (lib/backlinks). GET = the newest snapshot (DB only);
// POST { op: "refresh" } = a fresh check now (paid data on the brand's data_usd quota, max once a day).
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { refreshBacklinks } from "@/lib/backlinks/run"
import { backlinksView } from "@/lib/backlinks/view"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ view: await backlinksView(user) })
}

const body = z.object({ op: z.literal("refresh") })

const WHY: Record<string, string> = {
  plan: "Link checks come with a paid plan.",
  "no website": "Add your website first, so I know whose links to check.",
  "not configured": "My link data service isn’t set up yet.",
  "access denied": "My link data service turned me away just now. I’ll try again later.",
  running: "I’m already checking. Give me a minute.",
  today: "I checked your links today already. I’ll look again tomorrow.",
  "this month": "I already checked this month.",
  failed: "I couldn’t read your link data just now. Try again later.",
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try { body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const r = await refreshBacklinks(user, "owner").catch((err) => {
    console.error("[workspace/backlinks]", err instanceof Error ? err.message : err)
    return { snapshot: null, skipped: "failed" }
  })
  if (!r.snapshot) return NextResponse.json({ error: WHY[r.skipped ?? "failed"] ?? WHY.failed, view: await backlinksView(user) }, { status: r.skipped === "today" || r.skipped === "running" ? 429 : 422 })
  return NextResponse.json({ view: await backlinksView(user) })
}
