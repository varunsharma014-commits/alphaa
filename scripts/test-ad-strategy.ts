// Unit tests for the ad plan's pure rules (budget split, claims checks, HTML rendering).
// Run: npx tsx scripts/test-ad-strategy.ts
import assert from "node:assert/strict"
import { allowedNumbers, keepLines, scriptLines, testingPlan, LINKEDIN_MIN_MONTHLY } from "../src/lib/ad-strategy/rules"
import { planHtml, scriptMd } from "../src/lib/ad-strategy/markdown"
import { VERTICALS, VERTICAL_RULES, HOOK_TYPES, playbookBrief } from "../src/lib/ad-strategy/playbook"
import type { Script } from "../src/lib/ad-strategy/types"

let passed = 0
function test(name: string, fn: () => void) { fn(); passed++; console.log(`ok  ${name}`) }

test("local business: Meta + Google, 60/40, judge count from $60 per creative", () => {
  const t = testingPlan({ monthly: 600, currency: "CAD", b2b: false, local: true })
  assert.deepEqual(t.platforms.map((p) => p.platform), ["Facebook & Instagram", "Google"])
  assert.equal(t.platforms[0].monthly, 360)
  assert.equal(t.platforms[0].judge, 6)
  assert.match(t.platforms[0].launch, /^4 different concepts/)
  assert.equal(t.platforms[1].monthly, 240)
})

test("b2b with enough budget adds LinkedIn; too little drops it", () => {
  const big = testingPlan({ monthly: 3000, currency: "USD", b2b: true, local: false })
  assert.ok(big.platforms.some((p) => p.platform === "LinkedIn" && p.monthly! >= LINKEDIN_MIN_MONTHLY))
  assert.equal(big.platforms.find((p) => p.platform === "LinkedIn")!.judge, 4)
  const small = testingPlan({ monthly: 500, currency: "USD", b2b: true, local: false })
  assert.ok(!small.platforms.some((p) => p.platform === "LinkedIn"))
})

test("tiny budget judges fewer than 2 creatives: launch one at a time", () => {
  const t = testingPlan({ monthly: 100, currency: "USD", b2b: false, local: true })
  assert.equal(t.platforms[0].judge, 1)
  assert.match(t.platforms[0].launch, /^1 concept at a time/)
})

test("no budget: no amounts, asks for the budget", () => {
  const t = testingPlan({ monthly: null, currency: "USD", b2b: false, local: true })
  assert.ok(t.platforms.every((p) => p.monthly === null && p.judge === null))
  assert.ok(t.notes.some((n) => /Set your monthly ad budget/.test(n)))
})

test("claims: numbers must come from the facts, superlatives and over-limit lines go", () => {
  const allowed = allowedNumbers("Business: Joe's Plumbing\nWe answer calls 24/7. Service calls from $89.")
  const lines = ["Calls answered 24/7", "Service calls from $89", "Rated 4.9 by 500 neighbours", "The best plumber in town", "x".repeat(50)]
  const r = keepLines(lines, (t) => [{ text: t, max: 40 }], allowed, "Joe's Plumbing")
  assert.deepEqual(r.ok, ["Calls answered 24/7", "Service calls from $89"])
  assert.equal(r.dropped, 3)
})

test("scripts: one bad voice-over line drops the whole script; empty VO is fine", () => {
  const base: Script = { title: "T", angle: "A", format: "Kinetic text", hookType: "confession", seconds: 8, platforms: ["Instagram Reels"], scenes: [{ t: "0-2s", visual: "text", onScreen: "You keep putting it off", vo: "", audio: "hit" }], hookSwaps: ["One", "Two", "Three"], labels: [] }
  const bad: Script = { ...base, title: "B", scenes: [{ ...base.scenes[0], vo: "Trusted by 10,000 families" }] }
  const r = keepLines([base, bad], scriptLines, allowedNumbers(""), null)
  assert.equal(r.ok.length, 1)
  assert.equal(r.ok[0].title, "T")
})

test("planHtml escapes HTML, renders tables, only https links", () => {
  const html = planHtml("## Hi <script>\n\n| A | B |\n|---|---|\n| 1 <b> | [x](https://a.com) |\n\n[bad](javascript:alert(1))")
  assert.ok(!html.includes("<script>"))
  assert.ok(html.includes("&lt;script&gt;"))
  assert.ok(html.includes("<table"))
  assert.ok(html.includes('<a href="https://a.com"'))
  assert.ok(!html.includes('href="javascript'))
})

test("scriptMd keeps pipes out of table cells", () => {
  const md = scriptMd({ title: "T", angle: "A", format: "F", hookType: "warning", seconds: 6, platforms: ["TikTok"], scenes: [{ t: "0-2s", visual: "a | b", onScreen: "x", vo: "y", audio: "z" }], hookSwaps: [], labels: [] }, 0)
  assert.ok(md.includes("a / b"))
})

test("playbook: every vertical has a rule list, hooks in priority order, brief mentions avoid list", () => {
  for (const v of VERTICALS) assert.ok(Array.isArray(VERTICAL_RULES[v]))
  assert.equal(HOOK_TYPES[0].key, "price_anchor")
  assert.match(playbookBrief(), /AVOID as openers/)
})

console.log(`\n${passed} passed`)
