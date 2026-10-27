export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { buildThread, isTopic } from "@/lib/agent/threads"

// One topic's messages, so the chat can pull them in place ("Show me my
// competitors") instead of sending the owner to another page.
export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const topic = new URL(req.url).searchParams.get("topic") ?? ""
  if (!isTopic(topic)) return NextResponse.json({ error: "I don’t know that one yet." }, { status: 400 })
  const thread = await buildThread(topic, user.id)
  return NextResponse.json(thread)
}
