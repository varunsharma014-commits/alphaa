export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"

// Beacon from the WordPress plugin when a visitor arrives from an AI
// assistant. Public and unauthenticated by nature (it runs in visitors'
// browsers), so it only records sites that are connected, caps volume, and
// stores nothing about the visitor.
const SOURCES: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "perplexity.ai": "Perplexity",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "copilot.microsoft.com": "Copilot",
}
const DAILY_CAP = 1000

export async function POST(req: Request) {
  const done = new Response(null, { status: 204 })
  let data: { s?: string; src?: string; p?: string }
  try {
    data = JSON.parse(await req.text())
  } catch {
    return done
  }
  const source = SOURCES[(data.src ?? "").toLowerCase()]
  if (!source || !data.s || !/^[a-z0-9]{10,40}$/i.test(data.s)) return done
  const settings = await getAgentSettings(data.s).catch(() => null)
  if (!settings?.wp) return done
  const since = new Date(Date.now() - 86_400_000)
  const today = await db.mockActivity.count({ where: { userId: data.s, type: "ai_visit", createdAt: { gte: since } } })
  if (today >= DAILY_CAP) return done
  const path = (data.p ?? "/").slice(0, 200)
  await db.mockActivity.create({ data: { userId: data.s, type: "ai_visit", title: `A visitor came from ${source}`, metadata: { source, path } } })
  return done
}
