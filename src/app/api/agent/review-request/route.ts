export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { reviewLinkFor } from "@/lib/agent/review-link"
import { esc, sendAs, shell } from "@/lib/connector/mail"

// Ask a real customer for a Google review. Email goes out from
// "<Business> via Alphaa" with replies to the owner; for a phone number we hand
// back a pre-written text for the owner to send from their own phone.
// Everyone gets the same neutral ask — no filtering for happy customers,
// which Google's review policy forbids.
const body = z.object({
  name: z.string().trim().min(1).max(80),
  contact: z.string().trim().min(5).max(200),
  consent: z.literal(true),
})

const DAILY_CAP = 50

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Add their first name, an email or mobile number, and tick the box." }, { status: 400 })
  }
  const link = await reviewLinkFor(user.id)
  if (!link) return NextResponse.json({ error: "I need your Google review link first.", needLink: true }, { status: 400 })

  const biz = user.businessName || "us"
  const first = input.name.split(/\s+/)[0]
  const message = `Hi ${first}, thanks for choosing ${biz}! If you have a minute, would you leave us a quick Google review? It really helps people nearby find us: ${link}`

  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.contact)
  const phone = input.contact.replace(/[^\d+]/g, "")
  if (!isEmail && phone.replace(/\D/g, "").length < 7) return NextResponse.json({ error: "That isn’t an email address or a phone number." }, { status: 400 })

  const since = new Date(Date.now() - 86_400_000)
  const recent = await db.mockActivity.findMany({ where: { userId: user.id, type: "review_request", createdAt: { gte: new Date(Date.now() - 90 * 86_400_000) } }, select: { metadata: true, createdAt: true } })
  if (recent.filter((r) => r.createdAt >= since).length >= DAILY_CAP) return NextResponse.json({ error: `That’s ${DAILY_CAP} today — I’ll pick up again tomorrow.` }, { status: 429 })
  const key = isEmail ? input.contact.toLowerCase() : phone
  if (recent.some((r) => (r.metadata as { to?: string } | null)?.to === key)) return NextResponse.json({ error: `You already asked ${first} in the last 90 days — I don’t ask twice.` }, { status: 409 })

  if (isEmail) {
    const inner = `<p style="margin:0 0 16px">Hi ${esc(first)},</p>
<p style="margin:0 0 16px">Thanks for choosing <b>${esc(biz)}</b>. If you have a minute, would you leave us a quick review on Google? It really helps people nearby find us.</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#0071e3;color:#fff;text-decoration:none;border-radius:980px;padding:12px 24px;font-size:16px">Leave a review</a></p>
<p style="margin:0">Thank you,<br>${esc(user.fullName || biz)}</p>`
    try {
      await sendAs({
        fromName: biz,
        to: input.contact,
        replyTo: user.email,
        subject: `${biz}: how did we do?`,
        html: shell(inner, `You’re getting this one-time note because you were a customer of ${esc(biz)}${user.city ? ` in ${esc(user.city)}` : ""}. Reply to reach them directly. Sent with Alphaa.`),
        text: `${message}\n\nThank you,\n${user.fullName || biz}`,
      })
    } catch (err) {
      console.error("[review-request]", err instanceof Error ? err.message : err)
      return NextResponse.json({ error: "The email didn’t send. Try again in a minute." }, { status: 502 })
    }
  }
  await db.mockActivity.create({ data: { userId: user.id, type: "review_request", title: `Asked ${first} for a review (${isEmail ? "email" : "text"})`, metadata: { to: key, via: isEmail ? "email" : "sms" } } })
  return NextResponse.json(isEmail ? { ok: true, via: "email" } : { ok: true, via: "sms", smsHref: `sms:${phone}?&body=${encodeURIComponent(message)}`, message })
}
