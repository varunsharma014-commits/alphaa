// Builds the "email it to my web person" message: what the change is, why it
// matters for being recommended by AI, where it goes, and how to check it.
// Shared by the API route and scripts, so a test email is the real email.
import { db } from "@/lib/db"
import { generateLlmsTxt } from "@/lib/llms-txt"
import { faqToHtml, mdToHtml, mdFaq } from "@/lib/connector/wordpress"
import { parseMeta } from "@/lib/content"
import { codeBox, esc, shell } from "@/lib/connector/mail"

export type HandoffWhat = "schema" | "llms" | "page" | "robots" | "post" | "meta" | "sitemap" | "headers"
export type HandoffInput = { what: HandoffWhat; title?: string; text?: string; url?: string }
type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

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

function why(what: HandoffWhat, biz: string, user: U): string {
  const where = user.city ? ` in ${user.city}` : ""
  switch (what) {
    case "schema": return `When someone asks ChatGPT, Gemini or Google for a business like ${esc(biz)}${esc(where)}, the AI favours businesses whose facts it can read with confidence. Structured data states ${esc(biz)}’s facts in the format these systems are built to read, so they don’t have to guess — or skip us.`
    case "llms": return "AI assistants increasingly look for a short, plain summary of a business. This file gives them one in our own words instead of leaving them to piece it together from scattered pages."
    case "robots": return "Some AI search crawlers are currently being turned away from the site. If an assistant can’t read our pages, it recommends businesses whose pages it can."
    case "meta": return "The page title and description are the first thing Google and AI assistants read about a page. Saying clearly what we do and where makes it far more likely we’re the business they name."
    case "headers": return "Browsers, security scanners and some crawlers treat sites without these standard headers as less trustworthy. They take minutes to add and don’t change how the site looks."
    case "sitemap": return "A sitemap lets search engines and AI crawlers find every page, so new pages get picked up in days rather than weeks."
    case "post":
    case "page": return `AI assistants quote pages that answer customers’ questions directly. This one answers a question people are asking AI right now — where ${esc(biz)} isn’t currently being named.`
  }
}

export async function buildHandoffEmail(user: U, input: HandoffInput): Promise<{ subject: string; html: string; text: string } | { error: string }> {
  const biz = user.businessName || "our business"
  const site = user.websiteUrl || "our website"
  let subject: string, what: string, where: string, check: string, code: string
  if (input.what === "schema") {
    const latest = await db.schemaMarkup.findFirst({ where: { userId: user.id }, orderBy: { generatedAt: "desc" } })
    const blocks = ((latest?.schemas as { jsonLd: unknown }[] | null) ?? []).map((x) => x.jsonLd).filter(Boolean)
    if (!blocks.length) return { error: "I haven’t written your structured facts yet." }
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
  } else if (input.what === "meta") {
    const { title, description } = parseMeta(input.text ?? "")
    if (!title && !description) return { error: "There’s no title or description to send." }
    code = `<title>${title}</title>\n<meta name="description" content="${description.replace(/"/g, "&quot;")}">`
    subject = `${biz}: new page title and description (2 minutes)`
    what = "A clearer page title and meta description — what Google and AI assistants read first about the page."
    where = `For ${esc(input.url ?? site)}: if the site uses an SEO plugin (Yoast, Rank Math, etc.), paste them into its title and description fields for that page. Otherwise replace the page’s &lt;title&gt; and meta description with these.`
    check = "View the page source (or share the link in a chat app) and confirm the new title and description show."
  } else if (input.what === "headers") {
    code = `Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin`
    subject = `${biz}: add four standard security headers (about 10 minutes)`
    what = "Standard HTTP security headers. They tell browsers to always use HTTPS and block a few common attacks; security scanners and some AI crawlers look for them."
    where = "Add them as response headers for the whole site — in the host’s settings, the CDN (e.g. Cloudflare → Rules → Transform Rules), or the server config. Only add Strict-Transport-Security if every page works over HTTPS."
    check = "Run the homepage through https://securityheaders.com — these four should show green."
  } else if (input.what === "sitemap") {
    code = `Sitemap: ${site.replace(/\/$/, "")}/sitemap.xml`
    subject = `${biz}: publish an XML sitemap`
    what = "An XML sitemap listing every page, so search engines and AI crawlers find all of them."
    where = "Most site builders and SEO plugins can generate one (WordPress has one built in at /wp-sitemap.xml). Then add the line below to /robots.txt, pointing at the real sitemap address, and submit it in Google Search Console and Bing Webmaster Tools."
    check = "Open the sitemap address in a browser — it should list your pages."
  } else if (input.what === "post") {
    const text = input.text ?? ""
    if (/\[[^\]]{2,}\]/.test(text)) return { error: "Fill in the [bracketed] details first — tap the draft to edit it." }
    const faq = mdFaq(text)
    code = `${mdToHtml(text)}${faq.length ? `\n\n<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }, null, 2)}\n</script>` : ""}`
    subject = `${biz}: new blog post to publish — “${input.title ?? "New post"}”`
    what = "A blog post we approved. Headings are questions and each section opens with the direct answer — that’s what AI assistants quote."
    where = "Publish it as a new blog post with this title, keeping the headings as H2/H3. The script tag (if any) goes on the same page."
    check = "Load the post and run it through https://validator.schema.org."
  } else {
    const text = input.text ?? ""
    if (/\[[^\]]{2,}\]/.test(text)) return { error: "Fill in the [bracketed] details first — tap the draft to edit it." }
    if (!/^Q:/im.test(text)) {
      const faq = mdFaq(text)
      code = `${mdToHtml(text)}${faq.length ? `\n\n<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }, null, 2)}\n</script>` : ""}`
      subject = `${biz}: publish a new page — “${input.title ?? "New page"}”`
      what = "A new page we approved, written so AI assistants can quote it."
      where = "Publish it as a new page with this title, keeping the headings. The script tag (if any) goes on the same page."
      check = "Load the page and run it through https://validator.schema.org."
    } else {
    const { html, faq } = faqToHtml(text)
    if (!faq.length) return { error: "That draft is empty." }
    const jsonld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    code = `${html}\n\n<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n</script>`
    subject = `${biz}: publish a new FAQ page — “${input.title ?? faq[0].q}”`
    what = "A short FAQ page we approved. Each question is a heading; the first sentence of each answer answers it directly — that’s what AI assistants quote."
    where = "Publish it as a new page (or a section on the relevant service page). Keep the questions as H2 headings. The script tag goes on the same page."
    check = "Load the page and run it through https://validator.schema.org — it should show an FAQPage."
    }
  }

  const owner = user.fullName || biz
  const reason = why(input.what, biz, user)
  const inner = `<p style="margin:0 0 16px">Hi,</p>
<p style="margin:0 0 16px">${esc(owner)} asked us to send you a small website update for <b>${esc(biz)}</b>. It’s ready to paste — most people finish it in a few minutes.</p>
<p style="margin:0 0 4px"><b>Why it matters</b></p><p style="margin:0 0 16px">${reason}</p>
<p style="margin:0 0 4px"><b>What it is</b></p><p style="margin:0 0 16px">${what}</p>
<p style="margin:0 0 4px"><b>Where it goes</b></p><p style="margin:0 0 4px">${where}</p>
${codeBox(code)}
<p style="margin:0 0 4px"><b>How to check it</b></p><p style="margin:0 0 16px">${check}</p>
<p style="margin:0">Questions? Just reply — your reply goes straight to ${esc(owner)}.</p>
<p style="margin:16px 0 0;color:#6e6e73">Thank you,<br>Alphaa, on behalf of ${esc(biz)}</p>`
  const plain = (h: string) => h.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
  const text = `Hi,\n\n${owner} asked us to send you a small website update for ${biz}. It’s ready to paste.\n\nWHY IT MATTERS\n${plain(reason)}\n\nWHAT IT IS\n${plain(what)}\n\nWHERE IT GOES\n${plain(where)}\n\n${code}\n\nHOW TO CHECK IT\n${plain(check)}\n\nQuestions? Just reply — your reply goes straight to ${owner}.\n\nThank you,\nAlphaa, on behalf of ${biz}`
  return {
    subject,
    html: shell(inner, `Sent by Alphaa on behalf of ${esc(biz)}. Alphaa is the AI agent ${esc(biz)} uses to get recommended by AI assistants like ChatGPT.`),
    text,
  }
}
