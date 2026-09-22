# alphaa — Weekly Growth Review

**Date:** 2026-09-22
**Account reviewed:** varunsharma014@gmail.com (alphaa's own dogfood account)
**Prod:** https://alphaa.app
**Previous review on file:** 2026-07-17 (no reports committed in between)

---

## TL;DR

- **The two "wins" in the activity feed are false positives.** "Perplexity now mentions your business" (09-09) and "Gemini now mentions your business" (08-05) never happened. The account's `businessName` is `null`, so the scan uses the placeholder "this business". The keyword matcher then counts any sentence that contains both "this" and "business" as a mention. The latest Perplexity answer never says "alphaa" (checked the full text). Real AI visibility is **0 of 4 engines**, and the 42/100 score is inflated by that fake hit. The same bug hits **any customer with a blank business name.**
- **Search is still brand-only and getting smaller.** Search Console shows only two queries, "alphaa" and "alfaa": **0 clicks, 7 impressions/day, down from 12 a week ago (−42%)**. Average position is 65.7. That's with **89 blog posts and 104 sitemap URLs** live. The daily content engine is publishing, but nothing ranks yet.
- **The top of the funnel is flat. The site works but isn't converting.** There were **0 new scan leads this week, and none since 2026-07-31** (24 all-time, 0 converted, nearly all internal tests on growthturbine.com). There were **0 new users** this week (6 total). GA4 is **still connected to the "GrowthTurbine - GA4" property**, so the dashboard's 1,788 sessions/day are growthturbine.com's traffic, not alphaa's. This was flagged on 07-17 and is still not fixed.

---

## What moved this week (real numbers)

### Keyword rankings (Search Console, `sc-domain:alphaa.app`)
This compares the latest batch (2026-09-22) with the batch 6 days earlier (2026-09-16).

| Query | Impr. 09-16 | Impr. 09-22 | Δ | Pos. 09-16 | Pos. 09-22 | Δ |
|---|---|---|---|---|---|---|
| alphaa | 7 | 4 | −3 | 51.1 | 53.8 | −2.7 (worse) |
| alfaa | 5 | 3 | −2 | 77.8 | 77.7 | +0.1 |
| **Total** | **12** | **7** | **−42%** | 64.5 avg | 65.7 avg | −1.2 |

- **Clicks:** 0 → 0.
- **Top movers:** Neither query moved in a useful way. "alphaa" slipped 2.7 positions.
- **Striking-distance queries (position 5–30, impressions > 0):** **None.**
- **Non-brand queries:** **None.** 89 blog posts have produced no non-brand impressions that GSC reports.
- Daily impressions held at 13 from 09-03 to 09-15, then fell to 7 by 09-19 and stayed there.

### Analytics (GA4)
**No valid alphaa data yet.** The Integration row still has `gaPropertyName: "GrowthTurbine - GA4"` (312827928). The snapshot numbers describe growthturbine.com: 1,788 sessions and 406 organic (09-22) vs 1,829 and 418 (09-16). Its top pages are `/services/reg-d-equity-crowdfunding-marketing-agency`, `/case-studies` and `/blogs/25-biggest-wefunder-...`. **Don't read any of this as alphaa traffic.**

### AI visibility (Audit + AiEngineResult)
- **Score trend (weekly audits):** 44 (07-29) → 44 (08-05) → 42 (08-12) → 42 (08-19) → 41 (08-26) → 42 (09-02) → 42 (09-09) → **42 (09-16)**. This is flat to slightly down over 8 weeks.
- **All 4 engines are running again** (ChatGPT, Claude, Gemini, Perplexity), up from 2 in July.
- **Recorded mentions:** Perplexity is marked `appeared: true` on 09-09 and 09-16. **Both are false positives** (see the TL;DR). **Real mentions: 0/4.**
- The test query is still *"best SaaS / Software near Kanata"*. That comes from `city: Kanata` and `businessType: SaaS / Software`. No buyer of alphaa searches for it, so the score doesn't measure anything useful.

### Activity ledger (MockActivity, last 7 days)
- 1× `visibility_scan` (09-16) and 1× `weekly_report` (09-21). Both are routine crons.
- There's no other activity: no content, citation or outreach events were logged for the account.

### Scan leads (ScanLead)
- **This week: 0 new, 0 converted.** Previous week: 0.
- **All-time: 24 leads, 0 converted.** The most recent is from 2026-07-31. The recent rows are almost all growthturbine.com, so they're internal tests, not prospects.
- Users: 6 total, 0 new this week.

---

## Funnel health

| URL | Status | Time |
|---|---|---|
| / | 200 | 0.39s |
| /blog | 200 | 0.28s |
| /scan | 200 | 0.18s |
| /pricing | 200 | 0.18s |
| /refer | 200 | 0.18s |
| /for/dentists | 200 | 0.19s |
| /for/plumbers | 200 | 0.21s |
| /for/lawyers | 200 | — |
| /for/saas | 200 | 0.21s |

- **Sitemap: 104 URLs.** That's 89 /blog, 7 /for (dentists, med-spas, hvac, plumbers, lawyers, restaurants, saas), and pricing, scan, refer, how-it-works, case-studies, privacy, terms and home. It was 33 URLs on 07-17.
- Nothing is broken. (I also tried `/for/law-firms`, which returns 404, but that URL isn't in the sitemap; the real page is `/for/lawyers`.)
- **The funnel works but gets no traffic.** The problem is demand: no organic reach and no leads.

---

## Top 5 prioritized actions for next week

1. **Fix the mention-detection false positive.**
   - **What:** In `checkAppearance` (`src/lib/ai-engines.ts`), skip the keyword fallback when the name is the placeholder "this business". Better, have `visibility-scan.ts` fall back to the website domain ("alphaa") instead of "this business". Also drop generic words like this, business, company, software and services from `extractKeyWords`. Set `businessName = "alphaa"` on the dogfood account.
   - **Why:** It sent two fake "win" notifications and inflates the score. Any paying customer with a blank business name gets the same false wins. That's a trust-killer for a product whose whole job is this measurement.
   - **Effort:** ~1 hr.
2. **Point the audit query at alphaa's real market.**
   - **What:** Change `city` and `businessType` so the scan asks something like *"best AI search optimization tool for small businesses"*. The alternative is a non-geo query mode for SaaS accounts.
   - **Why:** 8 weeks of scores measured a Kanata query no buyer will type. Until this changes, the visibility number can't guide any decision.
   - **Effort:** ~30 min (data change), or 2–3 hrs for a proper non-local query mode.
3. **Reconnect GA4 to alphaa's own property.**
   - **What:** Create or select the alphaa.app GA4 property, reconnect the integration, and confirm the tag fires on alphaa.app.
   - **Why:** This was flagged on 07-17 and hasn't changed. With no traffic data, nobody can tell whether 89 posts bring any visitors.
   - **Effort:** ~30 min.
4. **Diagnose indexing before publishing more posts.**
   - **What:** In GSC, check Pages → "Indexed" vs "Discovered/Crawled – not indexed" for /blog. Request indexing for the top 10 posts, and link the /for pages and top posts from the homepage.
   - **Why:** 104 URLs are live but produce 7 impressions a day, all on the brand name. The content engine adds 2 posts a day into a site that isn't getting indexed or ranked. More volume won't help until that's fixed.
   - **Effort:** 1–2 hrs.
5. **Get the first 10 external scans, since the funnel has no inbound traffic.**
   - **What:** Send the free /scan to warm contacts: GrowthTurbine clients, LinkedIn connections, and the 7 /for verticals. Use a direct "see what ChatGPT says about you" ask, and track it with UTMs.
   - **Why:** There have been 0 scan leads in 7+ weeks and 0 conversions ever. Organic search won't send traffic for months, so the scan-to-signup step needs real users to test it.
   - **Effort:** 2–3 hrs.

---

## Content suggestions

GSC reports **no non-brand queries** for alphaa, so the data can't show any query that has impressions but no article answering it. The only queries are "alphaa" and "alfaa". I compared them with the 90 posts imported in `src/content/blog/index.ts`. Data-backed suggestions:

- **A brand/entity page ("What is alphaa?")** to catch "alphaa" and the misspelling "alfaa". The site ranks #54 for its own name, so Google doesn't yet treat alphaa as an entity. An About page with Organization schema and `sameAs` links to LinkedIn, Crunchbase, Product Hunt and similar profiles would fix the brand query directly.
- **Pause adding new topics** until indexing is confirmed (see action 4). Deepen and interlink the ~10 posts closest to money intent instead: `best-aeo-tools-2026`, `how-to-get-recommended-by-chatgpt`, `what-is-answer-engine-optimization`, and `aeo-vs-seo`.

---

*Data: prod DB (read-only SELECTs), pulled 2026-09-22. Funnel: live curl checks, same day.*
