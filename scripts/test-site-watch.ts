// The weekly site check (lib/seo/site-watch.ts, /api/cron/site-check) and the weekly checks'
// per-kind dedupe (lib/checks/due.ts), against a FAKE site on localhost (never a customer site) and
// the LOCAL dev database (refuses anything else). Publishes and emails nothing.
//   npx tsx --env-file=.env.local scripts/test-site-watch.ts
// Pure parts only (no database): npx tsx scripts/test-site-watch.ts --pure
import assert from "node:assert/strict"
import http from "node:http"
import * as React from "react"

const react = ((React as unknown as { default?: object }).default ?? React) as { cache?: unknown }
if (typeof react.cache !== "function") react.cache = <T,>(f: T) => f

const PORT = 4791
const ORIGIN = `http://localhost:${PORT}`
let extraBroken = false
let robotsHits = 0
const hits: string[] = []

function server() {
  return http.createServer((req, res) => {
    const u = new URL(req.url ?? "/", ORIGIN)
    hits.push(u.pathname)
    const send = (code: number, body: string, type = "text/html", extra: Record<string, string> = {}) => { res.writeHead(code, { "Content-Type": type, ...extra }); res.end(body) }
    if (u.pathname === "/robots.txt") { robotsHits++; return send(200, "User-agent: *\nDisallow: /private\n", "text/plain") }
    if (u.pathname === "/") return send(200, `<html><head><title>Fake Plumbing</title></head><body><a href="${ORIGIN}/services">Services</a> <a href="${ORIGIN}/private/admin">Admin</a></body></html>`)
    if (u.pathname === "/services") return send(200, `<html><head><title>Services</title></head><body><article><h1>Services</h1><div class="entry-content"><p>We fix taps and pipes across the city, the same day you call. Read <a href="${ORIGIN}/gone">our old guide</a> and see <a href="${ORIGIN}/old">our prices</a>.${extraBroken ? ` Also <a href="${ORIGIN}/also-gone">this page</a>.` : ""}</p><p>Our team has fixed leaking taps, burst pipes and blocked drains for years. Every visit starts with a free look at the problem. We explain what we found, what it costs and how long it takes before any work starts, so there are no surprises on the bill.</p></div></article></body></html>`)
    if (u.pathname === "/old") return send(301, "", "text/plain", { Location: `${ORIGIN}/old/` })
    if (u.pathname === "/old/") return send(301, "", "text/plain", { Location: `${ORIGIN}/prices` })
    if (u.pathname === "/prices") return send(200, "<html><body><h1>Prices</h1></body></html>")
    if (u.pathname.startsWith("/private")) return send(500, "should never be fetched")
    send(404, "<html><body>Not found</body></html>")
  })
}

let passed = 0
const t = async (name: string, fn: () => unknown) => { await fn(); passed++; console.log(`ok - ${name}`) }

async function pure() {
  const { dueSteps, CHECK_STEPS } = await import("../src/lib/checks/due")
  const { newProblems, pagesToFix, problemKey, linkProblems } = await import("../src/lib/seo/site-watch")
  await t("checks dedupe: nothing stored = every kind runs; stored kinds are skipped (resume after a cut-off run)", () => {
    assert.deepEqual(dueSteps([]), CHECK_STEPS)
    assert.deepEqual(dueSteps(["check_security", "check_profiles"]), ["listings", "bing", "site"])
    assert.deepEqual(dueSteps(["check_security", "check_profiles", "check_listings", "check_bing", "site_check"]), [])
    assert.deepEqual(dueSteps(["site_links", "post_image"]), CHECK_STEPS)
  })
  const a = { type: "broken_internal_link" as const, target: "https://x.com/a/", status: 404, sources: ["https://x.com/p1"] }
  const b = { type: "redirect_chain" as const, target: "https://x.com/old", status: 200, sources: ["https://x.com/p1", "https://x.com/p2"] }
  const c = { type: "broken_outbound_link" as const, target: "https://dead.example/z", status: null, sources: ["https://x.com/p2"] }
  await t("site check: new = in this check, not in the last one (trailing slash / case / query ignored); first check = all new", () => {
    assert.deepEqual(newProblems(null, [a, b]), [a, b])
    assert.deepEqual(newProblems([{ ...a, target: "https://X.com/a?utm=1" }], [a, b, c]), [b, c])
    assert.equal(problemKey(a), "broken_internal_link|https://x.com/a")
    assert.deepEqual(newProblems([a, b, c], [a, b, c]), [])
  })
  await t("site check: pages with the most new problems are fixed first, max 3", () => {
    assert.deepEqual(pagesToFix([a, b, c]), ["https://x.com/p1", "https://x.com/p2"])
    assert.equal(pagesToFix([a, b, c], 1).length, 1)
  })
  await t("site check: only link issues count", () => {
    assert.deepEqual(linkProblems([{ type: "missing_title", url: "u", severity: "warning", description: "", fix: "" }, { ...a, url: a.target, severity: "critical", description: "", fix: "" }]).map((p) => p.target), [a.target])
    assert.deepEqual(linkProblems(null), [])
  })
}

async function withDb() {
  if (!/@(localhost|127\.0\.0\.1):\d+\//.test(process.env.DATABASE_URL ?? "")) throw new Error("Refusing to run: DATABASE_URL is not a local database.")
  const srv = server()
  await new Promise<void>((r) => srv.listen(PORT, r))
  const { db } = await import("../src/lib/db")
  const { weeklySiteCheck, pendingLinkNews, SITE_LINKS } = await import("../src/lib/seo/site-watch")
  const user = await db.user.create({ data: { clerkId: `test_sitewatch_${Date.now()}`, email: `sitewatch-${Date.now()}@example.com`, businessName: "Fake Plumbing", businessType: "plumber", city: "Ottawa", websiteUrl: ORIGIN, plan: "pro", onboardingCompleted: true } })
  try {
    await t("first weekly check: finds the broken link + redirect chain, notes them, drafts the fix", async () => {
      const r = await weeklySiteCheck(user)
      assert.equal(r.status, "checked")
      assert.equal(r.newProblems, 2)
      const row = await db.mockActivity.findFirst({ where: { userId: user.id, type: SITE_LINKS } })
      assert.equal(r.drafts, 1, JSON.stringify((row?.metadata as { skipped?: unknown } | null)?.skipped))
      assert.match(row!.title, /Found 2 new link problems/)
      const news = await pendingLinkNews(user.id)
      assert.equal(news?.count, 2)
      assert.equal(news?.drafts, 1)
      const drafts = await db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft" } })
      assert.equal((drafts[0].metadata as { refresh?: { kind?: string } }).refresh?.kind, "links")
    })
    await t("robots.txt is read and a disallowed page is never fetched", () => {
      assert.ok(robotsHits >= 1)
      assert.ok(!hits.some((h) => h.startsWith("/private")), `fetched: ${hits.filter((h) => h.startsWith("/private"))}`)
    })
    await t("a re-hit within 5 days skips the brand (catch-up window resumes, never repeats)", async () => {
      const before = hits.length
      assert.equal((await weeklySiteCheck(user)).status, "skipped")
      assert.equal(hits.length, before)
    })
    await t("next week: only problems that are new since the last check are reported", async () => {
      await db.crawlResult.updateMany({ where: { userId: user.id }, data: { crawledAt: new Date(Date.now() - 6 * 86_400_000) } })
      extraBroken = true
      const r = await weeklySiteCheck(user)
      assert.equal(r.status, "checked")
      assert.equal(r.newProblems, 1)
      const rows = await db.mockActivity.findMany({ where: { userId: user.id, type: SITE_LINKS }, orderBy: { createdAt: "desc" } })
      assert.equal(rows.length, 2)
      assert.equal(((rows[0].metadata as { new: { target: string }[] }).new)[0].target, `${ORIGIN}/also-gone`)
      // Last week's waiting fix is replaced by one that also fixes the new link.
      const drafts = await db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft" }, orderBy: { createdAt: "asc" } })
      assert.deepEqual(drafts.map((d) => (d.metadata as { status: string }).status), ["superseded", "ready"])
      const html = (drafts[1].metadata as { html: string }).html
      assert.ok(!html.includes("/also-gone") && !html.includes(`${ORIGIN}/gone`) && html.includes(`${ORIGIN}/prices`), html)
    })
    await t("the Briefing item goes away once the fix drafts are published or undone", async () => {
      const drafts = await db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft" } })
      for (const d of drafts) await db.mockActivity.update({ where: { id: d.id }, data: { metadata: { ...(d.metadata as object), status: "published" } } })
      assert.equal(await pendingLinkNews(user.id), null)
    })
    await t("a week with nothing new leaves no Briefing row", async () => {
      // Week 1's check two weeks back, week 2's one week back (so "the last check" is week 2's).
      await db.crawlResult.updateMany({ where: { userId: user.id, crawledAt: { lt: new Date(Date.now() - 86_400_000) } }, data: { crawledAt: new Date(Date.now() - 13 * 86_400_000) } })
      await db.crawlResult.updateMany({ where: { userId: user.id, crawledAt: { gte: new Date(Date.now() - 86_400_000) } }, data: { crawledAt: new Date(Date.now() - 6 * 86_400_000) } })
      const n = await db.mockActivity.count({ where: { userId: user.id, type: SITE_LINKS } })
      const r = await weeklySiteCheck(user)
      assert.equal(r.newProblems, 0)
      assert.equal(await db.mockActivity.count({ where: { userId: user.id, type: SITE_LINKS } }), n)
    })
  } finally {
    await db.mockActivity.deleteMany({ where: { userId: user.id } })
    await db.crawlResult.deleteMany({ where: { userId: user.id } })
    await db.user.delete({ where: { id: user.id } })
    srv.close()
    await db.$disconnect()
  }
}

async function main() {
  await pure()
  if (!process.argv.includes("--pure")) await withDb()
  console.log(`\n${passed} passed`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
