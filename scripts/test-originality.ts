// Tests for the originality check's pure rules (lib/originality-rules.ts): shingled overlap with
// the brief's pages, verbatim runs, web-matched sentences, the block thresholds, attributed quotes,
// sentence picking for the Google check and the "Rewrite these lines" replacement.
// No database, no network, no AI:  npx tsx scripts/test-originality.ts
import assert from "node:assert/strict"
import {
  compare, units, pickSentences, holdsSentence, phraseQuery, replaceSentences, sourceSentence, textHash, shingles, tokens, summaryLine,
  BLOCK_SOURCE_PCT, MIN_WORDS, type WebSentence,
} from "../src/lib/originality-rules"

let passed = 0
const t = (name: string, fn: () => void) => { try { fn(); passed++ } catch (e) { console.error(`✗ ${name}`); throw e } }

// A draft of ~300 words in our own words, and a competitor page that shares nothing with it.
const OWN = [
  "## How long does teeth whitening last?",
  "Most people keep a brighter smile for many months when they look after their teeth. Coffee, red wine and smoking bring stains back sooner, so rinsing with water after a dark drink helps.",
  "Our dentists check your enamel first and tell you honestly whether whitening suits you. If your gums are sore or you have old fillings at the front, we talk through other choices before anything starts.",
  "## What does the visit look like?",
  "You sit back in a quiet room while we protect your gums with a soft barrier. The gel stays on in short rounds, and we pause between them so you stay comfortable the whole time.",
  "Afterwards you get a small kit for touch ups at home, with written steps in plain language. Bring it to your next cleaning and we check how the shade is holding up.",
  "## Is it safe for sensitive teeth?",
  "Sensitive teeth can still be whitened, but slowly and with a gentler gel. We start with a toothpaste for sensitivity two weeks before, and we keep each round short.",
  "Tell us about any twinges during the visit. We stop straight away and adjust the plan, because a calm visit matters more than a fast one.",
  "## How do I book?",
  "Book online or call the front desk, and mention whitening so we keep enough time free. We confirm by text the day before and send a short reminder about what to eat.",
  "Parking is behind the building and the entrance has no steps. If you need a different time, reply to the text and we move it for you without any fuss at all.",
].join("\n\n")
const RIVAL = "Professional whitening uses peroxide gels that break down stain molecules inside the enamel layer. Results vary by diet and habits. Clinics typically recommend maintenance trays and avoiding staining foods for the first forty eight hours after treatment. Some patients feel temporary sensitivity which fades quickly. Ask your provider about the shade guide and expected results before booking any appointment."

const copied = "The gel stays on in short rounds, and we pause between them so you stay comfortable the whole time."

t("units: headings, images, link URLs out; link text in", () => {
  const u = units("## A heading here?\nRead [our pricing page](https://a.com/pricing) today. ![alt text](https://a.com/x.jpg)\n- A list item that is long enough.\n| a | b |\n|---|---|")
  assert.ok(!u.some((x) => x.includes("heading")))
  assert.ok(u.some((x) => x.includes("Read our pricing page today.")))
  assert.ok(!u.some((x) => x.includes("https://")))
  assert.ok(u.some((x) => x.startsWith("A list item")))
})

t("attributed quotes are not compared", () => {
  const u = units("As the ADA says, “whitening works best on natural enamel that has no fillings or crowns at the front” and we agree.\n\n> A blockquote copied from a page with a source.\n> — American Dental Association")
  assert.ok(!u.join(" ").includes("natural enamel"))
  assert.ok(!u.join(" ").includes("blockquote copied"))
  // Unattributed quote marks don't excuse copying.
  assert.ok(units("We think “whitening works best on natural enamel that has no fillings” is right.").join(" ").includes("natural enamel"))
})

t("own text vs unrelated page = 100% original, not blocked", () => {
  const r = compare(OWN, [{ url: "https://rival.com/whitening", title: "Whitening", text: RIVAL }], [], { provider: "self" })
  assert.ok(r.words >= MIN_WORDS, `words ${r.words}`)
  assert.equal(r.original, 100)
  assert.equal(r.passages.length, 0)
  assert.equal(r.blocked, false)
  assert.match(summaryLine(r), /No matching passages/)
})

t("one copied sentence = a passage with its source, advisory only", () => {
  const r = compare(OWN, [{ url: "https://rival.com/visit", title: "Your visit", text: `${RIVAL} ${copied} More text about something else entirely here.` }], [], { provider: "self" })
  assert.equal(r.blocked, false)
  assert.ok(r.passages.length === 1, JSON.stringify(r.passages))
  assert.equal(r.passages[0].url, "https://rival.com/visit")
  assert.ok(r.passages[0].words >= 18)
  assert.ok(r.passages[0].sentences[0].startsWith("The gel stays on"))
  assert.ok(r.original < 100 && r.original > 85)
  assert.ok(r.sources[0].pct < BLOCK_SOURCE_PCT)
})

t("over 15% from one page = blocked with the reason", () => {
  const paras = OWN.split("\n\n").filter((p) => !p.startsWith("#")).slice(0, 4).join(" ")
  const r = compare(OWN, [{ url: "https://copycat.com/p", title: null, text: paras }], [], { provider: "self" })
  assert.equal(r.blocked, true)
  assert.ok(r.sources[0].pct > 15)
  assert.match(r.reason ?? "", /copycat\.com/)
})

t("two verbatim 25-word runs from different pages = blocked even under 15% each", () => {
  const long1 = "Our dentists check your enamel first and tell you honestly whether whitening suits you. If your gums are sore or you have old fillings at the front, we talk through other choices before anything starts."
  const long2 = "Book online or call the front desk, and mention whitening so we keep enough time free. We confirm by text the day before and send a short reminder about what to eat."
  const r = compare(OWN, [{ url: "https://a.com/1", title: null, text: `Intro words. ${long1} Outro words.` }, { url: "https://b.com/2", title: null, text: `Intro. ${long2} Outro.` }], [], { provider: "self" })
  assert.ok(r.sources.every((s) => s.pct <= 15), JSON.stringify(r.sources))
  assert.equal(r.runs25, 2)
  assert.equal(r.blocked, true)
  assert.match(r.reason ?? "", /2 passages of 25\+ words/)
})

t("web matches count, and a stale one (edited away) is ignored", () => {
  const web: WebSentence[] = [
    { key: textHash(copied), sentence: copied, matches: [{ url: "https://web.com/a", title: "A page", via: "snippet" }] },
    { key: "x", sentence: "This sentence is no longer anywhere in the draft at all, it was edited away.", matches: [{ url: "https://web.com/b", title: null, via: "page" }] },
  ]
  const r = compare(OWN, [], web, { provider: "self", webRan: true })
  assert.equal(r.passages.length, 1)
  assert.equal(r.passages[0].via, "web")
  assert.equal(r.sources[0].kind, "web")
  assert.equal(r.blocked, false)
  assert.ok(r.original < 100)
})

t("short texts aren't checked", () => {
  const r = compare("Just a short note about our hours and parking.", [{ url: "https://a.com", title: null, text: "Just a short note about our hours and parking." }], [], { provider: "self" })
  assert.equal(r.tooShort, true)
  assert.equal(r.blocked, false)
})

t("stop-word-only shingles don't count", () => {
  assert.equal(shingles(tokens("and the of to in it is that and the of to")).size, 0)
  assert.ok(shingles(tokens("whitening gel stays on in short rounds today")).size === 1)
})

t("pickSentences: distinctive, 12-32 words, no links/questions/brand, ≤2 per section", () => {
  const s = pickSentences(OWN, { exclude: ["Sample Dental"] })
  assert.ok(s.length >= 3 && s.length <= 5, String(s.length))
  for (const x of s) {
    const n = tokens(x).length
    assert.ok(n >= 12 && n <= 32, `${n}: ${x}`)
    assert.ok(!x.endsWith("?"))
  }
  const brand = pickSentences("## A\nSample Dental keeps your enamel safe with gentle peroxide gels in short supervised rounds every visit.\n", { exclude: ["Sample Dental"] })
  assert.equal(brand.length, 0)
  const linked = pickSentences("## A\nRead [our whitening guide](https://a.com/g) for every detail about gentle peroxide gels and enamel care.\n")
  assert.equal(linked.length, 0)
})

t("holdsSentence: snippets with the run match, unrelated text doesn't", () => {
  assert.ok(holdsSentence(copied, `Dental clinic · ${copied.slice(0, 70)} ...`))
  assert.ok(!holdsSentence(copied, "Whitening gels and short rounds keep patients comfortable."))
  assert.equal(phraseQuery(`He said "hi" ${"word ".repeat(40)}`).split(" ").length, 32)
  assert.ok(phraseQuery("a b").startsWith('"') && phraseQuery("a b").endsWith('"'))
})

t("textHash ignores spacing and punctuation, not words", () => {
  assert.equal(textHash("Hello,  world!"), textHash("hello world"))
  assert.notEqual(textHash("hello world"), textHash("hello there world"))
})

t("rewrite: sentence found in Markdown (with links/bold) and replaced", () => {
  const md = "Intro.\n\nWe check your **enamel** first and read [our guide](https://a.com/g) before we start any whitening at all.\n"
  const u = units(md).find((x) => x.startsWith("We check"))!
  const src = sourceSentence(md, u)
  assert.ok(src && src.includes("**enamel**") && src.includes("](https://a.com/g)"), String(src))
  const out = replaceSentences(md, [{ from: src!, to: "First we look at your **enamel** and [our guide](https://a.com/g) with you." }, { from: "not there", to: "x" }])
  assert.equal(out.done, 1)
  assert.deepEqual(out.missed, ["not there"])
  assert.ok(out.text.includes("First we look at your"))
})

console.log(`✓ ${passed} originality tests passed`)
