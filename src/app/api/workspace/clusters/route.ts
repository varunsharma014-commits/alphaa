export const dynamic = "force-dynamic"
export const maxDuration = 180

// Research → Topic plan (lib/clusters.ts). GET = the map with each article's status (DB only);
// POST { op: "build" } = rebuild it now from the real inputs (one topic_plan quota use).
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { buildClusters, clusterView } from "@/lib/clusters"
import { isQuotaError, quotaBody } from "@/lib/quotas"
import { once } from "@/lib/draft-dedupe"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ view: await clusterView(user.id) })
}

const body = z.object({ op: z.literal("build") })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try { body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  try {
    const r = await once(`clusters:${user.id}`, () => buildClusters(user, { reason: "owner" }))
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 422 })
    return NextResponse.json({ view: await clusterView(user.id) })
  } catch (err) {
    if (isQuotaError(err)) return NextResponse.json(...quotaBody(err))
    console.error("[workspace/clusters]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t plan your topics just now. Try again in a minute." }, { status: 502 })
  }
}
