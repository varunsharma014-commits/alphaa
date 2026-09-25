export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { wpCall, pingIndexNow, faqToHtml } from "@/lib/connector/wordpress"
import { generateLlmsTxt } from "@/lib/llms-txt"
import { currentUser } from "@/lib/connector/user"

// Publishes one approved change to the owner's WordPress site through the
// plugin. Content for schema and llms.txt is read from our own records, never
// taken from the browser. Every change is logged with an id for undo.
const body = z.object({
  op: z.enum(["page", "schema", "llms", "robots"]),
  title: z.string().max(200).optional(),
  text: z.string().max(20_000).optional(),
})

type PushResult = { ok: boolean; id: string; url: string; shadowed?: boolean }

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const s = await getAgentSettings(user.id)
  if (!s.wp) return NextResponse.json({ error: "Your website isn’t connected yet." }, { status: 400 })

  let result: PushResult
  let label: string
  try {
    if (input.op === "page") {
      const text = input.text ?? ""
      if (/\[[^\]]{2,}\]/.test(text)) return NextResponse.json({ error: "Fill in the [bracketed] details first — they’re facts only you know. Tap the draft to edit it." }, { status: 400 })
      const { html, faq } = faqToHtml(text)
      if (faq.length === 0) return NextResponse.json({ error: "That draft doesn’t have any questions in it to publish." }, { status: 400 })
      const title = input.title?.trim() || faq[0].q
      const jsonld = [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }]
      result = await wpCall<PushResult>(user.id, s.wp, "page", { title, html, jsonld })
      label = `Published “${title}” to your website`
    } else if (input.op === "schema") {
      const latest = await db.schemaMarkup.findFirst({ where: { userId: user.id }, orderBy: { generatedAt: "desc" } })
      const blocks = ((latest?.schemas as { jsonLd: unknown }[] | null) ?? []).map((x) => x.jsonLd).filter(Boolean)
      if (!blocks.length) return NextResponse.json({ error: "I haven’t written your structured facts yet." }, { status: 400 })
      result = await wpCall<PushResult>(user.id, s.wp, "schema", { blocks })
      label = "Added your structured facts to your website’s header"
    } else if (input.op === "llms") {
      result = await wpCall<PushResult>(user.id, s.wp, "llms", { text: generateLlmsTxt(user) })
      label = "Published llms.txt on your website"
    } else {
      result = await wpCall<PushResult>(user.id, s.wp, "robots")
      label = "Opened robots.txt to AI search assistants"
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Your website didn’t accept it: ${msg}. Nothing changed.` }, { status: 502 })
  }

  const indexed = input.op === "page" || input.op === "schema" ? await pingIndexNow(user.id, s.wp.siteUrl, [result.url]) : false
  await db.mockActivity.create({
    data: { userId: user.id, type: "site_change", title: label, metadata: { op: input.op, changeId: result.id, url: result.url, indexed, undone: false } },
  })
  return NextResponse.json({ url: result.url, changeId: result.id, indexed, shadowed: !!result.shadowed })
}
