export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createHash } from "crypto"
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

  const bizKnown = user.businessName?.trim() || null
  const biz = bizKnown || "us"
  const owner = user.fullName?.trim() || null
  const signOff = owner || bizKnown
  const first = input.name.split(/\s+/)[0]
  const ask = "If you have a minute, would you mind leaving us a quick review on Google? Mentioning the specific service we provided really helps other people nearby find us."
  const message = `Hi ${first}, thanks for choosing ${biz}. ${ask} ${link}`

  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.contact)
  const phone = input.contact.replace(/[^\d+]/g, "")
  if (!isEmail && phone.replace(/\D/g, "").length < 7) return NextResponse.json({ error: "That isn’t an email address or a phone number." }, { status: 400 })

  const since = new Date(Date.now() - 86_400_000)
  const recent = await db.mockActivity.findMany({ where: { userId: user.id, type: "review_request", createdAt: { gte: new Date(Date.now() - 90 * 86_400_000) } }, select: { metadata: true, createdAt: true } })
  if (recent.filter((r) => r.createdAt >= since).length >= DAILY_CAP) return NextResponse.json({ error: `That’s ${DAILY_CAP} today — I’ll pick up again tomorrow.` }, { status: 429 })
  // Only a one-way fingerprint is kept, to avoid asking the same person twice.
  const key = createHash("sha256").update(isEmail ? input.contact.toLowerCase() : phone.replace(/\D/g, "")).digest("hex")
  if (recent.some((r) => (r.metadata as { to?: string } | null)?.to === key)) return NextResponse.json({ error: `You already asked ${first} in the last 90 days — I don’t ask twice.` }, { status: 409 })

  if (isEmail) {
    const inner = `<p style="margin:0 0 16px">Hi ${esc(first)},</p>
<p style="margin:0 0 16px">Thanks for choosing ${bizKnown ? `<b>${esc(bizKnown)}</b>` : "us"}.</p>
<p style="margin:0 0 16px">${esc(ask)}</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#000000;color:#fff;text-decoration:none;border-radius:980px;padding:12px 24px;font-size:16px">Leave a review →</a></p>
<p style="margin:0">${signOff ? `Thank you,<br>${esc(signOff)}` : "Thank you."}</p>`
    try {
      await sendAs({
        // Sender is the business itself; with no business name, the owner.
        fromName: bizKnown || owner || "Alphaa",
        to: input.contact,
        replyTo: user.email,
        subject: "How did we do?",
        html: shell(inner, `You’re getting this one-time note because you were a customer of ${bizKnown ? esc(bizKnown) : "this business"}${user.city?.trim() ? ` in ${esc(user.city.trim())}` : ""}. Reply to reach them directly. Sent with Alphaa.`),
        text: `Hi ${first},\n\nThanks for choosing ${biz}.\n\n${ask}\n\nLeave a review: ${link}\n\n${signOff ? `Thank you,\n${signOff}` : "Thank you."}`,
      })
    } catch (err) {
      console.error("[review-request]", err instanceof Error ? err.message : err)
      return NextResponse.json({ error: "The email didn’t send. Try again in a minute." }, { status: 502 })
    }
  }
  await db.mockActivity.create({ data: { userId: user.id, type: "review_request", title: `Asked ${first} for a review (${isEmail ? "email" : "text"})`, metadata: { to: key, via: isEmail ? "email" : "sms" } } })
  return NextResponse.json(isEmail ? { ok: true, via: "email" } : { ok: true, via: "sms", smsHref: `sms:${phone}?&body=${encodeURIComponent(message)}`, message })
}
