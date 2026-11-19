export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { agent } from "@/lib/agent/types"

// Saves the business's city (and state/province) from the chat, then offers to carry on with
// whatever asked for it (the Google or Meta ads plan).
const place = z.string().trim().max(80).regex(/^[\p{L}\p{M}][\p{L}\p{M}0-9 .,'’()-]*$/u)
const body = z.object({
  city: place.min(2),
  state: z.union([place, z.literal("")]).optional(),
  next: z.enum(["ads", "metaads"]).optional(),
})

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look like a city name." }, { status: 400 }) }

  const state = input.state?.trim() || null
  await db.user.update({ where: { id: user.id }, data: { city: input.city, ...(state ? { state } : {}) } })
  const where = [input.city, state ?? user.state?.trim()].filter(Boolean).join(", ")
  const next = input.next
  return NextResponse.json({
    messages: [agent([
      { kind: "text", text: `Saved: ${where}.${next ? " Now I can plan your ads around it." : ""}` },
      ...(next
        ? [{ kind: "chips" as const, items: [{ label: next === "ads" ? "Plan my Google ads" : "Plan my Facebook and Instagram ads", primary: true, action: { type: "agent-op" as const, endpoint: next, body: { op: "plan" } } }] }]
        : []),
    ])],
  })
}
