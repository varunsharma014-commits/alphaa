# alphaa — Weekly Growth Review

**Date:** 2026-07-17
**Account reviewed:** varunsharma014@gmail.com (alphaa's own dogfood account, created 2026-06-15)
**Prod:** https://alphaa.app

---

## TL;DR

- **Last week's two blockers are fixed.** The Google token now refreshes (`lastSyncedAt: 2026-07-17 09:00`, was `null`), and `/refer` returns **200** (was a 404 on a page that was in the sitemap). Data is flowing and the funnel is whole.
- **But GA4 is pointed at the wrong property, so the analytics dashboard is reporting someone else's traffic.** The account's `websiteUrl` is `https://alphaa.app`, while its GA4 property is **"GrowthTurbine - GA4" (312827928)**. The ~983 sessions/day in `AnalyticsSnapshot` are **growthturbine.com's**, not alphaa's — the top pages are `/blogs/25-biggest-wefunder-success-stories`, `/services/reg-d-equity-crowdfunding-marketing-agency`, `/case-studies`, none of which exist on alphaa.app. **Do not read those numbers as alphaa traffic.** GSC is correctly connected (`sc-domain:alphaa.app`).
- **Now that real data is flowing, it says alphaa has essentially no organic presence yet: 1 query, 2 impressions, 0 clicks, position 57.** 17 blog posts and 33 sitemap URLs are live and healthy, but only the brand term "alphaa" registers any impressions at all. The content is published, not yet indexed-and-ranking. That — not the site — is the growth constraint.

---

## What moved this week (real numbers)

### Keyword rankings (Search Console)
The sync now works, but the history is only **4 days deep** (first batch 2026-07-14). **There is no batch ~7 days earlier, so no week-over-week comparison is possible this week.** It will be possible next week.

| Date | Queries | Clicks | Impressions | Avg position |
|---|---|---|---|---|
| 2026-07-17 | 1 | 0 | 2 | 57.0 |
| 2026-07-16 | 1 | 0 | 2 | 57.0 |
| 2026-07-15 | 1 | 0 | 2 | 57.0 |
| 2026-07-14 | 2 | 0 | 3 | 74.5 |

The entire dataset is one query: **"alphaa"** — position **57**, **2 impressions**, **0 clicks**. That is the brand name, and it does not rank on page one for its own name.

- **Top movers up/down:** no data yet (needs two batches ≥7 days apart).
- **Striking-distance queries (position 5–30, impressions > 0):** **none — zero queries qualify.** Nothing is close to the money zone; the site isn't ranking for any non-brand term.

### Analytics (GA4)
**No valid alphaa data yet — the connected property is GrowthTurbine's, not alphaa's** (see TL;DR). Snapshots exist for 4 days (2026-07-14 → 07-17) and are flat (~953→983 sessions, ~418→421 organic, bounce 0.64), but those describe growthturbine.com. There is also no prior-week snapshot to compare against, so even after the property is corrected the first real WoW read lands next week.

### AI visibility (Audit + AiEngineResult)
- **2 audits on record:** **41/100** (2026-07-15) vs **42/100** (2026-07-04) — **down 1 point**. Effectively flat; two data points over 11 days is not yet a trend.
- **alphaa appeared in 0 of 2 engines.** ChatGPT ❌, Claude ❌. Only **chatgpt** and **claude** ran on the latest audit — **Gemini and Perplexity are absent**, despite last week's commits (`af3d071`, `87a6780`) reviving them. Coverage went from 4 engines to 2.
- The audit still tests a **geo-local query** — *"What are the best SaaS / Software near Kanata?"* — because the account's `city` is `Kanata` and `businessType` is `SaaS / Software`. alphaa is a global SaaS; nobody searches for SaaS "near Kanata". **We are measuring visibility on a query no customer will ever type**, which makes the 41/100 score close to meaningless as a signal.

### Activity ledger (MockActivity — what ran this week)
3 events in the last 7 days — the automation is alive:

| When | Type | Title |
|---|---|---|
| 2026-07-15 | visibility_scan | alphaa checked the AI engines for you |
| 2026-07-14 | keywords_synced | alphaa is now tracking your Google rankings |
| 2026-07-13 | weekly_report | Your weekly report is ready |

`keywords_synced` firing on 07-14 is the fix from last week landing.

### Scan leads (top-of-funnel)
- **This week: 11 new** (prior week: **0**). All-time: **17**, **0 converted**.
- **The 11 is not real demand.** 10 of them are Varun's own test scans (`varunsharma014@gmail.com` / "Growth Turbine", scored 47, several minutes apart on 07-15/07-16 — a testing session), and the 11th is `v.sharma@growthturbine.com`. **Genuine external leads this week: 0. All-time: 0.**

### Users
**6 total, 1 new this week.** Every one is internal (`@growthturbine.com`, `@gigaboostai.com`, or Varun's personal address). **All 6 are `plan: none` / `subscriptionStatus: trialing` — 0 paying customers, 0 activated external users.**

---

## Funnel health

Everything responds. **No broken surfaces this week** — last week's `/refer` 404 is resolved.

| Surface | Status |
|---|---|
| `/` | 200 (0.36s) |
| `/blog` | 200 |
| `/scan` | 200 |
| `/pricing` | 200 |
| `/refer` | **200 (fixed — was 404)** |
| `/how-it-works`, `/case-studies` | 200 |
| `/for/dentists`, `/for/saas`, `/for/hvac`, `/for/med-spas` | 200 |
| `/robots.txt`, `/llms.txt` | 200 |
| `/sitemap.xml` | 200 — **33 URLs** |

Sitemap breakdown: 17 blog posts (all published slugs present, none missing), 7 `/for/` pages, 9 core/legal pages. Home title and meta description are set and on-message.

**The site is not the problem.** 33 healthy URLs generating 2 impressions/day means the constraint is acquisition and indexing, not the funnel.

---

## Top 5 prioritized actions for next week

**1. Repoint GA4 to alphaa.app's own property — or disconnect it. (Effort: 30 min)**
*What:* The integration's `gaPropertyId` is `312827928` ("GrowthTurbine - GA4") while `websiteUrl` is `alphaa.app`. Switch it to alphaa.app's GA4 property; if one doesn't exist, create it and install the tag.
*Why the data says so:* Every `topPages` entry in every snapshot is a growthturbine.com URL. Right now the product's analytics dashboard shows a dogfood user a competitor-scale traffic number that has nothing to do with their site — and it's alphaa's own account, so we're the ones being misled. Every "sessions" figure in this report is unusable until this is fixed. This is also a product bug worth checking: if property selection can silently mismatch `websiteUrl`, real customers can hit it too.

**2. Fix the AI visibility scan: restore Gemini + Perplexity, and drop the geo framing for non-local businesses. (Effort: 2–3 hrs)**
*What:* Get all 4 engines back into the audit, and make query generation branch on business type — global SaaS should be tested on "best AEO tools", "how do I get my business recommended by ChatGPT", not "SaaS near Kanata".
*Why the data says so:* The latest audit ran **2 engines, not 4** — Gemini and Perplexity are missing even after commits `af3d071`/`87a6780` were meant to revive them, so that fix did not fully land. And the one query tested is geo-local for a global product. A 41/100 built from 2 engines and an irrelevant query isn't measuring anything real — this is the product's core promise, and it's the metric we'd put in front of a customer.

**3. Get the 17 published posts indexed — submit and verify coverage. (Effort: 1–2 hrs)**
*What:* Submit the sitemap in GSC, request indexing on the 17 blog URLs + 7 `/for/` pages, and check the Coverage/Pages report for what's excluded and why.
*Why the data says so:* 33 URLs live, **1 query with impressions, 0 clicks, nothing in striking distance**. That is the signature of content that exists but isn't in the index — not of content that's ranking badly. Until pages are indexed, no amount of new writing changes anything.

**4. Rank for our own brand name — "alphaa" sits at position 57. (Effort: 1–2 hrs)**
*What:* Diagnose why alphaa.app doesn't rank for "alphaa" (indexing, or the generic dictionary-word collision). Establish brand entity signals: consistent naming, an About/organization schema, and any credible third-party mentions.
*Why the data says so:* Position **57** on your own brand term with 2 impressions means anyone who hears about alphaa and searches for it **will not find it**. Every other acquisition channel — content, referral, word of mouth — leaks through this hole, so it compounds. It's also the single cheapest ranking win available.

**5. Put one real external lead through the scanner. (Effort: half a day)**
*What:* Drive genuine outside traffic to `/scan` — a small paid test, a targeted outreach batch, or a post to a relevant community — and watch whether a stranger completes a scan.
*Why the data says so:* **0 genuine external leads all-time; 0 conversions; 6 users, all internal, all trialing, 0 paying.** The 11 leads this week are our own test scans. We have never observed a real user's behavior in this funnel, which means every conversion assumption in the product is currently unvalidated. Even 5 real scans would teach us more than another week of internal testing.

---

## Content suggestions

**Formal gap analysis isn't possible this week — and that's the finding.** The method is to look for queries alphaa earns impressions for but has no article answering. alphaa earns impressions for exactly **one** query — its own brand name, "alphaa" — so there is **no impression data to mine**. Any content recommendation derived from it would be invented, not measured.

What the data does support:

- **The existing 17 posts are not the bottleneck; distribution is.** Slugs cover the obvious AEO surface well — `what-is-answer-engine-optimization`, `best-aeo-tools-2026`, `how-to-get-recommended-by-chatgpt`, `aeo-vs-seo-why-agencies-fail`, `death-of-the-blue-link`, plus vertical posts for dentists, HVAC/plumbing, restaurants, SaaS, and local service businesses. **Writing post #18 before the first 17 are indexed and ranking would be wasted effort.** Action #3 outranks any new article.
- **Prerequisite for real gap analysis:** once indexing lands and GSC returns a real query set (expect 2–4 weeks), this section becomes data-driven. Re-run it then.
- **The vertical pages are the asset most likely to pay first.** The 7 `/for/` pages map cleanly to high-intent commercial queries and have no blog post feeding them internal links from the topic angle. Once indexed, the `/for/{vertical}` + matching post pairs are the natural cluster to build on.

---

## Data-quality notes

Stated plainly so nothing here is over-read:

- **GA4 sessions/organic/top-pages describe growthturbine.com, not alphaa.app.** Excluded from all conclusions.
- **No week-over-week keyword or analytics comparison exists** — both datasets start 2026-07-14 (4 days). First true WoW read: next week's report.
- **AI visibility trend is 2 data points, 11 days apart, from an inconsistent engine set** (4 engines on 07-04, 2 on 07-15). The −1 point delta is noise, not a signal.
- **Scan-lead and user counts are dominated by internal testing.** Reported both raw and net-of-self-tests above.
