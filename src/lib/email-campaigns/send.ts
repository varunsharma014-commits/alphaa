// Sends an approved campaign to the brand's list, 50 at a time through Resend's batch API.
// From "<Business>" <RESEND_FROM_EMAIL>, replies go to the owner. Every email carries the
// business's mailing address and a one-click unsubscribe (List-Unsubscribe + footer link) that
// opts the person out of THIS business only. Opt-outs are re-read before every batch. The
// recipient list is frozen on the campaign when sending starts, so a restart resumes where it was.
import { checkQuota } from "@/lib/quotas"
import { db } from "@/lib/db"
import { resend } from "@/lib/resend"
import { fromAs } from "@/lib/email-sender"
import { render, type Sender } from "./render"
import { realEmail } from "@/lib/sites"
import { campaignUnsubLinks } from "@/lib/unsubscribe"
import { once } from "@/lib/draft-dedupe"
import { logActivity } from "@/lib/activity"
import { getAgentSettings } from "@/lib/agent/settings"
import { fingerprint, getCampaign, getContacts, lastSentAt, nextAllowedSend, optedOutSet, updateCampaign, type Campaign } from "./store"

const CHUNK = 50
export const CAMPAIGN_TAG_BRAND = "alphaa_brand"
export const CAMPAIGN_TAG_ID = "alphaa_campaign"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))


async function sender(userId: string): Promise<Sender | null> {
  const [user, s] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { businessName: true, fullName: true, email: true, city: true } }),
    getAgentSettings(userId),
  ])
  const address = s.emailOutreach?.address?.trim()
  if (!user || !address) return null
  const biz = user.businessName?.trim() || user.fullName?.trim() || "Your local business"
  return { biz, signOff: user.fullName?.trim() ? `${user.fullName.trim()}\n${biz}` : biz, replyTo: realEmail(user.email), address, city: user.city }
}

/** One copy to the owner, marked as a test. */
export async function sendTest(userId: string, id: string): Promise<{ ok: true; to: string } | { ok: false; error: string }> {
  const row = await getCampaign(userId, id)
  if (!row) return { ok: false, error: "I can’t find that email any more." }
  const s = await sender(userId)
  if (!s) return { ok: false, error: "I need your business mailing address first. The law requires it on every marketing email." }
  const today = (row.c.tests ?? []).filter((t) => Date.now() - Date.parse(t) < 86_400_000)
  if (today.length >= 5) return { ok: false, error: "That’s 5 test copies today. Try again tomorrow." }
  const links = campaignUnsubLinks(userId, fingerprint(s.replyTo))
  if (!links) return { ok: false, error: "Email isn’t set up right now. Try again later." }
  const { html, text } = render(row.c, s, { n: undefined }, links.pageUrl)
  const { error } = await resend.emails.send({ from: fromAs(s.biz), to: s.replyTo, replyTo: s.replyTo, subject: `[Test] ${row.c.subject}`, html, text })
  if (error) return { ok: false, error: "The test didn’t send. Try again in a minute." }
  await updateCampaign(id, { tests: [...today, new Date().toISOString()] })
  return { ok: true, to: s.replyTo }
}

/** Why it can't go out right now, or null when it can. */
export async function sendBlocker(userId: string): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) return "Email isn’t set up right now. Try again later."
  const s = await getAgentSettings(userId)
  if (!s.emailOutreach?.address?.trim()) return "address"
  const next = nextAllowedSend(await lastSentAt(userId))
  if (next) return `I send at most one email a week so your customers stay glad to hear from you. The next one can go on ${next.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.`
  return null
}

/** Starts (or resumes) sending in the background. Returns how many it will go to. */
export async function startSend(userId: string, id: string): Promise<{ ok: true; count: number } | { ok: false; error: string; quota?: boolean }> {
  const row = await getCampaign(userId, id)
  if (!row) return { ok: false, error: "I can’t find that email any more." }
  if (row.c.status === "sent") return { ok: false, error: "That one already went out." }
  if (row.c.status !== "sending") {
    const block = await sendBlocker(userId)
    if (block) return { ok: false, error: block === "address" ? "I need your business mailing address first. The law requires it on every marketing email." : block }
    const [contacts, out] = await Promise.all([getContacts(userId), optedOutSet(userId)])
    const to = contacts.filter((c) => !out.has(fingerprint(c.e))).map((c) => ({ e: c.e, n: c.n }))
    if (!to.length) return { ok: false, error: "Your list is empty. Add your customers first." }
    // Every recipient counts against the plan's email quota (lib/quotas.ts email_send).
    const q = await checkQuota(userId, "email_send", { n: to.length })
    if (!q.allowed) return { ok: false, error: q.message ?? "I've sent all the emails your plan covers for now.", quota: true }
    await updateCampaign(id, { status: "sending", to, done: 0, sent: 0, skipped: 0, failed: 0, startedAt: new Date().toISOString(), error: undefined })
  }
  void runSend(userId, id)
  const fresh = await getCampaign(userId, id)
  return { ok: true, count: fresh?.c.to?.length ?? 0 }
}

/** The background loop. Safe to call twice: one run per campaign at a time. */
export function runSend(userId: string, id: string): Promise<void> {
  return once(`email-send:${id}`, async () => {
    const s = await sender(userId)
    let row = await getCampaign(userId, id)
    if (!row || row.c.status !== "sending" || !row.c.to) return
    if (!s) { await updateCampaign(id, { status: "failed", error: "No mailing address" }); return }
    const to = row.c.to
    let { done = 0, sent = 0, skipped = 0, failed = 0 } = row.c
    while (done < to.length) {
      const out = await optedOutSet(userId)
      const chunk = to.slice(done, done + CHUNK)
      const batch = []
      for (const r of chunk) {
        const fp = fingerprint(r.e)
        const links = out.has(fp) ? null : campaignUnsubLinks(userId, fp)
        if (!links) { skipped++; continue }
        const { html, text } = render(row.c, s, r, links.pageUrl)
        batch.push({
          from: fromAs(s.biz),
          to: r.e,
          replyTo: s.replyTo,
          subject: row.c.subject,
          html,
          text,
          headers: { "List-Unsubscribe": `<${links.oneClickUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
          // The Resend webhook (api/webhooks/resend) reads these to take bounces and spam complaints off THIS brand's list.
          tags: [{ name: CAMPAIGN_TAG_BRAND, value: userId }, { name: CAMPAIGN_TAG_ID, value: id }],
        })
      }
      if (batch.length) {
        try {
          const { error } = await resend.batch.send(batch)
          if (error) throw new Error(error.message)
          sent += batch.length
        } catch (err) {
          console.error("[email-campaign] batch", id, err instanceof Error ? err.message : err)
          failed += batch.length
        }
      }
      done += chunk.length
      await updateCampaign(id, { done, sent, skipped, failed })
      await sleep(700) // stays under Resend's 2 requests a second
      row = await getCampaign(userId, id)
      if (!row || row.c.status !== "sending") return // deleted or stopped mid-way
    }
    const ok = sent > 0
    await updateCampaign(id, { status: ok ? "sent" : "failed", sentAt: new Date().toISOString(), ...(ok ? {} : { error: "Nothing could be delivered" }) })
    if (ok) await logActivity(userId, "email_campaign_sent", `Emailed ${sent} past customer${sent === 1 ? "" : "s"}: “${row.c.subject}”`, "", { campaignId: id, sent, skipped, failed })
  })
}

/** Called by the cron: picks up any send that stopped (deploy or restart) more than 5 minutes ago. */
export async function resumeStuckSends(): Promise<number> {
  const rows = await db.mockActivity.findMany({ where: { type: "email_campaign", metadata: { path: ["status"], equals: "sending" } }, select: { id: true, userId: true, metadata: true }, take: 50 })
  const stale = rows.filter((r) => Date.now() - Date.parse((r.metadata as { touchedAt?: string } | null)?.touchedAt ?? "0") > 5 * 60_000)
  for (const r of stale) void runSend(r.userId, r.id)
  return stale.length
}
