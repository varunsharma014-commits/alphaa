// Pure tests for the draft editor's graders (lib/content-grade.ts) and version diff (lib/text-diff.ts).
// No database, no network.
//   npx tsx scripts/test-content-grade.ts
import assert from "node:assert/strict"
import { blocksOf, gradeAnswers, gradeContent, isPassive, isQuestionHeading, readability, sentencesOf, syllables, wordsOf } from "../src/lib/content-grade"
import { diffStats, diffText } from "../src/lib/text-diff"

let passed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`ok  ${name}`) } catch (e) { console.error(`FAIL ${name}`); throw e }
}
const words = (n: number, w = "plumbers") => Array.from({ length: n }, (_, i) => (i === 0 ? "Most" : w)).join(" ") + "."

test("question headings", () => {
  assert.equal(isQuestionHeading("How much does a drain cleaning cost"), true)
  assert.equal(isQuestionHeading("Our prices?"), true)
  assert.equal(isQuestionHeading("**Is** it safe"), true)
  assert.equal(isQuestionHeading("Island tours we run"), false) // "Is" only as a whole word
  assert.equal(isQuestionHeading("Pricing"), false)
  assert.equal(isQuestionHeading("Whatever you need"), false)
})

test("blocks: paragraphs join lines, lists and headings split", () => {
  const b = blocksOf("## A?\nline one\nline two\n\n- x\n- y\n### B")
  assert.deepEqual(b.map((x) => x.kind), ["h", "p", "li", "li", "h"])
  assert.equal((b[1] as { text: string }).text, "line one line two")
})

test("direct answers: good / short / long / missing / list-first / leans on heading", () => {
  const md = [
    "## How much does it cost?", words(45),
    "## Why choose us?", words(12),
    "## What areas do you serve?", words(75),
    "## Can you come today?",
    "## Where are you?", "- Downtown", "- Uptown",
    "### Is it safe?", "It " + words(44).toLowerCase(),
    "## Our story", words(10),
  ].join("\n\n")
  const c = gradeAnswers(md)
  assert.deepEqual(c.map((x) => x.status), ["good", "short", "long", "missing", "missing", "leans"])
  assert.equal(c[0].words, 45)
  assert.match(c[1].fix!, /12 words/)
  assert.match(c[2].fix!, /first 60 words/)
  assert.match(c[4].fix!, /starts with a list/)
  assert.match(c[5].fix!, /opens with “It”/)
  assert.equal(c.length, 6) // "Our story" isn't a question
})

test("words, sentences, syllables", () => {
  assert.deepEqual(wordsOf("We fix **leaks** fast — [call us](https://x.com) today."), ["We", "fix", "leaks", "fast", "call", "us", "today."])
  assert.equal(sentencesOf("We open at 8 a.m. on weekdays. Call Dr. Lee today! Prices start at $9.50. e.g. drains.").length, 3)
  assert.equal(syllables("the"), 1)
  assert.equal(syllables("water"), 2)
  assert.equal(syllables("plumbing"), 2)
  assert.equal(syllables("emergency"), 4)
})

test("passive voice estimate", () => {
  assert.equal(isPassive("The pipe was repaired by our team."), true)
  assert.equal(isPassive("Your quote is sent within an hour."), true)
  assert.equal(isPassive("We are located downtown."), false)
  assert.equal(isPassive("We are licensed and insured."), false)
  assert.equal(isPassive("We repair pipes the same day."), false)
})

test("readability: easy copy scores well, dense copy gets fixes", () => {
  const easy = "## How fast can you come?\n\n" + "We come the same day. Call us before noon. We bring the parts. You pay when it works. ".repeat(4)
  const r = readability(easy)
  assert.ok(r.grade != null && r.grade < 6, `grade ${r.grade}`)
  assert.equal(r.longSentences.length, 0)
  const dense = "Notwithstanding the considerable complexity inherent in contemporary residential plumbing infrastructure, comprehensive preventative maintenance methodologies are generally recommended by experienced professionals in order to substantially minimize unanticipated expenditures associated with emergency remediation. ".repeat(3)
  const g = gradeContent(dense)
  assert.ok(g.readability.grade! > 14, `grade ${g.readability.grade}`)
  assert.equal(g.readability.longSentences.length, 3)
  assert.equal(g.readability.longParagraphs.length, 1)
  assert.ok(g.score < 50, `score ${g.score}`)
  assert.ok(g.fixes.some((f) => /grade/.test(f.text)))
  assert.ok(g.fixes.some((f) => /Split this \d+-word sentence/.test(f.text)))
})

test("score card: good post, empty post, no question headings", () => {
  const ans = "A drain cleaning in Ottawa costs most homes between one and two hundred dollars. The price depends on how deep the clog sits and how old the pipes are. We tell you the price before we start. You never pay for a visit that fixes nothing at all."
  const good = `## How much does drain cleaning cost?\n\n${ans}\n\n- Small clogs cost less.\n- Main lines cost more.\n\n## When should you call a plumber?\n\n${ans}`
  const g = gradeContent(good)
  assert.equal(g.answers.total, 2)
  assert.equal(g.answers.passed, 2)
  assert.ok(g.score >= 80, `score ${g.score}`)
  assert.equal(g.level, "good")
  assert.equal(gradeContent("").score, 0)
  const flat = gradeContent(("We fix leaks. We clean drains. We help fast. ".repeat(20)))
  assert.equal(flat.answers.total, 0)
  assert.ok(flat.fixes.some((f) => /phrased as customer questions/.test(f.text)))
  assert.ok(g.fixes.length <= 8)
})

test("diff: identical, one word, added line, removed paragraph", () => {
  assert.deepEqual(diffText("same\ntext", "same\ntext"), [{ t: "eq", s: "same\ntext" }])
  const one = diffText("We fix leaks fast.\nCall us.", "We fix drains fast.\nCall us.")
  assert.deepEqual(one.filter((o) => o.t !== "eq"), [{ t: "del", s: "leaks" }, { t: "add", s: "drains" }])
  assert.deepEqual(diffStats(one), { added: 1, removed: 1 })
  const add = diffText("a\nb", "a\nnew line\nb")
  assert.deepEqual(add, [{ t: "eq", s: "a\n" }, { t: "add", s: "new line\n" }, { t: "eq", s: "b" }])
  const del = diffText("## H\n\nold para here\n\nend", "## H\n\nend")
  assert.equal(diffStats(del).removed, 3)
  assert.equal(diffStats(del).added, 0)
  // Ops rebuild both texts exactly.
  const a = "## Title\n\nOne two three.\n\n- list\n", b = "## Title!\n\nOne 2 three four.\n\n- list\n- more\n"
  const ops = diffText(a, b)
  assert.equal(ops.filter((o) => o.t !== "add").map((o) => o.s).join(""), a)
  assert.equal(ops.filter((o) => o.t !== "del").map((o) => o.s).join(""), b)
})

test("diff: big inputs stay fast and exact", () => {
  const a = Array.from({ length: 3000 }, (_, i) => `line ${i} with some words`).join("\n")
  const b = a.replace("line 1500 with", "line 1500 now with")
  const t = Date.now()
  const ops = diffText(a, b)
  assert.ok(Date.now() - t < 1500)
  assert.equal(ops.filter((o) => o.t !== "del").map((o) => o.s).join(""), b)
  assert.deepEqual(diffStats(ops), { added: 1, removed: 0 })
})

console.log(`\n${passed} passed`)
