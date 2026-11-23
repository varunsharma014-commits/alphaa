export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { db } from "@/lib/db"
import { fingerprint, getCampaign, optOut, updateCampaign } from "@/lib/email-campaigns/store"
import { CAMPAIGN_TAG_BRAND, CAMPAIGN_TAG_ID } from "@/lib/email-campaigns/send"

// Resend delivery events for customer email campaigns (Growth "Email outreach").
// A hard bounce or a spam complaint takes that address off THAT brand's list for good (same
// record as an unsubscribe), and counts it on the campaign. Every other Resend email (our own
// transactional mail, other brands on the same Resend team) has no campaign tags and is ignored.
// Signed with svix: RESEND_WEBHOOK_SECRET is the webhook's signing secret (whsec_...).

type Data = { email_id?: string; to?: string[]; tags?: Record<string, string> | { name: string; value: string }[]; bounce?: { type?: string; subType?: string } }

const tag = (tags: Data["tags"], name: string): string | undefined =>
  Array.isArray(tags) ? tags.find((t) => t.name === name)?.value : tags?.[name]

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 })
  const body = await req.text()
  let event: { type?: string; data?: Data }
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as typeof event
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const kind = event.type === "email.complained" ? "complained" : event.type === "email.bounced" ? "bounced" : null
  if (!kind || !event.data) return NextResponse.json({ ok: true, ignored: event.type })
  // Soft bounces (mailbox full, out of office) aren't a reason to drop someone.
  if (kind === "bounced" && /transient|temporary|undetermined/i.test(event.data.bounce?.type ?? "")) return NextResponse.json({ ok: true, ignored: "soft bounce" })

  const userId = tag(event.data.tags, CAMPAIGN_TAG_BRAND)
  const campaignId = tag(event.data.tags, CAMPAIGN_TAG_ID)
  if (!userId || !campaignId) return NextResponse.json({ ok: true, ignored: "not a campaign email" })
  const row = await getCampaign(userId, campaignId)
  if (!row) return NextResponse.json({ ok: true, ignored: "unknown campaign" })

  let changed = 0
  for (const to of event.data.to ?? []) {
    const email = to.replace(/^.*<([^>]+)>.*$/, "$1").trim().toLowerCase()
    if (!email) continue
    // Only addresses this campaign actually went to.
    if (row.c.to && !row.c.to.some((r) => r.e === email)) continue
    if (await optOut(userId, fingerprint(email), kind)) changed++
  }
  if (changed) {
    const fresh = await getCampaign(userId, campaignId)
    if (fresh) await updateCampaign(campaignId, kind === "bounced" ? { bounced: (fresh.c.bounced ?? 0) + changed } : { complained: (fresh.c.complained ?? 0) + changed })
    if (kind === "complained") {
      await db.mockActivity.create({ data: { userId, type: "email_complaint", title: `Someone marked “${row.c.subject.slice(0, 120)}” as spam. I took them off your list.`, metadata: { campaignId } } })
    }
  }
  return NextResponse.json({ ok: true, removed: changed })
}
