export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getActor, requireCan } from "@/lib/team/actor"
import { can } from "@/lib/team/permissions"
import { inviteMember, listTeam, removeMember, resendInvite, seatsFor, setBriefing, setMemberRole } from "@/lib/team/store"

// The Team card on Your rules (components/dashboard/TeamCard.tsx).
// GET: the team, seats and the viewer's own role. POST: invite / role / remove / resend (owner or
// admin), briefing (a member's own weekly-email opt-in) and leave (a member leaving the brand).

export async function GET() {
  const user = await currentUser()
  const actor = await getActor()
  if (!user || !actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const members = await listTeam(user.id)
  const manage = can(actor, "team")
  const me = actor.memberId ? members.find((m) => m.id === actor.memberId) ?? null : null
  return NextResponse.json({
    role: actor.role,
    manage,
    seats: seatsFor(user),
    used: members.length,
    // Members see who is on the team, not the invite emails of people who haven't joined.
    members: manage ? members : members.filter((m) => m.status === "active").map((m) => ({ ...m, email: m.id === actor.memberId ? m.email : "" })),
    me: me ? { id: me.id, briefing: me.briefing } : null,
  })
}

const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("invite"), email: z.string().min(3).max(200), role: z.string().max(20) }),
  z.object({ op: z.literal("role"), id: z.string().min(5).max(40), role: z.string().max(20) }),
  z.object({ op: z.literal("remove"), id: z.string().min(5).max(40) }),
  z.object({ op: z.literal("resend"), id: z.string().min(5).max(40) }),
  z.object({ op: z.literal("briefing"), on: z.boolean() }),
  z.object({ op: z.literal("leave") }),
])

export async function POST(req: Request) {
  const user = await currentUser()
  const actor = await getActor()
  if (!user || !actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }

  if (input.op === "briefing" || input.op === "leave") {
    if (!actor.memberId) return NextResponse.json({ error: input.op === "leave" ? "You own this brand, so you can’t leave it." : "As the owner you already get the weekly briefing." }, { status: 400 })
    if (input.op === "briefing") {
      const ok = await setBriefing(user.id, actor.memberId, input.on)
      return ok ? NextResponse.json({ ok: true, briefing: input.on }) : NextResponse.json({ error: "That didn’t save." }, { status: 409 })
    }
    const r = await removeMember(user.id, actor.memberId)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    const res = NextResponse.json({ ok: true, next: "/dashboard" })
    res.cookies.delete("alphaa_site")
    return res
  }

  const denied = await requireCan("team")
  if (denied) return denied
  const by = { clerkId: actor.clerkId, name: actor.memberId ? actor.name?.trim() || actor.email || "Your team" : user.fullName?.trim() || user.businessName?.trim() || "The owner" }
  const r =
    input.op === "invite" ? await inviteMember(user, by, input.email, input.role)
    : input.op === "role" ? await setMemberRole(user.id, input.id, input.role)
    : input.op === "resend" ? await resendInvite(user, input.id, by.name)
    : await removeMember(user.id, input.id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  // The accept link only works for a login with the invited (verified) email, so when the email
  // didn't go out it is safe to show it for copying.
  return NextResponse.json({ ok: true, member: r.member, emailed: r.emailed ?? null, url: r.emailed === false ? r.url ?? null : null, team: await listTeam(user.id) })
}
