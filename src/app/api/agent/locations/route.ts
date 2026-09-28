export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { randomBytes } from "crypto"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings, maxExtraLocations } from "@/lib/agent/settings"

// Extra locations for multi-location plans. Pro and Full Service cover up to
// 3 locations in total (the main business + 2).
const add = z.object({
  name: z.string().trim().min(1).max(120),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(50).optional(),
  zip: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(40).optional(),
  hours: z.string().trim().max(200).optional(),
})


export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof add>
  try {
    input = add.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Add at least a name, street and city." }, { status: 400 })
  }
  const s = await getAgentSettings(user.id)
  const list = s.locations ?? []
  const max = maxExtraLocations(user.plan)
  if (list.length >= max) return NextResponse.json({ error: max === 0 ? "More locations come with the Pro plan (up to 3)." : `Your plan covers ${max + 1} locations in total.`, upgrade: true }, { status: 403 })
  const loc = { id: randomBytes(5).toString("hex"), ...input }
  // New cities mean new questions to track.
  await saveAgentSettings(user.id, { locations: [...list, loc], questions: undefined })
  return NextResponse.json({ ok: true, location: loc })
}

export async function DELETE(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id")
  const s = await getAgentSettings(user.id)
  await saveAgentSettings(user.id, { locations: (s.locations ?? []).filter((l) => l.id !== id) })
  return NextResponse.json({ ok: true })
}
