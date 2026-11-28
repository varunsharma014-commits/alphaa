export const dynamic = "force-dynamic"

// "× Not a competitor": remember the host (agent settings competitorsDismissed, nothing deleted),
// and look for a better match in the background (at most once every 30 minutes per brand).
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { discoverCompetitors } from "@/lib/discover-competitors"
import { dataforseoConfigured } from "@/lib/dataforseo"
import { runAsUser } from "@/lib/usage"

const body = z.object({ op: z.literal("dismiss"), host: z.string().min(3).max(200) })
const lastKick = new Map<string, number>()

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const host = input.host.toLowerCase().replace(/^www\./, "")
  const s = await getAgentSettings(user.id)
  const list = Array.from(new Set([...(s.competitorsDismissed ?? []), host])).slice(-300)
  await saveAgentSettings(user.id, { competitorsDismissed: list })

  let looking = false
  const last = lastKick.get(user.id) ?? 0
  if (dataforseoConfigured() && user.businessType && Date.now() - last > 30 * 60_000) {
    lastKick.set(user.id, Date.now())
    looking = true
    void runAsUser(user.id, () => discoverCompetitors(user, 1)).catch(() => 0)
  }
  return NextResponse.json({ ok: true, looking })
}
