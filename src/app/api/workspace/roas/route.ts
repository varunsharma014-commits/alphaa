export const dynamic = "force-dynamic"

// ROAS owner actions (Ads page): mark a lead won with an amount (or undo it), and turn sending won
// sales to Google / Meta on or off. Growth only. Sending is a dry run unless ROAS_UPLOADS=live.
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { getAgentSettings } from "@/lib/agent/settings"
import { listAdLeads, setWon } from "@/lib/roas/leads"
import { forgetRoas } from "@/lib/roas/sources"
import { setUploads, uploadWon } from "@/lib/roas/uploads"

const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("won"), ref: z.string().regex(/^[ms]:[a-z0-9]{10,40}$/i), amount: z.coerce.number().positive().max(10_000_000) }),
  z.object({ op: z.literal("unwon"), ref: z.string().regex(/^[ms]:[a-z0-9]{10,40}$/i) }),
  z.object({ op: z.literal("uploads"), google: z.boolean().optional(), meta: z.boolean().optional() }),
])

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Ads come with the Growth plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }

  if (input.op === "uploads") {
    const r = await setUploads(user.id, { google: input.google, meta: input.meta })
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 409 })
  }

  const lead = (await listAdLeads(user.id, 90, 500)).find((l) => l.ref === input.ref)
  if (!lead) return NextResponse.json({ error: "I can’t find that lead." }, { status: 404 })
  if (input.op === "unwon") {
    await setWon(user.id, input.ref, { amount: null, currency: "USD", valueFrom: "owner" })
    forgetRoas(user.id)
    return NextResponse.json({ ok: true, won: null, note: lead.won?.uploads?.google?.ok && lead.won.uploads.google.mode === "live" ? "Google already has this sale. Remove it in Google Ads if it shouldn’t count." : null })
  }

  const s = await getAgentSettings(user.id)
  const currency = lead.currency ?? "USD"
  const valueFrom = s.customerValue && Math.abs(s.customerValue.amount - input.amount) < 0.005 ? "customer_value" : "owner"
  const won = await setWon(user.id, input.ref, { amount: input.amount, currency, valueFrom })
  forgetRoas(user.id)
  const uploads = await uploadWon(user.id, input.ref).catch(() => ({}))
  return NextResponse.json({ ok: true, won: { ...won, uploads } })
}
