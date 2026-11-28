// DB tests for saved drafts + version history (lib/draft-versions.ts). Needs a throwaway LOCAL
// Postgres with the schema pushed; refuses any other host.
//   initdb + pg_ctl on port 5499, createdb alphaa_t, DATABASE_URL=… npx prisma db push
//   TEST_DATABASE_URL=postgresql://u@localhost:5499/alphaa_t npx tsx scripts/test-draft-versions.ts
import assert from "node:assert/strict"

const url = process.env.TEST_DATABASE_URL ?? ""
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) { console.error("Set TEST_DATABASE_URL to a local throwaway database."); process.exit(1) }
process.env.DATABASE_URL = url

async function main() {
  const { db } = await import("../src/lib/db")
  const v = await import("../src/lib/draft-versions")
  const user = await db.user.create({ data: { clerkId: `test_${Date.now()}`, email: `t${Date.now()}@example.com` } })
  const other = await db.user.create({ data: { clerkId: `test2_${Date.now()}`, email: `t2${Date.now()}@example.com` } })
  const orig = "## How much does it cost?\n\nIt depends on the job."
  const row = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: "Drafted a post", metadata: { title: "Costs", markdown: orig, status: "ready", topic: "cost" } } })
  let passed = 0
  const ok = (name: string) => { passed++; console.log(`ok  ${name}`) }
  try {
    assert.equal((await v.getDraft(other.id, row.id)), null)
    assert.deepEqual(await v.listRevisions(user.id, row.id), [])
    ok("another user can't read it; no versions before the first edit")

    let r = await v.saveDraftText(user.id, row.id, { markdown: orig + "\n\nMore.", by: "owner", baseRev: 0 })
    assert.ok(r.ok && r.draft.rev === 1 && r.draft.markdown.endsWith("More.") && r.draft.editedBy === "owner")
    let revs = await v.listRevisions(user.id, row.id)
    assert.equal(revs.length, 1)
    assert.equal(revs[0].reason, "original")
    assert.equal(revs[0].by, "agent")
    assert.equal((await v.getRevision(user.id, row.id, revs[0].id))!.markdown, orig)
    ok("autosave updates the draft; the agent's original is kept as version 1")

    r = await v.saveDraftText(user.id, row.id, { markdown: "stale tab text", by: "owner", baseRev: 0 })
    assert.ok(!r.ok && r.status === 409 && r.current?.rev === 1)
    ok("a stale tab (old baseRev) can't overwrite newer text")

    r = await v.saveDraftText(user.id, row.id, { markdown: orig + "\n\nMore.", by: "owner", baseRev: 1, checkpoint: "save" })
    assert.ok(r.ok && r.draft.rev === 1 && r.revisionId)
    const again = await v.saveDraftText(user.id, row.id, { markdown: orig + "\n\nMore.", by: "owner", baseRev: 1, checkpoint: "save" })
    assert.ok(again.ok && again.revisionId === r.revisionId)
    assert.equal((await v.listRevisions(user.id, row.id)).length, 2)
    ok("Save version keeps one version; saving the same text twice doesn't duplicate it")

    const pub = await v.textToPublish(user.id, row.id, "Inline chat edit [city]", "owner")
    assert.ok(pub.ok && pub.markdown === "Inline chat edit [city]" && pub.title === "Costs")
    assert.equal((await v.getDraft(user.id, row.id))!.markdown, "Inline chat edit [city]")
    const same = await v.textToPublish(user.id, row.id, undefined)
    assert.ok(same.ok && same.markdown === "Inline chat edit [city]")
    ok("publishing saves text passed with it first; no text = the saved draft")

    revs = await v.listRevisions(user.id, row.id)
    const first = revs.find((x) => x.reason === "original")!
    const rest = await v.restoreRevision(user.id, row.id, first.id)
    assert.ok(rest.ok && rest.draft.markdown === orig)
    revs = await v.listRevisions(user.id, row.id)
    assert.equal(revs[0].reason, "restore")
    assert.equal(revs[0].restoredFrom, first.id)
    assert.equal(revs[1].reason, "save") // the text before the restore was kept
    assert.equal((await v.getRevision(user.id, row.id, revs[1].id))!.markdown, "Inline chat edit [city]")
    assert.equal(await v.getRevision(other.id, row.id, first.id), null)
    ok("restore keeps the current text as a version first, then restores")

    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...((await db.mockActivity.findUnique({ where: { id: row.id } }))!.metadata as object), status: "published", url: "https://example.com/p" } } })
    await v.markPublished(user.id, row.id, "agent")
    revs = await v.listRevisions(user.id, row.id)
    assert.equal(revs[0].reason, "publish")
    assert.equal(revs[0].by, "agent")
    await v.markPublished(user.id, row.id, "agent")
    assert.equal((await v.listRevisions(user.id, row.id)).length, revs.length)
    const locked = await v.saveDraftText(user.id, row.id, { markdown: "after publish", by: "owner" })
    assert.ok(!locked.ok && locked.status === 409)
    ok("publish is kept as a version once; a published draft is locked")

    const big = await v.saveDraftText(user.id, row.id, { markdown: "x".repeat(v.MAX_DRAFT_CHARS + 1), by: "owner", allowPublished: true })
    assert.ok(!big.ok && big.status === 413)
    ok("over-long text is refused")

    const ai = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: "d2", metadata: { title: "T", markdown: "old", status: "ready" } } })
    const w = await v.saveAiRewrite(user.id, ai.id, "new by AI")
    assert.ok(w.ok)
    const air = await v.listRevisions(user.id, ai.id)
    assert.deepEqual(air.map((x) => [x.reason, x.by]), [["ai_rewrite", "agent"], ["original", "agent"]])
    ok("an AI rewrite is the agent's version")
  } finally {
    await db.user.deleteMany({ where: { id: { in: [user.id, other.id] } } })
    await db.$disconnect()
  }
  console.log(`\n${passed} passed`)
}
main().catch((e) => { console.error(e); process.exit(1) })
