export const dynamic = "force-dynamic"
export const maxDuration = 90

import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isQuotaError, quotaBody } from "@/lib/quotas"
import { once } from "@/lib/draft-dedupe"
import { buildBrief, getBrief } from "@/lib/content-brief"

// The plan for one page before it's written (lib/content-brief.ts): POST { topic, gapId?, competitor? }
// builds it (or returns the one for that topic from the last 14 days); GET ?id= reads one back.
const body = z.object({
  topic: z.string().min(3).max(200),
  gapId: z.string().max(80).optional(),
  competitor: z.string().max(200).optional(),
  fresh: z.boolean().optional(),
  // A Topic plan article ("<mapId>:<articleId>", lib/clusters.ts): links its pillar + live siblings.
  cluster: z.string().max(80).optional(),
})

async function me() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  return db.user.findUnique({ where: { clerkId } })
}

export async function GET(req: Request) {
  const user = await me()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const brief = await getBrief(user.id, new URL(req.url).searchParams.get("id"))
  return brief ? NextResponse.json({ brief }) : NextResponse.json({ error: "That plan isn’t here any more." }, { status: 404 })
}

export async function POST(req: Request) {
  const user = await me()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  try {
    const brief = await once(`brief:${user.id}:${input.topic.trim().toLowerCase()}:${input.gapId ?? ""}:${input.cluster ?? ""}`, () => buildBrief(user, input))
    return NextResponse.json({ brief })
  } catch (err) {
    if (isQuotaError(err)) return NextResponse.json(...quotaBody(err))
    console.error("[agent/brief]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t plan that page just now. I’ll write it without the plan if you go on." }, { status: 502 })
  }
}
