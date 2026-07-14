# 1,000 Customers by Dec 31, 2026 — Master Execution Plan

> v1.0 — 2026-07-14. Owner: founder + Claude automation. Pricing: $99/mo Starter ($199 Pro), 14-day **card-upfront** trial, free 60-second scan at alphaa.app/scan as the wedge.
> All numbers marked *(est.)* are estimates from standard benchmark ranges — we have **zero real funnel data yet** (6 lifetime scans, all self-tests, 0 external customers as of the 2026-07-10 growth review). Every number gets replaced with actuals in the Monday review.

---

## 0. The honest math first

Funnel assumptions (targets, unproven): visitor→scan **8%**, scan→signup **25%**, trial→paid **40%** ⇒ **0.8% visitor→customer**.

- 1,000 paying customers ≈ **2,500 trials** ≈ **10,000 completed scans** ≈ **~125,000 funnel-equivalent visitors** in <6 months.
- At $2–5K/mo paid budget and ~$5 CPC, paid ads produce roughly **400–1,000 clicks/mo → 3–20 customers/mo**. Paid ads alone gets us to ~50–100 by December. **Paid cannot carry this goal.**
- Cold outreach skips the visitor stage (we run *their* scan and email the result), so its arithmetic is sends → replies → trials, not clicks. That is why outbound is the backbone of this plan.
- The 14-day trial means **anyone who must be paying by Dec 31 must start a trial by ~Dec 17.** December signups after that don't count.
- Churn: at 3–5%/mo SMB churn *(est.)*, hitting 1,000 **net** requires ~1,080–1,120 gross conversions.

**Verdict: 1,000 by Dec 31 is a stretch. ~300 is the credible base case, ~600 is aggressive-but-plannable, 1,000 requires several low-probability things to all go right (see §2).** We plan and staff for Aggressive; we build the Moonshot preconditions and promote the target only if September actuals support it.

### Prerequisite fixes (Week 0 — before anything scales)

| Fix | Why | Status |
|---|---|---|
| Google OAuth token refresh (GSC/GA4 never synced) | Measurement layer is blind | Open (growth review #1) |
| `/refer` 404 in prod + remove fabricated stats on that page | Growth loop dead + FTC risk | Open (see referral-viral.md) |
| Reconcile "no credit card" copy vs card-upfront trial | Ads/emails currently say "no card needed" — deceptive if card is now required. Update google-ads.md RSAs, email-flows.md, pricing FAQ, or reverse the policy | Open — decide this week |
| GA4 events + Ads conversion import | Ads without tracking = burning money | Open (launch-checklist Day 1–2) |
| Scan-lead nurture unsubscribe infra | Blocks all cold + nurture email | Open (email-flows.md §B) |

---

## 1. Three scenarios

| | **Base ~300** | **Aggressive ~600** | **Moonshot 1,000** |
|---|---|---|---|
| Cold email sends/day by Oct | ~200 (6 inboxes) | ~400 (10–12 inboxes) | **500+ (12–16 inboxes), SDR-grade daily routine** |
| Paid spend/mo | $2K | $4–5K | $5K, ruthlessly optimized to /for/ pages |
| Product Hunt | Launched, any rank | Top 10 | **Top 5 day rank** |
| Content/AEO | 2 posts/wk, compounding from Oct | Same + digital-PR stats asset earns links | Same + alphaa itself ranks in AI answers for its category |
| Referral / viral win loop | Live, modest | Win pages shipping share traffic | **Loop actually hits: 15–20% of scans come from shared win pages / referrals (K≈0.2–0.3)** |
| Partnerships | 5 active partners | 12–15 active | **25+ active (designers/bookkeepers), 30% commission** |
| Pricing motion | — | Annual push at trial end | Annual + limited launch pricing experiment |
| Founder time | ~5 h/wk | ~7 h/wk | **10+ h/wk (reply handling alone breaks the 5h cap — plan a VA or accept it)** |

**What must ALL be true for 1,000 (state of the world, not hopes):** deliverability never melts down across 4+ domains; scan-led emails hit ≥0.4% send→customer *(est. range 0.2–0.5%)*; PH top-5; the shareable-win loop generates a real viral coefficient; 25+ partners each referring 1–3/mo; trial→paid holds ≥40% with card-upfront; churn ≤4%/mo; and nothing (Google OAuth verification, Stripe, spam complaints) breaks for more than a week. Any two failing ⇒ you land in Aggressive territory. That's the honest picture.

### Month-by-month targets (net customers, end of month)

| Month | Base new / cum | Aggressive new / cum | Moonshot new / cum | MRR @ $99 (Aggr.) | Spend (ads+tools, Aggr.) |
|---|---|---|---|---|---|
| Jul (half-month) | 5 / 5 | 10 / 10 | 15 / 15 | $1.0K | $2.4K |
| Aug | 15 / 20 | 40 / 49 | 60 / 75 | $4.9K | $3.2K |
| Sep | 35 / 54 | 80 / 127 | 135 / 207 | $12.6K | $4.0K |
| Oct | 60 / 113 | 120 / 243 | 210 / 411 | $24.1K | $4.5K |
| Nov | 85 / 194 | 160 / 396 | 280 / 679 | $39.2K | $5.0K |
| Dec | 105 / **~295** | 190 / **~575** | 330 / **~988** | $56.9K | $5.0K |

Cumulative assumes 3%/mo churn *(est.)*. MRR floor uses $99 ARPU; ~15% Pro mix *(est.)* adds ~15%. Moonshot December MRR ≈ **$98K**.

---

## 2. Channel portfolio — expected 6-month yield

| Channel | Yield (Base → Moonshot) | Cash CAC *(est.)* | Confidence | Notes |
|---|---|---|---|---|
| Cold email (scan-led) | 100 → 400 | $30–80 (tools only; time is the real cost) | **Medium** | Backbone. Yield = sends × 0.2–0.5% *(est.)*. See outreach-kit.md |
| Google Ads | 40 → 100 | $250–600 | **Medium** | Per google-ads.md; /for/ pages + retargeting needed to get under $300 |
| Meta Ads | 15 → 40 | $300–700 | Low-Med | Retargeting first; prospecting only if CAC proves out |
| Content / AEO organic | 30 → 120 | ~$0 marginal | **Medium, back-loaded** | 15 posts live; compounds meaningfully Oct+ only |
| LinkedIn + IG DMs | 15 → 60 | ~$100/mo tools | Low-Med | Lawyers on LinkedIn, med-spas on IG. See dm-social-kit.md |
| Product Hunt | 10 → 40 | ~$0 | Low (one-shot) | Mostly secondary ICP (SaaS founders) — converts fast, churns fast |
| PR / podcasts / newsletters | 10 → 50 | ~$0 | Low | Slow to book; compounding credibility. See pr-launch-kit.md |
| Referral + viral win loop | 20 → 120 | ~$100/customer (give/get credit) | Low (loop unproven) | Multiplier on the base, not a base. See referral-viral.md |
| Partnerships (web designers, bookkeepers, consultants) | 20 → 100 | 30% rev share | **Medium** | /refer program — currently 404. Fix first |
| **Total** | **~260–310 → ~1,030** | | | Sums to the scenarios by design — every channel must hit its lane for Moonshot |

---

## 3. Month-by-month execution calendar

**July 14–31 — Fix + ignite.** Week-0 fixes (§0). Buy outreach domains, start inbox warmup (ready ~Aug 4). Launch Google Brand + Category campaigns ($18/day). Meta retargeting. First 500-lead list (dentists). Run first 100 outreach scans. PH launch prep; target **Tue Jul 28** (fallback Tue Aug 4). Ship 4 blog posts. Fix /refer, recruit first 3 partners manually.

**August — Outbound live.** Cold email ramps 60→180/day across 6 inboxes. Google full $40/day (all 4 campaigns). PH launch + follow-through week. LinkedIn motion starts (lawyers). First win pages live → share prompts on. Partner outreach 10/wk. 2 posts/wk forever. Target: 40 new (Aggr.).

**September — Prove the math.** Decision month: compute real send→customer %, CPC→CAC, trial→paid. Kill what's failing (rules §5). Add domains 3–4 if deliverability is clean → 300/day. First podcast pitches out (booked shows air Oct–Nov). Annual-plan push at trial end begins. Target: 80 new. **Go/no-go on Moonshot happens here** — need ≥120 cumulative + send→customer ≥0.3% to keep 1,000 alive.

**October — Scale what survived.** Outbound 400/day (Moonshot: 500+). Reallocate all paid budget into the ≤$300-CAC survivors. Stats asset ("we scanned N businesses; X% invisible on ChatGPT") published from real outreach-scan data → press push. Wins wall live on site. Target: 120 new.

**November — Peak push.** Everything at full rate. Black-Friday-adjacent annual offer (honest framing: "12 months for 10"). Referral give/get promoted in-app to every active customer. Second PR wave off the stats asset. Target: 160 new.

**December — Convert the pipeline.** Last trial-start day that counts: **Dec 17**. Front-load sends Dec 1–10. Year-end angle for lawyers/dentists ("2027 marketing budget: $1,188 not $24,000"). Target: 190 new.

---

## 4. Weekly operating cadence (founder, ≤5 h/wk manual — Aggressive; Moonshot needs ~10)

| Day | Time | What the founder actually does |
|---|---|---|
| **Mon** | 60 min | Metrics pull + Monday review ritual (launch-checklist.md): spend, CPC, scans, trials, paid, CAC by channel. Apply kill/double-down rules (§5). Log one row. |
| **Tue** | 45 min | Outreach reply handling (Claude pre-drafts, founder approves/sends). Approve this week's 2 blog posts (Claude-drafted). |
| **Wed** | 45 min | Reply handling. Post 1 LinkedIn founder post (from dm-social-kit.md bank). Approve partner-outreach batch. |
| **Thu** | 45 min | Reply handling. One community value-play (answer a real question in a group/subreddit). |
| **Fri** | 45 min | Reply handling. Review win pages created this week → nudge 3 customers to share. Queue next week's lead lists (approve Claude's batch). |

**Claude automation (nightly, zero founder time):** scrape + verify lead lists; run outreach scans in batch; personalize + queue sequences; draft replies; draft blog posts and LinkedIn posts; compile Monday metrics.

## 5. Kill / double-down rules (checked every Monday)

| Signal | Action |
|---|---|
| Keyword CPC > $8 with 0 scans after ~$50 | Pause keyword |
| Campaign cost/scan > $40 two straight weeks | Cut budget 50%, rewrite ads |
| Any channel CAC < $200 trial-adjusted | +20% budget/effort per week |
| Cold-email variant reply rate < 1% after 500 sends | Rewrite (kill the variant, not the channel) |
| Spam complaint rate > 0.1% or open rate < 30% on a domain | Pause domain 2 wks, re-warm |
| Positive replies → trial < 20% | Problem is the offer/landing page, not volume — fix before adding sends |
| Trial→paid < 25% for a full cohort | Stop scaling everything; fix activation (this breaks ALL the math) |
| A channel delivers < 5 customers after a full month at plan volume | Kill it, reallocate to the best CAC channel |
| Viral: < 3% of win pages shared after 200 wins | Redesign the share moment, don't build more loop features |

## 6. The 3 metrics that matter weekly

1. **External scans completed** (excl. self-tests) — top-of-funnel truth.
2. **Trials started** (card entered) — the only "lead" that counts.
3. **New paying customers + MRR** — the scoreboard. (Trial→paid % is watched inside #3.)

Everything else — followers, impressions, opens — is diagnostics, not progress.
