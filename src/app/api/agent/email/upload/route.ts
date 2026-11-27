export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { parseContacts } from "@/lib/email-campaigns/store"

// The CSV field of the "Add my customers" form posts here first. The file is parsed and staged
// (MockActivity email_import_staged, read once by POST /api/agent/email op "import"); the
// file itself is not kept.
const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPro(user)) return NextResponse.json({ error: "Email to your customers comes with the Pro plan." }, { status: 403 })
  let file: File | null = null
  try {
    const f = (await req.formData()).get("file")
    file = f instanceof File ? f : null
  } catch {
    return NextResponse.json({ error: "That upload didn’t come through. Try again." }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: "Choose a CSV file first." }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: `${file.name} is over 2 MB. Export only names and emails and try again.` }, { status: 413 })
  if (!/\.(csv|txt)$/i.test(file.name) && !/text\/(csv|plain)/i.test(file.type)) return NextResponse.json({ error: `${file.name} isn’t a CSV. Export your list as CSV and try again.` }, { status: 415 })
  const { contacts, bad } = parseContacts(await file.text(), "csv")
  if (!contacts.length) return NextResponse.json({ error: `I couldn’t find any email addresses in ${file.name}.` }, { status: 400 })
  const row = await db.mockActivity.create({ data: { userId: user.id, type: "email_import_staged", title: file.name.slice(0, 120), metadata: { contacts, bad } } })
  return NextResponse.json({ id: row.id })
}
