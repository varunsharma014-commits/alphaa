export const dynamic = "force-dynamic"
export const maxDuration = 120

import { isQuotaError } from "@/lib/quotas"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { agent, type Message } from "@/lib/agent/types"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { once } from "@/lib/draft-dedupe"
import { emailMessages } from "@/lib/email-campaigns/narration"
import { addContacts, clearContacts, createCampaign, getCampaign, listCampaigns, parseContacts, updateCampaign, type Contact } from "@/lib/email-campaigns/store"
import { writeCampaign } from "@/lib/email-campaigns/write"
import { sendTest, startSend } from "@/lib/email-campaigns/send"

// Email outreach ops for the "email" thread (lib/email-campaigns). Every op answers with the
// thread's messages, which replace the old copies with the same id.
const body = z.object({
  op: z.enum(["import", "address", "write", "edit", "test", "send", "stop", "delete", "clear", "refresh"]),
  id: z.string().max(64).optional(),
  paste: z.string().max(400_000).optional(),
  file: z.string().max(2000).optional(),
  consent: z.boolean().optional(),
  address: z.string().max(300).optional(),
  topic: z.string().max(600).optional(),
  subject: z.string().max(120).optional(),
  preview: z.string().max(160).optional(),
  body: z.string().max(4000).optional(),
  button: z.string().max(40).optional(),
})

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await emailMessages(user) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPro(user)) return NextResponse.json({ error: "Email to your customers comes with the Pro plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That didn’t come through. Try again." }, { status: 400 }) }
  const err = (error: string, status = 400) => NextResponse.json({ error }, { status })
  const reply = async (note?: string, extra: Message[] = []) => NextResponse.json({ messages: [...extra, ...(await emailMessages(user, note))] })

  switch (input.op) {
    case "refresh":
      return reply()

    case "address": {
      const address = input.address?.replace(/\s+/g, " ").trim() ?? ""
      if (address.length < 10 || !/\d/.test(address) || !/[a-z]/i.test(address)) return err("That doesn’t look like a full mailing address. Add the street (or PO box), city and postal code.")
      const s = await getAgentSettings(user.id)
      await saveAgentSettings(user.id, { emailOutreach: { ...s.emailOutreach, address, at: new Date().toISOString() } })
      return reply("Saved. It goes at the bottom of every email.")
    }

    case "import": {
      if (input.consent !== true) return err("Tick the box to confirm these are your customers.")
      const incoming: Contact[] = []
      let bad = 0
      if (input.paste?.trim()) {
        const p = parseContacts(input.paste, "paste")
        incoming.push(...p.contacts)
        bad += p.bad
      }
      const ids = (input.file ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 5)
      for (const id of ids) {
        const row = await db.mockActivity.findFirst({ where: { id, userId: user.id, type: "email_import_staged" } })
        if (!row) continue
        const m = row.metadata as { contacts?: Contact[]; bad?: number } | null
        incoming.push(...(m?.contacts ?? []))
        bad += m?.bad ?? 0
        await db.mockActivity.delete({ where: { id: row.id } }).catch(() => null)
      }
      if (!incoming.length) return err(bad ? "I couldn’t find any email addresses in that. Use one customer per line." : "Paste some customers or choose a CSV first.")
      const r = await addContacts(user.id, incoming, ids.length ? "csv" : "paste")
      const parts = [`Added ${r.added.toLocaleString("en-US")} ${r.added === 1 ? "person" : "people"}. Your list has ${r.total.toLocaleString("en-US")}.`]
      if (r.already) parts.push(`${r.already} were already on it.`)
      if (r.optedOut) parts.push(`${r.optedOut} unsubscribed before, so I left them off.`)
      if (r.overCap) parts.push(`${r.overCap} didn’t fit: the list holds up to 2,000.`)
      if (bad) parts.push(`${bad} line${bad === 1 ? "" : "s"} had no email address.`)
      return reply(parts.join(" "))
    }

    case "clear":
      await clearContacts(user.id)
      return reply("Done. Your customer list is empty, and I won’t email anyone until you add people again.")

    case "write": {
      const existing = (await listCampaigns(user.id, 10))
      const drafts = existing.filter((r) => r.c.status === "draft")
      const avoid = existing.filter((r) => r.c.status === "sent").slice(0, 4).map((r) => r.c.subject)
      let made: Awaited<ReturnType<typeof createCampaign>>
      try {
        made = await once(`email-write:${user.id}`, async () => {
          const c = await writeCampaign(user.id, { topic: input.topic, avoid })
          for (const d of drafts) await updateCampaign(d.id, { status: "deleted" })
          return createCampaign(user.id, { v: 1, status: "draft", ...c })
        })
      } catch (e) {
        if (isQuotaError(e)) return err(e.message)
        throw e
      }
      return reply(undefined, drafts.map((d) => agent([{ kind: "text", text: "Replaced with the new draft below." }], `em-draft-${d.id}`)).filter((m) => m.id !== `em-draft-${made.id}`))
    }

    case "edit": {
      const row = input.id ? await getCampaign(user.id, input.id) : null
      if (!row || row.c.status !== "draft") return err("That draft is gone. Write a new one.")
      const subject = input.subject?.trim()
      const paragraphs = (input.body ?? "").split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean)
      if (!subject || !paragraphs.length) return err("Add a subject and the email text.")
      await updateCampaign(row.id, {
        subject: subject.slice(0, 80),
        preview: (input.preview ?? row.c.preview).trim().slice(0, 120),
        paragraphs: paragraphs.slice(0, 12),
        ...(row.c.cta && input.button?.trim() ? { cta: { ...row.c.cta, label: input.button.trim().slice(0, 40) } } : {}),
      })
      return reply("Saved your changes.")
    }

    case "test": {
      if (!input.id) return err("Which email?")
      const r = await sendTest(user.id, input.id)
      if (!r.ok) return err(r.error)
      return reply(`Sent a test copy to ${r.to}. Check how it looks, then send it.`)
    }

    case "send": {
      if (!input.id) return err("Which email?")
      const r = await startSend(user.id, input.id)
      if (!r.ok) return err(r.error)
      return reply(`Sending to ${r.count.toLocaleString("en-US")} customer${r.count === 1 ? "" : "s"} now. It takes a minute or two for a big list.`, [agent([{ kind: "text", text: "On its way." }], `em-draft-${input.id}`)])
    }

    case "stop": {
      const row = input.id ? await getCampaign(user.id, input.id) : null
      if (!row || row.c.status !== "sending") return reply()
      await updateCampaign(row.id, { status: row.c.sent ? "sent" : "failed", sentAt: new Date().toISOString(), error: "Stopped by the owner" })
      return reply(`Stopped. ${(row.c.sent ?? 0).toLocaleString("en-US")} had already gone out.`)
    }

    case "delete": {
      const row = input.id ? await getCampaign(user.id, input.id) : null
      if (row && row.c.status === "draft") await updateCampaign(row.id, { status: "deleted" })
      return reply(undefined, [agent([{ kind: "text", text: "Deleted that draft." }], `em-draft-${input.id}`)])
    }
  }
}
