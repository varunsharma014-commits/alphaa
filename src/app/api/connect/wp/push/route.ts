export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { wpCall, pingIndexNow, faqToHtml, mdToHtml, mdFaq } from "@/lib/connector/wordpress"
import { parseMeta } from "@/lib/content"
import { generateLlmsTxt } from "@/lib/llms-txt"
import { currentUser } from "@/lib/connector/user"

// Publishes one approved change to the owner's WordPress site through the
// plugin. Content for schema and llms.txt is read from our own records, never
// taken from the browser. Every change is logged with an id for undo.
const body = z.object({
  op: z.enum(["page", "schema", "llms", "robots", "post", "meta", "sitemap", "headers"]),
  title: z.string().max(200).optional(),
  text: z.string().max(30_000).optional(),
  url: z.string().url().max(500).optional(), // meta: which page
  locationId: z.string().max(40).optional(), // page: a location page gets that location's LocalBusiness data
  draftId: z.string().max(40).optional(), // post: the post_draft row to mark published
})

const faqLd = (faq: { q: string; a: string }[]) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) })
const hasBrackets = (t: string) => /\[[^\]]{2,}\]/.test(t)
const BRACKETS = "Fill in the [bracketed] details first — they’re facts only you know. Tap the draft to edit it."

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
      if (hasBrackets(text)) return NextResponse.json({ error: BRACKETS }, { status: 400 })
      let html: string, faq: { q: string; a: string }[]
      if (/^Q:/im.test(text)) ({ html, faq } = faqToHtml(text))
      else { html = mdToHtml(text); faq = mdFaq(text) }
      if (!html.trim()) return NextResponse.json({ error: "That draft is empty." }, { status: 400 })
      const title = input.title?.trim() || faq[0]?.q || "New page"
      const jsonld: object[] = faq.length ? [faqLd(faq)] : []
      if (input.locationId) {
        const loc = s.locations?.find((l) => l.id === input.locationId)
        if (loc) jsonld.push({
          "@context": "https://schema.org", "@type": "LocalBusiness",
          name: `${user.businessName ?? loc.name} — ${loc.city}`,
          address: { "@type": "PostalAddress", streetAddress: loc.street, addressLocality: loc.city, addressRegion: loc.state, postalCode: loc.zip },
          ...(loc.phone ? { telephone: loc.phone } : {}),
          ...(user.websiteUrl ? { parentOrganization: { "@type": "Organization", name: user.businessName, url: user.websiteUrl } } : {}),
        })
      }
      result = await wpCall<PushResult>(user.id, s.wp, "page", { title, html, jsonld })
      label = `Published “${title}” to your website`
    } else if (input.op === "post") {
      const text = input.text ?? ""
      if (hasBrackets(text)) return NextResponse.json({ error: BRACKETS }, { status: 400 })
      const title = input.title?.trim() || "New post"
      const faq = mdFaq(text)
      const jsonld: object[] = [{ "@context": "https://schema.org", "@type": "BlogPosting", headline: title, datePublished: new Date().toISOString(), author: { "@type": "Organization", name: user.businessName ?? undefined }, publisher: { "@type": "Organization", name: user.businessName ?? undefined } }]
      if (faq.length) jsonld.push(faqLd(faq))
      result = await wpCall<PushResult>(user.id, s.wp, "post", { title, html: mdToHtml(text), jsonld })
      label = `Published the post “${title}”`
      if (input.draftId) {
        const row = await db.mockActivity.findFirst({ where: { id: input.draftId, userId: user.id, type: "post_draft" } })
        if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...(row.metadata as object), status: "published", url: result.url } } })
      }
    } else if (input.op === "meta") {
      const { title, description } = parseMeta(input.text ?? "")
      if (!title && !description) return NextResponse.json({ error: "I need a title or a description to publish." }, { status: 400 })
      if (hasBrackets(`${title} ${description}`)) return NextResponse.json({ error: BRACKETS }, { status: 400 })
      result = await wpCall<PushResult>(user.id, s.wp, "meta", { url: input.url ?? s.wp.siteUrl, title, description })
      label = "Updated your page title and description"
    } else if (input.op === "sitemap") {
      result = await wpCall<PushResult>(user.id, s.wp, "sitemap")
      label = "Turned on your sitemap"
    } else if (input.op === "headers") {
      result = await wpCall<PushResult>(user.id, s.wp, "headers")
      label = "Added basic security headers to your site"
    } else if (input.op === "schema") {
      const latest = await db.schemaMarkup.findFirst({ where: { userId: user.id }, orderBy: { generatedAt: "desc" } })
      // Profiles the owner confirmed become sameAs on the main entity.
      const profiles = s.profiles ?? []
      const blocks = ((latest?.schemas as { jsonLd: unknown }[] | null) ?? []).map((x) => x.jsonLd).filter(Boolean).map((b, i) => {
        if (i !== 0 || !profiles.length || typeof b !== "object") return b
        const o = b as Record<string, unknown>
        const prev = Array.isArray(o.sameAs) ? (o.sameAs as string[]) : o.sameAs ? [String(o.sameAs)] : []
        return { ...o, sameAs: Array.from(new Set([...prev, ...profiles])) }
      })
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

  const indexed = ["page", "post", "schema", "meta"].includes(input.op) ? await pingIndexNow(user.id, s.wp.siteUrl, [result.url]) : false
  await db.mockActivity.create({
    data: { userId: user.id, type: "site_change", title: label, metadata: { op: input.op, changeId: result.id, url: result.url, indexed, undone: false } },
  })
  return NextResponse.json({ url: result.url, changeId: result.id, indexed, shadowed: !!result.shadowed })
}
