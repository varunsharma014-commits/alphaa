// Server side: who is acting on the open brand, and the in-route check for routes whose action
// depends on the request body ("self" in lib/team/routes.ts).
import { NextResponse } from "next/server"
import { resolveActive } from "@/lib/auth"
import { can, roleMessage, type Action, type Role } from "./permissions"

export type Actor = {
  /** The real Clerk id of the person signed in. */
  clerkId: string
  role: Role
  /** The brand row's clerkId (what auth() resolves to). */
  brandClerkId: string
  memberId?: string
  email?: string
  name?: string | null
}

/** Who is signed in and their role on the open brand, or null when signed out. */
export async function getActor(): Promise<Actor | null> {
  const r = await resolveActive()
  if (!r) return null
  return { clerkId: r.realClerkId, role: r.role, brandClerkId: r.clerkId, memberId: r.memberId, email: r.email, name: r.name }
}

/** null = go ahead. Otherwise a 403 with the owner-facing sentence (`role: true` for the UI). */
export async function requireCan(action: Action): Promise<NextResponse | null> {
  const a = await getActor()
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (can(a, action)) return null
  return NextResponse.json({ error: roleMessage(a.role, action), role: true, need: action }, { status: 403 })
}

/** The audit stamp saved on approve/publish/reject rows: { clerkId, email, role, name }. */
export type ActorStamp = { clerkId: string; email: string | null; role: Role; name: string | null }
export async function actorStamp(a?: Actor | null): Promise<ActorStamp | null> {
  const x = a ?? (await getActor())
  if (!x) return null
  return { clerkId: x.clerkId, email: x.email ?? null, role: x.role, name: x.name ?? null }
}
