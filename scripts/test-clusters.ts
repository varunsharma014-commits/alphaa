// Tests for topic clusters' pure rules (lib/cluster-rules.ts): every pillar/article must map to a
// real input (anything else is dropped), live pages and drafts are matched only when on topic,
// statuses come from the brand's drafts, the next article is pillar-first one topic at a time,
// and a brief's link targets are the pillar + live siblings.
// No database, no network, no AI:  npx tsx scripts/test-clusters.ts
import assert from "node:assert/strict"
import {
  validatePlan, viewOf, nextArticle, linkTargets, statusOf, promptLists, anchorFor, clusterRef, whyOf, withRelated,
  type ClusterInputs, type DraftRow, type RawPlan,
} from "../src/lib/cluster-rules"

let passed = 0
const t = (name: string, fn: () => void) => { try { fn(); passed++ } catch (e) { console.error(`✗ ${name}`); throw e } }

const inputs: ClusterInputs = {
  questions: [
    { q: "How long does teeth whitening last?", named: 0, asked: 4 },
    { q: "Is Invisalign worth it for adults?", named: 1, asked: 4 },
  ],
  queries: [
    { query: "teeth whitening ottawa", impressions: 320, clicks: 9, position: 14.2 },
    { query: "invisalign cost", impressions: 210, clicks: 2, position: 22.6 },
    { query: "whitening sensitive teeth", impressions: 90, clicks: 1, position: 9.4 },
  ],
  pages: [
    { url: "https://dent.example/services/teeth-whitening", title: "teeth whitening" },
    { url: "https://dent.example/blog/invisalign-for-adults", title: "invisalign for adults" },
  ],
  drafts: [{ id: "draft1", title: "Whitening for sensitive teeth" }],
  gaps: [{ id: "gap1:0", title: "Invisalign vs braces for adults", host: "rival.example", url: "https://rival.example/invisalign-vs-braces" }],
  services: [{ name: "Cosmetic dentistry", url: null }, { name: "Invisalign", url: "https://dent.example/services/invisalign" }],
}

const raw: RawPlan = { clusters: [
  { pillar: "Teeth whitening: what to expect", pillarSources: ["Q0", "K0"], pillarPage: "P0", articles: [
    { title: "How long does teeth whitening last?", question: "How long does teeth whitening last?", sources: ["Q0"], page: null },
    { title: "Whitening for sensitive teeth", question: null, sources: ["K2"], page: "D0" },
    { title: "7 whitening myths debunked", question: null, sources: ["K0"], page: null }, // invented number: dropped
    { title: "Whitening at the beach this summer", question: null, sources: ["X9"], page: null }, // no real input: dropped
    { title: "How long does teeth whitening last?", question: null, sources: ["K0"], page: null }, // duplicate: dropped
  ] },
  { pillar: "Invisalign for adults", pillarSources: ["S1", "Q1"], pillarPage: "P1", articles: [
    { title: "Invisalign vs braces for adults", question: null, sources: ["G0"], page: null },
    { title: "What does Invisalign cost?", question: "invisalign cost", sources: ["K1"], page: "P0" }, // P0 is about whitening: page dropped, article kept
  ] },
  { pillar: "Gum care at home", pillarSources: ["Z1"], pillarPage: null, articles: [ // pillar with no real input: whole cluster dropped
    { title: "Flossing basics", question: null, sources: ["S0"], page: null },
  ] },
  { pillar: "Cosmetic dentistry options", pillarSources: ["S0"], pillarPage: null, articles: [] }, // no supporting articles: dropped
] }

const map = validatePlan(raw, inputs, "2026-11-28T00:00:00.000Z")
const MAP_ID = "map1"

t("prompt lists every input with its id", () => {
  const p = promptLists(inputs)
  for (const id of ["Q0:", "Q1:", "K0:", "K2:", "P0:", "P1:", "D0:", "G0:", "S0:", "S1:"]) assert.ok(p.includes(id), id)
  assert.ok(p.includes("320 impressions"))
  assert.ok(p.includes("named the business in 0 of 4 answers"))
})

t("only clusters tied to real inputs survive", () => {
  assert.equal(map.clusters.length, 2)
  assert.deepEqual(map.clusters.map((c) => c.title), ["Teeth whitening: what to expect", "Invisalign for adults"])
  assert.ok(map.dropped >= 5, String(map.dropped))
  const titles = map.clusters.flatMap((c) => c.articles.map((a) => a.title))
  assert.ok(!titles.some((x) => /myths|beach|Flossing/.test(x)), titles.join(" | "))
  assert.equal(titles.filter((x) => x === "How long does teeth whitening last?").length, 1)
})

t("pages and drafts are matched only when on topic", () => {
  const [w, inv] = map.clusters
  assert.equal(w.pillar.url, "https://dent.example/services/teeth-whitening")
  assert.equal(w.articles.find((a) => a.title.startsWith("Whitening for"))!.draftId, "draft1")
  const cost = inv.articles.find((a) => a.title === "What does Invisalign cost?")!
  assert.equal(cost.url, null, "P0 is a whitening page: not this article")
  assert.equal(cost.question, "invisalign cost")
  assert.equal(inv.pillar.url, "https://dent.example/blog/invisalign-for-adults")
})

t("gap articles carry their gap card + competitor for the brief", () => {
  const g = map.clusters[1].articles.find((a) => a.title.startsWith("Invisalign vs braces"))!
  assert.equal(g.gapId, "gap1:0")
  assert.equal(g.competitor, "rival.example")
  assert.equal(g.sources[0].label, "Competitor page")
})

t("why is written from the real counts", () => {
  const why = whyOf(map.clusters[0])
  assert.match(why, /^Built from /)
  assert.match(why, /AI question/)
  assert.match(why, /Google search/)
})

t("statuses: live page, open draft, a published draft, planned", () => {
  const drafts: DraftRow[] = [
    { id: "draft1", title: "Whitening for sensitive teeth", topic: null, requestTopic: null, status: "ready", url: null, cluster: null, at: "2026-11-20T00:00:00Z" },
    { id: "d2", title: "Long title the writer chose", topic: "How long does teeth whitening last?", requestTopic: null, status: "published", url: "https://dent.example/blog/whitening-last", cluster: null, at: "2026-11-21T00:00:00Z" },
  ]
  const v = viewOf(MAP_ID, map, drafts)
  const w = v.clusters[0]
  assert.equal(w.pillar.status, "published")
  assert.equal(w.articles.find((a) => a.title.startsWith("How long"))!.status, "published")
  assert.equal(w.articles.find((a) => a.title.startsWith("How long"))!.liveUrl, "https://dent.example/blog/whitening-last")
  const s = w.articles.find((a) => a.title.startsWith("Whitening for"))!
  assert.equal(s.status, "drafted")
  assert.equal(s.openDraftId, "draft1")
  assert.equal(w.written, 3)
  assert.equal(w.total, 3)
  assert.equal(v.clusters[1].articles.find((a) => a.title.startsWith("What does"))!.status, "planned")
})

t("a draft linked by cluster ref counts, whatever its title", () => {
  const a = map.clusters[1].articles[0]
  const s = statusOf(a, [{ id: "x", title: "Something else entirely", topic: null, requestTopic: null, status: "ready", url: null, cluster: clusterRef(MAP_ID, a.id), at: "2026-11-22T00:00:00Z" }])
  assert.equal(s.status, "drafted")
})

t("next article: finish one topic first, pillar first", () => {
  // Nothing written yet beyond build-time matches: whitening cluster's planned article comes first.
  const n1 = nextArticle(MAP_ID, map, [])!
  assert.equal(n1.cluster.title, "Teeth whitening: what to expect")
  assert.equal(n1.article.title, "How long does teeth whitening last?")
  // Whitening done → Invisalign: its pillar is live, so its first planned article.
  const done: DraftRow[] = [
    { id: "draft1", title: "Whitening for sensitive teeth", topic: null, requestTopic: null, status: "ready", url: null, cluster: null, at: "2026-11-20T00:00:00Z" },
    { id: "d2", title: "How long does teeth whitening last?", topic: null, requestTopic: null, status: "ready", url: null, cluster: null, at: "2026-11-21T00:00:00Z" },
  ]
  const n2 = nextArticle(MAP_ID, map, done)!
  assert.equal(n2.cluster.title, "Invisalign for adults")
  assert.equal(n2.article.title, "Invisalign vs braces for adults")
  assert.equal(n2.article.ref, clusterRef(MAP_ID, n2.article.id))
})

t("a pillar with no live page comes before its articles", () => {
  const m = validatePlan({ clusters: [{ pillar: "Invisalign guide for adults", pillarSources: ["Q1"], pillarPage: null, articles: [{ title: "What does Invisalign cost?", question: null, sources: ["K1"], page: null }] }] }, inputs)
  assert.equal(nextArticle("m", m, [])!.article.pillar, true)
})

t("link targets: pillar + live siblings, never itself or drafts", () => {
  const drafts: DraftRow[] = [{ id: "d2", title: "How long does teeth whitening last?", topic: null, requestTopic: null, status: "published", url: "https://dent.example/blog/whitening-last", cluster: null, at: "2026-11-21T00:00:00Z" }]
  const sensitive = map.clusters[0].articles.find((a) => a.title.startsWith("Whitening for"))!
  const tg = linkTargets(MAP_ID, map, sensitive.id, drafts)
  assert.deepEqual(tg.map((x) => x.url), ["https://dent.example/services/teeth-whitening", "https://dent.example/blog/whitening-last"])
  assert.equal(tg[0].pillar, true)
  // The pillar links to its live supporting pages.
  const fromPillar = linkTargets(MAP_ID, map, map.clusters[0].pillar.id, drafts)
  assert.deepEqual(fromPillar.map((x) => x.url), ["https://dent.example/blog/whitening-last"])
  assert.deepEqual(linkTargets(MAP_ID, map, "a_nope", drafts), [])
})

t("anchor text drops the brand part", () => {
  assert.equal(anchorFor("Teeth whitening: what to expect"), "Teeth whitening")
  assert.equal(anchorFor("Invisalign for adults | Sample Dental"), "Invisalign for adults")
})

t("empty or refused output = no clusters, nothing invented", () => {
  assert.equal(validatePlan(null, inputs).clusters.length, 0)
  assert.equal(validatePlan({ clusters: [] }, inputs).clusters.length, 0)
})

t("at most 6 clusters and 10 articles each", () => {
  const many: RawPlan = { clusters: Array.from({ length: 8 }, (_, i) => ({ pillar: `Topic number ${["one", "two", "three", "four", "five", "six", "seven", "eight"][i]} about whitening`, pillarSources: ["Q0"], pillarPage: null, articles: Array.from({ length: 12 }, (_, k) => ({ title: `Whitening question ${["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"][k]} for topic ${i}x`, question: null, sources: ["K0"], page: null })) })) }
  // Titles above include digits from "topic ${i}": allowed only when in the source; they aren't, so use letters.
  for (const c of many.clusters) c.articles.forEach((a, k) => { a.title = `Whitening question ${"abcdefghijkl"[k]} for ${c.pillar.split(" ")[2]}` })
  const m = validatePlan(many, inputs)
  assert.equal(m.clusters.length, 6)
  assert.ok(m.clusters.every((c) => c.articles.length === 10))
})

t("missing topic links go in one Related reading line before the FAQ", () => {
  const md = "Intro.\n\n## Why?\nBecause.\n\n## Frequently asked questions\n### Q?\nA."
  const out = withRelated(md, [{ anchor: "Teeth whitening", url: "https://d.example/p" }, { anchor: "Sensitive teeth", url: "https://d.example/s" }])
  assert.ok(out.includes("Related reading: [Teeth whitening](https://d.example/p) and [Sensitive teeth](https://d.example/s).\n\n## Frequently asked questions"))
  assert.equal(withRelated("No faq here.", [{ anchor: "A", url: "https://d.example/a" }]), "No faq here.\n\nRelated reading: [A](https://d.example/a).")
  assert.equal(withRelated(md, []), md)
})

console.log(`✓ ${passed} cluster tests passed`)
