export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { saveAgentSettings } from "@/lib/agent/settings"
import { generateLlmsTxt } from "@/lib/llms-txt"
import { faqToHtml } from "@/lib/connector/wordpress"
import { codeBox, esc, sendAs, shell } from "@/lib/connector/mail"

// "Email it to my web person": sends the exact code or content, with where it
// goes and how to check it, to the owner's developer. Replies go to the owner.
const body = z.object({
  what: z.enum(["schema", "llms", "page", "robots"]),
  email: z.string().email().max(200),
  title: z.string().max(200).optional(),
  text: z.string().max(20_000).optional(),
})

const ROBOTS = `# Let AI search assistants read the site
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /`

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "That email address doesn’t look right." }, { status: 400 })
  }
  const today = await db.mockActivity.count({ where: { userId: user.id, type: "handoff_sent", createdAt: { gte: new Date(Date.now() - 86_400_000) } } })
  if (today >= 20) return NextResponse.json({ error: "That’s a lot of emails today — try again tomorrow." }, { status: 429 })

  const biz = user.businessName || "our business"
  const site = user.websiteUrl || "our website"
  let subject: string, what: string, where: string, check: string, code: string
  if (input.what === "schema") {
    const latest = await db.schemaMarkup.findFirst({ where: { userId: user.id }, orderBy: { generatedAt: "desc" } })
    const blocks = ((latest?.schemas as { jsonLd: unknown }[] | null) ?? []).map((x) => x.jsonLd).filter(Boolean)
    if (!blocks.length) return NextResponse.json({ error: "I haven’t written your structured facts yet." }, { status: 400 })
    code = blocks.map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`).join("\n\n")
    subject = `${biz}: add structured data to the site header (about 5 minutes)`
    what = "Structured data (JSON-LD) that tells Google, ChatGPT, Claude and Perplexity our business facts — name, services, area, phone and hours."
    where = "Paste it once into the &lt;head&gt; of every page (the site-wide header). It doesn’t change how the site looks."
    check = "Run the homepage through https://validator.schema.org — it should show the blocks with no errors."
  } else if (input.what === "llms") {
    code = generateLlmsTxt(user)
    subject = `${biz}: publish /llms.txt (about 5 minutes)`
    what = "An llms.txt file: a short plain-text summary of the business that AI assistants can read."
    where = `Save it as a plain-text file at the site root so it loads at ${esc(site.replace(/\/$/, ""))}/llms.txt (Content-Type: text/plain).`
    check = "Open /llms.txt in a browser — you should see this text."
  } else if (input.what === "robots") {
    code = ROBOTS
    subject = `${biz}: let AI search assistants read the site (robots.txt)`
    what = "robots.txt rules that allow the AI search crawlers from OpenAI, Anthropic and Perplexity. Right now they may be blocked."
    where = "Add these groups to /robots.txt. If a firewall or CDN (e.g. Cloudflare bot protection) blocks bots, allow these user agents there too — that is the more common blocker."
    check = "Open /robots.txt and confirm the groups are there and no rule disallows these bots."
  } else {
    const text = input.text ?? ""
    if (/\[[^\]]{2,}\]/.test(text)) return NextResponse.json({ error: "Fill in the [bracketed] details first — tap the draft to edit it." }, { status: 400 })
    const { html, faq } = faqToHtml(text)
    if (!faq.length) return NextResponse.json({ error: "That draft is empty." }, { status: 400 })
    const jsonld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    code = `${html}\n\n<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n</script>`
    subject = `${biz}: publish a new FAQ page — “${input.title ?? faq[0].q}”`
    what = "A short FAQ page we approved. Each question is a heading; the first sentence of each answer answers it directly — that’s what AI assistants quote."
    where = "Publish it as a new page (or a section on the relevant service page). Keep the questions as H2 headings. The script tag goes on the same page."
    check = "Load the page and run it through https://validator.schema.org — it should show an FAQPage."
  }

  const owner = user.fullName || biz
  const inner = `<p style="margin:0 0 16px">Hi,</p>
<p style="margin:0 0 16px">${esc(owner)} asked me to send you a small website update for <b>${esc(biz)}</b>. It’s ready to paste.</p>
<p style="margin:0 0 4px"><b>What it is</b></p><p style="margin:0 0 16px">${what}</p>
<p style="margin:0 0 4px"><b>Where it goes</b></p><p style="margin:0 0 4px">${where}</p>
${codeBox(code)}
<p style="margin:0 0 4px"><b>How to check it</b></p><p style="margin:0 0 16px">${check}</p>
<p style="margin:0">Questions? Just reply — it goes straight to ${esc(owner)}.</p>`
  const text = `Hi,\n\n${owner} asked me to send you a small website update for ${biz}.\n\nWHAT IT IS\n${what.replace(/&lt;|&gt;/g, "")}\n\nWHERE IT GOES\n${where.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}\n\n${code}\n\nHOW TO CHECK IT\n${check}\n\nQuestions? Just reply — it goes to ${owner}.`
  try {
    await sendAs({
      fromName: `${biz} via Alphaa`,
      to: input.email,
      replyTo: user.email,
      subject,
      html: shell(inner, `Sent by Alphaa on behalf of ${esc(biz)}. Alphaa is the AI agent ${esc(biz)} uses to get recommended by AI assistants.`),
      text,
    })
  } catch (err) {
    console.error("[handoff]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "The email didn’t send. Try again in a minute." }, { status: 502 })
  }
  await saveAgentSettings(user.id, { webPersonEmail: input.email })
  await db.mockActivity.create({ data: { userId: user.id, type: "handoff_sent", title: `Emailed ${input.what === "page" ? "a page" : input.what} to ${input.email}`, metadata: { what: input.what, to: input.email } } })
  return NextResponse.json({ ok: true })
}
