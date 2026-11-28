// Teams and roles (lib/team): the can() matrix, the central route gate (and that EVERY mutating
// API route in the repo is classified), the brand resolver that decides which brand a cookie may
// open, invite + approve tokens and seat caps.
//   npx tsx scripts/test-team.ts
// Plus the resolver against a real database (a THROWAWAY local Postgres, never prod), including a
// member's cookie forged to another brand's id:
//   DATABASE_URL=postgresql://user@localhost:5439/alphaa_team npx prisma migrate deploy   (after db push of the old schema, or db push)
//   TEAM_TEST_DB=1 DATABASE_URL=postgresql://user@localhost:5439/alphaa_team npx tsx scripts/test-team.ts
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

process.env.CRON_SECRET ||= "test-secret-test-secret-123456"
process.env.DATABASE_URL ||= "postgresql://nobody@localhost:1/none" // pure tests never connect

let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    passed++
    console.log(`  ok  ${name}`)
  } catch (e) {
    console.error(`FAIL  ${name}`)
    throw e
  }
}

async function main() {
  const { can, goLiveMode, ACTIONS, MEMBER_ROLES, isRole, bySuffix, whoName } = await import("../src/lib/team/permissions")
  const { memberRequestAllowed, routePolicy, ROUTE_POLICY } = await import("../src/lib/team/routes")
  const { resolveBrand } = await import("../src/lib/team/resolve")
  const { seatCap } = await import("../src/lib/quota-rules")

  // ── can() matrix ───────────────────────────────────────────────────────────────────────────
  const EXPECT: Record<string, string[]> = {
    view: ["owner", "admin", "publisher", "reviewer", "creator"],
    create: ["owner", "admin", "publisher", "reviewer", "creator"],
    submit: ["owner", "admin", "publisher", "reviewer", "creator"],
    review: ["owner", "admin", "publisher", "reviewer"],
    publish: ["owner", "admin", "publisher"],
    settings: ["owner", "admin"],
    connect: ["owner", "admin"],
    autopilot: ["owner", "admin"],
    autopilot_consent: ["owner"],
    ads: ["owner", "admin"],
    billing: ["owner"],
    team: ["owner", "admin"],
    delete: ["owner"],
  }
  await test("can(): every role × action matches the design", () => {
    assert.deepEqual([...ACTIONS].sort(), Object.keys(EXPECT).sort())
    for (const action of ACTIONS) for (const role of ["owner", ...MEMBER_ROLES] as const) {
      assert.equal(can(role, action), EXPECT[action].includes(role), `${role} ${action}`)
      assert.equal(can({ role }, action), EXPECT[action].includes(role))
    }
  })
  await test("can(): unknown roles, null and unknown actions are always no", () => {
    for (const bad of [null, undefined, "", "Owner", "superadmin", "admin ", "__proto__"] as unknown[]) {
      for (const action of ACTIONS) assert.equal(can(bad as never, action), false, `${String(bad)} ${action}`)
    }
    assert.equal(can("owner", "nuke" as never), false)
    assert.equal(can("owner", "constructor" as never), false)
    assert.equal(isRole("owner"), true)
    assert.equal(isRole("toString"), false)
  })
  await test("goLiveMode: publish / approve / submit by role", () => {
    assert.equal(goLiveMode("owner"), "publish")
    assert.equal(goLiveMode("admin"), "publish")
    assert.equal(goLiveMode("publisher"), "publish")
    assert.equal(goLiveMode("reviewer"), "approve")
    assert.equal(goLiveMode("creator"), "submit")
    assert.equal(goLiveMode(null), "none")
    assert.equal(goLiveMode("x" as never), "none")
  })
  await test("audit labels: by Sam, the owner, nothing without an actor", () => {
    assert.equal(bySuffix({ actor: { role: "reviewer", name: "Sam Lee", email: "sam@x.com" } }), " · by Sam")
    assert.equal(bySuffix({ actor: { role: "creator", email: "kim@x.com" } }), " · by kim")
    assert.equal(bySuffix({ actor: { role: "owner" } }), " · by the owner")
    assert.equal(bySuffix({}), "")
    assert.equal(bySuffix(null), "")
    assert.equal(whoName(null), "Someone")
  })

  // ── central route gate ─────────────────────────────────────────────────────────────────────
  await test("gate: reads are open, connect GETs and every unlisted write are refused", () => {
    for (const role of MEMBER_ROLES) {
      assert.equal(memberRequestAllowed(role, "GET", "/dashboard").ok, true)
      assert.equal(memberRequestAllowed(role, "GET", "/api/agent/thread").ok, true)
      assert.equal(memberRequestAllowed(role, "POST", "/api/some-new-route-nobody-classified").ok, false)
      assert.equal(memberRequestAllowed(role, "DELETE", "/api/agent/chat").ok, false, "method not listed")
      assert.equal(memberRequestAllowed(role, "POST", "/dashboard/settings").ok, false, "page POST")
      assert.equal(memberRequestAllowed(role, "POST", "/api/stripe/checkout").ok, false, "billing")
      assert.equal(memberRequestAllowed(role, "POST", "/api/stripe/portal").ok, false)
      assert.equal(memberRequestAllowed(role, "POST", "/api/credits").ok, false)
      assert.equal(memberRequestAllowed(role, null, "/api/agent/chat").ok, false, "no header")
      assert.equal(memberRequestAllowed(role, "POST", null).ok, false)
      assert.equal(memberRequestAllowed(role, "POST", "/api/agent/chat").ok, true, "create")
      assert.equal(memberRequestAllowed(role, "POST", "/api/workspace/schedule").ok, true, "self route")
    }
    for (const [role, ok] of [["admin", true], ["publisher", false], ["reviewer", false], ["creator", false]] as const) {
      assert.equal(memberRequestAllowed(role, "GET", "/api/social/connect/meta").ok, ok, `${role} social connect`)
      assert.equal(memberRequestAllowed(role, "GET", "/api/integrations/google/connect").ok, ok)
      assert.equal(memberRequestAllowed(role, "GET", "/api/library/drive/token").ok, ok)
      assert.equal(memberRequestAllowed(role, "POST", "/api/connect/disconnect").ok, ok)
      assert.equal(memberRequestAllowed(role, "POST", "/api/agent/guardrails").ok, ok, "settings")
    }
    for (const [role, ok] of [["admin", true], ["publisher", true], ["reviewer", false], ["creator", false]] as const) {
      assert.equal(memberRequestAllowed(role, "POST", "/api/connect/wp/push").ok, ok, `${role} push`)
      assert.equal(memberRequestAllowed(role, "POST", "/api/gbp/posts/abc123/publish").ok, ok)
      assert.equal(memberRequestAllowed(role, "POST", "/api/workspace/approve-plan").ok, ok)
    }
    assert.equal(memberRequestAllowed("creator", "PUT", "/api/workspace/drafts/abc123").ok, true)
    assert.equal(memberRequestAllowed("creator", "POST", "/api/workspace/drafts/abc/revisions/def").ok, true)
    assert.equal(memberRequestAllowed("creator", "POST", "/api/gbp/posts/abc123/publish/").ok, false, "trailing slash")
    assert.equal(memberRequestAllowed("creator", "POST", "/api/gbp/posts/a/b/publish").ok, false, "extra segment is not :id")
    assert.equal(routePolicy("POST", "/api/scan"), "create")
    assert.equal(routePolicy("POST", "/api/scan/week/teaser"), "create")
    assert.equal(routePolicy("HEAD", "/api/social/connect/x"), "connect")
  })

  await test("gate: EVERY mutating API route in src/app/api is classified (rebase guard)", () => {
    const root = join(__dirname, "../src/app/api")
    const files: string[] = []
    const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f === "route.ts") files.push(p) } }
    walk(root)
    const missing: string[] = []
    for (const f of files) {
      const rel = "/api/" + relative(root, f).replace(/\/route\.ts$/, "").replace(/\[([^\]]+)\]/g, "x$1")
      if (rel.startsWith("/api/cron/")) continue // bearer-token crons never call auth()
      const src = readFileSync(f, "utf8")
      for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
        if (!new RegExp(`export (async function|const) ${m}\\b`).test(src)) continue
        if (!routePolicy(m, rel)) missing.push(`${m} ${rel}`)
      }
    }
    assert.deepEqual(missing, [], `Classify these in src/lib/team/routes.ts:\n${missing.join("\n")}`)
    assert.ok(ROUTE_POLICY.length > 50)
  })

  // ── brand resolver ─────────────────────────────────────────────────────────────────────────
  type Row = { id: string; clerkId: string }
  type Mem = { id: string; brandId: string; clerkId: string | null; role: string; status: string; email: string }
  const users: Row[] = [
    { id: "u_owner", clerkId: "user_owner" },
    { id: "u_owner_site", clerkId: "site:user_owner:abc123" },
    { id: "u_other", clerkId: "user_other" },
    { id: "u_member_own", clerkId: "user_member" },
  ]
  const members: Mem[] = [
    { id: "m1", brandId: "u_owner", clerkId: "user_member", role: "reviewer", status: "active", email: "m@x.com" },
    { id: "m2", brandId: "u_owner_site", clerkId: "user_member", role: "creator", status: "invited", email: "m@x.com" },
    { id: "m3", brandId: "u_other", clerkId: "user_member", role: "admin", status: "removed", email: "m@x.com" },
    { id: "m4", brandId: "u_other", clerkId: "user_third", role: "superadmin", status: "active", email: "t@x.com" },
    { id: "m5", brandId: "u_owner", clerkId: "user_owner", role: "admin", status: "active", email: "o@x.com" }, // owner on own brand
  ]
  const lookup = (opts: { buggy?: boolean } = {}) => ({
    async ownRow(real: string, siteId: string) {
      const r = users.find((u) => u.id === siteId && (u.clerkId === real || u.clerkId.startsWith(`site:${real}:`)))
      return r?.clerkId ?? null
    },
    async membership(real: string, siteId: string) {
      // buggy = ignores clerkId/status, as a broken query might: the resolver must still refuse.
      const m = members.find((x) => x.brandId === siteId && (opts.buggy || (x.clerkId === real && x.status === "active")))
      if (!m) return null
      const brand = users.find((u) => u.id === m.brandId)!
      return { brandClerkId: brand.clerkId, memberId: m.id, role: m.role, status: m.status, clerkId: m.clerkId, email: m.email, name: null }
    },
  })
  await test("resolver: owners open their own brands; no cookie = own first brand", async () => {
    assert.deepEqual(await resolveBrand("user_owner", undefined, lookup()), { clerkId: "user_owner", role: "owner" })
    assert.deepEqual(await resolveBrand("user_owner", "u_owner", lookup()), { clerkId: "user_owner", role: "owner" })
    assert.deepEqual(await resolveBrand("user_owner", "u_owner_site", lookup()), { clerkId: "site:user_owner:abc123", role: "owner" })
  })
  await test("resolver: an active member opens that brand with their role", async () => {
    const r = await resolveBrand("user_member", "u_owner", lookup())
    assert.equal(r.clerkId, "user_owner")
    assert.equal(r.role, "reviewer")
    assert.equal(r.memberId, "m1")
  })
  await test("resolver: forged / invited / removed / bad-role cookies fall back to the person's own brand", async () => {
    const self = { clerkId: "user_member", role: "owner" }
    assert.deepEqual(await resolveBrand("user_member", "u_other", lookup()), self, "forged to a brand they were removed from")
    assert.deepEqual(await resolveBrand("user_member", "u_owner_site", lookup()), self, "invited, not accepted")
    assert.deepEqual(await resolveBrand("user_member", "does_not_exist", lookup()), self)
    assert.deepEqual(await resolveBrand("user_third", "u_other", lookup()), { clerkId: "user_third", role: "owner" }, "unknown role")
    assert.deepEqual(await resolveBrand("user_member", "x".repeat(200), lookup()), self, "silly cookie")
    assert.deepEqual(await resolveBrand("", "u_owner", lookup()), { clerkId: "", role: "owner" })
  })
  await test("resolver: a lookup that ignores clerkId/status still can't open someone else's brand", async () => {
    const self = { clerkId: "user_member", role: "owner" }
    assert.deepEqual(await resolveBrand("user_member", "u_other", lookup({ buggy: true })), self)
    assert.deepEqual(await resolveBrand("user_member", "u_owner_site", lookup({ buggy: true })), self)
    assert.deepEqual(await resolveBrand("user_intruder", "u_owner", lookup({ buggy: true })), { clerkId: "user_intruder", role: "owner" })
  })
  await test("resolver: a member row on the login's own brand never downgrades the owner", async () => {
    assert.deepEqual(await resolveBrand("user_owner", "u_owner", lookup({ buggy: true })), { clerkId: "user_owner", role: "owner" })
  })

  // ── tokens and seats ───────────────────────────────────────────────────────────────────────
  const { makeInviteToken, readInviteToken } = await import("../src/lib/team/store")
  const { makeApproveToken, readApproveToken } = await import("../src/lib/approve-token")
  await test("invite token: signed, expires, tamper-proof", () => {
    const m = { id: "m1", email: "sam@x.com", invitedAt: new Date("2026-11-28T10:00:00Z") }
    const t = makeInviteToken(m)!
    const c = readInviteToken(t)!
    assert.equal(c.m, "m1")
    assert.equal(c.e, "sam@x.com")
    assert.equal(c.t, m.invitedAt.getTime())
    assert.equal(readInviteToken(t, Date.now() + 15 * 86_400_000), null, "expired after 14 days")
    const [p, mac] = t.split(".")
    const forged = Buffer.from(JSON.stringify({ ...c, m: "m_other" })).toString("base64url")
    assert.equal(readInviteToken(`${forged}.${mac}`), null, "changed member id")
    assert.equal(readInviteToken(`${p}.${mac.slice(0, -1)}x`), null)
    assert.equal(readInviteToken(`${t}.extra`), null)
    assert.equal(readInviteToken(""), null)
  })
  await test("approve token: owner links have no member, member links name the member", () => {
    const o = readApproveToken(makeApproveToken("u_owner", "post", "d1")!)!
    assert.equal(o.m, undefined)
    const m = readApproveToken(makeApproveToken("u_owner", "gbp", "g1", "m1")!)!
    assert.equal(m.m, "m1")
    assert.equal(m.k, "gbp")
  })
  await test("seats: Starter/no plan 0, Pro 3, Growth 5, comped = Growth, QUOTAS_JSON wins", () => {
    assert.equal(seatCap("none"), 0)
    assert.equal(seatCap("starter"), 0)
    assert.equal(seatCap("pro"), 3)
    assert.equal(seatCap("fullservice"), 3)
    assert.equal(seatCap("growth"), 5)
    assert.equal(seatCap("none", true), 5)
    assert.equal(seatCap("pro", false, JSON.stringify({ pro: { team_seat: { month: 4 } } })), 4)
    assert.equal(seatCap("starter", false, JSON.stringify({ "*": { team_seat: { month: 2 } } })), 2)
    assert.equal(seatCap("pro", false, JSON.stringify({ pro: { team_seat: { month: null } } })), 0)
  })

  if (process.env.TEAM_TEST_DB === "1") await dbTests()
  console.log(`\n${passed} passed`)
}

// ── the real resolver + store on a throwaway database ─────────────────────────────────────────
async function dbTests() {
  const url = process.env.DATABASE_URL ?? ""
  if (!/@(localhost|127\.0\.0\.1):\d+\//.test(url)) throw new Error("Refusing: TEAM_TEST_DB needs a local throwaway DATABASE_URL.")
  process.env.RESEND_API_KEY = "re_dummy_never_used" // invite emails fail (no real key), the links are still made
  const { db } = await import("../src/lib/db")
  const { dbLookup, resolveBrand } = await import("../src/lib/team/resolve")
  const store = await import("../src/lib/team/store")
  const tag = `t${Date.now().toString(36)}`
  const mk = (n: string, plan = "pro") => db.user.create({ data: { clerkId: `user_${n}_${tag}`, email: `${n}_${tag}@example.test`, plan, subscriptionStatus: "active", onboardingCompleted: true } })
  const owner = await mk("owner")
  const other = await mk("other")
  const memberOwn = await mk("member", "none")
  const site = await db.user.create({ data: { clerkId: `site:${owner.clerkId}:abc123`, email: `owner_${tag}+as-abc123@example.test`, plan: "pro", subscriptionStatus: "active" } })
  const starter = await mk("starter", "starter")
  try {
    const L = await dbLookup()
    await test("db: invite → accept → member opens the brand as reviewer", async () => {
      const r = await store.inviteMember(owner, { clerkId: owner.clerkId, name: "Owner" }, `Sam_${tag}@Example.test`, "reviewer")
      assert.ok(r.ok, JSON.stringify(r))
      assert.equal(r.ok && r.member.status, "invited")
      // Before accepting, the cookie does nothing.
      assert.equal((await resolveBrand(memberOwn.clerkId, owner.id, L)).clerkId, memberOwn.clerkId)
      const row = await db.teamMember.findFirstOrThrow({ where: { brandId: owner.id } })
      const t = store.makeInviteToken(row)!
      const wrong = await store.acceptInvite(t, { id: memberOwn.clerkId, verifiedEmails: [`someone_else_${tag}@example.test`], name: "Sam" })
      assert.equal(wrong.ok, false, "a forwarded link does nothing")
      const self = await store.acceptInvite(t, { id: owner.clerkId, verifiedEmails: [`sam_${tag}@example.test`], name: "Owner" })
      assert.equal(self.ok, false, "the owner can't join their own brand")
      const ok = await store.acceptInvite(t, { id: memberOwn.clerkId, verifiedEmails: [`SAM_${tag}@example.test`], name: "Sam Lee" })
      assert.deepEqual(ok, { ok: true, brandId: owner.id })
      const res = await resolveBrand(memberOwn.clerkId, owner.id, L)
      assert.equal(res.clerkId, owner.clerkId)
      assert.equal(res.role, "reviewer")
      assert.equal(res.name, "Sam Lee")
    })
    await test("db: a member's cookie forged to another brand id is refused (own brand opens)", async () => {
      for (const forged of [other.id, site.id, starter.id, "cl_not_a_row"]) {
        const r = await resolveBrand(memberOwn.clerkId, forged, L)
        assert.deepEqual(r, { clerkId: memberOwn.clerkId, role: "owner" }, forged)
      }
      // and the owner's extra site stays the owner's only
      assert.equal((await resolveBrand(owner.clerkId, site.id, L)).clerkId, site.clerkId)
      assert.equal((await resolveBrand(other.clerkId, site.id, L)).clerkId, other.clerkId)
    })
    await test("db: role change applies at once; removal cuts access at once", async () => {
      const row = await db.teamMember.findFirstOrThrow({ where: { brandId: owner.id } })
      assert.ok((await store.setMemberRole(owner.id, row.id, "publisher")).ok)
      assert.equal((await resolveBrand(memberOwn.clerkId, owner.id, L)).role, "publisher")
      assert.equal((await store.setMemberRole(other.id, row.id, "admin")).ok, false, "another brand can't change it")
      assert.ok((await store.removeMember(owner.id, row.id)).ok)
      assert.deepEqual(await resolveBrand(memberOwn.clerkId, owner.id, L), { clerkId: memberOwn.clerkId, role: "owner" })
      assert.equal(store.readInviteToken(store.makeInviteToken(row)!) !== null, true)
      const again = await store.acceptInvite(store.makeInviteToken(row)!, { id: memberOwn.clerkId, verifiedEmails: [row.email], name: null })
      assert.equal(again.ok, false, "a removed member's old link is dead")
    })
    await test("db: seats: Starter can't invite, Pro stops at 3, the owner's own email is refused", async () => {
      const s = await store.inviteMember(starter, { clerkId: starter.clerkId, name: "S" }, `a_${tag}@example.test`, "creator")
      assert.equal(s.ok, false)
      assert.equal(!s.ok && s.status, 402)
      const own = await store.inviteMember(owner, { clerkId: owner.clerkId, name: "O" }, owner.email.toUpperCase(), "admin")
      assert.equal(own.ok, false)
      const siteOwn = await store.inviteMember(site, { clerkId: owner.clerkId, name: "O" }, owner.email, "admin")
      assert.equal(siteOwn.ok, false, "extra site: the owner's real email")
      for (const n of [1, 2, 3]) assert.ok((await store.inviteMember(owner, { clerkId: owner.clerkId, name: "O" }, `p${n}_${tag}@example.test`, "creator")).ok, `seat ${n}`)
      const fourth = await store.inviteMember(owner, { clerkId: owner.clerkId, name: "O" }, `p4_${tag}@example.test`, "creator")
      assert.equal(fourth.ok, false)
      assert.equal((await store.listTeam(owner.id)).length, 3)
      assert.equal((await store.inviteMember(owner, { clerkId: owner.clerkId, name: "O" }, "not-an-email", "creator")).ok, false)
      assert.equal((await store.inviteMember(other, { clerkId: other.clerkId, name: "O" }, `z_${tag}@example.test`, "owner")).ok, false, "can't invite an owner")
    })
    await test("db: membershipsFor lists only active memberships", async () => {
      const row = await db.teamMember.findFirstOrThrow({ where: { brandId: owner.id, email: `p1_${tag}@example.test` } })
      await db.teamMember.update({ where: { id: row.id }, data: { status: "active", clerkId: other.clerkId } })
      const list = await store.membershipsFor(other.clerkId)
      assert.deepEqual(list.map((x) => [x.id, x.role]), [[owner.id, "creator"]])
      assert.deepEqual(await store.membershipsFor(memberOwn.clerkId), [])
    })
  } finally {
    await db.user.deleteMany({ where: { id: { in: [owner.id, other.id, memberOwn.id, site.id, starter.id] } } })
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
