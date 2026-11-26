// Email & Flows (Growth): the owner's list, their campaigns and what happened to each send.
// Opens and clicks aren't tracked, so they are never shown.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getContacts, listCampaigns, lastSentAt, nextAllowedSend, optedOutSet } from "@/lib/email-campaigns/store"
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
    const status = c.status === "sent" ? `Sent ${c.sentAt ? ago(c.sentAt) : ""}`.trim() : c.status === "sending" ? "Sending now" : c.status === "failed" ? "Didn’t send" : c.auto && settings.autopilot?.email === "auto" ? "Goes out on its own" : "Draft"
    return {
      id: r.id,
      subject: c.subject,
      preview: c.preview,
      status,
      pc: c.status === "sent" ? "g" : c.status === "sending" ? "b" : c.status === "failed" ? "a" : "n",
      sent: c.status === "sent" || c.status === "sending" ? c.sent ?? 0 : null,
      bounced: c.bounced ?? 0,
      complained: c.complained ?? 0,
      body: c.paragraphs,
      when: ago((c.sentAt ?? c.touchedAt ?? r.createdAt.toISOString())),
      auto: !!c.auto,
    }
  })
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
    chips: { add: addCustomersChip("Add my customers", true), address: addressChip(address ?? undefined), write: writeChip("Write an email", true) },
  }
}

export const fmt = n
