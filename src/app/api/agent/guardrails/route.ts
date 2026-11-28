export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings } from "@/lib/agent/settings"
import { EMPTY_GUARDRAILS, normalizeGuardrails, PLATFORMS, saveGuardrails } from "@/lib/guardrails"
import { requireCan } from "@/lib/team/actor"

// The owner's brand guardrails (Your rules → "Brand rules"): banned words, mandatory hashtags
// (all platforms + per platform), disclaimers per channel and "always say" items. Every writer
// enforces them (lib/guardrails.ts). GET = the saved rules, POST = replace them.
const list = z.union([z.string().max(4000), z.array(z.string().max(200)).max(40)]).optional()
const body = z.object({
  banned: list,
  hashtags: list,
  platformHashtags: z.object(Object.fromEntries(PLATFORMS.map((p) => [p, list])) as Record<(typeof PLATFORMS)[number], typeof list>).partial().optional(),
  disclaimers: z.object({ social: z.string().max(600), blog: z.string().max(600), email: z.string().max(600), ads: z.string().max(600), reviews: z.string().max(600) }).partial().optional(),
  alwaysSay: list,
})

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  return NextResponse.json({ guardrails: s.guardrails ? normalizeGuardrails(s.guardrails) : EMPTY_GUARDRAILS })
}

export async function POST(req: Request) {
  { const denied = await requireCan("settings"); if (denied) return denied } // teams (lib/team)
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right. Keep each list short." }, { status: 400 }) }
  const g = await saveGuardrails(user.id, input)
  return NextResponse.json({ guardrails: g, said: "Saved. Everything I write from now on follows these rules." })
}
