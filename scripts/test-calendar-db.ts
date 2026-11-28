// DB-backed check of the content calendar on a THROWAWAY Postgres (never prod): seeds one Pro
// brand with social / Google / website / email items, then runs calendarItems, moveItem, the
// stop-window rules, best times and the due sweeps. Nothing is published: the social account and
// website are fake (website publishing goes to a .invalid host and fails), and RESEND_API_KEY is
// unset so a due email can't send.
//   createdb …; DATABASE_URL=postgresql://user@localhost:55433/alphaa_cal npx prisma db push
//   CALENDAR_TEST_DB=1 DATABASE_URL=postgresql://user@localhost:55433/alphaa_cal npx tsx scripts/test-calendar-db.ts
import assert from "node:assert/strict"

const url = process.env.DATABASE_URL ?? ""
if (process.env.CALENDAR_TEST_DB !== "1" || !/@(localhost|127\.0\.0\.1):\d+\//.test(url)) {
  console.error("Refusing: set CALENDAR_TEST_DB=1 and point DATABASE_URL at a local throwaway database.")
  process.exit(1)
}
// The Resend client is built at import and needs a key; it's removed again before anything could send.
process.env.RESEND_API_KEY = "re_dummy_never_used"

const H = 3_600_000

async function main() {
  // lib/auth (pulled in through approvals) wraps Clerk in React.cache, which only exists in Next's server build.
  const React = (await import("react")) as unknown as { cache?: unknown; default?: { cache?: unknown } }
  const passthrough = <T,>(f: T) => f
  if (React.default && !React.default.cache) React.default.cache = passthrough
  const { db } = await import("../src/lib/db")
  const { CONSENT_VERSION } = await import("../src/lib/auto-approve-text")
  const { calendarItems } = await import("../src/lib/calendar/items")
  const { moveItem, holdEmail } = await import("../src/lib/calendar/move")
  const { getBestTimes } = await import("../src/lib/calendar/best-time-data")
  const { sendDueEmails } = await import("../src/lib/calendar/due")
  const { publishDueSitePosts } = await import("../src/lib/workspace/site-posts")
  const { saveAgentSettings, getAgentSettings } = await import("../src/lib/agent/settings")
  await import("../src/lib/email-campaigns/send")
  delete process.env.RESEND_API_KEY // sendBlocker: "Email isn’t set up", so a due email can't send

  let passed = 0
  const test = async (name: string, fn: () => Promise<void>) => {
    try { await fn(); passed++; console.log(`ok   ${name}`) } catch (e) { console.error(`FAIL ${name}\n     ${e instanceof Error ? e.stack : e}`); process.exitCode = 1 }
  }

  // Fresh brand each run.
  const tag = Date.now().toString(36)
  const user = await db.user.create({ data: { clerkId: `test_cal_${tag}`, email: `cal-${tag}@example.test`, businessName: "Sample Clinic", plan: "pro", subscriptionStatus: "active", stripeSubscriptionId: "sub_test" } })
  const uid = user.id
  await db.integration.create({ data: { userId: uid, accessToken: "fake", refreshToken: null, expiresAt: new Date(Date.now() + 24 * H), gmbAccountId: "accounts/1", gmbLocationId: "locations/1" } })
  await saveAgentSettings(uid, {
    autoApprove: { acceptedAt: new Date().toISOString(), version: CONSENT_VERSION, consentId: "test" },
    calendar: { timezone: "America/Toronto" },
    wp: { siteUrl: "https://sample.invalid", restUrl: "https://sample.invalid/wp-json", version: "1.4.0", connectedAt: new Date().toISOString() },
    emailOutreach: { address: "1 Sample St, Toronto ON", at: new Date().toISOString() },
  })
  const acc = await db.mockActivity.create({ data: { userId: uid, type: "social_account", title: "facebook: Sample", metadata: { platform: "facebook", externalId: "p1", name: "Sample Page", tokenEnc: "x", status: "active", connectedAt: new Date().toISOString() } } })
  const li = await db.mockActivity.create({ data: { userId: uid, type: "social_account", title: "linkedin: Sample", metadata: { platform: "linkedin", externalId: "o1", name: "Sample Co", tokenEnc: "x", status: "active", extra: { kind: "organization" }, connectedAt: new Date().toISOString() } } })
  const now = Date.now()
  const post = (m: object) => db.mockActivity.create({ data: { userId: uid, type: "social_post", title: "Social post", metadata: { text: "Sample caption about a first visit.", accountIds: [acc.id], ...m } } })
  const sAuto = await post({ status: "scheduled", scheduledFor: new Date(now + 30 * H).toISOString(), source: "week", title: "Autopilot post" })
  const sPlanned = await post({ status: "draft", scheduledFor: new Date(now + 50 * H).toISOString(), source: "week", title: "Planned post" })
  const sDone = await post({ status: "published", publishedAt: new Date(now - 26 * H).toISOString(), results: [{ accountId: acc.id, platform: "facebook", ok: true, url: "https://facebook.example/p/1" }], title: "Published post" })
  // Six LinkedIn Page posts with stats, Tuesdays 9 AM Toronto doing best.
  for (let w = 1; w <= 6; w++) {
    const tue = Date.parse("2026-10-06T13:00:00Z") + w * 7 * 24 * H
    const at = w % 2 ? tue : tue + 3 * 24 * H + 7 * H
    await db.mockActivity.create({ data: { userId: uid, type: "social_post", title: "LI", metadata: { text: `LinkedIn post ${w}`, accountIds: [li.id], status: "published", publishedAt: new Date(at).toISOString(), results: [{ accountId: li.id, platform: "linkedin", ok: true, externalId: `urn:li:share:${w}`, stats: { impressions: 1000, likes: w % 2 ? 60 : 5, comments: 2, at: new Date().toISOString() } }] } } })
  }
  const gSched = await db.gbpPost.create({ data: { userId: uid, content: "Sample Google update.", status: "scheduled", scheduledFor: new Date(now + 20 * H) } })
  const gDraft = await db.gbpPost.create({ data: { userId: uid, content: "Sample Google draft.", status: "draft" } })
  const site = (m: object) => db.mockActivity.create({ data: { userId: uid, type: "post_draft", title: "Drafted a post", metadata: { title: "Sample post", markdown: "Sample body.", ...m } } })
  const wSched = await site({ status: "scheduled", scheduledFor: new Date(now + 72 * H).toISOString(), stopUntil: new Date(now + 72 * H).toISOString(), ownerOk: false })
  const wReady = await site({ status: "ready", title: "Ready post" })
  const wDone = await site({ status: "published", publishedAt: new Date(now - 3 * 24 * H).toISOString(), url: "https://sample.invalid/p" })
  await db.mockActivity.create({ data: { userId: uid, type: "email_contacts", title: "Customer email list", metadata: { contacts: [{ e: "customer@example.test", at: new Date().toISOString(), src: "paste" }] } } })
  const email = (subject: string) => db.mockActivity.create({ data: { userId: uid, type: "email_campaign", title: subject, metadata: { v: 1, status: "draft", subject, preview: "Sample preview", paragraphs: ["Sample paragraph."] } } })
  const e1 = await email("December note")
  const e2 = await email("Second note")

  const from = new Date(now - 10 * 24 * H), to = new Date(now + 30 * 24 * H)
  const fresh = async () => (await db.user.findUnique({ where: { id: uid } }))!

  await test("calendarItems: every channel, right statuses, tray for drafts", async () => {
    const items = await calendarItems(await fresh(), from, to)
    const by = (k: string) => items.find((i) => i.key === k)!
    assert.equal(by(`social:${sAuto.id}`).status, "scheduled")
    assert.ok(by(`social:${sAuto.id}`).windowEnd, "autopilot item has a stop window")
    assert.equal(by(`social:${sPlanned.id}`).status, "planned")
    assert.equal(by(`social:${sDone.id}`).status, "published")
    assert.equal(by(`social:${sDone.id}`).movable, false)
    assert.equal(by(`gbp:${gSched.id}`).channels[0], "google")
    assert.equal(by(`gbp:${gDraft.id}`).at, null)
    assert.equal(by(`site:${wSched.id}`).status, "scheduled")
    assert.equal(by(`site:${wReady.id}`).at, null)
    assert.equal(by(`site:${wDone.id}`).status, "published")
    assert.equal(by(`email:${e1.id}`).status, "draft")
  })

  await test("move: past refused, autopilot item inside its window asks, confirm records the OK", async () => {
    const u = await fresh()
    const past = await moveItem(u, "social", sAuto.id, new Date(Date.now() - H).toISOString())
    assert.equal(past.ok, false)
    const early = await moveItem(u, "social", sAuto.id, new Date(now + 10 * H).toISOString())
    assert.ok(!early.ok && early.needsOk, "needs the owner's OK")
    const later = await moveItem(u, "social", sAuto.id, new Date(now + 40 * H).toISOString())
    assert.ok(later.ok && !later.approved, "later than its time is fine without asking")
    const ok = await moveItem(u, "social", sAuto.id, new Date(now + 10 * H).toISOString(), true)
    assert.ok(ok.ok)
    const row = await db.mockActivity.findUnique({ where: { id: sAuto.id } })
    const m = row!.metadata as { scheduledFor: string; ownerOk: boolean; status: string }
    assert.equal(m.status, "scheduled"); assert.equal(m.ownerOk, true)
    assert.equal(Date.parse(m.scheduledFor), Date.parse(ok.ok ? ok.at : ""))
  })

  await test("move: planned draft becomes scheduled (the move is the OK)", async () => {
    const r = await moveItem(await fresh(), "social", sPlanned.id, new Date(now + 5 * 24 * H).toISOString())
    assert.ok(r.ok && r.approved)
    const m = (await db.mockActivity.findUnique({ where: { id: sPlanned.id } }))!.metadata as { status: string; ownerOk: boolean }
    assert.equal(m.status, "scheduled"); assert.equal(m.ownerOk, true)
  })

  await test("move: published items refuse", async () => {
    const r = await moveItem(await fresh(), "social", sDone.id, new Date(now + 5 * H).toISOString())
    assert.equal(r.ok, false)
  })

  await test("move: Google post inside window asks; draft is scheduled and remembered as OK'd", async () => {
    const u = await fresh()
    const ask = await moveItem(u, "gbp", gSched.id, new Date(now + 2 * H).toISOString())
    assert.ok(!ask.ok && ask.needsOk)
    const r = await moveItem(u, "gbp", gDraft.id, new Date(now + 6 * H).toISOString())
    assert.ok(r.ok)
    const g = await db.gbpPost.findUnique({ where: { id: gDraft.id } })
    assert.equal(g!.status, "scheduled")
    assert.equal(g!.scheduledFor!.toISOString(), r.ok ? r.at : "")
    assert.ok((await getAgentSettings(uid)).calendar?.okGbp?.includes(gDraft.id))
  })

  await test("move: Autopilot off = the move is the OK (no question inside the window)", async () => {
    const s = await getAgentSettings(uid)
    await saveAgentSettings(uid, { autoApprove: undefined })
    const r = await moveItem(await fresh(), "site", wSched.id, new Date(now + 3 * H).toISOString())
    assert.ok(r.ok && r.approved)
    const m = (await db.mockActivity.findUnique({ where: { id: wSched.id } }))!.metadata as { ownerOk: boolean }
    assert.equal(m.ownerOk, true)
    await saveAgentSettings(uid, { autoApprove: s.autoApprove })
  })

  await test("email: scheduling, one a week, stop + undo", async () => {
    const u = await fresh()
    const r = await moveItem(u, "email", e1.id, new Date(now + 2 * 24 * H).toISOString())
    assert.ok(r.ok)
    const clash = await moveItem(u, "email", e2.id, new Date(now + 4 * 24 * H).toISOString())
    assert.ok(!clash.ok && /one email a week/.test(clash.error))
    const fine = await moveItem(u, "email", e2.id, new Date(now + 10 * 24 * H).toISOString())
    assert.ok(fine.ok)
    assert.ok((await holdEmail(uid, e2.id, "stop")).ok)
    assert.ok((await holdEmail(uid, e2.id, "undo")).ok)
  })

  await test("due sweep: a due email that can't send goes back to a draft with the reason", async () => {
    // Make e1 due now (directly, as the clock would).
    const row = await db.mockActivity.findUnique({ where: { id: e1.id } })
    await db.mockActivity.update({ where: { id: e1.id }, data: { metadata: { ...(row!.metadata as object), scheduledFor: new Date(Date.now() - 60_000).toISOString() } } })
    const r = await sendDueEmails()
    assert.ok(r.due >= 1 && r.failed >= 1)
    const m = (await db.mockActivity.findUnique({ where: { id: e1.id } }))!.metadata as { status: string; error?: string }
    assert.equal(m.status, "draft")
    assert.match(m.error ?? "", /isn’t set up/)
  })

  await test("site sweep: Autopilot off publishes only what the owner OK'd", async () => {
    const s = await getAgentSettings(uid)
    await saveAgentSettings(uid, { autoApprove: undefined })
    const ok = await site({ status: "scheduled", scheduledFor: new Date(Date.now() - 60_000).toISOString(), ownerOk: true, title: "OK'd" })
    const notOk = await site({ status: "scheduled", scheduledFor: new Date(Date.now() - 60_000).toISOString(), ownerOk: false, title: "Not OK'd" })
    await publishDueSitePosts()
    const a = (await db.mockActivity.findUnique({ where: { id: ok.id } }))!.metadata as { status: string; scheduleError?: string }
    const b = (await db.mockActivity.findUnique({ where: { id: notOk.id } }))!.metadata as { status: string }
    // The fake .invalid site can't take it, so it comes back with the reason; what matters is that it was tried.
    assert.equal(a.status, "ready"); assert.ok(a.scheduleError)
    assert.equal(b.status, "scheduled")
    await saveAgentSettings(uid, { autoApprove: s.autoApprove })
  })

  await test("best times: LinkedIn uses the owner's posts, the rest is labelled typical", async () => {
    const b = await getBestTimes(uid, { fresh: true })
    assert.equal(b.tz, "America/Toronto")
    assert.equal(b.channels.linkedin!.source, "yours")
    assert.equal(b.channels.linkedin!.hours[0], 9)
    assert.equal(b.channels.linkedin!.days[0], 2)
    assert.equal(b.channels.instagram!.source, "typical")
    assert.equal(b.channels.email!.source, "typical")
    const cached = await getBestTimes(uid)
    assert.equal(cached.at, b.at, "cached for a day")
  })

  console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
