// Unit tests for the Google Ads request builders and rules, with a mocked fetch (never calls Google).
// Run: npx tsx scripts/test-gads.ts
import assert from "node:assert/strict"
import * as api from "../src/lib/gads/api"
import { checkDaily, cleanLines, copyProblem, countryOf, dailyFromMonthly, decideTuning, monthlyFromDaily, suggestDaily, cleanKeyword } from "../src/lib/gads/rules"

type Call = { url: string; init: RequestInit }
function mockFetch(responses: unknown[], status = 200) {
  const calls: Call[] = []
  const impl: api.FetchLike = async (url, init) => {
    calls.push({ url, init })
    const body = responses.shift()
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
  }
  return { calls, impl }
}
const headers = (c: Call) => c.init.headers as Record<string, string>
const json = (c: Call) => JSON.parse(String(c.init.body))
let passed = 0
async function test(name: string, fn: () => Promise<void> | void) {
  await fn()
  passed++
  console.log(`ok - ${name}`)
}

async function main() {
  await test("listAccessibleCustomers: GET v26, bearer only, no developer-token", async () => {
    const m = mockFetch([{ resourceNames: ["customers/1234567890", "customers/111"] }])
    const ids = await api.listAccessibleCustomers({ token: "tok", fetchImpl: m.impl })
    assert.deepEqual(ids, ["1234567890", "111"])
    assert.equal(m.calls[0].url, "https://googleads.googleapis.com/v26/customers:listAccessibleCustomers")
    assert.equal(m.calls[0].init.method, "GET")
    assert.equal(headers(m.calls[0]).Authorization, "Bearer tok")
    assert.ok(!("developer-token" in headers(m.calls[0])))
    assert.ok(!("login-customer-id" in headers(m.calls[0])))
  })

  await test("login-customer-id only when given, digits only", async () => {
    const m = mockFetch([[]])
    await api.searchStream("123-456-7890", "SELECT customer.id FROM customer", { token: "t", loginCustomerId: "999-000-1111", fetchImpl: m.impl })
    assert.equal(m.calls[0].url, "https://googleads.googleapis.com/v26/customers/1234567890/googleAds:searchStream")
    assert.equal(headers(m.calls[0])["login-customer-id"], "9990001111")
  })

  await test("searchStream flattens the array of batches", async () => {
    const m = mockFetch([[{ results: [{ a: 1 }, { a: 2 }] }, { results: [{ a: 3 }] }]])
    const rows = await api.searchStream("1", "q", { token: "t", fetchImpl: m.impl })
    assert.deepEqual(rows, [{ a: 1 }, { a: 2 }, { a: 3 }])
    assert.deepEqual(json(m.calls[0]), { query: "q" })
  })

  await test("customerInfo maps the customer row", async () => {
    const m = mockFetch([[{ results: [{ customer: { id: "42", descriptiveName: "Joe Plumbing", currencyCode: "CAD", timeZone: "America/Toronto", manager: false, testAccount: true, status: "ENABLED" } }] }]])
    const c = await api.customerInfo("42", { token: "t", fetchImpl: m.impl })
    assert.deepEqual(c, { id: "42", name: "Joe Plumbing", currency: "CAD", timeZone: "America/Toronto", manager: false, test: true, status: "ENABLED" })
  })

  await test("errors: GoogleAdsFailure message + codes", async () => {
    const m = mockFetch([{ error: { code: 403, message: "The caller does not have permission", status: "PERMISSION_DENIED", details: [{ "@type": "type.googleapis.com/google.ads.googleads.v26.errors.GoogleAdsFailure", errors: [{ errorCode: { authorizationError: "USER_PERMISSION_DENIED" }, message: "User doesn't have permission to access customer." }] }] } }], 403)
    await assert.rejects(() => api.listAccessibleCustomers({ token: "t", fetchImpl: m.impl }), (e: unknown) => {
      assert.ok(e instanceof api.GadsError)
      assert.equal(e.status, 403)
      assert.deepEqual(e.codes, ["authorizationError:USER_PERMISSION_DENIED"])
      assert.match(e.message, /permission to access customer/)
      return true
    })
  })

  await test("generateKeywordIdeas: body + parsing", async () => {
    const body = api.keywordIdeasBody({ keywords: ["emergency plumber", "plumber near me"], url: "https://joe.example", language: "languageConstants/1000", geoTargets: ["geoTargetConstants/1002451"] })
    assert.deepEqual(body, { language: "languageConstants/1000", geoTargetConstants: ["geoTargetConstants/1002451"], includeAdultKeywords: false, keywordPlanNetwork: "GOOGLE_SEARCH", pageSize: 200, keywordAndUrlSeed: { url: "https://joe.example", keywords: ["emergency plumber", "plumber near me"] } })
    const m = mockFetch([{ results: [{ text: "emergency plumber", keywordIdeaMetrics: { avgMonthlySearches: "390", competition: "HIGH", lowTopOfPageBidMicros: "4100000", highTopOfPageBidMicros: "12500000" } }, { text: "plumber near me", keywordIdeaMetrics: {} }] }])
    const ideas = await api.generateKeywordIdeas("123", body, { token: "t", fetchImpl: m.impl })
    assert.equal(m.calls[0].url, "https://googleads.googleapis.com/v26/customers/123:generateKeywordIdeas")
    assert.deepEqual(ideas[0], { text: "emergency plumber", avgMonthlySearches: 390, competition: "HIGH", lowBidMicros: 4_100_000, highBidMicros: 12_500_000 })
    assert.equal(ideas[1].avgMonthlySearches, null)
  })

  await test("geoTargetConstants:suggest prefers a City", async () => {
    const m = mockFetch([{ geoTargetConstantSuggestions: [{ geoTargetConstant: { resourceName: "geoTargetConstants/21167", targetType: "State" } }, { geoTargetConstant: { resourceName: "geoTargetConstants/1026339", targetType: "City" } }] }])
    const g = await api.suggestGeoTarget("Austin", "US", { token: "t", fetchImpl: m.impl })
    assert.equal(g, "geoTargetConstants/1026339")
    assert.equal(m.calls[0].url, "https://googleads.googleapis.com/v26/geoTargetConstants:suggest")
    assert.deepEqual(json(m.calls[0]), { locale: "en", countryCode: "US", locationNames: { names: ["Austin"] } })
  })

  await test("buildCampaignOps: one atomic create, PAUSED, temp ids, right order", async () => {
    const ops = api.buildCampaignOps({
      customerId: "123-456-7890", name: "Search - Plumbing - Austin", dailyBudget: 16.44, bidding: "clicks", finalUrl: "https://joe.example",
      location: { cityName: "Austin", provinceCode: "TX", postalCode: "78701", countryCode: "US", radius: 15, units: "MILES" },
      language: "languageConstants/1000", negatives: ["jobs", "Jobs", "free"],
      adGroups: [{ name: "Emergency plumbing", keywords: [{ text: "emergency plumber", match: "PHRASE" }, { text: "emergency plumber", match: "PHRASE" }, { text: "plumber austin", match: "EXACT" }], ad: { headlines: ["Joe Plumbing", "Emergency Plumber Austin", "Call Today"], descriptions: ["Licensed plumbers in Austin.", "Book online in a minute."], path1: "plumbing" } }],
    })
    const kinds = ops.map((o) => Object.keys(o)[0])
    assert.deepEqual(kinds, ["campaignBudgetOperation", "campaignOperation", "campaignCriterionOperation", "campaignCriterionOperation", "campaignCriterionOperation", "campaignCriterionOperation", "adGroupOperation", "adGroupCriterionOperation", "adGroupCriterionOperation", "adGroupAdOperation"])
    const budget = (ops[0] as { campaignBudgetOperation: api.Operation }).campaignBudgetOperation.create as Record<string, unknown>
    assert.equal(budget.resourceName, "customers/1234567890/campaignBudgets/-1")
    assert.equal(budget.amountMicros, "16440000")
    const camp = (ops[1] as { campaignOperation: api.Operation }).campaignOperation.create as Record<string, unknown>
    assert.equal(camp.resourceName, "customers/1234567890/campaigns/-2")
    assert.equal(camp.status, "PAUSED")
    assert.equal(camp.advertisingChannelType, "SEARCH")
    assert.equal(camp.campaignBudget, budget.resourceName)
    assert.deepEqual(camp.targetSpend, {})
    assert.equal(camp.containsEuPoliticalAdvertising, "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING")
    const prox = (ops[2] as { campaignCriterionOperation: api.Operation }).campaignCriterionOperation.create as Record<string, unknown>
    assert.deepEqual(prox, { campaign: camp.resourceName, proximity: { address: { cityName: "Austin", provinceCode: "TX", postalCode: "78701", countryCode: "US" }, radius: 15, radiusUnits: "MILES" } })
    const ad = (ops[9] as { adGroupAdOperation: api.Operation }).adGroupAdOperation.create as { adGroup: string; ad: { finalUrls: string[]; responsiveSearchAd: { headlines: { text: string }[]; path1?: string; path2?: string } } }
    assert.equal(ad.adGroup, "customers/1234567890/adGroups/-3")
    assert.deepEqual(ad.ad.finalUrls, ["https://joe.example"])
    assert.equal(ad.ad.responsiveSearchAd.headlines[1].text, "Emergency Plumber Austin")
    assert.equal(ad.ad.responsiveSearchAd.path1, "plumbing")
    assert.ok(!("path2" in ad.ad.responsiveSearchAd))
    const conv = api.buildCampaignOps({ customerId: "1", name: "x", dailyBudget: 10, bidding: "conversions", finalUrl: "https://a", location: { radius: 10, units: "KILOMETERS" }, negatives: [], adGroups: [] })
    assert.deepEqual(((conv[1] as { campaignOperation: api.Operation }).campaignOperation.create as Record<string, unknown>).maximizeConversions, {})
  })

  await test("mutateAll posts to googleAds:mutate and returns resource names", async () => {
    const m = mockFetch([{ mutateOperationResponses: [{ campaignBudgetResult: { resourceName: "customers/1/campaignBudgets/9" } }, { campaignResult: { resourceName: "customers/1/campaigns/8" } }] }])
    const names = await api.mutateAll("1", [{ campaignBudgetOperation: { create: {} } }, { campaignOperation: { create: {} } }], { token: "t", fetchImpl: m.impl })
    assert.deepEqual(names, ["customers/1/campaignBudgets/9", "customers/1/campaigns/8"])
    assert.equal(m.calls[0].url, "https://googleads.googleapis.com/v26/customers/1/googleAds:mutate")
    assert.ok(Array.isArray(json(m.calls[0]).mutateOperations))
  })

  await test("service mutates: enable, pause keyword, negative, lower budget", async () => {
    const m = mockFetch([{ results: [{ resourceName: "customers/1/campaigns/8" }] }, { results: [{ resourceName: "customers/1/campaignCriteria/8~55" }] }])
    await api.mutate("1", "campaigns", [api.campaignStatusOp("customers/1/campaigns/8", "ENABLED")], { token: "t", fetchImpl: m.impl })
    assert.equal(m.calls[0].url, "https://googleads.googleapis.com/v26/customers/1/campaigns:mutate")
    assert.deepEqual(json(m.calls[0]), { operations: [{ update: { resourceName: "customers/1/campaigns/8", status: "ENABLED" }, updateMask: "status" }] })
    await api.mutate("1", "campaignCriteria", [api.negativeKeywordOp("customers/1/campaigns/8", "free plumbing")], { token: "t", fetchImpl: m.impl })
    assert.deepEqual(json(m.calls[1]).operations[0], { create: { campaign: "customers/1/campaigns/8", negative: true, keyword: { text: "free plumbing", matchType: "EXACT" } } })
    assert.deepEqual(api.keywordStatusOp("customers/1/adGroupCriteria/7~9", "PAUSED"), { update: { resourceName: "customers/1/adGroupCriteria/7~9", status: "PAUSED" }, updateMask: "status" })
    assert.deepEqual(api.budgetAmountOp("customers/1/campaignBudgets/9", 12.5), { update: { resourceName: "customers/1/campaignBudgets/9", amountMicros: "12500000" }, updateMask: "amountMicros" })
  })

  await test("ad copy rules", () => {
    const allowed = new Set(["24"])
    assert.equal(copyProblem("Best Plumber in Austin", 30, allowed, true), "superlative or claim I can’t back up")
    assert.equal(copyProblem("#1 Plumber", 30, allowed, true), "superlative or claim I can’t back up")
    assert.equal(copyProblem("Call Us Today!", 30, allowed, true), "Google doesn’t allow ! in headlines")
    assert.equal(copyProblem("Open 24 Hours", 30, allowed, true), null)
    assert.equal(copyProblem("Open 7 Days", 30, allowed, true), "a number that isn’t in your facts")
    assert.equal(copyProblem("A headline that is way too long for Google", 30, allowed, true), "over 30 characters")
    assert.equal(copyProblem("Best Buy Plumbing", 30, allowed, true, "Best Buy Plumbing"), null)
    const r = cleanLines(["Call Today", "call today", "Top-Rated Team", "Book Online"], 30, 15, allowed, true)
    assert.deepEqual(r.ok, ["Call Today", "Book Online"])
    assert.equal(r.dropped.length, 2)
    assert.equal(cleanKeyword("Emergency Plumber!!"), "emergency plumber")
    assert.equal(cleanKeyword("best plumber"), null)
  })

  await test("budget maths never exceeds the cap", () => {
    assert.equal(dailyFromMonthly(500), 16.44)
    assert.ok(monthlyFromDaily(dailyFromMonthly(500)) <= 500)
    assert.deepEqual(checkDaily("15", 500), { ok: true, daily: 15 })
    assert.equal(checkDaily("17", 500).ok, false)
    assert.equal(checkDaily("0", null).ok, false)
    assert.deepEqual(suggestDaily([2_000_000, 4_000_000, 9_000_000]), { daily: 40, cpc: 4 })
    assert.equal(suggestDaily([]), null)
    assert.equal(countryOf("ON", null), "CA")
    assert.equal(countryOf(null, "M5V 2T6"), "CA")
    assert.equal(countryOf("TX", null), "US")
  })

  await test("tuning: only with conversion tracking, real thresholds, keeps keywords running", () => {
    const terms = [
      { term: "plumbing jobs", status: "NONE", cost: 12, clicks: 6, conversions: 0 },
      { term: "emergency plumber austin", status: "NONE", cost: 40, clicks: 10, conversions: 2 },
      { term: "cheap toilet", status: "NONE", cost: 3, clicks: 4, conversions: 0 },
      { term: "diy drain", status: "EXCLUDED", cost: 20, clicks: 9, conversions: 0 },
    ]
    const keywords = ["a", "b", "c", "d", "e"].map((t, i) => ({ criterion: `c/${i}`, text: t, status: "ENABLED", cost: i === 0 ? 80 : 5, clicks: 10, conversions: 0 }))
    assert.deepEqual(decideTuning({ daily: 10, tracking: false, terms, keywords }), [])
    const d = decideTuning({ daily: 10, tracking: true, terms, keywords })
    assert.deepEqual(d, [
      { kind: "negative", term: "plumbing jobs", cost: 12, clicks: 6 },
      { kind: "pause_keyword", criterion: "c/0", text: "a", cost: 80, clicks: 10 },
    ])
    const few = keywords.slice(0, 3)
    assert.equal(decideTuning({ daily: 10, tracking: true, terms: [], keywords: few }).length, 0)
  })

  console.log(`\n${passed} passed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
