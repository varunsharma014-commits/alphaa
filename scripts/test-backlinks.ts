// Tests for backlinks (lib/backlinks/rules.ts + view.ts actions) against DataForSEO Backlinks API
// answers recorded 2026-11-28 (scripts/fixtures/dataforseo/backlinks_*.json: growthturbine.com, and
// 3 crowdfunding sites for the intersection), plus the client's per-API "access denied" pause with a
// mocked fetch. No network, no database.
//   npx tsx scripts/test-backlinks.ts
import { readFileSync } from "node:fs"
import { join } from "node:path"

process.env.ANTHROPIC_API_KEY ||= "test-key"
process.env.DATABASE_URL ||= "postgresql://nobody@127.0.0.1:1/none"
process.env.DATAFORSEO_LOGIN = "test"
process.env.DATAFORSEO_PASSWORD = "test"

const fx = (name: string) => JSON.parse(readFileSync(join(__dirname, "fixtures", "dataforseo", `${name}.json`), "utf8"))
let fails = 0
const ok = (cond: unknown, msg: string) => { if (cond) console.log(`  ok  ${msg}`); else { fails++; console.log(`  FAIL ${msg}`) } }

async function main() {
  const b = await import("../src/lib/backlinks/rules")
  const { actionsFrom } = await import("../src/lib/backlinks/view")
  const p = await import("../src/lib/dataforseo-parse")

  console.log("Summary")
  {
    const t = p.firstTask(fx("backlinks_summary_live"))
    ok(t.ok && t.cost === 0.024036, "ok, cost $0.024")
    const s = b.parseSummary(t.result)!
    ok(s.target === "growthturbine.com" && s.referringDomains === 350 && s.backlinks === 1038 && s.rank === 31 && s.spamScore === 13, "main referring domains 350 (not 370 with subdomains), 1,038 links, rank 31")
    ok(b.parseSummary(null) === null && b.parseSummary({}) === null, "garbage = null")
  }

  console.log("History: new / lost month over month")
  {
    const h = b.parseHistory(p.firstTask(fx("backlinks_history_live")).result)
    ok(h.length === 3 && h[0].month === "2026-08" && h[2].month === "2026-10", "3 months, oldest first")
    const mom = b.monthOverMonth(h)!
    ok(mom.month === "2026-10" && mom.newDomains === 49 && mom.lostDomains === 12 && mom.net === 37, "October: +49 new, 12 lost, net +37")
    ok(mom.prevReferring === 526 && mom.referring === 348, "referring sites before / now")
    ok(b.monthOverMonth([]) === null, "no history = null")
  }

  console.log("Referring domains")
  {
    const rd = b.parseReferringDomains(p.firstTask(fx("backlinks_referring_domains_live")).result)
    ok(rd.total === 350 && rd.items.length === 20 && rd.items[0].domain === "ainvest.com" && rd.items[0].rank === 13, "20 rows of 350, strongest first")
  }

  console.log("Link gap")
  {
    const targets = { "1": "kingscrowd.com", "2": "crowdfundinsider.com", "3": "startengine.com" }
    const inter = b.parseIntersection(p.firstTask(fx("backlinks_domain_intersection_live")).result, targets)
    ok(inter.length === 20 && inter.every((x) => Object.keys(x.links).length === 3), "20 sites, each linking to all 3 targets")
    const gap = b.linkGap([inter], { brandHost: "growthturbine.com", competitorHosts: Object.values(targets) })
    const doms = gap.map((g) => g.domain)
    ok(!doms.includes("18.209.169.198") && !doms.some((d) => d.endsWith("cloudfront.net")), "IP addresses and CDNs dropped")
    ok(!doms.includes("stripe.com") && !doms.includes("beehiiv.com") && !doms.includes("simplecast.com") && !doms.includes("clay.earth"), "platforms you can't ask for a link dropped")
    ok(doms.includes("crowdwise.org") && doms.includes("thecrowdscale.com"), "real sites in the niche kept")
    ok(gap.every((g) => g.linksTo.length >= 2), "every site links to 2+ competitors")
    ok(gap.length >= 5 && gap.length < inter.length, `kept ${gap.length} of ${inter.length}`)
    ok(b.linkGap([inter], { brandHost: "growthturbine.com", competitorHosts: Object.values(targets), brandReferring: new Set(["crowdwise.org"]) }).every((g) => g.domain !== "crowdwise.org"), "a site already linking to the brand is not a gap")
    // Pairwise answers merge: a site in (a,b) and (a,c) links to all three.
    const x = (d: string, links: Record<string, number>, spam = 0) => ({ domain: d, rank: 20, spamScore: spam, links })
    const merged = b.linkGap([[x("localnews.ca", { a: 3, b: 1 }), x("spammy.biz", { a: 9, b: 9 }, 60), x("yelp.com", { a: 1, b: 1 }), x("reddit.com", { a: 5, b: 2 })], [x("localnews.ca", { a: 3, c: 2 }), x("solo.org", { a: 1, c: 0 })]], { brandHost: "me.ca", competitorHosts: ["a", "b", "c"] })
    const ln = merged.find((g) => g.domain === "localnews.ca")
    ok(ln?.linksTo.join() === "a,c,b", "merged across pairs: links to a, c and b (most links first)")
    ok(!merged.some((g) => g.domain === "spammy.biz"), "spam score over 30 dropped")
    ok(merged.find((g) => g.domain === "yelp.com")?.kindLabel === "Directory & reviews", "directories kept, labelled")
    ok(!merged.some((g) => g.domain === "reddit.com"), "forums dropped")
    ok(!merged.some((g) => g.domain === "solo.org"), "0 links to the second competitor = only 1 competitor = not a gap")
    ok(b.pairs(["a", "b", "c"]).length === 3 && b.pairs(["a", "b"]).length === 1 && b.pairs(["a"]).length === 0, "pairs: 3 competitors = 3 calls")
    ok(merged[0].domain === "localnews.ca", "most competitors first")
  }

  console.log("Plans + actions")
  {
    ok(b.backlinkScope("starter", false) === "own" && b.backlinkScope("pro", false) === "full" && b.backlinkScope("growth", false) === "full" && b.backlinkScope("starter", true) === "full", "Starter = own summary; Pro/Growth/comped = competitors + gap")
    const acts = actionsFrom({ gap: [{ domain: "localnews.ca", kind: "media", kindLabel: "News & media", rank: 20, linksTo: ["a.com", "b.com", "c.com"] }] } as never)
    ok(acts[0].text === "localnews.ca links to a.com, b.com and c.com, not to you.", "plain sentence with the real names")
    ok(/Don.t contact them/.test(acts[0].ask), "the chat ask says not to contact anyone")
    ok(acts.every((a) => !/[–—]/.test(a.text + a.ask)), "no dashes")
  }

  console.log("Client: access denied pauses only that API")
  {
    const d = await import("../src/lib/dataforseo")
    const real = globalThis.fetch
    let calls = 0
    globalThis.fetch = (async () => { calls++; return new Response(JSON.stringify({ status_code: 20000, status_message: "Ok.", cost: 0, tasks: [{ status_code: 40204, status_message: "Access denied. Visit Plans and Subscriptions to activate your subscription.", cost: 0 }] }), { status: 200 }) }) as typeof fetch
    const r = await d.runTask("blSummary", { target: "x.com" })
    ok(!r.ok && d.apiDenied("backlinks") && !d.dataPaused(), "40204 on backlinks: failed, backlinks paused, other data calls not paused")
    const again = await d.runTask("blHistory", { target: "x.com" })
    ok(!again.ok && calls === 1, "the next backlinks call doesn't even go out")
    ok(!d.apiDenied("dataforseo_labs"), "Labs not affected")
    globalThis.fetch = (async () => { calls++; return new Response(JSON.stringify(fx("labs_bulk_keyword_difficulty_live")), { status: 200 }) }) as typeof fetch
    const labs = await d.runTask("kwDifficulty", { keywords: ["local seo"] })
    ok(labs.ok && labs.cost === 0.0126 && !!labs.result, "a live-only endpoint runs live without a mode (cost recorded)")
    globalThis.fetch = real
  }

  console.log(fails ? `\n${fails} FAILED` : "\nall passed")
  process.exit(fails ? 1 : 0)
}
main()
