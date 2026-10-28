export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { getEngineEvidence, type EngineKey } from "@/lib/engine-evidence"

// "Share it": a public, verified card (/w/[id]) saying an AI recommends the
// business. Only issued when our latest evidence says that AI named them.
const NAME: Record<EngineKey, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity" }
const body = z.object({ engine: z.enum(["chatgpt", "gemini", "claude", "perplexity"]) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let engine: EngineKey
  try {
    engine = body.parse(await req.json()).engine
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const ev = (await getEngineEvidence({ id: user.id, email: user.email }))[engine]
  if (ev?.state !== "found" && ev?.state !== "partial") return NextResponse.json({ error: `${NAME[engine]} didn’t name you in my latest check.` }, { status: 400 })

  // Reuse this month's card for the same AI instead of minting a new link each tap.
  const recent = await db.mockActivity.findFirst({
    where: { userId: user.id, type: "win", createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) }, metadata: { path: ["engine"], equals: engine } },
    orderBy: { createdAt: "desc" },
  })
  if (recent) return NextResponse.json({ id: recent.id })
  const row = await db.mockActivity.create({
    data: { userId: user.id, type: "win", title: `${NAME[engine]} recommends ${user.businessName ?? "us"}`, description: `${NAME[engine]} named ${user.businessName ?? "the business"} when asked as a customer would.`, metadata: { kind: "engine_named", engine } },
  })
  await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { kind: "engine_named", engine, winId: row.id } } })
  return NextResponse.json({ id: row.id })
}
