// End-to-end dry run of page refresh + link fix against a FAKE WordPress site on localhost (never a
// customer site): crawl with link checks → "Fix the links" draft → publish as an UPDATE → Undo →
// "Refresh this post" (real Claude call) → publish → Undo → the Tracking card data.
// Needs the LOCAL dev database (.env.local DATABASE_URL on localhost) and ANTHROPIC_API_KEY.
//   npx tsx --env-file=.env.local scripts/test-refresh-local.ts [--no-ai]
import assert from "node:assert/strict"
import http from "node:http"

const PORT = 4789
const ORIGIN = `http://localhost:${PORT}`
const PAGE = `${ORIGIN}/blog/whitening`

const BODY = `<p>At Bright Smile Dental we offer in-office teeth whitening in one visit. The appointment takes about an hour and you leave with a brighter smile the same day.</p>
<h2>Is teeth whitening safe?</h2><p>Yes. Professional whitening uses a gel applied by our team, with your gums protected. Some people feel short-lived sensitivity, which fades within a day or two.</p>
<h2>How long do results last?</h2><p>Results depend on what you eat and drink. Coffee, tea and red wine stain teeth over time. Touch-up trays help keep the shade. Read <a href="${ORIGIN}/blog/gone">our aftercare guide</a>, the <a href="${ORIGIN}/old">old pricing page</a> and <a href="https://dead.invalid/study">this study</a>.</p>
<ul><li>Done in one visit</li><li>Gums protected the whole time</li><li>Take-home touch-up trays available</li></ul>`

let content = BODY
let title = "Teeth whitening at Bright Smile"
const prevs = new Map<string, { title: string; content: string }>()

const page = () => `<!doctype html><html><head><title>${title} | Bright Smile</title><link rel="https://api.w.org/" href="${ORIGIN}/wp-json/" /></head>
<body><header><nav><a href="${ORIGIN}/">Home</a> <a href="${ORIGIN}/blog/whitening">Whitening</a></nav></header>
<article><h1>${title}</h1><div class="entry-content">${content}</div></article><footer><a href="${ORIGIN}/privacy">Privacy</a></footer></body></html>`

function server() {
  return http.createServer((req, res) => {
    const u = new URL(req.url ?? "/", ORIGIN)
    const send = (code: number, body: string, type = "text/html", extra: Record<string, string> = {}) => { res.writeHead(code, { "Content-Type": type, ...extra }); res.end(body) }
    if (req.method === "GET" && u.pathname === "/") return send(200, `<html><head><title>Bright Smile</title></head><body><a href="${ORIGIN}/blog/whitening">Whitening</a> <a href="${ORIGIN}/privacy">Privacy</a></body></html>`)
    if (req.method === "GET" && u.pathname === "/blog/whitening") return send(200, page())
    if (req.method === "GET" && u.pathname === "/privacy") return send(200, "<html><body><h1>Privacy</h1></body></html>")
    if (u.pathname === "/old") return send(301, "", "text/plain", { Location: `${ORIGIN}/old/` })
    if (u.pathname === "/old/") return send(301, "", "text/plain", { Location: `${ORIGIN}/pricing` })
    if (u.pathname === "/pricing") return send(200, "<html><body><h1>Pricing</h1></body></html>")
    if (u.pathname === "/wp-json/wp/v2/posts") return send(200, JSON.stringify(u.searchParams.get("slug") === "whitening" ? [{ link: `${PAGE}/`, title: { rendered: title }, content: { rendered: content } }] : []), "application/json")
    if (req.method === "POST" && u.pathname.startsWith("/wp-json/alphaa/v1/")) {
      let raw = ""
      req.on("data", (c) => (raw += c))
      req.on("end", () => {
        const p = JSON.parse(raw || "{}")
        if (u.pathname.endsWith("/update")) {
          const id = `update-${Math.random().toString(36).slice(2, 8)}`
          prevs.set(id, { title, content })
          title = p.title
          content = p.html
          return send(200, JSON.stringify({ ok: true, id, url: `${PAGE}/` }), "application/json")
        }
        if (u.pathname.endsWith("/undo")) {
          const pv = prevs.get(p.id)
          if (!pv) return send(404, JSON.stringify({ message: "Nothing to undo with that id." }), "application/json")
          title = pv.title
          content = pv.content
          return send(200, JSON.stringify({ ok: true }), "application/json")
        }
        send(404, JSON.stringify({ code: "rest_no_route", message: "No route was found matching the URL and request method." }), "application/json")
      })
      return
    }
    send(404, "<html><body>Not found</body></html>")
  })
}

async function main() {
  if (!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "")) throw new Error("Refusing to run: DATABASE_URL is not a local database.")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require("react") as { cache?: unknown }
  if (typeof react.cache !== "function") react.cache = (fn: unknown) => fn
  const noAi = process.argv.includes("--no-ai")
  const srv = server()
  await new Promise<void>((r) => srv.listen(PORT, r))

  const { db } = await import("../src/lib/db")
  const { saveAgentSettings } = await import("../src/lib/agent/settings")
  const { crawlWebsite } = await import("../src/lib/crawler")
  const { draftLinkFix, draftRefresh, publishRefreshDraft } = await import("../src/lib/seo/refresh")
  const { undoChange } = await import("../src/lib/connector/publish")
  const { getUpkeep } = await import("../src/lib/seo/upkeep")

  const email = `refresh-e2e-${Date.now()}@example.com`
  const user = await db.user.create({ data: { clerkId: `test_${Date.now()}`, email, businessName: "Bright Smile Dental", businessType: "dentist", city: "Ottawa", websiteUrl: `localhost:${PORT}`, plan: "pro" } })
  await saveAgentSettings(user.id, { wp: { siteUrl: `${ORIGIN}/`, restUrl: `${ORIGIN}/wp-json/alphaa/v1/`, version: "1.5.0", connectedAt: new Date().toISOString() } })

  // 1. Crawl with link checks.
  const out = await crawlWebsite(ORIGIN, 10, { checkLinks: true, linkBudgetMs: 10_000 })
  const types = out.issues.filter((i) => i.target).map((i) => `${i.type}:${i.target}`).sort()
  console.log("link issues:", types)
  assert.ok(types.includes(`broken_internal_link:${ORIGIN}/blog/gone`))
  assert.ok(types.includes(`redirect_chain:${ORIGIN}/old`))
  assert.ok(types.includes("broken_outbound_link:https://dead.invalid/study"))
  await db.crawlResult.create({ data: { userId: user.id, url: ORIGIN, pagesScanned: out.pagesScanned, issues: out.issues as object[], schemaFound: out.schemaFound, schemaMissing: out.schemaMissing, metaIssues: out.metaIssues } })

  // 2. Link fix → publish (UPDATE) → undo.
  const fix = await draftLinkFix(user, PAGE)
  assert.ok(fix.ok, !fix.ok ? fix.error : "")
  if (!fix.ok) return
  console.log("link fix changes:", fix.meta.refresh.changes)
  const pub = await publishRefreshDraft(user.id, fix.draftId)
  assert.ok(pub.ok, !pub.ok ? pub.error : "")
  assert.ok(!content.includes("/blog/gone") && !content.includes("dead.invalid") && content.includes(`${ORIGIN}/pricing`) && content.includes("our aftercare guide"))
  const change = await db.mockActivity.findFirst({ where: { userId: user.id, type: "site_change" }, orderBy: { createdAt: "desc" } })
  assert.equal((change?.metadata as { op?: string })?.op, "update")
  await undoChange(user.id, (change!.metadata as { changeId: string }).changeId)
  assert.equal(content, BODY)
  const draftAfter = await db.mockActivity.findUnique({ where: { id: fix.draftId } })
  assert.equal((draftAfter?.metadata as { status?: string }).status, "undone")
  console.log("✓ link fix published as an update and undone")

  // 3. Refresh (real Claude call) → publish → undo.
  if (!noAi) {
    const t0 = Date.now()
    const r = await draftRefresh(user, PAGE)
    assert.ok(r.ok, !r.ok ? r.error : "")
    if (!r.ok) return
    console.log(`refresh written in ${((Date.now() - t0) / 1000).toFixed(0)}s; title: ${r.meta.title}`)
    console.log("changes:", r.meta.refresh.changes)
    console.log("unverified numbers:", r.meta.refresh.unverified)
    assert.match(r.meta.html, /^<p><em>Updated /)
    assert.ok(!/dead\.invalid|spam/.test(r.meta.html) || r.meta.html.includes("dead.invalid/study"), "only original links")
    const again = await draftRefresh(user, PAGE)
    assert.ok(again.ok && again.draftId === r.draftId, "second tap returns the same draft")
    const p2 = await publishRefreshDraft(user.id, r.draftId)
    assert.ok(p2.ok, !p2.ok ? p2.error : "")
    assert.ok(content.startsWith("<p><em>Updated "))
    if (p2.ok) await undoChange(user.id, p2.changeId!)
    assert.equal(content, BODY)
    console.log("✓ refresh published as an update and undone")
  }

  // 4. A site that can't update: the owner gets the web-person path.
  await saveAgentSettings(user.id, { wp: { siteUrl: "https://elsewhere.example/", restUrl: `${ORIGIN}/wp-json/alphaa/v1/`, version: "1.5.0", connectedAt: new Date().toISOString() } })
  const fix2 = await draftLinkFix(user, PAGE)
  assert.ok(fix2.ok)
  if (fix2.ok) {
    const p3 = await publishRefreshDraft(user.id, fix2.draftId)
    assert.ok(!p3.ok && p3.handoff, "blocked update offers the web person")
  }

  const up = await getUpkeep(user)
  console.log("upkeep links pages:", up.links.pages.map((p) => `${p.path} (${p.count}) blocker=${!!p.blocker} draft=${p.draft?.status}`))
  console.log("✓ local refresh e2e passed (test user", user.id, ")")
  srv.close()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
