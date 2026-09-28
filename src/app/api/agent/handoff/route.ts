export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { saveAgentSettings } from "@/lib/agent/settings"
import { sendAs } from "@/lib/connector/mail"
import { buildHandoffEmail } from "@/lib/connector/handoff"

// "Email it to my web person": sends the exact code or content, with where it
// goes and how to check it, to the owner's developer. Replies go to the owner.
const body = z.object({
  what: z.enum(["schema", "llms", "page", "robots", "post", "meta", "sitemap", "headers"]),
  email: z.string().email().max(200),
  title: z.string().max(200).optional(),
  text: z.string().max(30_000).optional(),
  url: z.string().url().max(500).optional(),
})



export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "That email address doesn’t look right." }, { status: 400 })
  }
  const today = await db.mockActivity.count({ where: { userId: user.id, type: "handoff_sent", createdAt: { gte: new Date(Date.now() - 86_400_000) } } })
  if (today >= 20) return NextResponse.json({ error: "That’s a lot of emails today — try again tomorrow." }, { status: 429 })

  const biz = user.businessName || "our business"
  const mail = await buildHandoffEmail(user, input)
  if ("error" in mail) return NextResponse.json({ error: mail.error }, { status: 400 })
  try {
    await sendAs({
      fromName: `${biz} via Alphaa`,
      to: input.email,
      replyTo: user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
  } catch (err) {
    console.error("[handoff]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "The email didn’t send. Try again in a minute." }, { status: 502 })
  }
  await saveAgentSettings(user.id, { webPersonEmail: input.email })
  await db.mockActivity.create({ data: { userId: user.id, type: "handoff_sent", title: `Emailed ${input.what === "page" ? "a page" : input.what} to ${input.email}`, metadata: { what: input.what, to: input.email } } })
  return NextResponse.json({ ok: true })
}
