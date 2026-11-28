// Email & Flows (Pro and up since 2026-11-26): the owner's list, their campaigns and what happened to each send.
// Opens and clicks aren't tracked, so they are never shown.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { createCampaign, getContacts, listCampaigns, lastSentAt, nextAllowedSend, optedOutSet, updateCampaign } from "@/lib/email-campaigns/store"
import { writeCampaign } from "@/lib/email-campaigns/write"
import { render } from "@/lib/email-campaigns/render"
import { runAsUser } from "@/lib/usage"
import { addCustomersChip, addressChip, writeChip } from "@/lib/email-campaigns/narration"
import { getAgentSettings } from "@/lib/agent/settings"
import type { Chip } from "@/lib/agent/types"
import { ago, n, whenAhead } from "./common"

export type CampaignCard = {
  id: string
  subject: string
  preview: string
  status: string
  pc: "g" | "b" | "n" | "a"
  sent: number | null
  bounced: number
  complained: number
  body: string[]
  when: string
  auto: boolean
}
export type EmailData = {
  listSize: number
  optedOut: number
  imports: { text: string; when: string }[]
  address: string | null
  auto: boolean
  campaigns: CampaignCard[]
  sentTotal: number
  nextSend: string | null
  /** This month's note, written before a list exists ("Issue #N"), shown as the real email. */
  issue: { id: string; number: number; subject: string; html: string } | null
  writingIssue: boolean
  island: string
  chips: { add: Chip; address: Chip; write: Chip }
}

export async function getEmailData(user: User): Promise<EmailData> {
  const [contacts, opted, rows, settings, imports, last] = await Promise.all([
    getContacts(user.id).catch(() => []),
    optedOutSet(user.id).catch(() => new Set<string>()),
    listCampaigns(user.id, 12).catch(() => []),
    getAgentSettings(user.id),
    db.mockActivity.findMany({ where: { userId: user.id, type: "email_import" }, orderBy: { createdAt: "desc" }, take: 5, select: { title: true, createdAt: true } }),
    lastSentAt(user.id).catch(() => null),
  ])
  const campaigns: CampaignCard[] = rows.map((r) => {
    const c = r.c
    const status = c.status === "sent" ? `Sent ${c.sentAt ? ago(c.sentAt) : ""}`.trim() : c.status === "sending" ? "Sending now" : c.status === "failed" ? "Didn’t send" : c.status === "scheduled" && c.scheduledFor ? `Goes out ${whenAhead(c.scheduledFor)}` : c.auto && settings.autopilot?.email === "auto" ? "Goes out on its own" : "Draft"
    return {
      id: r.id,
      subject: c.subject,
      preview: c.preview,
      status,
      pc: c.status === "sent" ? "g" : c.status === "sending" || c.status === "scheduled" ? "b" : c.status === "failed" ? "a" : "n",
      sent: c.status === "sent" || c.status === "sending" ? c.sent ?? 0 : null,
      bounced: c.bounced ?? 0,
      complained: c.complained ?? 0,
      body: c.paragraphs,
      when: ago((c.sentAt ?? c.touchedAt ?? r.createdAt.toISOString())),
      auto: !!c.auto,
    }
  })
  // This month's note: the newest draft if it's under a month old, else write one in the background
  // (the existing writer: facts-only claims, no invented offers). One write per brand at a time.
  const newestDraft = rows.find((r) => r.c.status === "draft")
  const fresh = newestDraft && Date.now() - newestDraft.createdAt.getTime() < 30 * 86_400_000 ? newestDraft : null
  let writingIssue = writing.has(user.id)
  if (!fresh && !writingIssue) {
    writing.add(user.id)
    writingIssue = true
    void runAsUser(user.id, async () => {
      const avoid = rows.filter((r) => r.c.status === "sent").slice(0, 4).map((r) => r.c.subject)
      const c = await writeCampaign(user.id, { avoid })
      for (const d of rows.filter((r) => r.c.status === "draft")) await updateCampaign(d.id, { status: "deleted" })
      await createCampaign(user.id, { v: 1, status: "draft", ...c })
    }).catch((e) => console.error("[workspace/email] issue", e instanceof Error ? e.message : e)).finally(() => setTimeout(() => writing.delete(user.id), 60_000))
  }
  const ordered = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const biz = user.businessName?.trim() || user.fullName?.trim() || "Your business"
  const issue = fresh ? {
    id: fresh.id,
    number: ordered.findIndex((r) => r.id === fresh.id) + 1,
    subject: fresh.c.subject,
    html: previewHtml(render(fresh.c, { biz, signOff: user.fullName?.trim() ? `${user.fullName.trim()}\n${biz}` : biz, replyTo: "", address: settings.emailOutreach?.address?.trim() || ADDR_TOKEN, city: user.city }, { n: NAME_TOKEN }, "#").html),
  } : null
  const next = nextAllowedSend(last)
  const address = settings.emailOutreach?.address?.trim() || null
  return {
    listSize: contacts.length,
    optedOut: opted.size,
    imports: imports.map((i) => ({ text: i.title, when: ago(i.createdAt.toISOString()) })),
    address,
    auto: settings.autopilot?.email === "auto",
    campaigns,
    sentTotal: campaigns.reduce((a, c) => a + (c.sent ?? 0), 0),
    nextSend: next ? whenAhead(next.toISOString()) : null,
    issue,
    writingIssue: !fresh && writingIssue,
    island: issue ? `Issue #${issue.number} is ready${contacts.length ? "" : " · add your list to send it"}` : "Writing this month’s note for your customers",
    chips: { add: addCustomersChip("Add my customers", true), address: addressChip(address ?? undefined), write: writeChip("Write an email", true) },
  }
}

// The preview never shows a made-up customer or address: each person's own first name goes in
// when it's sent, so the preview shows a "first name" token; a missing address shows a red
// "Add your address" token (nothing sends without one).
const NAME_TOKEN = "XALPHAAFIRSTNAMEX"
const ADDR_TOKEN = "XALPHAAADDRESSX"
function previewHtml(html: string): string {
  const pill = (text: string, bg: string, fg: string) => `<span style="display:inline-block;padding:0 8px;border-radius:6px;background:${bg};color:${fg};font-weight:600">${text}</span>`
  return html
    .split(NAME_TOKEN).join(pill("first name", "#e8f1fd", "#0a5bc4"))
    .split(ADDR_TOKEN).join(pill("Add your address", "#fde8e7", "#c0271d"))
}

export const fmt = n
const writing = new Set<string>()
