// Tests for the DataForSEO parsers, location mapping and the data_usd quota mapping, against real
// responses recorded 2026-11-28 in scripts/fixtures/dataforseo/ (reviewers' words stripped). Also
// the Meta Instagram parsers (shapes from Meta's docs: no recorded call, App Review is pending) and
// the client's failure handling with a mocked fetch. No network, no database.
//   npx tsx scripts/test-dataforseo.ts
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Modules that build clients at import time get harmless placeholders (nothing connects).
process.env.ANTHROPIC_API_KEY ||= "test-key"
process.env.DATABASE_URL ||= "postgresql://nobody@127.0.0.1:1/none"

const dir = join(__dirname, "fixtures", "dataforseo")
const fx = (name: string) => JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"))
let fails = 0
const ok = (cond: unknown, msg: string) => { if (cond) console.log(`  ok  ${msg}`); else { fails++; console.log(`  FAIL ${msg}`) } }

async function main() {
  const p = await import("../src/lib/dataforseo-parse")
  const q = await import("../src/lib/quota-rules")
  const c = await import("../src/lib/credit-rules")
  const m = await import("../src/lib/social/meta-insights")
  const ads = await import("../src/lib/ad-strategy/competitor-ad-rows")
  const r = await import("../src/lib/checks/ratings")

  console.log("Envelopes")
  {
    const post = p.firstTask(fx("serp_task_post"))
    ok(post.ok && post.status === 20100 && !!post.id && post.cost === 0.0006, "task_post: created, id + cost read")
    const waiting = p.firstTask(fx("serp_task_get_waiting"))
    ok(waiting.status === 40602 && p.DFS_WAITING.has(waiting.status!) && !waiting.result, "task_get while queued: 40602, no result")
    const live = p.firstTask(fx("serp_live_advanced"))
    ok(live.ok && live.cost === 0.002 && !!live.result, "live: ok, cost $0.002")
    ok(!p.firstTask({ status_code: 40210, status_message: "insufficient funds", tasks: [] }).ok, "account error envelope is not ok")
    ok(!p.firstTask(null).ok && p.firstTask(null).cost === 0, "garbage in: not ok, no cost")
  }

  console.log("Google organic")
  {
    const std = p.parseOrganic(p.firstTask(fx("serp_task_get_advanced")).result)
    ok(std.length === 8 && std.every((x) => x.exact === undefined), `standard mode: ${std.length} organic results with real addresses (local pack + AI Overview left out)`)
    ok(std[0].url === "https://www.champlainhealthline.ca/listservices.aspx?id=10061" && !!std[0].description, "first organic result + its snippet")
    const live = p.parseOrganic(p.firstTask(fx("serp_live_local")).result)
    ok(live.length > 0 && live.every((x) => x.exact === false && /^https:\/\/[a-z0-9.-]+$/.test(x.url)), `live: Google redirects become the site's own address, exact: false (${live.length})`)
    ok(live[0].url === "https://www.drgreat.ca", "address read from the breadcrumb")
    ok(p.breadcrumbOrigin("https://islandparkdental.ca › Blog") === "https://islandparkdental.ca" && p.breadcrumbOrigin("Island Park › Blog") === null, "breadcrumbOrigin")
    ok(p.parseOrganic(p.firstTask(fx("serp_task_get_advanced")).result, 3).length === 3, "max respected")
  }

  console.log("AI Overview")
  {
    const live = p.parseAiOverview(p.firstTask(fx("serp_live_advanced")).result)
    ok(live.shown && !!live.content?.includes("six months"), "live: Overview text read")
    ok(live.sources.length >= 4 && live.sources.every((s) => !p.isGoogleRedirect(s.url)), `live: ${live.sources.length} real sources, redirects left out`)
    ok(live.sources.some((s) => s.url.includes("pinnacledental.ca")), "a cited page is there")
    const std = p.parseAiOverview(p.firstTask(fx("serp_standard_ai_overview")).result)
    ok(std.shown && std.sources.length > 0 && !/\[\[\d+\]\]/.test(std.content ?? ""), "standard (load_async_ai_overview): shown, citation markers removed")
    ok(!p.parseAiOverview({ items: [{ type: "organic" }] }).shown, "no ai_overview item = not shown")
  }

  console.log("YouTube")
  {
    const v = p.parseYoutube(p.firstTask(fx("youtube_task_get_advanced")).result)
    ok(v.length === 12, `12 videos (${v.length})`)
    ok(v[0].views === 115308 && v[0].channel === "Teeth Talk Girl" && v[0].seconds === 342, "views, channel and length read")
    ok(v.every((x) => /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+$/.test(x.url)), "tracking parameter dropped from the link")
  }

  console.log("Google Ads Transparency")
  {
    const list = p.parseAdsSearch(p.firstTask(fx("ads_search_task_get_advanced")).result)
    ok(list.length === 9 && list.filter((a) => a.format === "video").length === 2, "9 ads, 2 video")
    ok(list[0].advertiser === "Semrush INC" && list[0].verified && !!list[0].preview && list[0].url.startsWith("https://adstransparency.google.com/"), "advertiser, preview picture and Transparency link")
    const now = Date.parse("2026-11-28T12:00:00Z")
    const active = ads.activeAds(list, now)
    ok(active.length === list.length, "all were shown in the last 30 days")
    ok(ads.activeAds(list, now + 60 * 86_400_000).length === 0, "60 days later none count as running")
    const row = ads.toCompetitorAd(list[0], "Semrush", "Rank Higher On Google")
    ok(row.platform === "google" && row.daysRunning === 647 && row.since === "2025-02-18" && row.text === "Rank Higher On Google", `competitor ad row (running ${row.daysRunning} days)`)
    ok(ads.META_ADS_NOTE.includes("Meta only shares political ads") && !/—|–/.test(ads.META_ADS_NOTE), "Meta note says why, no dashes")
  }

  console.log("Ratings")
  {
    const g = p.parseGoogleBusiness(p.firstTask(fx("google_business_info_live")).result)
    ok(g?.rating === 4.5 && g.count === 3115 && g.domain === "thekeg.com" && g.claimed === true, "Google listing: 4.5 from 3,115, domain, claimed")
    ok(!!g?.url?.startsWith("https://www.google.com/maps?cid="), "Google listing link is the Maps page")
    const tp = p.parseReviewSite(p.firstTask(fx("trustpilot_task_get")).result, "Trustpilot")
    ok(tp?.rating === 4.8 && tp.count === 17972 && tp.url?.startsWith("https://www.trustpilot.com/review/"), "Trustpilot: 4.8 from 17,972")
    const ta = p.parseReviewSite(p.firstTask(fx("tripadvisor_task_get")).result, "Tripadvisor")
    ok(ta?.rating === 4.3 && ta.count === 772 && ta.title === "The Keg Steakhouse + Bar - Ottawa Market", "Tripadvisor: 4.3 from 772")
    ok(p.parseReviewSite({ title: "x" }, "Trustpilot") === null, "no rating and no count = nothing")
    ok(r.trustpilotDomain("https://www.trustpilot.com/review/www.thepearlsource.com") === "www.thepearlsource.com", "Trustpilot domain from the owner's link")
    ok(r.tripadvisorPath("https://www.tripadvisor.ca/Restaurant_Review-g155004-d709884-Reviews-The_Keg-Ottawa_Ontario.html") === "Restaurant_Review-g155004-d709884-Reviews-The_Keg-Ottawa_Ontario.html", "Tripadvisor path from the owner's link")
  }

  console.log("Locations")
  {
    const loc = fx("locations_subset")
    const ca = p.parseLocations(loc.ca)
    const us = p.parseLocations(loc.us)
    ok(ca.length > 10 && us.length > 40, "locations parsed")
    ok(p.pickLocation(ca, { city: "Ottawa", state: "ON", country: "ca" }).code === 9198644, "Ottawa, ON → Ottawa,Ontario,Canada (9198644, the code DataForSEO itself used)")
    ok(p.pickLocation(ca, { city: "Ottawa, ON", country: "ca" }).code === 9198644, "\"Ottawa, ON\" in the city field")
    ok(p.pickLocation(ca, { city: "Kingston", state: "Nova Scotia", country: "ca" }).code === 9243614, "Kingston, Nova Scotia (not Ontario)")
    ok(p.pickLocation(ca, { city: "Kingston", country: "ca" }).level === "country", "Kingston with no province: two provinces, so the country")
    ok(p.pickLocation(us, { city: "Springfield", state: "MO", country: "us" }).code === 1020610, "Springfield, MO")
    ok(p.pickLocation(us, { city: "Springfield", country: "us" }).code === 2840, "Springfield with no state → United States")
    ok(p.pickLocation(us, { city: "Portland", state: "Oregon", country: "us" }).code === 1024543, "Portland, Oregon")
    ok(p.pickLocation(ca, { city: "Nowhereville", state: "ON", country: "ca" }).code === 2124, "unknown city → Canada")
    ok(p.pickLocation(ca, { city: null, country: "ca" }).code === 2124, "no city → Canada")
    ok(p.pickLocation(ca, { city: "Montréal", state: "QC", country: "ca" }).level === "city", "accents folded (Montréal)")
    ok(p.countryFor({ city: "Ottawa, ON" }) === "ca" && p.countryFor({ city: "Seattle", state: "WA" }) === "us" && p.countryFor({ city: "Perth", state: "WA" }) === "us", "countryFor: a WA state field is Washington")
    ok(p.countryFor({ city: "Sydney, NSW" }) === "au" && p.countryFor({ city: "Leeds", websiteUrl: "shop.co.uk" }) === "gb" && p.countryFor({ city: "Kanata", websiteUrl: "growthturbine.com" }) === "us", "countryFor: NSW, .co.uk, default US")
    ok(p.countryFor({ city: "Kanata", state: "Ontario" }) === "ca", "countryFor: a full province name")
    ok(p.regionName("ON", "ca") === "Ontario" && p.regionName("texas", "us") === "Texas" && p.regionName("ZZ", "us") === null, "regionName")
  }

  console.log("Quotas: data_usd")
  {
    ok(q.QUOTA_KINDS.includes("data_usd"), "data_usd is a quota kind")
    ok(JSON.stringify(q.limitsFor("starter", "data_usd", "{}")) === JSON.stringify({ day: 0.5, month: 1 }), "Starter $0.50/day, $1/month")
    ok(q.limitsFor("pro", "data_usd", "{}").month === 8 && q.limitsFor("growth", "data_usd", "{}").month === 15 && q.limitsFor(null, "data_usd", "{}").day === 0.25, "Pro $8, Growth $15 a month, no plan $0.25/day")
    ok(q.limitsFor("pro", "data_usd", JSON.stringify({ pro: { scraper_usd: { month: 20 } } })).month === 20, "an older <name>_usd key in QUOTAS_JSON is read as data_usd")
    ok(q.limitsFor("pro", "data_usd", JSON.stringify({ pro: { scraper_usd: { month: 20 }, data_usd: { month: 30 } } })).month === 30, "data_usd wins over the older key")
    ok(q.limitsFor("pro", "ai_cost_usd", JSON.stringify({ pro: { scraper_usd: { month: 20 } } })).month === 40, "the alias never touches ai_cost_usd")
    ok(q.countsAmount({ data_usd: 0.01, scraper_usd: 0.25, ai_cost_usd: 9, search: 2 }, "data_usd") === 0.26, "ledger: data_usd sums the older provider's dollars this month")
    ok(q.countsAmount({ search: 2 }, "search", 3) === 5, "searches = Claude web searches + results pages")
    ok(c.creditCost("data_usd", "{}") === 4, "credits: data $1 = 4")
    ok(c.creditCost("data_usd", JSON.stringify({ credits: { scraper_usd: 6 } })) === 6, "credits: older key accepted")
    const msg = q.quotaMessage("data_usd", "day", 0.5, "starter")
    ok(msg.startsWith("I've done all the work your plan covers today") && !msg.includes("$"), "owner message is the plain one, no dollars")
  }

  console.log("Meta Instagram (shapes from Meta's docs)")
  {
    ok(JSON.stringify(m.scopesOf({ data: { is_valid: true, scopes: ["instagram_basic", "pages_read_engagement"] } })) === '["instagram_basic","pages_read_engagement"]', "scopesOf")
    ok(m.scopesOf({ data: { is_valid: false, scopes: ["instagram_basic"] } }).length === 0 && m.scopesOf(null).length === 0, "invalid token = no scopes")
    ok(!m.hasAll(["instagram_basic", "pages_read_engagement"], m.DISCOVERY_SCOPES) && m.hasAll(["instagram_basic", "instagram_manage_insights", "pages_read_engagement"], m.DISCOVERY_SCOPES), "Business Discovery needs instagram_manage_insights")
    const d = m.parseDiscovery({ business_discovery: { username: "bluebottle", followers_count: 267788, media_count: 1205, media: { data: [{ id: "1", like_count: 120, comments_count: 4, view_count: 3000, permalink: "https://www.instagram.com/p/abc/", media_type: "VIDEO", media_product_type: "REELS", timestamp: "2026-11-20T10:00:00+0000", caption: "never read" }, { id: "2", like_count: 5 }] }, id: "17841401441775531" }, id: "17841405309211844" })
    ok(d?.followers === 267788 && d.media.length === 1 && d.media[0].views === 3000 && d.media[0].product === "REELS", "Business Discovery: followers + media (a post with no link is left out)")
    ok(!JSON.stringify(d).includes("never read"), "captions never kept")
    ok(m.parseMediaList({ data: [{ permalink: "https://evil.example/p/1" }] }).length === 0, "only instagram.com links")
    const now = Date.parse("2026-11-28T00:00:00Z")
    const log = Array.from({ length: 30 }, (_, i) => ({ tag: `t${i}`, id: `${i}`, at: new Date(now - 86_400_000).toISOString() }))
    ok(!m.hashtagRoom(log, "new", now).ok, "31st unique hashtag in 7 days is refused")
    ok(m.hashtagRoom(log, "t3", now).ok && m.hashtagRoom(log, "t3", now).id === "3" && !m.hashtagRoom(log, "t3", now).isNew, "a tag already looked up reuses its id")
    ok(m.hashtagRoom(log, "new", now + 7 * 86_400_000).ok, "the window rolls after 7 days")
  }

  console.log("Client: failures come back empty")
  {
    const d = await import("../src/lib/dataforseo")
    const realFetch = globalThis.fetch
    const saved = { l: process.env.DATAFORSEO_LOGIN, p: process.env.DATAFORSEO_PASSWORD }
    process.env.DATAFORSEO_LOGIN = "test"
    process.env.DATAFORSEO_PASSWORD = "test"
    let calls = 0
    const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
    try {
      globalThis.fetch = (async () => { calls++; return reply(500, {}) }) as typeof fetch
      ok((await d.runTask("organic", { keyword: "x", location_code: 2840 }, { mode: "live", timeoutMs: 8000 })).ok === false && calls === 2, "a 5xx is retried once, then empty")
      calls = 0
      globalThis.fetch = (async () => { calls++; return reply(200, { status_code: 20000, tasks: [{ status_code: 40102, status_message: "No Search Results.", cost: 0.002, result: null }] }) }) as typeof fetch
      const none = await d.runTask("organic", { keyword: "x", location_code: 2840 }, { mode: "live", timeoutMs: 8000 })
      ok(none.ok && none.result === null && calls === 1, "no results (40102) is an empty answer, not an error")
      // Out of balance: logged once, calls paused, empty shapes everywhere, nothing thrown.
      calls = 0
      globalThis.fetch = (async () => { calls++; return reply(200, { status_code: 40210, status_message: "insufficient funds. your account's balance is too low to complete this request.", tasks: [] }) }) as typeof fetch
      const first = await d.googleSearch("dentist ottawa", { country: "ca", timeoutMs: 8000 })
      ok(Array.isArray(first) && first.length === 0 && d.dataPaused(), "insufficient funds: [] and data calls paused")
      const before = calls
      ok((await d.googleSerp("x", { country: "ca" })) === null && (await d.youtubeSearch("x")).length === 0 && (await d.adsForDomain("example.com")) === null && (await d.googleBusinessInfo("Acme", { city: null })) === null, "while paused: null / [] from every call")
      ok(calls === before, "while paused nothing is sent")
    } catch (err) {
      ok(false, `client threw: ${err instanceof Error ? err.message : err}`)
    } finally {
      globalThis.fetch = realFetch
      process.env.DATAFORSEO_LOGIN = saved.l
      process.env.DATAFORSEO_PASSWORD = saved.p
    }
  }

  console.log(fails ? `\n${fails} FAILED` : "\nAll passed")
  process.exit(fails ? 1 : 0)
}
main()
