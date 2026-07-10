# alphaa — Weekly Growth Review

**Date:** 2026-07-10
**Account reviewed:** varunsharma014@gmail.com (alphaa's own dogfood account, created 2026-06-15)
**Prod:** https://alphaa.app

---

## TL;DR

- **The data pipeline is broken, not the product.** GSC + GA4 are connected but the OAuth token expired **2026-07-04** and has **never synced** (`lastSyncedAt: null`). Result: **0 keyword rankings and 0 analytics snapshots** for the account — we are flying blind on organic performance. Fixing the token refresh is the single highest-leverage action this week.
- **Funnel is 200 everywhere except one broken link:** `/refer` is in the sitemap and has source (`page.tsx`) but returns **404 in production** — the referral program (a growth loop) is dead on arrival for anyone who clicks through.
- **Demand is not being generated yet.** 0 new scan leads this week (6 total ever, all self-tests from gigaboost.ai/growthturbine.com, 0 converted). The content + `/for/` surface is live and healthy, but nothing is driving traffic into it.

---

## What moved this week (real numbers)

### Keyword rankings (Search Console)
**No data yet.** `KeywordRanking` has **0 rows** for this account (and 0 across the entire DB). Root cause: the Google integration token `expiresAt` was **2026-07-04** and `lastSyncedAt` is `null` — GSC has never completed a sync. No top movers, striking-distance queries, or clicks/impressions trend can be reported until this is fixed.

### Analytics (GA4)
**No data yet.** `AnalyticsSnapshot` has **0 rows** for this account. Same root cause — GA4 is connected (`GrowthTurbine - GA4`, property `312827928`) but never synced. No sessions / organic-sessions / top-pages trend available.

### AI visibility (Audit + AiEngineResult)
- **1 audit on record**, run **2026-07-04**, visibility score **42/100**.
- alphaa **did not appear** in any of the 4 AI engines tested — **ChatGPT ❌, Claude ❌, Gemini ❌, Perplexity ❌** (0/4 appeared).
- The audit queries were geo-targeted ("best SaaS / Software in **Kanata**"), i.e. alphaa's own business is being tested as a local-SaaS listing. No trend — only one audit exists, so there is no week-over-week visibility delta.

### Activity ledger (MockActivity — what ran this week)
3 events in the last 7 days:
| When | Type | Title |
|---|---|---|
| 2026-07-06 | weekly_report | Your weekly report is ready |
| 2026-07-04 | content_gaps | alphaa found 1 content opportunity |
| 2026-07-04 | competitors | alphaa found 5 competitors to track |

### Scan leads (top-of-funnel)
- **This week: 0 new** (prior week: 0). 
- **All-time: 6 leads, 0 converted.** Every lead is a self-test (v@gigaboost.ai ×5, v.sharma@growthturbine.com ×1), visibility scores 46. **No real external lead has ever hit the scanner.**

---

## Funnel health

Surface check (HTTP status):

| Page | Status |
|---|---|
| `/` | ✅ 200 |
| `/blog` | ✅ 200 |
| `/scan` | ✅ 200 |
| `/for/dentists` | ✅ 200 |
| `/for/saas` | ✅ 200 |
| `/for/hvac` | ✅ 200 |
| `/pricing` | ✅ 200 |
| `/how-it-works` | ✅ 200 |
| `/case-studies` | ✅ 200 |
| **`/refer`** | ❌ **404** |

- **Sitemap:** 29 URLs, well-formed (home, 13 blog posts, 7 `/for/` verticals, pricing, how-it-works, scan, case-studies, refer, privacy, terms).
- **Broken link:** `/refer` is listed in the sitemap and has a valid `page.tsx` in source (`src/app/(marketing)/refer/page.tsx`, a full referral page with an earnings calculator) but returns 404 in production. Likely a stale deploy or a build/runtime error on that route. This is a growth-loop leak: the earn-30%-commission referral page is unreachable, and Google is being told to index a 404.

---

## Top 5 prioritized actions for next week

1. **Fix the Google OAuth token refresh so GSC/GA4 actually sync.**
   *What:* The integration token expired 2026-07-04 and `lastSyncedAt` is null — implement/repair the refresh-token flow and backfill the first GSC + GA4 sync. *Why the data says so:* 0 keyword rows and 0 analytics snapshots means every future growth review is blind and the in-app "rankings/analytics" features show nothing to users. This blocks the entire measurement layer. *Effort:* M (half-day — the refresh token is present in the DB; likely a cron/refresh-logic bug, not re-auth).

2. **Fix the `/refer` 404 in production.**
   *What:* Diagnose why a route with valid source 404s in prod (redeploy, check build logs for that route, verify it's not excluded). *Why:* The referral program is a compounding acquisition loop and it's currently unreachable — plus we're feeding Google a 404 in the sitemap. *Effort:* S (likely a redeploy or one build fix).

3. **Drive the first real scan lead — seed top-of-funnel.**
   *What:* Get 10–20 genuine external businesses through `/scan` (post the free AI-visibility scan in 2–3 relevant communities, or run a small outreach batch to local SaaS/dental/med-spa businesses matching the `/for/` verticals). *Why:* 6 lifetime leads, all self-tests, 0 conversions — the funnel works but has never seen real traffic. Nothing else matters until demand exists. *Effort:* M (outreach/posting time).

4. **Raise alphaa's own AI visibility from 42 → target the 0/4 engine gap.**
   *What:* Act on the audit: publish/verify llms.txt, schema markup, and a clear "what is alphaa" answer block so at least ChatGPT + Perplexity can cite it. Re-run the audit after. *Why:* alphaa appears in 0/4 engines with score 42 — dogfooding our own product is the most credible case study we can build. *Effort:* M.

5. **Publish 1 content piece targeting a `/for/` vertical's buyer intent.**
   *What:* We have 13 blog posts but they're all top-of-funnel AEO education. Add one bottom-of-funnel piece tied to a live vertical page (e.g. "How dentists get recommended by ChatGPT" → links to `/for/dentists`). *Why:* The `/for/` pages are healthy 200s but have no supporting content driving qualified traffic to them; and with GSC dark we should be building intent-matched inventory now so it's ranking once data flows. *Effort:* M.

---

## Content suggestions

**Impression-gap analysis is not possible this week** — with `KeywordRanking` empty (GSC never synced), there are no "queries we get impressions for but don't have an article answering." This becomes available as soon as Action #1 lands. Re-run this section next week.

In the meantime, based on the current 13-post library vs. the 7 live `/for/` verticals, the clearest **structural gaps** (no article maps to these buyer-intent, vertical-specific queries — none of the existing slugs cover them):

- **"How dentists get recommended by ChatGPT / AI search"** → supports `/for/dentists` (existing slugs cover restaurants, local-service, SaaS — not dental).
- **"AI search visibility for med spas / how med spas show up in ChatGPT"** → supports `/for/med-spas` (no vertical article exists).
- **"How law firms get cited by AI assistants"** → supports `/for/lawyers`.
- **"HVAC & plumbing: getting recommended by AI search"** → supports `/for/hvac` and `/for/plumbers`.
- **"How to check your AI visibility score (free)"** → bottom-of-funnel, routes directly to `/scan`; pairs with the existing "how-to-see-what-chatgpt-says-about-your-business" post but with an explicit tool CTA.

Existing slugs for reference: what-is-answer-engine-optimization, how-to-get-recommended-by-chatgpt, is-aeo-real, aeo-checklist, how-to-get-cited-on-perplexity, schema-markup-for-ai-search, get-recommended-by-ai-local-service-business, ai-recommendations-for-restaurants, aeo-for-saas-b2b, aeo-vs-seo-why-agencies-fail, how-to-create-llms-txt-file, how-to-see-what-chatgpt-says-about-your-business, best-aeo-tools-2026.

---

*Generated by the alphaa weekly growth-review routine. Database access was read-only (SELECT).*
