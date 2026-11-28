// DB tests for site vitals storage + Briefing alerts + the editor's summary save. Needs a throwaway
// LOCAL Postgres with the schema pushed; refuses any other host. No PSI calls, no site fetches.
//   initdb + pg_ctl on a spare port, createdb alphaa_t, npx prisma db push --url <url>
//   TEST_DATABASE_URL=postgresql://u@localhost:5498/alphaa_t npx tsx scripts/test-site-vitals-db.ts
import assert from "node:assert/strict"
import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const url = process.env.TEST_DATABASE_URL ?? ""
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) { console.error("Set TEST_DATABASE_URL to a local throwaway database."); process.exit(1) }
process.env.DATABASE_URL = url
delete process.env.PAGESPEED_API_KEY
const react = ((React as unknown as { default?: object }).default ?? React) as { cache?: unknown }
if (typeof react.cache !== "function") react.cache = <T,>(f: T) => f

async function main() {
  const { db } = await import("../src/lib/db")
  const { saveExcerpt } = await import("../src/lib/onpage-terms")
  const { getSiteAlerts, getSiteVitals, checkedRecently, installOption } = await import("../src/lib/seo/site-vitals")
  const { latestCwv, runCwv, CWV_TYPE } = await import("../src/lib/seo/cwv-run")
  const { parsePsi } = await import("../src/lib/seo/cwv")
  const { SCHEMA_AUDIT } = await import("../src/lib/schema/audit")
  const { getDraft, saveDraftText } = await import("../src/lib/draft-versions")
  const user = await db.user.create({ data: { clerkId: `test_${Date.now()}`, email: `t${Date.now()}@example.com`, websiteUrl: "example.com", businessName: "Bright Pipes" } })
  let passed = 0
  const ok = (name: string) => { passed++; console.log(`ok  ${name}`) }
  try {
    // ── summary save: one key in place, never on a published post, never another user's ──
    const d = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: "Drafted a post", metadata: { title: "Costs", markdown: "## A?\n\nText.", status: "ready", excerpt: "old" } } })
    assert.equal(await saveExcerpt(user.id, d.id, "  A new   summary for Google.  "), true)
    let m = (await db.mockActivity.findUnique({ where: { id: d.id } }))!.metadata as Record<string, unknown>
    assert.equal(m.excerpt, "A new summary for Google.")
    assert.equal(m.markdown, "## A?\n\nText.")
    assert.equal(m.status, "ready")
    assert.equal(await saveExcerpt("someone-else", d.id, "x"), false)
    // The text autosave after it keeps the new summary (it re-reads the row).
    const r = await saveDraftText(user.id, d.id, { markdown: "## A?\n\nMore text.", by: "owner", baseRev: 0 })
    assert.ok(r.ok)
    assert.equal((await getDraft(user.id, d.id))!.excerpt, "A new summary for Google.")
    await db.mockActivity.update({ where: { id: d.id }, data: { metadata: { ...((await db.mockActivity.findUnique({ where: { id: d.id } }))!.metadata as object), status: "published" } } })
    assert.equal(await saveExcerpt(user.id, d.id, "changed"), false)
    ok("summary save: jsonb_set in place, keeps the text, refuses published posts and other users")

    // ── no key: honest state, nothing run, nothing stored ──
    assert.equal(await runCwv(user, "owner"), null)
    const v0 = await getSiteVitals(user)
    assert.equal(v0.keyMissing, true)
    assert.equal(v0.cwv, null)
    assert.equal(v0.install.auto, false)
    assert.equal(await checkedRecently(user.id), false)
    ok("no PAGESPEED_API_KEY: no run, no row, the page says so")

    // ── stored runs → latest/previous, alerts in the Briefing only from the newest run under 8 days ──
    const psi = JSON.parse(readFileSync(join(__dirname, "fixtures/psi/mobile.json"), "utf8"))
    const mob = parsePsi(psi, "mobile")
    const page = { url: "https://example.com/", mobile: mob, desktop: null, errors: [] }
    await db.mockActivity.create({ data: { userId: user.id, type: CWV_TYPE, title: "x", createdAt: new Date(Date.now() - 7 * 86_400_000), metadata: { at: new Date(Date.now() - 7 * 86_400_000).toISOString(), pages: [page], history: null, viewportMeta: true, alerts: [], reason: "weekly" } as object } })
    await db.mockActivity.create({ data: { userId: user.id, type: CWV_TYPE, title: "x", metadata: { at: new Date().toISOString(), pages: [page], history: null, viewportMeta: true, alerts: [{ url: "https://example.com/blog/a", strategy: "mobile", metric: "cls", text: "Things jump around while your page loads on phones (shift score 0.30). Google wants under 0.1." }], reason: "weekly" } as object } })
    await db.mockActivity.create({ data: { userId: user.id, type: SCHEMA_AUDIT, title: "x", metadata: { at: new Date().toISOString(), pages: [], mismatches: [], products: [], totals: { errors: 0, warnings: 0, blocks: 0 }, alerts: ["Your website tells Google and AI your phone number is “613-555-0199”, but your profile says “613-555-0100”."], reason: "weekly" } as object } })
    const latest = await latestCwv(user.id)
    assert.equal(latest!.alerts.length, 1)
    assert.equal((await latestCwv(user.id, 1))!.alerts.length, 0)
    const alerts = await getSiteAlerts(user.id)
    assert.deepEqual(alerts.map((a) => a.href), ["/dashboard/tracking#vitals", "/dashboard/tracking#structured-data"])
    assert.ok(alerts[0].text.startsWith("/blog/a: Things jump around"))
    assert.equal(await checkedRecently(user.id), true) // schema_audit counts when there's no PSI key
    const v1 = await getSiteVitals(user)
    assert.equal(v1.cwv!.pages[0].mobile!.field!.scope, "page")
    assert.ok(v1.cwvPrev)
    ok("stored runs: newest + previous, Briefing alerts, weekly dedupe")

    // Older than 8 days: no Briefing alert.
    await db.mockActivity.deleteMany({ where: { userId: user.id, type: { in: [CWV_TYPE, SCHEMA_AUDIT] } } })
    await db.mockActivity.create({ data: { userId: user.id, type: CWV_TYPE, title: "x", metadata: { at: new Date(Date.now() - 9 * 86_400_000).toISOString(), pages: [page], history: null, viewportMeta: true, alerts: [{ url: "https://example.com/", strategy: "mobile", metric: "lcp", text: "t" }], reason: "weekly" } as object } })
    assert.deepEqual(await getSiteAlerts(user.id), [])
    ok("alerts expire after 8 days")

    assert.equal(installOption({ wp: { siteUrl: "https://a.com", restUrl: "", version: "1.5.0", connectedAt: "" } }).auto, true)
    for (const platform of ["webflow", "shopify", "wix"] as const) {
      const o = installOption({ site: { platform, siteUrl: "https://a.com", label: "a", tokenEnc: "", config: {}, connectedAt: "" } })
      assert.equal(o.auto, false, platform)
      assert.ok(/web person/.test(o.how), platform)
    }
    ok("install: WordPress auto; Webflow/Shopify/Wix copy-paste + web person (no new scopes)")

    // --live <site>: read a real site (reads only, nothing published): structured data audit + generated blocks.
    const live = process.argv.indexOf("--live")
    if (live > 0) {
      const site = process.argv[live + 1]
      const u = await db.user.update({ where: { id: user.id }, data: { websiteUrl: site, city: "Kanata", state: "ON" } })
      const { runSchemaAudit } = await import("../src/lib/schema/audit")
      const { generateSchemaFor } = await import("../src/lib/schema-generator")
      const { passes } = await import("../src/lib/schema/rules")
      const a = await runSchemaAudit(u, "owner")
      assert.ok(a, "audit stored")
      console.log(`   ${site}: ${a!.pages.length} pages, ${a!.totals.blocks} blocks, ${a!.totals.errors} errors, ${a!.totals.warnings} warnings, ${a!.mismatches.length} mismatches, ${a!.products.length} product blocks`)
      for (const p of a!.pages) console.log(`     ${p.url} ${p.status} ${p.types.join(",")} e${p.errors} w${p.warnings}`)
      for (const mm of a!.mismatches) console.log(`     mismatch ${mm.field}: site “${mm.onSite}” vs profile “${mm.ours}”`)
      const g = await generateSchemaFor(u)
      assert.ok(g.schemas.length >= 1 && g.schemas.every((s) => passes(s.jsonLd)))
      console.log(`   generated: ${g.schemas.map((s) => `${s.type} @ ${s.pageUrl}`).join(", ")}${g.faqFrom ? ` (FAQ from ${g.faqFrom})` : ""}`)
      ok("live: audit stored, generated blocks all pass the validator")
    }
  } finally {
    await db.mockActivity.deleteMany({ where: { userId: user.id } })
    await db.user.delete({ where: { id: user.id } })
    await db.$disconnect()
  }
  console.log(`\n${passed} passed`)
}
main().catch((e) => { console.error(e); process.exit(1) })
