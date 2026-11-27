export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { ownerUsage } from "@/lib/quotas"

// GET: the owner's "This month" usage (Your rules): what the plan includes vs what was used.
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await ownerUsage(user))
}
