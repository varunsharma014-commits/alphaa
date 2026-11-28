export const dynamic = "force-dynamic"
export const maxDuration = 120

import { isQuotaError, quotaBody } from "@/lib/quotas"
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { deletePost, getPost, removeAccount, savePost } from "@/lib/social/store"
import { publishPost } from "@/lib/social/publish"
import { socialThread as thread } from "@/lib/social/thread"
import { agent } from "@/lib/agent/types"

const body = z.object({ op: z.enum(["approve", "post_now", "unschedule", "delete", "disconnect"]), id: z.string().min(5).max(40) })

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await thread(user) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPro(user)) return NextResponse.json({ error: "Social media comes with the Pro plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  let said = "Done."
  if (input.op === "disconnect") {
    said = (await removeAccount(user.id, input.id)) ? "Disconnected. I won’t post there any more." : "That account isn’t connected."
  } else if (input.op === "delete") {
    said = (await deletePost(user.id, input.id)) ? "Deleted." : "That post isn’t here any more."
  } else {
    const p = await getPost(user.id, input.id)
    if (!p) return NextResponse.json({ error: "That post isn’t here any more." }, { status: 404 })
    if (input.op === "post_now") {
      if (!p.accountIds.length) return NextResponse.json({ error: "Connect an account first, then I can post it." }, { status: 409 })
      let r: Awaited<ReturnType<typeof publishPost>>
      try {
        r = await publishPost(user.id, p.id)
      } catch (err) {
        if (isQuotaError(err)) return NextResponse.json(...quotaBody(err))
        throw err
      }
      said = r?.status === "published" ? "Posted." : r?.status === "partial" ? "Posted to some of your accounts. The rest are below." : "It didn’t post. The reason is below."
    } else if (input.op === "approve") {
      p.status = "scheduled"
      p.ownerOk = true
      if (!p.scheduledFor || Date.parse(p.scheduledFor) < Date.now()) p.scheduledFor = new Date(Date.now() + 5 * 60_000).toISOString()
      await savePost(user.id, p)
      said = "Approved. It goes out on schedule."
    } else {
      p.status = "draft"
      await savePost(user.id, p)
      said = "On hold. It waits for your OK."
    }
  }
  return NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...(await thread(user))] })
}
