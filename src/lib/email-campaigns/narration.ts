// The "Email your past customers" thread (topic "email", Growth). Built from real rows only.
import type { User } from "@prisma/client"
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasGrowth } from "@/lib/billing"
import { CONSENT_TEXT, MAX_CONTACTS, getContacts, lastSentAt, listCampaigns, nextAllowedSend, type CampaignRow } from "./store"

const op = (body: Record<string, string | number | boolean>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "email", body } })
const day = (d: Date | string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })

export const addCustomersChip = (label = "Add my customers", primary = false): Chip => ({
  label,
  primary,
  action: {
    type: "agent-op",
    endpoint: "email",
    body: { op: "import" },
    form: {
      text: "Paste your customers below (one per line, “Name, email” or just the email), or upload a CSV export from your booking, POS or email tool.",
      fields: [
        { name: "paste", label: "Paste customers", type: "textarea", placeholder: "Jane Doe, jane@example.com\nsam@example.com" },
        { name: "file", label: "Or upload a CSV", type: "file", accept: ".csv,text/csv,text/plain", upload: "/api/agent/email/upload" },
        { name: "consent", label: CONSENT_TEXT, type: "checkbox", required: true },
      ],
      cta: "Add them",
      fine: `Up to ${MAX_CONTACTS.toLocaleString("en-US")} people. Only add people who bought from you or asked to hear from you. I never email anyone who unsubscribed, and I never share your list.`,
    },
  },
})

export const addressChip = (current?: string, label = "Add my mailing address"): Chip => ({
  label,
  primary: !current,
  action: {
    type: "agent-op",
    endpoint: "email",
    body: { op: "address" },
    form: {
      text: "What’s your business mailing address? Anti-spam law (CAN-SPAM in the US, CASL in Canada) requires it at the bottom of every marketing email.",
      fields: [{ name: "address", label: "Mailing address", type: "text", placeholder: "123 Main St, Toronto, ON M5V 1A1", value: current ?? "", required: true }],
      cta: "Save it",
      fine: "A PO box works too. It only appears in the email footer.",
    },
  },
})

export const writeChip = (label = "Write an email", primary = false): Chip => ({
  label,
  primary,
  action: {
    type: "agent-op",
    endpoint: "email",
    body: { op: "write" },
    form: {
      text: "What should this email be about? Leave it blank and I’ll pick something useful for your customers. If you mention an offer, I’ll use exactly what you write.",
      fields: [{ name: "topic", label: "What it’s about (optional)", type: "textarea", placeholder: "We’re open on Sundays from next month" }],
      cta: "Write it",
    },
  },
})

function draftMessage(r: CampaignRow, listSize: number, blocked: string | null): Message {
  const c = r.c
  const body = [`Subject: ${c.subject}`, `Preview: ${c.preview}`, "", "Hi <first name>,", "", ...c.paragraphs.flatMap((p) => [p, ""]), c.cta ? `[${c.cta.label}] → ${c.cta.url}` : ""].join("\n").trim()
  const chips: Chip[] = []
  if (!blocked && listSize) chips.push(op({ op: "send", id: r.id }, `Send to ${listSize.toLocaleString("en-US")} customer${listSize === 1 ? "" : "s"}`, true))
  chips.push(op({ op: "test", id: r.id }, "Send me a test"))
  chips.push({
    label: "Edit it",
    action: {
      type: "agent-op",
      endpoint: "email",
      body: { op: "edit", id: r.id },
      form: {
        text: "Change anything you like. Each paragraph goes on its own line.",
        fields: [
          { name: "subject", label: "Subject", type: "text", value: c.subject, required: true },
          { name: "preview", label: "Preview text", type: "text", value: c.preview },
          { name: "body", label: "Email", type: "textarea", value: c.paragraphs.join("\n\n"), required: true },
          ...(c.cta ? [{ name: "button", label: "Button", type: "text" as const, value: c.cta.label }] : []),
        ],
        cta: "Save",
      },
    },
  })
  chips.push(writeChip("Write a different one"))
  chips.push(op({ op: "delete", id: r.id }, "Delete it"))
  const blocks: Block[] = [
    { kind: "text", text: c.auto ? "I wrote this month’s email to your customers." : "Here’s your email. Nothing goes out until you say so." },
    { kind: "doc", title: c.subject, meta: `Draft · ${day(r.createdAt)}`, text: body },
  ]
  if (blocked) blocks.push({ kind: "text", text: blocked })
  else if (!listSize) blocks.push({ kind: "text", text: "Add your customers and it’s ready to go." })
  blocks.push({ kind: "chips", items: chips })
  return agent(blocks, `em-draft-${r.id}`)
}

export async function emailMessages(user: User, note?: string | null): Promise<Message[]> {
  if (!hasGrowth(user)) {
    return [agent([
      { kind: "text", text: "Email your past customers", big: true },
      { kind: "text", text: "Your past customers are the easiest people to win back. On the Growth plan I write a short email in your voice, you approve it, and I send it from your business with replies going straight to you." },
      { kind: "chips", items: [{ label: "See the Growth plan", primary: true, action: { type: "link", href: "/dashboard/upgrade?plan=growth" } }] },
    ], "em-upsell")]
  }
  const [s, contacts, campaigns, last] = await Promise.all([getAgentSettings(user.id), getContacts(user.id), listCampaigns(user.id, 8), lastSentAt(user.id)])
  const address = s.emailOutreach?.address?.trim()
  const next = nextAllowedSend(last)
  const auto = s.autopilot?.email === "auto"
  const out: Message[] = []

  const rows = [
    { name: "Your customer list", detail: contacts.length ? `${contacts.length.toLocaleString("en-US")} people` : "Paste them or upload a CSV", status: contacts.length ? "Ready" : "Empty", ok: contacts.length > 0 },
    { name: "Mailing address", detail: address ?? "Required by anti-spam law in every email", status: address ? "Set" : "Needed", ok: !!address },
    { name: "Sending", detail: auto ? "I send one email a month without asking" : "I ask you before every send", status: auto ? "Automatic" : "Ask first", ok: true },
  ]
  const chips: Chip[] = []
  if (!address) chips.push(addressChip())
  chips.push(addCustomersChip(contacts.length ? "Add more customers" : "Add my customers", !!address && !contacts.length))
  if (!campaigns.some((r) => r.c.status === "draft")) chips.push(writeChip("Write an email", !!address && contacts.length > 0))
  if (address) chips.push(addressChip(address, "Change my address"))
  if (contacts.length) chips.push(op({ op: "clear" }, "Remove my list"))
  out.push(agent([
    ...(note ? [{ kind: "text" as const, text: note }] : []),
    { kind: "text", text: "Email your past customers", big: true },
    { kind: "text", text: "Once a month at most, I write a short email in your voice that gives people a reason to come back. It comes from your business, replies go to you, and anyone can unsubscribe in one click." },
    { kind: "sources", items: rows },
    { kind: "chips", items: chips },
  ], "em-head"))

  const draft = campaigns.find((r) => r.c.status === "draft")
  if (draft) {
    const blocked = !address ? "Add your mailing address and it’s ready to send." : next ? `You sent one recently. To keep your customers glad to hear from you, the next one can go on ${next.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.` : null
    out.push(draftMessage(draft, contacts.length, blocked))
  }

  const sending = campaigns.find((r) => r.c.status === "sending")
  if (sending) {
    const total = sending.c.to?.length ?? 0
    out.push(agent([
      { kind: "text", text: `Sending “${sending.c.subject}”.` },
      { kind: "steps", items: [`Sent ${(sending.c.done ?? 0).toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`], done: 0 },
      { kind: "chips", items: [op({ op: "refresh" }, "Check progress"), op({ op: "stop", id: sending.id }, "Stop sending")] },
    ], "em-sending"))
  }

  const past = campaigns.filter((r) => r.c.status === "sent" || r.c.status === "failed")
  if (past.length) {
    out.push(agent([
      { kind: "sources", title: "Emails sent", items: past.map((r) => ({
        name: r.c.subject,
        detail: r.c.status === "sent" ? `${day(r.c.sentAt ?? r.updatedAt)} · ${(r.c.sent ?? 0).toLocaleString("en-US")} sent${r.c.failed ? `, ${r.c.failed} didn’t go` : ""}` : `${day(r.updatedAt)} · didn’t send`,
        status: r.c.status === "sent" ? "Sent" : "Failed",
        ok: r.c.status === "sent",
      })) },
      { kind: "text", text: "Replies land in your own inbox. Anyone who unsubscribes is taken off your list for good." },
    ], "em-past"))
  }
  return out
}
