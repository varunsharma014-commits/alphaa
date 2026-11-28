// Tests for the owner's own Instagram / Facebook Page stats (lib/social/meta-stats.ts), the
// shared ranking/labels that use them, and the meta-insights scope parser. No database; Graph is
// mocked with doc-shaped answers (scripts/fixtures/meta-insights/, NOT live-verified).
//   npx tsx scripts/test-meta-insights.ts
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

process.env.CONNECTOR_SECRET ||= "test-secret-for-meta-insights"

const F = JSON.parse(readFileSync(join(__dirname, "fixtures/meta-insights/answers.json"), "utf8")) as Record<string, unknown>

let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  try { await fn(); passed++; console.log(`ok   ${name}`) } catch (e) { console.error(`FAIL ${name}\n     ${e instanceof Error ? e.message : e}`); process.exitCode = 1 }
}

async function main() {
  const ms = await import("../src/lib/social/meta-stats")
  const mi = await import("../src/lib/social/meta-insights")
  const { statsLine, engagementOf } = await import("../src/lib/social/stats")
  const { engagementRate } = await import("../src/lib/promote/rank")
  const { fromPosts } = await import("../src/lib/calendar/best-time")
  const { enc } = await import("../src/lib/social/store")

  await test("insightValues reads values[] and total_value", () => {
    assert.deepEqual(ms.insightValues(F.ig_media_insights), { reach: 1204, views: 1630, likes: 19, comments: 3, shares: 2, saved: 4, total_interactions: 28 })
    assert.deepEqual(ms.insightValues(F.ig_reel_insights_total_value), { reach: 5310, views: 9120, saved: 41 })
    assert.deepEqual(ms.insightValues(null), {})
    assert.deepEqual(ms.insightValues({ data: [{ name: "post_clicks", values: [{ value: { "link clicks": 3, "other clicks": 5 } }] }] }), { post_clicks: 8 })
  })

  await test("Instagram: basic counts without insights, full with them", () => {
    const basic = ms.igStats(F.ig_media_fields, null, "t")!
    assert.deepEqual(basic, { likes: 18, comments: 3, at: "t", level: "basic" })
    const full = ms.igStats(F.ig_media_fields, F.ig_media_insights, "t")!
    assert.equal(full.level, "full")
    assert.equal(full.reach, 1204)
    assert.equal(full.views, 1630)
    assert.equal(full.saves, 4)
    assert.equal(full.shares, 2)
    assert.equal(full.likes, 19, "insights likes win over the media field")
    assert.equal(ms.igStats({}, null), null)
  })

  await test("Facebook: reactions/comments/shares, then views, reach, clicks", () => {
    const basic = ms.fbStats(F.fb_post_fields, null, "t")!
    assert.deepEqual(basic, { likes: 12, comments: 2, shares: 2, at: "t", level: "basic" })
    const full = ms.fbStats(F.fb_post_fields, F.fb_post_insights, "t")!
    assert.equal(full.views, 1120)
    assert.equal(full.reach, 840)
    assert.equal(full.clicks, 37)
    assert.equal(full.level, "full")
  })

  await test("never asks for deprecated metrics", () => {
    for (const bad of ["impressions", "plays", "video_views", "post_impressions", "post_impressions_unique", "post_engaged_users"]) {
      assert.ok(!ms.IG_METRICS.includes(bad) && !ms.IG_CORE.includes(bad) && !ms.FB_METRICS.includes(bad), bad)
    }
  })

  await test("permission errors are recognised", () => {
    assert.equal(ms.isPermissionError(F.ig_permission_error), true)
    assert.equal(ms.isPermissionError({ error: { code: 200, message: "Requires read_insights" } }), true)
    assert.equal(ms.isPermissionError({ error: { code: 100, message: "Invalid parameter" } }), false)
    assert.equal(ms.isPermissionError(F.ig_media_fields), false)
  })

  await test("scopes from debug_token: round 1 lacks insights, round 2 has them", () => {
    const r1 = mi.scopesOf(F.debug_token_round1), r2 = mi.scopesOf(F.debug_token_round2)
    assert.equal(mi.hasAll(r1, ms.IG_INSIGHT_SCOPES), false)
    assert.equal(mi.hasAll(r1, ms.FB_INSIGHT_SCOPES), false)
    assert.equal(mi.hasAll(r2, ms.IG_INSIGHT_SCOPES), true)
    assert.equal(mi.hasAll(r2, ms.FB_INSIGHT_SCOPES), true)
    assert.equal(mi.hasAll(r2, mi.DISCOVERY_SCOPES), true)
  })

  await test("Business Discovery parse keeps counts and links only", () => {
    const d = mi.parseDiscovery(F.business_discovery)!
    assert.equal(d.username, "samplerival")
    assert.equal(d.followers, 2140)
    assert.equal(d.media.length, 2)
    assert.equal(d.media[0].likes, 240)
    assert.ok(!("caption" in d.media[0]))
  })

  await test("follower snapshots: one point a day, growth over 30 days", () => {
    const day = (s: string) => Date.parse(`${s}T10:00:00Z`)
    let pts = ms.addPoint([], 1000, day("2026-10-20"))
    pts = ms.addPoint(pts, 1005, day("2026-10-29"))
    pts = ms.addPoint(pts, 1010, day("2026-11-28"))
    pts = ms.addPoint(pts, 1012, day("2026-11-28"))
    assert.equal(pts.length, 3, "same day overwrites")
    const g = ms.growth(pts, 30, day("2026-11-28"))
    assert.deepEqual(g, { now: 1012, change: 7, since: "2026-10-29" })
    const young = ms.growth([{ d: "2026-11-26", n: 50 }, { d: "2026-11-28", n: 53 }], 30, day("2026-11-28"))
    assert.deepEqual(young, { now: 53, change: 3, since: "2026-11-26" })
    assert.deepEqual(ms.growth([{ d: "2026-11-28", n: 53 }], 30, day("2026-11-28")), { now: 53, change: null, since: null })
  })

  await test("statsLine per platform", () => {
    const ig = ms.igStats(F.ig_media_fields, F.ig_media_insights, "t")!
    assert.equal(statsLine(ig, "instagram"), "1,204 reached · 1,630 views · 19 likes · 3 comments · 2 shares · 4 saves")
    assert.equal(statsLine(ms.fbStats(F.fb_post_fields, null, "t")!, "facebook"), "12 reactions · 2 comments · 2 shares")
    assert.equal(statsLine({ impressions: 900, likes: 9, comments: 1, shares: 2, at: "t" }, "linkedin"), "900 views · 9 likes · 1 comment · 2 reposts")
  })

  await test("ranking + best time use reach, else followers", () => {
    const ig = ms.igStats(F.ig_media_fields, F.ig_media_insights, "t")!
    assert.equal(engagementRate(ig), Math.round(((19 + 3 + 2 + 4) / 1204) * 10000) / 100)
    assert.equal(engagementRate(ms.igStats(F.ig_media_fields, null, "t")), null, "no reach = not ranked")
    assert.deepEqual(engagementOf(ms.igStats(F.ig_media_fields, null, "t")!, 500), { base: 500, engagements: 21 })
    assert.equal(engagementOf(ms.igStats(F.ig_media_fields, null, "t")!, null), null)
    const at = (d: string) => Date.parse(d)
    const posts = ["2026-11-03T14:00:00Z", "2026-11-05T14:00:00Z", "2026-11-10T14:00:00Z", "2026-11-12T22:00:00Z", "2026-11-17T14:00:00Z", "2026-11-19T22:00:00Z"].map((d, i) => ({ at: at(d), impressions: 1000, engagements: d.endsWith("14:00:00Z") ? 60 + i : 10 }))
    const b = fromPosts("instagram", posts, "America/Toronto", "Instagram")!
    assert.equal(b.source, "yours")
    assert.match(b.label, /^Your data: from 6 of your Instagram posts, /)
    assert.equal(b.hours[0], 9)
  })

  await test("metaPostStats: IG asks fields then insights; FB skips video ids; permission error reported", async () => {
    const calls: string[] = []
    const real = globalThis.fetch
    const answers: Record<string, unknown> = {}
    globalThis.fetch = (async (u: string | URL) => {
      const url = new URL(String(u))
      calls.push(`${url.pathname}?${url.searchParams.get("fields") ?? url.searchParams.get("metric")}`)
      assert.ok(url.searchParams.get("access_token") === "PAGE_TOKEN")
      const key = url.pathname.endsWith("/insights") ? "insights" : "fields"
      const body = answers[key]
      const ok = !(body && typeof body === "object" && "error" in (body as object))
      return new Response(JSON.stringify(body ?? {}), { status: ok ? 200 : 400 })
    }) as typeof fetch
    try {
      const acc = { id: "a", platform: "instagram" as const, externalId: "1784", name: "@alphaa.ai.agent", tokenEnc: enc("PAGE_TOKEN"), status: "active" as const, connectedAt: "" }
      answers.fields = F.ig_media_fields
      answers.insights = F.ig_media_insights
      const full = await ms.metaPostStats(acc, "17900000000000001", true)
      assert.equal(full.stats?.reach, 1204)
      assert.equal(full.denied, false)
      assert.match(calls[1], /\/v27\.0\/17900000000000001\/insights\?reach,views,likes,comments,shares,saved,total_interactions/)
      calls.length = 0
      const basic = await ms.metaPostStats(acc, "17900000000000001", false)
      assert.equal(calls.length, 1, "no insights call without the permission")
      assert.equal(basic.stats?.level, "basic")
      answers.insights = F.ig_permission_error
      const denied = await ms.metaPostStats(acc, "17900000000000001", true)
      assert.equal(denied.denied, true)
      assert.equal(denied.stats?.level, "basic", "still shows the counts")
      calls.length = 0
      const fb = { ...acc, platform: "facebook" as const }
      const video = await ms.metaPostStats(fb, "123456", true)
      assert.equal(video.stats, null)
      assert.equal(calls.length, 0)
      answers.fields = F.fb_post_fields
      answers.insights = F.fb_post_insights
      const post = await ms.metaPostStats(fb, "100000000000001_200000000000001", true)
      assert.equal(post.stats?.reach, 840)
      assert.match(calls[1], /post_media_view,post_total_media_view_unique,post_clicks/)
    } finally {
      globalThis.fetch = real
    }
  })

  console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`)
}
void main()
