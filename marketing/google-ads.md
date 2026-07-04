# Google Ads — Launch Plan

> v1.0. Total budget **$40/day** ($1,200/mo). Geo: **US + Canada**, English. Network: **Search only** (uncheck Display + Search Partners). Bidding: **Maximize Clicks with $8 max CPC cap → switch to Maximize Conversions once the account has 30 conversions**.

## UTM convention (every final URL)

```
?utm_source=google&utm_medium=cpc&utm_campaign={campaign}&utm_term={keyword}
```

Use ValueTrack in account-level tracking template so you don't hand-build these:
`{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_term={keyword}` (set custom parameter `{_campaign}` per campaign).

## Conversion actions (configure BEFORE launching — Day 1 of runbook)

| Conversion | Source | Primary? | Notes |
|---|---|---|---|
| `scan_completed` | GA4 event → import to Google Ads | **Primary** | Fire when scan results render on /scan/results |
| `signup` | GA4 event | Secondary | Clerk signup complete |
| `trial_start` | GA4 event | Secondary | Onboarding complete / trial begins |

## Account structure — 4 campaigns

| # | Campaign | Daily budget | Landing page |
|---|---|---|---|
| 1 | Brand | $4 | alphaa.app |
| 2 | Category-intent | $14 | alphaa.app/scan |
| 3 | Agency-alternative | $10 | alphaa.app (AgencySection does the work) |
| 4 | Vertical | $12 | /for/[vertical] pages |
| | **Total** | **$40** | |

---

## Campaign 1: Brand — $4/day

Protect the name; cheap clicks; near-100% conversion intent.

**Keywords (exact + phrase):**
`[alphaa]`, `[alphaa app]`, `[alphaa ai]`, `[alphaa seo]`, `[alphaa aeo]`, `"alphaa reviews"`, `"alphaa pricing"`, `[alpha aeo tool]` (common misspelling catch)

**RSA 1** — Final URL: `https://alphaa.app` (+UTM, campaign=brand)

Headlines (≤30 chars):
1. Alphaa — AI Search Autopilot
2. Get Found on ChatGPT & Gemini
3. Official Alphaa Site
4. $99/mo. No Contracts.
5. 14-Day Free Trial
6. Free 60-Second AI Scan
7. Replace Your SEO Agency
8. AEO on Autopilot
9. Show Up in AI Answers
10. Google + 5 AI Engines
11. No Credit Card to Start
12. See Your AI Visibility Score
13. Built for Local Business
14. Cancel Anytime

Descriptions (≤90 chars):
1. Alphaa gets your business into AI answers automatically. Start your 14-day free trial.
2. See what ChatGPT, Gemini & Perplexity say about your business. Free 60-second scan.
3. AI search optimization for $99/mo — not $1,000+/mo agency retainers. No contracts.
4. Content, schema, reviews & Google Business Profile — handled on autopilot.

**RSA 2** — Final URL: `https://alphaa.app/pricing` (+UTM)

Headlines:
1. Alphaa Pricing — From $99/mo
2. Alphaa: 14-Day Free Trial
3. No Contracts, Cancel Anytime
4. Starter $99 · Pro $199
5. Try Alphaa Free Today
6. AI Search Visibility, Simple
7. The SEO Agency Alternative
8. Get Recommended by AI
9. Free Scan Before You Buy
10. Save vs Agency Retainers
11. Setup Takes 2 Minutes
12. Annual Plans Save 20%
13. Full Refund in First 7 Days

Descriptions:
1. Straightforward pricing: $99/mo Starter, $199/mo Pro. 14-day free trial, no card needed.
2. Everything an SEO agency does for AI-era search — automated. Cancel in one click.
3. Free scan shows your AI visibility score before you spend a dollar. Takes 60 seconds.
4. GBP posts, AI-optimized content, visibility tracking and weekly reports. Done for you.

---

## Campaign 2: Category-intent — $14/day

People searching for the solution by name. Ad groups by theme; phrase + exact match only (no broad at launch).

**Ad group 2a — AEO/AI-SEO tools:**
`"ai seo tool"`, `[ai seo tool]`, `"answer engine optimization"`, `[answer engine optimization tool]`, `"ai search optimization"`, `[ai search optimization tool]`, `"aeo tool"`, `[aeo software]`, `"ai seo software"`, `"llm seo"`

**Ad group 2b — Get found on ChatGPT:**
`"get found on chatgpt"`, `[how to get found on chatgpt]`, `"chatgpt for business visibility"`, `"show up on chatgpt"`, `[get my business on chatgpt]`, `"get recommended by chatgpt"`, `"chatgpt business listing"`, `"appear in ai search"`, `"get found on perplexity"`, `"ai search visibility"`

**RSA 1 (2a — tool seekers)** — Final URL: `https://alphaa.app/scan` (+UTM, campaign=category)

Headlines:
1. The AI Search Autopilot
2. Answer Engine Optimization
3. AEO Tool for Local Business
4. Free AI Visibility Scan
5. See Your Score in 60 Seconds
6. ChatGPT, Gemini & Perplexity
7. Plus Classic Google SEO
8. $99/mo — Not Agency Prices
9. 14-Day Free Trial
10. No Signup for the Free Scan
11. Content, Schema & Reviews
12. Tracks 6 AI Engines
13. Built for Business Owners
14. Set Up in 2 Minutes

Descriptions:
1. Alphaa optimizes the public signals AI engines read — content, schema, reviews, GBP.
2. Run a free 60-second scan. See exactly what each AI engine says about your business.
3. AEO on autopilot from $99/mo. 14-day free trial, no contracts, cancel anytime.
4. Not just tracking — Alphaa fixes what it finds, automatically. Weekly plain-English report.

**RSA 2 (2b — ChatGPT visibility)** — Final URL: `https://alphaa.app/scan` (+UTM)

Headlines:
1. Is Your Business on ChatGPT?
2. Find Out Free in 60 Seconds
3. Get Found in AI Answers
4. Your Customers Ask AI Now
5. ChatGPT, Claude & Gemini
6. Free AI Visibility Scan
7. Then Fix It on Autopilot
8. From $99/mo, No Contracts
9. 1B+ Daily AI Searches
10. Don't Be Invisible to AI
11. 14-Day Free Trial
12. No Credit Card Required
13. Works With Google SEO Too
14. See What AI Says About You

Descriptions:
1. Ask ChatGPT who's the best in your industry near you. If it's not you, we should talk.
2. Free scan shows your visibility across ChatGPT, Gemini, Perplexity & Google AI.
3. Alphaa shapes the signals AI reads so you show up in answers. Honest work, no fake promises.
4. 60 seconds, no signup. See your AI visibility score and exactly what's holding you back.

---

## Campaign 3: Agency-alternative — $10/day

Highest-emotion searches. One ad group; phrase + exact.

**Keywords:**
`"seo agency alternative"`, `"cheap seo agency"`, `"affordable seo for small business"`, `"is my seo agency worth it"`, `"fire seo agency"`, `"seo agency scam"`, `"cancel seo contract"`, `"seo without an agency"`, `"seo agency too expensive"`, `"diy seo vs agency"`, `"seo agency not working"`, `[replace seo agency]`, `"seo agency review"`, `"how much should seo cost"`, `"seo for $99"`

**RSA 1** — Final URL: `https://alphaa.app` (+UTM, campaign=agency-alt)

Headlines:
1. Fire Your SEO Agency
2. Save Up to $22,800/Year
3. $99/mo vs $2,000/mo
4. No Contracts. Ever.
5. AI Does What Agencies Can't
6. Get Found on ChatGPT Too
7. 14-Day Free Trial
8. No PDF Reports, Real Results
9. Cancel in One Click
10. See the Difference Free
11. Free 60-Second Scan
12. SEO + AI Search, Automated
13. Built for Owners, Not CMOs
14. Judge Us Before You Pay

Descriptions:
1. Agencies charge $1,000–$2,500/mo and can't get you on ChatGPT. Alphaa does both for $99.
2. No retainers, no 12-month lock-ins, no jargon PDFs. One dashboard, one weekly email.
3. Run Alphaa alongside your agency for a month. Compare. Then decide. Free trial, no card.
4. Free scan shows what AI engines say about you right now — before you spend anything.

**RSA 2** — Final URL: `https://alphaa.app/scan` (+UTM)

Headlines:
1. Is Your SEO Agency Worth It?
2. Check Free in 60 Seconds
3. What Does AI Say About You?
4. Your Agency Can't Answer That
5. $24,000/yr → $1,188/yr
6. Same Goal. 95% Cheaper.
7. Plus AI Search Coverage
8. No Contract, No Risk
9. Free AI Visibility Scan
10. 14-Day Trial, No Card
11. Honest, Measured Results
12. Weekly Plain-English Report
13. Keep or Cancel Anytime

Descriptions:
1. Scan your business free. If your agency were working, you'd already be in AI answers.
2. Alphaa automates content, schema, reviews & GBP — the work agencies bill retainers for.
3. We never promise guaranteed rankings. We show you the signals and the measured change.
4. From $99/mo with a 14-day free trial. The math is simple: save up to $22,800 a year.

---

## Campaign 4: Vertical — $12/day

One ad group per vertical, each → its `/for/` page. Launch with dentists, HVAC, lawyers ($4/day each); add med-spas/plumbers/restaurants/saas in week 2+. **Pause any vertical whose /for/ page isn't live.**

**Ad group 4a — Dentists** → `https://alphaa.app/for/dentists` (+UTM, campaign=vertical-dental)
Keywords: `"seo for dentists"`, `"dental seo"`, `"dental practice marketing"`, `"dental marketing company"`, `"get more dental patients"`, `"dentist google ranking"`, `"ai marketing for dentists"`, `[dental seo services]`, `"dental seo cost"`, `"med spa seo"` *(move to own group when /for/med-spas is live)*

**Ad group 4b — HVAC/Plumbers** → `https://alphaa.app/for/hvac` (+UTM, campaign=vertical-hvac)
Keywords: `"hvac seo"`, `"hvac marketing"`, `"seo for plumbers"`, `"plumber marketing"`, `"hvac lead generation"`, `"plumbing seo company"`, `"get more hvac leads"`, `[hvac seo services]`, `"hvac google ranking"`, `"local seo for contractors"`

**Ad group 4c — Lawyers** → `https://alphaa.app/for/lawyers` (+UTM, campaign=vertical-legal)
Keywords: `"seo for lawyers"`, `"law firm seo"`, `"attorney marketing"`, `"legal marketing company"`, `"law firm marketing cost"`, `[law firm seo services]`, `"lawyer google ranking"`, `"ai marketing for law firms"`, `"solo attorney marketing"`, `"family law seo"`
⚠️ Legal CPCs run $15–$50+. Keep the $8 CPC cap; you'll only win off-peak/long-tail — that's intentional.

**RSA 1 (adapt noun per ad group — dentist version shown)** — Final URL: vertical page

Headlines:
1. AI Search for Dental Offices
2. Patients Ask ChatGPT Now
3. Is Your Practice the Answer?
4. Free 60-Second Practice Scan
5. $99/mo — Not $2,000 Retainers
6. Get Recommended by AI
7. Google + ChatGPT + Gemini
8. Marketing on Autopilot
9. 14-Day Free Trial
10. No Contracts, Cancel Anytime
11. Built for Practice Owners
12. More New-Patient Calls
13. See What AI Says About You
14. Set Up in 2 Minutes

Descriptions:
1. New patients ask AI "best dentist near me." Alphaa makes sure you're in the answer.
2. Free scan shows your practice's visibility on ChatGPT, Gemini, Perplexity & Google AI.
3. Posts, content, schema, reviews — handled automatically for $99/mo. No agency retainer.
4. 14-day free trial, no credit card. One weekly email tells you exactly what improved.

**RSA 2 (agency-switch angle — HVAC version shown)** — Final URL: vertical page

Headlines:
1. HVAC Marketing for $99/mo
2. Fire the $1,500/mo Agency
3. Save Up to $22,800/Year
4. Homeowners Ask AI First Now
5. Be the Answer They Get
6. Free AI Visibility Scan
7. No Contracts, No Jargon
8. Google + 5 AI Engines
9. 14-Day Free Trial
10. Runs Itself. You Run Jobs.
11. Weekly Plain-English Report
12. Cancel in One Click
13. Built for Owner-Operators

Descriptions:
1. Alphaa does the SEO + AI search work agencies charge $1,500/mo for — automatically.
2. Free 60-second scan: see if ChatGPT recommends you or your competitor. No signup.
3. GBP posts, review monitoring, content and rankings — one dashboard, one weekly email.
4. $99/mo, 14-day free trial, cancel anytime. Spend on trucks and techs, not retainers.

---

## Negative keywords (account-level shared list)

```
job, jobs, salary, career, hiring, intern, course, courses, certification,
training, tutorial, learn, degree, university, free tool, free software,
open source, api, github, login, sign in, wordpress plugin, template,
what is (Brand campaign only — keep in Category for now and watch),
agency jobs, become an seo, reseller, white label, affiliate, meaning,
definition, examples, reddit, youtube, download, crack, alternative to alphaa
```

Add per-vertical negatives: `dental school, dds programs, hvac certification, plumbing license, law school, lsat, paralegal`.

## Launch checklist

- [ ] GA4 events `scan_completed`, `signup`, `trial_start` firing (verify in DebugView)
- [ ] Import GA4 conversions into Google Ads; set `scan_completed` as Primary
- [ ] Account-level tracking template with UTM convention set
- [ ] Shared negative list attached to all 4 campaigns
- [ ] Geo: United States + Canada, "Presence" (not "Presence or interest")
- [ ] Language: English. Networks: Search only
- [ ] Bidding: Maximize Clicks, $8 max CPC limit
- [ ] Ad schedule: all day at launch (review hour-of-day after 2 weeks)
- [ ] Sitelinks: Pricing, Free Scan, How It Works, Blog
- [ ] Callout extensions: "14-Day Free Trial", "No Contracts", "No Credit Card", "60-Second Scan"
- [ ] Billing + budget alerts set ($45/day account alert)
- [ ] Auto-apply recommendations: **OFF** (all of them)
- [ ] At 30 conversions: switch to Maximize Conversions (no tCPA for first 2 weeks after switch)
