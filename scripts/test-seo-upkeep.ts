// Tests for page-level SEO decay (lib/seo/decay.ts), link checks (lib/seo/links.ts + the crawler's
// buildLinkIssues), the refresh/link-fix HTML helpers (lib/seo/article-html.ts) and the connector
// URL matchers used by refresh updates. No database; no network unless --live.
//   npx tsx scripts/test-seo-upkeep.ts
//   npx tsx scripts/test-seo-upkeep.ts --live https://example.com   (read-only: crawls + checks links, reads one article)
import assert from "node:assert/strict"
import type { PageSnapshot, PageStat } from "../src/lib/seo/decay"
import type { LinkCheck } from "../src/lib/seo/links"

let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    passed++
  } catch (e) {
    console.error(`✗ ${name}`)
    throw e
  }
}

const row = (o: Partial<PageStat>): PageStat => ({ page: "https://x.com/a", clicks: 0, impressions: 0, position: 0, pClicks: 0, pImpressions: 0, pPosition: 0, ...o })

async function main() {
  // lib/auth.ts (pulled in through safe-fetch) uses React's server-only cache(); outside Next it isn't there.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require("react") as { cache?: unknown }
  if (typeof react.cache !== "function") react.cache = (fn: unknown) => fn

  const { DECAY, detectDecay, evidenceLines, mergeWindows, signalsFor, winLabel } = await import("../src/lib/seo/decay")
  const { gscWindows } = await import("../src/lib/gsc")
  const { classify, stateText } = await import("../src/lib/seo/links")
  const { buildLinkIssues, crawlWebsite } = await import("../src/lib/crawler")
  const { extractArticle, fixLinks, newNumbers, plainMarkdown, sanitizeArticle, stampUpdated } = await import("../src/lib/seo/article-html")
  const { webflowItemSlug } = await import("../src/lib/connector/webflow")
  const { matchShopifyPath } = await import("../src/lib/connector/shopify")
  const { updateBlocker } = await import("../src/lib/connector/publish")

  // ---- windows ----
  await test("gscWindows: two back-to-back 28-day windows ending on a Sunday ≥3 days ago", () => {
    const { cur, prev } = gscWindows(new Date("2026-11-28T12:00:00Z")) // a Saturday
    assert.equal(cur.end, "2026-11-22") // Nov 25 → back to Sunday Nov 22
    assert.equal(cur.start, "2026-10-26")
    assert.equal(prev.end, "2026-10-25")
    assert.equal(prev.start, "2026-09-28")
    assert.equal(new Date(`${cur.end}T00:00:00Z`).getUTCDay(), 0)
    // Same week → same windows (one snapshot per week)
    assert.deepEqual(gscWindows(new Date("2026-11-30T01:00:00Z")).cur, cur)
    assert.equal(winLabel(cur), "Oct 26 – Nov 22")
  })

  // ---- decay thresholds ----
  await test("clicks: ≥10 before, ≥30% and ≥5 lost", () => {
    assert.deepEqual(signalsFor(row({ pClicks: 20, clicks: 13 })).map((s) => s.kind), ["clicks"]) // -35%, -7
    assert.equal(signalsFor(row({ pClicks: 20, clicks: 15 })).length, 0) // -25%
    assert.equal(signalsFor(row({ pClicks: 9, clicks: 0 })).length, 0) // too small to tell
    assert.equal(signalsFor(row({ pClicks: 12, clicks: 8 })).length, 0) // -33% but only 4 clicks
  })
  await test("impressions: ≥200 before, ≥30% and ≥100 lost", () => {
    assert.deepEqual(signalsFor(row({ pImpressions: 400, impressions: 250 })).map((s) => s.kind), ["impressions"])
    assert.equal(signalsFor(row({ pImpressions: 190, impressions: 10 })).length, 0)
    assert.equal(signalsFor(row({ pImpressions: 300, impressions: 210 })).length, 0) // -30% but only 90
  })
  await test("position: ≥50 impressions both windows, was ≤30, ≥3 places lower", () => {
    const s = signalsFor(row({ pImpressions: 80, impressions: 70, pPosition: 6.2, position: 9.4 }))
    assert.deepEqual(s, [{ kind: "position", before: 6.2, after: 9.4 }])
    assert.equal(signalsFor(row({ pImpressions: 80, impressions: 40, pPosition: 6, position: 12 })).length, 0)
    assert.equal(signalsFor(row({ pImpressions: 80, impressions: 70, pPosition: 45, position: 60 })).length, 0)
    assert.equal(signalsFor(row({ pImpressions: 80, impressions: 70, pPosition: 6, position: 8.5 })).length, 0)
  })
  await test("detectDecay ranks by clicks lost, then impressions, then places", () => {
    const snap: PageSnapshot = {
      cur: { start: "2026-10-26", end: "2026-11-22" },
      prev: { start: "2026-09-28", end: "2026-10-25" },
      at: "2026-11-28T00:00:00Z",
      rows: [
        row({ page: "https://x.com/small", pClicks: 3, clicks: 0 }),
        row({ page: "https://x.com/pos", pImpressions: 100, impressions: 100, pPosition: 4, position: 9 }),
        row({ page: "https://x.com/big", pClicks: 48, clicks: 21, pImpressions: 900, impressions: 700 }),
        row({ page: "https://x.com/mid", pClicks: 15, clicks: 6 }),
      ],
    }
    const d = detectDecay(snap)
    assert.deepEqual(d.map((p) => p.path), ["/big", "/mid", "/pos"])
    assert.equal(d[0].lostClicks, 27)
    const ev = evidenceLines(d[0], snap)
    assert.equal(ev[0], "Clicks from Google: 48 → 21 (−56%), Sep 28 – Oct 25 vs Oct 26 – Nov 22")
    assert.equal(detectDecay(null).length, 0)
    assert.equal(DECAY.clickDropPct, 0.3)
  })
  await test("mergeWindows: a page gone from a complete list counts as 0; from a truncated list it is skipped", () => {
    const cur = [{ page: "a", clicks: 5, impressions: 50, position: 3 }]
    const prev = [{ page: "a", clicks: 9, impressions: 80, position: 2 }, { page: "b", clicks: 30, impressions: 300, position: 4 }]
    const m = mergeWindows(cur, prev, 250)
    assert.equal(m.length, 2)
    assert.deepEqual(m.find((r) => r.page === "b"), { page: "b", clicks: 0, impressions: 0, position: 0, pClicks: 30, pImpressions: 300, pPosition: 4 })
    assert.equal(mergeWindows(cur, prev, 1).length, 1)
  })

  // ---- link checks ----
  await test("classify: 404/410 broken, bot walls blocked, DNS broken, timeout unreachable", () => {
    assert.equal(classify(200), "ok")
    assert.equal(classify(301), "ok")
    assert.equal(classify(404), "broken")
    assert.equal(classify(410), "broken")
    assert.equal(classify(403), "blocked")
    assert.equal(classify(999), "blocked")
    assert.equal(classify(429), "blocked")
    assert.equal(classify(503), "unreachable")
    assert.equal(classify(null, "TypeError: fetch failed ENOTFOUND"), "broken")
    assert.equal(classify(null, "TimeoutError: The operation was aborted due to timeout"), "unreachable")
    assert.equal(stateText({ status: 404, state: "broken" }), "is missing (404)")
  })
  await test("buildLinkIssues: broken internal (with sources), redirect chains >1 hop, broken outbound; blocked/1-hop ignored", () => {
    const c = (url: string, status: number | null, hops: string[] = [], error?: string): LinkCheck => ({ url, status, state: classify(status, error), hops, finalUrl: hops.at(-1) ?? url, error })
    const internalFrom = new Map([
      ["https://x.com/gone", { target: "https://x.com/gone", sources: new Set(["https://x.com/", "https://x.com/blog/a"]) }],
      ["https://x.com/old", { target: "https://x.com/old", sources: new Set(["https://x.com/blog/a"]) }],
      ["https://x.com/one", { target: "https://x.com/one", sources: new Set(["https://x.com/"]) }],
      ["https://x.com/ok", { target: "https://x.com/ok", sources: new Set(["https://x.com/"]) }],
      ["https://x.com/seed", { target: "https://x.com/seed", sources: new Set<string>() }],
    ])
    const fetched = new Map([
      ["https://x.com/gone", c("https://x.com/gone", 404)],
      ["https://x.com/old", c("https://x.com/old", 200, ["https://x.com/old/", "https://x.com/new"])],
      ["https://x.com/one", c("https://x.com/one", 200, ["https://x.com/one/"])],
      ["https://x.com/ok", c("https://x.com/ok", 200)],
      ["https://x.com/seed", c("https://x.com/seed", 500)],
    ])
    const outFrom = new Map([["https://dead.example/p", new Set(["https://x.com/blog/a"])], ["https://linkedin.com/in/x", new Set(["https://x.com/"])], ["https://slow.example/", new Set(["https://x.com/"])]])
    const out = new Map([
      ["https://dead.example/p", c("https://dead.example/p", null, [], "TypeError: fetch failed ENOTFOUND")],
      ["https://linkedin.com/in/x", c("https://linkedin.com/in/x", 999)],
      ["https://slow.example/", c("https://slow.example/", null, [], "TimeoutError")],
    ])
    const issues = buildLinkIssues(internalFrom, fetched, outFrom, out)
    assert.deepEqual(issues.map((i) => `${i.type}:${i.target}`), ["broken_internal_link:https://x.com/gone", "redirect_chain:https://x.com/old", "broken_outbound_link:https://dead.example/p"])
    assert.deepEqual(issues[0].sources, ["https://x.com/", "https://x.com/blog/a"])
    assert.equal(issues[0].severity, "critical")
    assert.match(issues[0].description, /on 2 pages .*is missing \(404\)/)
    assert.equal(issues[1].finalUrl, "https://x.com/new")
    assert.equal(issues[2].severity, "warning")
  })

  // ---- article HTML ----
  const page = `<html><head><title>Teeth whitening in Ottawa | Bright Smile</title></head><body>
    <header><nav><a href="/">Home</a></nav></header>
    <article><h1>Teeth whitening in Ottawa</h1><div class="entry-content">
      <p>Our whitening takes <strong>one visit</strong> and costs $399. <a href="/book" class="btn" onclick="x()">Book now</a></p>
      <script>alert(1)</script><div class="share-buttons"><a href="https://facebook.com/sharer">Share</a></div>
      <h2>How long does it last?</h2><p>Most patients see results for a year. See <a href="https://dead.example/study">this study</a> and <a href="https://x.com/old">our guide</a>.</p>
      <ul><li>Safe for enamel</li><li>Done in 60 minutes</li></ul>
      <img src="/img/before.jpg" alt="Before and after" style="width:100%"><img src="https://tracker.example/p.gif">
      <p>${"Plenty more text about the treatment and aftercare. ".repeat(6)}</p>
    </div></article><footer><a href="/privacy">Privacy</a></footer></body></html>`
  await test("extractArticle: the body only (no nav/footer/share/script), absolute links, own images kept", () => {
    const a = extractArticle(page, "https://x.com/blog/whitening")
    assert.ok(a)
    assert.equal(a!.title, "Teeth whitening in Ottawa")
    assert.ok(!/script|alert|Share|Privacy|onclick|class=/.test(a!.html))
    assert.match(a!.html, /<a href="https:\/\/x\.com\/book">Book now<\/a>/)
    assert.match(a!.html, /<img src="https:\/\/x\.com\/img\/before\.jpg" alt="Before and after">/)
    assert.ok(a!.links.includes("https://dead.example/study"))
    assert.ok(!a!.html.includes("<h1"))
  })
  await test("sanitizeArticle: links not allowed lose the tag (keep words); images not allowed are dropped", () => {
    const out = sanitizeArticle('<h1>T</h1><p>See <a href="https://spam.example/x">this</a> and <a href="https://x.com/a">that</a> <img src="https://x.com/new.jpg"></p><div><span>kept</span></div>', "https://x.com/", { allowHref: (u) => u.startsWith("https://x.com/"), allowImg: new Set() })
    assert.equal(out, '<h2>T</h2><p>See this and <a href="https://x.com/a">that</a> </p>kept')
  })
  await test("fixLinks: unwrap broken links, repoint redirect chains", () => {
    const a = extractArticle(page, "https://x.com/blog/whitening")!
    const f = fixLinks(a.html, "https://x.com/blog/whitening", new Set(["https://dead.example/study"]), new Map([["https://x.com/old/", "https://x.com/new"]]))
    assert.equal(f.removed, 1)
    assert.equal(f.repointed, 1)
    assert.match(f.html, /See this study and <a href="https:\/\/x\.com\/new">our guide<\/a>/)
  })
  await test("stampUpdated replaces an older stamp; plainMarkdown has no links or brackets", () => {
    const once = stampUpdated("<p>Hi</p>", new Date("2026-11-28T00:00:00Z"))
    assert.equal(once, "<p><em>Updated November 28, 2026</em></p>\n<p>Hi</p>")
    assert.equal(stampUpdated(once, new Date("2026-12-02T00:00:00Z")), "<p><em>Updated December 2, 2026</em></p>\n<p>Hi</p>")
    const md = plainMarkdown('<h2>Q?</h2><p>See <a href="https://x.com">[this]</a></p><ul><li>a</li><li>b</li></ul>')
    assert.equal(md, "## Q?\n\nSee (this)\n\n- a\n- b")
  })
  await test("newNumbers: flags numbers not in the sources (single digits and this year are fine)", () => {
    assert.deepEqual(newNumbers("Costs $399, takes 60 minutes, 3 steps, 95% success since 2015", "costs $399 in 60 minutes"), ["95", "2015"])
    assert.deepEqual(newNumbers(`Updated in ${new Date().getUTCFullYear()}`, ""), [])
  })

  // ---- connectors: which URLs can be updated ----
  await test("webflowItemSlug / matchShopifyPath / updateBlocker", () => {
    assert.equal(webflowItemSlug("https://x.com/blog/My-Post/", "blog"), "my-post")
    assert.equal(webflowItemSlug("https://x.com/about", "blog"), null)
    assert.deepEqual(matchShopifyPath("https://shop.com/blogs/news/hello"), { type: "article", blog: "news", handle: "hello" })
    assert.equal(updateBlocker({ wp: { siteUrl: "https://www.x.com/" } }, "https://x.com/blog/a"), null)
    assert.match(updateBlocker({ wp: { siteUrl: "https://x.com/" } }, "https://other.com/a") ?? "", /isn’t on the WordPress site/)
    assert.match(updateBlocker({}, "https://x.com/a") ?? "", /isn’t connected/)
    const site = { platform: "webflow" as const, siteUrl: "https://x.com", label: "x.com", tokenEnc: "", config: {}, connectedAt: "" }
    assert.equal(updateBlocker({ site }, "https://x.com/blog/a"), null)
  })

  console.log(`✓ ${passed} passed`)

  const live = process.argv.indexOf("--live")
  if (live > 0 && process.argv[live + 1]) {
    const target = process.argv[live + 1]
    console.log(`\nLive (read-only) crawl of ${target} with link checks…`)
    const t0 = Date.now()
    const out = await crawlWebsite(target, 15, { checkLinks: true, linkBudgetMs: 15_000 })
    console.log(`${out.pagesScanned} pages, ${out.metaIssues.linksChecked} internal + ${out.metaIssues.outboundChecked} outbound links checked in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
    for (const i of out.issues.filter((x) => x.target)) console.log(` - ${i.type} ${i.target} ${i.status ?? ""} ← ${i.sources?.slice(0, 2).join(", ")}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
