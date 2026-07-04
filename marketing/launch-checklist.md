# Launch Checklist — 2-Week Runbook

> v1.0, starting 2026-07-04. Ordered; don't skip ahead — ads without conversion tracking is burning money blind.

## Day 1–2: Plumbing

- [ ] **Google OAuth verification:** record the demo video and submit the Alphaa Google OAuth app for verification (while the consent screen is in Testing, strangers can't complete "Connect Google"). This gates the entire activation funnel — do it first.
- [ ] **GA4:** create events `scan_completed` (fires on /scan/results render), `signup`, `trial_start`; verify in DebugView.
- [ ] **Google Ads account:** create, link GA4, import the 3 conversions, set `scan_completed` Primary. Auto-apply recommendations OFF. Set account tracking template (UTM convention in google-ads.md).
- [ ] **Meta:** Business Manager + ad account, install pixel (+ Conversions API if quick), verify the 5 events in meta-ads.md, verify domain, build audiences (visitors 30d, scan-abandoners, exclusions).
- [ ] **Brand profiles — EXACT spelling "Alphaa" everywhere** (entity fix for knowledge graphs/LLMs): Product Hunt (claim product page), G2 vendor profile, Capterra, LinkedIn company page, X profile. Same logo, same one-liner ("AI search optimization on autopilot — get recommended by ChatGPT, Gemini, Perplexity & Google"), same URL alphaa.app.
- [ ] ⚠️ **Claims audit before any ad runs:** the "1,000+ customers · 4.9 rating" hero social proof is a code placeholder. Ads + FTC are stricter than a homepage: do NOT use customer counts, ratings, or testimonials in ANY ad until backed by real numbers. Also verify "23 spots remaining" launch banner is being kept truthfully current. The $22,800 savings claim is safe as "save up to" vs stated agency rates.

## Day 3–4: First campaigns live

- [ ] Launch **Google Ads Campaign 1 (Brand, $4/day) + Campaign 2 (Category, $14/day)** — hold campaigns 3 & 4 until week 2 so budget concentrates while learning. (Interim total $18/day ≈ the "$20/day" launch step.)
- [ ] Attach shared negative keyword list; geo US+CA "Presence"; Max Clicks with $8 CPC cap.
- [ ] Launch **Meta Retargeting ($10/day)** with ads 1, 2, 6. (Prospecting waits — retargeting pool is small but converts; let pixel season.)
- [ ] Verify end-to-end: click own ad (or preview) → scan → confirm `scan_completed` lands in Google Ads + Meta within 24h.
- [ ] Set daily spend alerts ($45 Google, $25 Meta).

## Day 5–7: Watch, don't touch

- [ ] Daily 5-min check: spend pacing, search-terms report → add negatives (expect junk: jobs, courses, "free").
- [ ] No bid/budget changes before 7 days of data.
- [ ] Ship this week's 2 blog posts (queue #1 and #2 in content-engine.md) + distribution checklist.

## Week 2: Expand

- [ ] Launch **Google Campaign 3 (Agency-alt, $10/day)** and **Campaign 4 (Vertical, $12/day)** — all 7 `/for/` pages are LIVE (dentists, med-spas, hvac, plumbers, lawyers, restaurants, saas). Total now $40/day.
- [ ] Launch **Meta Prospecting ($10/day)**, ad sets A (health) + B (home services), ads 3, 4, 6.
- [ ] Ship 2 more blog posts (queue #3, #4).
- [ ] **Product Hunt prep:** gallery images (reuse Meta creative concepts), 60-sec demo video (the scan → results flow), maker comment draft (honest-mechanism story: "no one can guarantee AI rankings — here's what actually works"), line up 10–15 friends/users for launch-day comments. Schedule launch for week 3–4, a Tue/Wed.
- [ ] Submit G2 + Capterra listings for review if not yet live.
- [ ] First partner-designer outreach batch (5 emails, template from content-engine.md §backlinks).

## Weekly 30-minute review ritual (every Monday, forever)

**Pull (10 min):** Google Ads: spend, CPC, clicks, `scan_completed`, cost/scan by campaign + search-terms report. Meta: spend, CPM, CTR, ScanCompleted, frequency (retargeting). GA4: visitor→scan %, scan→signup %. Stripe: trials started, trial→paid, MRR.

**Decide (15 min) — kill/scale rules:**

| Signal | Action |
|---|---|
| Keyword CPC > $8 with 0 scans after ~$50 spend | Pause keyword |
| Campaign cost/scan > $40 for 2 straight weeks | Cut budget 50%, rewrite RSAs |
| Campaign CAC < $200 (trial-adjusted) | Scale budget +20%/week (from the $200 reserve) |
| Meta ad CTR < 0.7% after 3k impressions | Swap creative |
| Retargeting frequency > 4/7d | Add creative or trim budget |
| Search term converting repeatedly | Break out as exact-match keyword |
| Junk search terms | Add negatives (every single week) |
| Google Ads hits 30 conversions total | Switch to Maximize Conversions |

**Log (5 min):** one row in a simple sheet: date, spend, scans, signups, trials, paid, blended CAC, one sentence on what you changed. Plus monthly: run the AEO dogfooding check (content-engine.md) — ask each AI engine the 4 category queries, screenshot.

## Definition of "launch is working" (evaluate at day 30)

- Visitor→scan ≥ 8%, scan→signup ≥ 25% (fix landing/results pages before scaling spend if not)
- Blended CAC trending ≤ $300 (some grace: retargeting + organic compounding takes 60–90 days)
- ≥ 4 blog posts shipped, PH launched or scheduled, G2 live
- If CAC > $500 with healthy funnel rates → the problem is CPC/targeting: tighten to exact match + best vertical only.
