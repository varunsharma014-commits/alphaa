// On-page score + salient terms (lib/onpage-grade.ts, lib/salient-terms.ts). Pure: no network/DB.
//   npx tsx scripts/test-onpage.ts
//   npx tsx scripts/test-onpage.ts --live <url> [url…]   also prints the terms of real ranking pages (robots respected)
import assert from "node:assert/strict"
import * as React from "react"
import { gradeOnPage, linksIn, imagesIn } from "../src/lib/onpage-grade"
import { keysIn, salientTerms, stem } from "../src/lib/salient-terms"

let passed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`ok  ${name}`) } catch (e) { console.error(`FAIL ${name}`); throw e }
}
const now = new Date("2026-11-28T12:00:00Z")
const para = (s: string, n = 60) => Array.from({ length: n }, (_, i) => s.split(" ")[i % s.split(" ").length]).join(" ") + "."
const check = (g: ReturnType<typeof gradeOnPage>, key: string) => g.checks.find((c) => c.key === key)!

// Two "ranking pages" about drain cleaning, the way readArticle returns them (main text + headings).
const docA = {
  text: `Drain cleaning costs depend on the clog. A hydro jetting service clears grease and tree roots from the main sewer line. A camera inspection shows the pipe before any work. Most plumbers charge a flat rate for a kitchen sink clog and more for a main sewer line backup. Hydro jetting uses high pressure water. Tree roots in the sewer line need a camera inspection first. Grease buildup in the kitchen sink is the most common clog. ${para("the plumber checks the pipe and the drain for a clog", 120)}`,
  headings: ["How much does drain cleaning cost?", "Hydro jetting vs snaking", "Camera inspection", "Tree roots in the sewer line"],
}
const docB = {
  text: `Hydro jetting and drain snaking are the two ways to clear a clog. A camera inspection finds tree roots and cracks in the sewer line. Grease in the kitchen sink and hair in the shower drain cause most clogs. Ask for a flat rate before the plumber starts. ${para("a sewer line camera inspection helps the plumber", 120)}`,
  headings: ["Drain snaking", "Hydro jetting", "Camera inspection cost"],
}

test("stemming + keys: plurals/-ing match", () => {
  assert.equal(stem("clogs"), "clog")
  assert.equal(stem("batteries"), "battery")
  assert.equal(stem("cleaning"), "clean")
  assert.equal(stem("glass"), "glass")
  assert.ok(keysIn("Hydro jetting clears clogs").has("hydro jett"))
})

test("salient terms: shared, topical phrases rank high; boilerplate and the competitor's name never", () => {
  const t = salientTerms([{ ...docA, text: docA.text + " Rooter Pros. Click here to read more. Contact us. Privacy policy." }, docB], { exclude: ["rooterpros", "Rooter Pros"] })
  const terms = t.map((x) => x.term)
  for (const want of ["hydro jetting", "camera inspection", "sewer line", "tree roots"]) assert.ok(terms.includes(want), `missing ${want}: ${terms.join(", ")}`)
  for (const never of ["click", "privacy", "contact", "rooter", "pros"]) assert.ok(!terms.some((x) => x.split(" ").includes(never)), `${never} leaked`)
  assert.ok(t.find((x) => x.term === "camera inspection")!.pages === 2)
  assert.deepEqual(salientTerms([{ text: "too short" }]), [])
})

test("topic coverage: which terms the draft lacks, with the fix", () => {
  const terms = salientTerms([docA, docB])
  const thin = gradeOnPage(`## How much does drain cleaning cost?\n\n${para("our plumber clears a clog fast", 80)}`, "Drain cleaning cost in Kanata", { terms, termPages: 2, now })
  assert.equal(check(thin, "coverage").level, "fix")
  assert.ok(thin.missingTerms.includes("hydro jetting"))
  assert.ok(thin.fixes.some((f) => /also cover: .*hydro jetting.*from 2 pages/.test(f.text)))
  const full = gradeOnPage(`## How much does drain cleaning cost?\n\n${docA.text}\n\n## Hydro jetting vs snaking\n\n${docB.text}`, "Drain cleaning cost in Kanata", { terms, termPages: 2, now })
  assert.equal(check(full, "coverage").level, "good")
  // No terms (no brief) = no coverage check, not a zero.
  assert.equal(gradeOnPage("text", "t", {}).checks.some((c) => c.key === "coverage"), false)
})

test("headings: one H1 (the title), no skipped levels, question headings", () => {
  const g = gradeOnPage(`# Drain cleaning\n\n${para("water flows down", 40)}\n\n#### Too deep\n\n${para("more words here", 40)}`, "Drain cleaning guide for homeowners", { now })
  assert.equal(check(g, "headings").level, "fix")
  assert.ok(g.fixes.some((f) => f.text.includes("Change “# Drain cleaning” to a ## section heading")))
  assert.ok(g.fixes.some((f) => f.text.includes("jumps from H1 to H4")))
  const ok = gradeOnPage(`## How long does it take?\n\n${para("about an hour", 50)}\n\n### Small jobs\n\n${para("quick", 20)}`, "How long drain cleaning takes in Kanata", { now })
  assert.equal(check(ok, "headings").level, "good")
  const wall = gradeOnPage(para("one long wall of text with no sections", 320), "A long post with no sections at all", { now })
  assert.ok(wall.fixes.some((f) => f.text.startsWith("Break the post into sections")))
})

test("keyword in title, opening and a heading", () => {
  const g = gradeOnPage(`## Prices\n\n${para("we fix pipes", 40)}`, "Our plumbing services", { keyword: "drain cleaning cost", now })
  assert.equal(check(g, "keyword").level, "fix")
  const ok = gradeOnPage(`Drain cleaning cost depends on the clog.\n\n## What drain cleaning costs in Kanata\n\n${para("prices vary", 30)}`, "Drain cleaning cost in Kanata: what to expect", { keyword: "drain cleaning cost", now })
  assert.equal(check(ok, "keyword").level, "good")
})

test("internal links: counts own-site links, suggests the brief's and the pillar's targets with an insert", () => {
  const md = `## A\n\n${para("text", 300)} See [our prices](/pricing) and [Google](https://google.com).`
  const g = gradeOnPage(md, "A title that is long enough here", { siteHost: "https://brightpipes.ca", internalTargets: [{ url: "https://brightpipes.ca/pricing", anchor: "our prices" }, { url: "https://brightpipes.ca/emergency", anchor: "emergency plumbing" }], pillar: { url: "https://www.brightpipes.ca/drains/", title: "Drain services" }, now })
  assert.equal(check(g, "links").value, "1, 1 of 3 planned")
  assert.equal(check(g, "links").level, "ok")
  const pillar = g.fixes.find((f) => f.text.includes("main page on this topic"))!
  assert.equal(pillar.level, "fix")
  assert.equal(pillar.insert, "[Drain services](https://www.brightpipes.ca/drains/)")
  assert.ok(g.fixes.some((f) => f.insert === "[emergency plumbing](https://brightpipes.ca/emergency)"))
  assert.deepEqual(linksIn("![x](a.png) [b](https://c.com)").map((l) => l.url), ["https://c.com"])
})

test("freshness: future years and stale years in headings; never asks to add the current year", () => {
  const g = gradeOnPage(`## Best drain tips for 2024\n\n${para("prices in 2027 will rise", 40)}`, "Drain tips", { now })
  assert.equal(check(g, "freshness").level, "fix")
  assert.ok(g.fixes.some((f) => f.text.includes("2027, which hasn’t happened yet")))
  assert.ok(g.fixes.some((f) => f.text.includes("A heading says 2024") && f.text.includes("only say 2026 if you’ve checked it")))
  const ok = gradeOnPage(`## Tips\n\n${para("since 2019 we have fixed drains", 40)}`, "Drain tips", { now })
  assert.equal(check(ok, "freshness").level, "good")
})

test("title and summary lengths", () => {
  assert.equal(check(gradeOnPage("x", "Short", { now }), "title").level, "fix")
  assert.equal(check(gradeOnPage("x", "Drain cleaning cost in Kanata: what to expect", { now }), "title").level, "good")
  const long = gradeOnPage("x", "A".repeat(75), { now })
  assert.ok(long.fixes.some((f) => f.text.includes("75 characters. Google shows about 60")))
  assert.equal(check(gradeOnPage("x", "t", { excerpt: "", now }), "summary").level, "fix")
  assert.equal(check(gradeOnPage("x", "t", { excerpt: "a".repeat(140), now }), "summary").level, "good")
  assert.equal(gradeOnPage("x", "t", { now }).checks.some((c) => c.key === "summary"), false) // unknown = not graded
})

test("image alt text", () => {
  assert.deepEqual(imagesIn("![](a.png) ![A plumber's van outside a house](b.jpg)").map((i) => i.alt), ["", "A plumber's van outside a house"])
  const g = gradeOnPage(`## A\n\n![](https://x.com/van.jpg)\n\n![IMG_2201.jpg](https://x.com/b.jpg)\n\n${para("w", 40)}`, "A title that is long enough here", { now })
  assert.equal(check(g, "images").level, "fix")
  assert.ok(g.fixes.some((f) => f.text.includes("van.jpg")))
  assert.equal(check(gradeOnPage("text", "t", { coverAlt: true, now }), "images").value, "cover described")
})

test("one score 0-100, fixes first, never more than 8", () => {
  const g = gradeOnPage(`# H1\n\n#### skip\n\n![](a.png)\n\n${para("prices in 2030", 400)}`, "x", { keyword: "drain cleaning", excerpt: "", now })
  assert.ok(g.score >= 0 && g.score <= 100)
  assert.equal(g.level, "fix")
  assert.ok(g.fixes.length <= 8)
  const firstOk = g.fixes.findIndex((f) => f.level === "ok")
  assert.ok(firstOk === -1 || g.fixes.slice(firstOk).every((f) => f.level === "ok"))
  assert.ok(g.fixes.every((f) => !/ [–—] /.test(f.text))) // no dashes as punctuation
})

console.log(`\n${passed} passed`)

// lib/page-reader → safe-fetch → lib/auth uses React's server-only cache(); a pass-through is enough here.
const live = process.argv.indexOf("--live")
if (live > 0) {
  const react = ((React as unknown as { default?: object }).default ?? React) as { cache?: unknown }
  if (typeof react.cache !== "function") react.cache = <T,>(f: T) => f
  void (async () => {
    const { readArticle } = await import("../src/lib/page-reader")
    const docs = []
    for (const u of process.argv.slice(live + 1)) {
      const r = await readArticle(u, 15_000)
      console.log(`${u}: ${r.ok ? `${r.page.words} words` : r.reason}`)
      if (r.ok) docs.push({ text: r.page.text, headings: r.page.headings.map((h) => h.text) })
    }
    console.log(salientTerms(docs).map((t) => `${t.term} (${t.pages})`).join(", ") || "(no terms)")
  })()
}
