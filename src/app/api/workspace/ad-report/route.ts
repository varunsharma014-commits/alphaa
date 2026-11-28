export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { getAgentSettings } from "@/lib/agent/settings"
import { cleanEmail, createLink, listLinks, revokeLink, setMonthly } from "@/lib/ad-report/links"
import { rangeFor, TTL_DAYS } from "@/lib/ad-report/token"

// Shareable ad report links (Ads → Share a report): list (GET), make one, turn one off, and the
// monthly email switch. The only extra recipient is an address the owner types here.
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("create"), range: z.enum(["last7", "last30", "month"]), ttl: z.union([z.literal(7), z.literal(30), z.literal(90)]) }),
  z.object({ op: z.literal("revoke"), id: z.string().min(6).max(40) }),
  z.object({ op: z.literal("monthly"), on: z.boolean(), to: z.string().max(254).nullable().optional() }),
])

async function view(userId: string) {
  const s = await getAgentSettings(userId)
  return { links: await listLinks(userId), monthly: s.adReportMail?.monthly ?? false, to: s.adReportMail?.to ?? null, ttls: TTL_DAYS }
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Ad reports come with the Growth plan." }, { status: 403 })
  return NextResponse.json(await view(user.id))
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Ad reports come with the Growth plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  if (input.op === "create") {
    const l = await createLink(user.id, rangeFor(input.range), input.ttl)
    if (!l) return NextResponse.json({ error: "I can’t make links right now. Nothing changed." }, { status: 503 })
    return NextResponse.json({ said: `Made a link for ${l.label}. Anyone with it can see the report for ${input.ttl} days, unless you turn it off.`, link: l, ...(await view(user.id)) })
  }
  if (input.op === "revoke") {
    const ok = await revokeLink(user.id, input.id)
    return NextResponse.json({ said: ok ? "Turned off. That link shows nothing now." : "That link was already off.", ...(await view(user.id)) })
  }
  const to = input.to?.trim() ? cleanEmail(input.to) : null
  if (input.to?.trim() && !to) return NextResponse.json({ error: "That email address doesn’t look right." }, { status: 400 })
  await setMonthly(user.id, input.on, to)
  return NextResponse.json({ said: input.on ? `On. On the 1st of each month I email last month’s report link to you${to ? ` and ${to}` : ""}.` : "Off. No monthly report email.", ...(await view(user.id)) })
}
