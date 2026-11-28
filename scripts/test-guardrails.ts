// Unit tests for the owner's brand guardrails (lib/guardrails.ts): banned words, "always say",
// hashtags and disclaimers per channel and platform limit, and the reject + one retry loop.
// No database, no AI. Run: npx tsx scripts/test-guardrails.ts
import assert from "node:assert/strict"
import {
  bannedIn, cutTo, enforce, finishBlog, finishEmail, finishGoogle, finishGoogleAd, finishMetaAd, finishSocial, guardrailPrompt,
  guardrailPromptHere, GuardrailError, isEmpty, missingAlways, normalizeGuardrails, normalizeTag, runWithRules, SOCIAL_LIMIT, type Guardrails,
  finishReview, disclaimerFor, REVIEW_REPLY_LIMIT, bannedInEdit, bannedEditMessage,
} from "../src/lib/guardrails"
import { copyProblem } from "../src/lib/gads/rules"
import { checkAds } from "../src/lib/metaads/rules"

let passed = 0
async function test(name: string, fn: () => Promise<void> | void) {
  await fn()
  passed++
  console.log(`ok - ${name}`)
}

const G = (o: Partial<Guardrails> = {}): Guardrails => ({ banned: [], hashtags: [], platformHashtags: {}, disclaimers: {}, alwaysSay: [], ...o })

async function main() {
  await test("normalize: lists from text, tags get one #, junk dropped, empty is empty", () => {
    const g = normalizeGuardrails({ banned: "cheap, Cheap\n  world class ", hashtags: "LocalPlumbing #ottawa  #Ottawa, ##fix it!", platformHashtags: { instagram: "#igonly", bogus: "#x" } as never, disclaimers: { ads: "  Licensed in Ontario.  ", email: "" }, alwaysSay: ["Family-owned"] })
    assert.deepEqual(g.banned, ["Cheap", "world class"])
    assert.deepEqual(g.hashtags, ["#LocalPlumbing", "#Ottawa", "#fixit"])
    assert.deepEqual(g.platformHashtags, { instagram: ["#igonly"] })
    assert.deepEqual(g.disclaimers, { ads: "Licensed in Ontario." })
    assert.deepEqual(g.alwaysSay, ["Family-owned"])
    assert.equal(normalizeTag("  "), null)
    assert.ok(isEmpty(normalizeGuardrails({})))
    assert.ok(!isEmpty(g))
  })

  await test("bannedIn: whole words and phrases, any case, curly quotes, not inside other words", () => {
    assert.equal(bannedIn("We are CHEAP and fast", ["cheap"]), "cheap")
    assert.equal(bannedIn("Cheapest in town", ["cheap"]), null)
    assert.equal(bannedIn("truly world   class care", ["world class"]), "world class")
    assert.equal(bannedIn("we don’t stop", ["don't stop"]), "don't stop")
    assert.equal(bannedIn("Call 24/7 now", ["24/7"]), "24/7")
    assert.equal(bannedIn("nothing here", ["cheap", "free"]), null)
    assert.equal(bannedIn("C'est très bon marché", ["bon marché"]), "bon marché")
  })

  await test("missingAlways: case and spacing insensitive", () => {
    assert.deepEqual(missingAlways("We are family-owned and insured", ["Family-Owned", "Licensed"]), ["Licensed"])
  })

  await test("prompt: banned, always-say, and 'I add hashtags/disclaimers' only when set", () => {
    const p = guardrailPrompt(G({ banned: ["cheap"], alwaysSay: ["Licensed"], hashtags: ["#a"], disclaimers: { social: "D" } }), "social")
    assert.match(p, /Never use these words or phrases, in any form: "cheap"/)
    assert.match(p, /Always include, word for word: "Licensed"/)
    assert.match(p, /I add the business's own hashtags afterwards/)
    assert.match(p, /I add the business's disclaimer afterwards/)
    assert.doesNotMatch(guardrailPrompt(G({ hashtags: ["#a"] }), "blog"), /hashtags/)
    assert.equal(guardrailPrompt(G(), "blog"), "")
    assert.equal(guardrailPrompt(null, "blog"), "")
  })

  const g = G({ hashtags: ["#Ottawa", "#Plumbing"], platformHashtags: { instagram: ["#OttawaHomes"], x: ["#yow"] }, disclaimers: { social: "Licensed plumber, ON #12345.", blog: "Not legal advice.", email: "You get this because you are a customer.", ads: "Licensed in Ontario." } })

  await test("finishSocial: appends disclaimer + common + platform hashtags, no duplicates, idempotent", () => {
    const f = finishSocial("Leaky tap? We fix it today. #ottawa", g, "instagram")
    assert.equal(f.text, "Leaky tap? We fix it today. #ottawa\n\nLicensed plumber, ON #12345.\n\n#Plumbing #OttawaHomes")
    assert.deepEqual(f.flags, [])
    assert.equal(finishSocial(f.text, g, "instagram").text, f.text)
    // LinkedIn has no extra tags.
    assert.ok(finishSocial("Hi", g, "linkedin").text.endsWith("#Ottawa #Plumbing"))
  })

  await test("finishSocial: X 280 limit, the body is cut at a word so the required lines fit", () => {
    const long = "Water heater trouble? ".repeat(20).trim()
    const f = finishSocial(long, g, "x")
    assert.ok(f.text.length <= SOCIAL_LIMIT.x, `length ${f.text.length}`)
    assert.ok(f.text.includes("Licensed plumber, ON #12345.") && f.text.endsWith("#Ottawa #Plumbing #yow"))
    assert.ok(f.flags.includes("shortened"))
    assert.match(f.text.split("\n\n")[0], /…$/)
  })

  await test("finishSocial: a disclaimer too long for X drops hashtags first, then the disclaimer, and flags it", () => {
    const big = G({ hashtags: ["#a"], disclaimers: { social: "x".repeat(262) } })
    const f = finishSocial("Short body here.", big, "x")
    assert.ok(f.text.length <= 280)
    assert.ok(f.flags.includes("hashtags"))
    const huge = G({ disclaimers: { social: "y".repeat(400) } })
    const h = finishSocial("Short body here.", huge, "x")
    assert.equal(h.text, "Short body here.")
    assert.deepEqual(h.flags, ["disclaimer"])
  })

  await test("finishSocial: no rules = text unchanged", () => {
    assert.deepEqual(finishSocial("  hello  ", null, "x"), { text: "hello", flags: [] })
  })

  await test("finishGoogle: social disclaimer, no hashtags, inside 1,500", () => {
    assert.equal(finishGoogle("Update.", g).text, "Update.\n\nLicensed plumber, ON #12345.")
    const f = finishGoogle("a ".repeat(800), g)
    assert.ok(f.text.length <= 1500 && f.text.endsWith("Licensed plumber, ON #12345."))
  })

  await test("finishBlog / finishEmail: disclaimer last, once", () => {
    assert.equal(finishBlog("# T\n\nBody", g), "# T\n\nBody\n\n*Not legal advice.*")
    assert.equal(finishBlog(finishBlog("Body", g), g), "Body\n\n*Not legal advice.*")
    assert.deepEqual(finishEmail(["One.", "Two."], g), ["One.", "Two.", "You get this because you are a customer."])
    assert.deepEqual(finishEmail(["One.", "You get this because you are a customer."], g).length, 2)
    assert.equal(finishBlog("Body", G()), "Body")
  })

  await test("ads: Meta primary text gets the disclaimer if it fits, else unchanged + flagged", () => {
    assert.deepEqual(finishMetaAd("Book a plumber today.", g), { text: "Book a plumber today.\n\nLicensed in Ontario.", flags: [] })
    const long = "z".repeat(290)
    assert.deepEqual(finishMetaAd(long, g), { text: long, flags: ["disclaimer"] })
  })

  await test("ads: Google descriptions carry the disclaimer; too-long lines dropped while 2 remain; else flagged", () => {
    const r = finishGoogleAd(["Same-day repairs", "Call for a quote today", "x".repeat(80)], g)
    assert.deepEqual(r.descriptions, ["Same-day repairs. Licensed in Ontario.", "Call for a quote today. Licensed in Ontario."])
    assert.deepEqual(r.flags, [])
    const f = finishGoogleAd(["x".repeat(80), "y".repeat(85)], g)
    assert.deepEqual(f.descriptions, ["x".repeat(80), "y".repeat(85)])
    assert.deepEqual(f.flags, ["disclaimer"])
  })

  await test("cutTo: word boundary + ellipsis", () => {
    assert.equal(cutTo("one two three four", 12), "one two…")
    assert.equal(cutTo("short", 10), "short")
  })

  await test("enforce: banned word → one retry with a note in the prompt → clean draft passes, then finished", async () => {
    const rules = G({ banned: ["cheap"], disclaimers: { blog: "Not advice." } })
    const prompts: string[] = []
    let n = 0
    const out = await enforce<string>("u1", "blog", async () => {
      prompts.push(guardrailPromptHere())
      return n++ === 0 ? "A cheap fix." : "A quick fix."
    }, { rules, texts: (t) => [t], finish: (t, gg) => finishBlog(t, gg) })
    assert.equal(out, "A quick fix.\n\n*Not advice.*")
    assert.equal(n, 2)
    assert.match(prompts[0], /Never use these words or phrases, in any form: "cheap"/)
    assert.doesNotMatch(prompts[0], /Your last draft/)
    assert.match(prompts[1], /Your last draft used "cheap"/)
  })

  await test("enforce: banned twice → GuardrailError, nothing returned", async () => {
    let n = 0
    await assert.rejects(enforce("u1", "social", async () => { n++; return "So cheap!" }, { rules: G({ banned: ["cheap"] }), texts: (t) => [t] }), (e: unknown) => e instanceof GuardrailError && /cheap/.test((e as Error).message))
    assert.equal(n, 2)
  })

  await test("enforce: missing an always-say item gets one retry, then is accepted", async () => {
    let n = 0
    const out = await enforce("u1", "email", async () => { n++; return "Hello there." }, { rules: G({ alwaysSay: ["Family-owned"] }), texts: (t) => [t] })
    assert.equal(out, "Hello there.")
    assert.equal(n, 2)
  })

  await test("enforce: no rules = the writer runs once, untouched, no prompt lines", async () => {
    let n = 0
    const out = await enforce<string>("u1", "blog", async () => { n++; return `x${guardrailPromptHere()}` }, { rules: null, texts: (t) => [t] })
    assert.equal(out, "x")
    assert.equal(n, 1)
  })

  await test("the prompt lines exist only while a writer runs under the rules (voiceText appends them)", async () => {
    assert.equal(guardrailPromptHere(), "")
    const inside = await runWithRules(G({ banned: ["cheap"] }), "social", async () => guardrailPromptHere())
    assert.match(inside, /THE OWNER'S BRAND RULES[\s\S]*"cheap"/)
    assert.equal(guardrailPromptHere(), "")
  })

  await test("ad copy checks drop lines with a banned word only while the rules run", async () => {
    const allowed = new Set<string>()
    assert.equal(copyProblem("Affordable plumbing", 30, allowed, true), null)
    const r = await runWithRules(G({ banned: ["affordable"] }), "ads", async () => copyProblem("Affordable plumbing", 30, allowed, true))
    assert.match(r ?? "", /never to use/)
    const ads = [{ primaryText: "Affordable repairs near you", headline: "Call us", description: "", imageHeadline: "Fix it" }, { primaryText: "Same-day repairs", headline: "Call us", description: "", imageHeadline: "Fix it" }]
    assert.equal(checkAds(ads, "").length, 2)
    const kept = await runWithRules(G({ banned: ["affordable"] }), "ads", async () => checkAds(ads, ""))
    assert.deepEqual(kept.map((a) => a.primaryText), ["Same-day repairs"])
  })

  // ── Review replies (draftReviewReply runs enforce(…, "reviews", …) with finishReview) ──────
  const reviewWriter = (drafts: string[]) => { let i = 0; const seen: string[] = []; return { seen, write: async () => { seen.push(guardrailPromptHere()); return drafts[Math.min(i++, drafts.length - 1)] } } }
  await test("reviews: the rules reach the reply prompt; a banned word = one rewrite with a note", async () => {
    const w = reviewWriter(["Thanks, we're the cheapest in town!", "Thanks so much for the kind words, Sam."])
    const out = await enforce("u1", "reviews", w.write, { rules: G({ banned: ["cheapest"] }), texts: (t) => [t], finish: (t, g) => finishReview(t, g).text })
    assert.equal(out, "Thanks so much for the kind words, Sam.")
    assert.equal(w.seen.length, 2)
    assert.match(w.seen[0], /Never use these words[\s\S]*"cheapest"/)
    assert.match(w.seen[1], /Your last draft used "cheapest"/)
  })
  await test("reviews: banned twice → GuardrailError (the caller saves nothing and says why)", async () => {
    const w = reviewWriter(["Cheapest around!", "Still the cheapest!"])
    await assert.rejects(enforce("u1", "reviews", w.write, { rules: G({ banned: ["cheapest"] }), texts: (t) => [t] }), (e: unknown) => e instanceof GuardrailError && /cheapest/.test((e as Error).message) && /didn’t save/.test((e as Error).message))
  })
  await test("reviews: an always-say item missing = one rewrite asking for it", async () => {
    const w = reviewWriter(["Thanks for visiting!", "Thanks for visiting! Family-owned since 1998."])
    const out = await enforce("u1", "reviews", w.write, { rules: G({ alwaysSay: ["Family-owned since 1998"] }), texts: (t) => [t] })
    assert.match(out, /Family-owned since 1998/)
    assert.match(w.seen[1], /left out: "Family-owned since 1998"/)
  })
  await test("reviews: a disclaimer only when the owner set one for reviews", () => {
    const reply = "Thank you for the review."
    assert.equal(finishReview(reply, G({ disclaimers: { social: "Ads disclaimer.", blog: "Blog note.", email: "Email note." } })).text, reply)
    assert.equal(finishReview(reply, G({ disclaimers: { reviews: "Replies are from the owner." } })).text, `${reply}\n\nReplies are from the owner.`)
    assert.equal(finishReview(`${reply}\n\nReplies are from the owner.`, G({ disclaimers: { reviews: "Replies are from the owner." } })).text, `${reply}\n\nReplies are from the owner.`)
    assert.equal(disclaimerFor(G({ disclaimers: { social: "S" } }), "reviews"), null)
    const long = finishReview("x ".repeat(2100), G({ disclaimers: { reviews: "Owner reply." } }))
    assert.ok(long.text.length <= REVIEW_REPLY_LIMIT && long.text.endsWith("Owner reply."))
    assert.deepEqual(normalizeGuardrails({ disclaimers: { reviews: "  From the owner.  " } }).disclaimers, { reviews: "From the owner." })
  })
  await test("reviews: no reviews rule = no prompt line about a disclaimer", () => {
    assert.doesNotMatch(guardrailPrompt(G({ disclaimers: { social: "S" } }), "reviews"), /disclaimer/)
    assert.match(guardrailPrompt(G({ disclaimers: { reviews: "R" } }), "reviews"), /disclaimer afterwards/)
  })

  // ── The owner's own edits, checked again at approve/publish time ──────────────────────────
  await test("owner edits: a banned word in edited text is found (any text field), else null", () => {
    const g = G({ banned: ["cheap", "world class"] })
    assert.equal(bannedInEdit(["My title", "We are World  Class plumbers"], g), "world class")
    assert.equal(bannedInEdit([null, "Cheap repairs", undefined], g), "cheap")
    assert.equal(bannedInEdit(["Cheaper is not the word"], g), null)
    assert.equal(bannedInEdit(["anything"], null), null)
    assert.match(bannedEditMessage("cheap"), /“cheap”.*never use/)
  })

  console.log(`\n${passed} passed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
