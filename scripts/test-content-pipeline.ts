// Tests for the long-form content pipeline: Markdown → HTML (lib/markdown.ts), the placeholder
// check (lib/brackets.ts), per-platform HTML (lib/connector/html-adapt.ts + Wix Ricos), the
// writer's facts-only number check (lib/content-check.ts) and the page reader's robots rules.
// Pure by default (no database, no network):
//   npx tsx scripts/test-content-pipeline.ts
// With --live <owner-site> <competitor-site>: also reads the real sites (sitemaps, robots,
// competitor pages) the way the gap analysis does. Still no database and no AI calls.
import assert from "node:assert/strict"
import { mdToHtml, mdFaq, mdPlain, mdLinks } from "../src/lib/markdown"
import { hasPlaceholders, withoutPlaceholders } from "../src/lib/brackets"
import { htmlForPlatform, tablesToLists } from "../src/lib/connector/html-adapt"
import { numberProblems, allowedNumbers, cleanLinks } from "../src/lib/content-check"
import * as React from "react"

// lib/page-reader → safe-fetch → connector/user → lib/auth uses React's server-only cache();
// outside Next a pass-through is enough for these tests.
const react = ((React as unknown as { default?: object }).default ?? React) as { cache?: unknown }
if (typeof react.cache !== "function") react.cache = <T,>(f: T) => f

let passed = 0
const t = (name: string, fn: () => void | Promise<void>) => Promise.resolve().then(fn).then(() => { passed++ }, (e) => { console.error(`✗ ${name}`); throw e })

async function main() {
  const { robotsAllows, parseRobotsTxt } = await import("../src/lib/page-reader")
  // ── Bug 1: Markdown links are not placeholders ─────────────────────────────────────────────
  await t("links and images are not placeholders", () => {
    assert.equal(hasPlaceholders("Read [our pricing](https://acme.com/pricing)."), false)
    assert.equal(hasPlaceholders("![A van outside the shop](https://acme.com/van.jpg)"), false)
    assert.equal(hasPlaceholders("> [!NOTE]\n> Call first."), false)
    assert.equal(hasPlaceholders("Call us at [phone number]."), true)
    assert.equal(hasPlaceholders("See [our page](https://a.com) or call [phone]."), true)
    assert.equal(hasPlaceholders("[x]"), false) // one letter is not a placeholder (unchanged rule)
  })
  await t("withoutPlaceholders keeps links", () => {
    const out = withoutPlaceholders("## Hours\nWe open at [opening time]. See [our hours page](https://acme.com/hours).\nOther line [with link](https://acme.com/x).")
    assert.ok(out.includes("[with link](https://acme.com/x)"))
    assert.ok(!out.includes("[opening time]"))
  })

  // ── Bug 2: richer, safe Markdown ───────────────────────────────────────────────────────────
  const md = `## What does it cost?
Read our [pricing page](https://acme.com/pricing) and the [guide](https://other.org/x "Guide"), *really* and **bold** with \`code <b>\`.
Bad [link](javascript:alert(1)) and http [old](http://acme.com) and <script>alert(1)</script> and [phone number].
1. First
2. Second
- a
- b
| Plan | Price | Notes |
|---|:---:|---|
| Basic | $10 | good |
| Pro | $20 | |
> [!NOTE]
> Call before 5pm.
>
> Second para.

> **Tip:** plain tip
![A blue van outside the shop](https://acme.com/van.jpg)
### Do you work weekends?
Yes, see [the booking page](/book).`
  const html = mdToHtml(md, { siteUrl: "acme.com" })
  await t("internal link has no target, external opens safely", () => {
    assert.ok(html.includes('<a href="https://acme.com/pricing">pricing page</a>'))
    assert.ok(html.includes('<a href="https://other.org/x" title="Guide" target="_blank" rel="noopener">guide</a>'))
    assert.ok(html.includes('<a href="/book">the booking page</a>'))
  })
  await t("unsafe links become text, HTML is escaped", () => {
    assert.ok(!html.includes("javascript:"))
    assert.ok(!html.includes('href="http://'))
    assert.ok(!html.includes("<script>"))
    assert.ok(html.includes("&lt;script&gt;"))
    assert.ok(html.includes("<code>code &lt;b&gt;</code>"))
  })
  await t("inline styles, lists, tables, callouts, images", () => {
    assert.ok(html.includes("<em>really</em>") && html.includes("<strong>bold</strong>"))
    assert.ok(html.includes("<ol><li>First</li><li>Second</li></ol>"))
    assert.ok(html.includes("<ul><li>a</li><li>b</li></ul>"))
    assert.ok(html.includes("<table><thead><tr><th>Plan</th><th>Price</th><th>Notes</th></tr></thead><tbody><tr><td>Basic</td><td>$10</td><td>good</td></tr><tr><td>Pro</td><td>$20</td><td></td></tr></tbody></table>"))
    assert.ok(html.includes('<blockquote class="callout callout-note"><p><strong>Note</strong></p><p>Call before 5pm.</p><p>Second para.</p></blockquote>'))
    assert.ok(html.includes('<blockquote class="callout callout-tip"><p><strong>Tip:</strong> plain tip</p></blockquote>'))
    assert.ok(html.includes('<figure><img src="https://acme.com/van.jpg" alt="A blue van outside the shop" loading="lazy"></figure>'))
    assert.ok(html.includes("<h3>Do you work weekends?</h3>"))
  })
  await t("placeholder highlight skips links", () => {
    const h = mdToHtml("See [our page](https://a.com) or call [phone number].", { highlightPlaceholders: true })
    assert.ok(h.includes('<mark class="ag-ph">[phone number]</mark>'))
    assert.ok(h.includes('<a href="https://a.com" target="_blank" rel="noopener">our page</a>'))
  })
  await t("attribute injection is escaped", () => {
    const h = mdToHtml('![x" onerror="alert(1)](https://a.com/i.jpg) [t](https://a.com/"onmouseover=1)')
    assert.ok(!/onerror="/.test(h) && !/"onmouseover/.test(h), h)
  })
  await t("ordered list start and asterisks in words", () => {
    assert.ok(mdToHtml("3. three\n4. four").startsWith('<ol start="3">'))
    assert.equal(mdToHtml("2 * 3 = 6 and 4*5"), "<p>2 * 3 = 6 and 4*5</p>")
    assert.equal(mdToHtml("snake_case_name"), "<p>snake_case_name</p>")
  })
  await t("FAQ and plain text drop Markdown", () => {
    const faq = mdFaq(md)
    assert.equal(faq[0].q, "Do you work weekends?")
    assert.equal(faq[0].a, "Yes, see the booking page.")
    assert.equal(mdPlain("A [link](https://a.com) and **b**"), "A link and b")
    assert.deepEqual(mdLinks("x [a](https://a.com) ![i](https://a.com/i.jpg)"), [{ text: "a", url: "https://a.com" }])
  })

  // ── Every connector keeps the content ──────────────────────────────────────────────────────
  await t("WordPress and Shopify get the HTML as is", () => {
    assert.equal(htmlForPlatform(html, "wordpress"), html)
    assert.equal(htmlForPlatform(html, "shopify"), html)
  })
  await t("Webflow: tables become lists, code text, Webflow image figure, one-block quote", () => {
    const w = htmlForPlatform(html, "webflow")
    assert.ok(!w.includes("<table") && !w.includes("<code>"))
    assert.ok(w.includes("<li><strong>Basic</strong>: Price: $10; Notes: good</li>"))
    assert.ok(w.includes("<li><strong>Pro</strong>: Price: $20</li>"))
    assert.ok(w.includes('<figure class="w-richtext-align-fullwidth w-richtext-figure-type-image"><div><img src="https://acme.com/van.jpg" alt="A blue van outside the shop"></div></figure>'))
    assert.ok(w.includes("<blockquote><strong>Note</strong><br>Call before 5pm.<br>Second para.</blockquote>"))
    assert.ok(w.includes("code &lt;b&gt;"))
  })
  await t("tables without a header still keep every cell", () => {
    assert.equal(tablesToLists("<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>"), "<ul><li><strong>a</strong>: b</li></ul>")
  })
  await t("Wix: blockquote + image are Ricos nodes, table words kept", async () => {
    const { htmlToRicos } = await import("../src/lib/connector/wix")
    const doc = htmlToRicos(htmlForPlatform(html, "wix"))
    const types = doc.nodes.map((n) => n.type)
    assert.ok(types.includes("BLOCKQUOTE"), types.join(","))
    assert.ok(types.includes("IMAGE"))
    assert.ok(types.includes("ORDERED_LIST"))
    const img = doc.nodes.find((n) => n.type === "IMAGE")!
    assert.equal((img.imageData as { altText: string }).altText, "A blue van outside the shop")
    const q = doc.nodes.find((n) => n.type === "BLOCKQUOTE")!
    assert.equal(q.nodes.length, 3) // label + 2 paragraphs
    const text = JSON.stringify(doc)
    assert.ok(text.includes("Basic") && text.includes("$20") && text.includes("code <b>"))
    assert.ok(text.includes('"url":"https://acme.com/pricing"'))
  })

  // ── Facts-only number check (writer) ───────────────────────────────────────────────────────
  await t("numbers must come from the facts", () => {
    const allowed = allowedNumbers(["Open since 2009. Plans from $49 per month. 4.8 stars on Google.", "Topic: 3 ways to save"])
    assert.deepEqual(numberProblems("We opened in 2009 and plans start at $49. Here are 3 ways to save.", allowed), [])
    assert.deepEqual(numberProblems("We have 25 years of experience.", allowed), ["25 years"])
    assert.deepEqual(numberProblems("Save 30% today.", allowed), ["30%"])
    assert.deepEqual(numberProblems("It costs $99.", allowed), ["$99"])
    // Counting words for the article itself are fine; list numbers and link URLs are not checked.
    assert.deepEqual(numberProblems("1. Check the roof\n2. Call us\nHere are 5 questions to ask. See [page](https://a.com/2024/guide-7).", allowed), [])
    assert.deepEqual(numberProblems("Most jobs take 2 hours.", allowed), ["2 hours"])
  })
  await t("links: only the owner's site and listed targets stay linked", () => {
    const md2 = "See [pricing](https://acme.com/pricing), [rival](https://rival.com/x), [insecure](http://acme.com/a) and [ours](/about)."
    const out = cleanLinks(md2, { siteHost: "acme.com", allowed: ["https://acme.com/pricing"] })
    assert.equal(out, "See [pricing](https://acme.com/pricing), rival, insecure and [ours](https://acme.com/about).")
  })

  // ── Robots rules for the page reader ───────────────────────────────────────────────────────
  await t("robots: our agent group, then *; longest match wins", () => {
    const g = parseRobotsTxt("User-agent: *\nDisallow: /private\nAllow: /private/ok\n\nUser-agent: AlphaaBot\nDisallow: /blog/drafts\n")
    assert.equal(robotsAllows(g, "/private/x", "AlphaaBot"), true) // AlphaaBot has its own group
    assert.equal(robotsAllows(g, "/blog/drafts/1", "AlphaaBot"), false)
    assert.equal(robotsAllows(g, "/private/x", "OtherBot"), false)
    assert.equal(robotsAllows(g, "/private/ok/1", "OtherBot"), true)
    assert.equal(robotsAllows(parseRobotsTxt("User-agent: *\nDisallow: /\n"), "/", "AlphaaBot"), false)
    assert.equal(robotsAllows(parseRobotsTxt(""), "/anything", "AlphaaBot"), true)
    assert.equal(robotsAllows(parseRobotsTxt("User-agent: *\nDisallow: /*.pdf$\n"), "/a.pdf", "AlphaaBot"), false)
  })

  console.log(`✓ ${passed} content pipeline tests passed`)

  const i = process.argv.indexOf("--live")
  if (i > 0) {
    const [own, rival] = process.argv.slice(i + 1)
    const { readSitemap, readArticle, pickCompetitorPages } = await import("../src/lib/page-reader")
    console.log(`\nLive read: ${own} vs ${rival}`)
    const [mine, theirs] = await Promise.all([readSitemap(own, 300), readSitemap(rival, 300)])
    console.log(`  ${own}: ${mine.urls.length} sitemap URLs (${mine.source})`)
    console.log(`  ${rival}: ${theirs.urls.length} sitemap URLs (${theirs.source})`)
    const picks = pickCompetitorPages(theirs.urls, { max: 4 })
    for (const u of picks) {
      const a = await readArticle(u.url)
      console.log(a.ok ? `  read ${u.url}: “${a.page.title}” ${a.page.words} words, ${a.page.headings.length} headings` : `  skipped ${u.url}: ${a.reason}`)
    }
  }
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
