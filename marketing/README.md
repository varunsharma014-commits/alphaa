# Alphaa Marketing System

> Version 1.0 — 2026-07-04. Everything here is executable by one non-marketer founder in ~5 hrs/week. Docs are versioned in git; update the version line when you change strategy, not copy tweaks.

## What each doc is

| Doc | What it is | When you touch it |
|---|---|---|
| [icp.md](icp.md) | Who we sell to, their pains, objections + counters | Quarterly, or when a persona stops converting |
| [google-ads.md](google-ads.md) | Complete launch-ready Google Ads plan: 4 campaigns, keywords, RSAs, budgets | Copy-paste at launch; weekly review edits |
| [meta-ads.md](meta-ads.md) | Meta retargeting + prospecting: 6 ad copy variants + creative specs | Copy-paste at launch; refresh creative monthly |
| [email-flows.md](email-flows.md) | In-app lifecycle emails (live) + scan-lead nurture drafts (NOT yet automated) | Before enabling scan-lead sends |
| [content-engine.md](content-engine.md) | Blog hub, next-10 article queue, distribution checklist, backlink plan | Weekly (2 posts/wk cadence) |
| [launch-checklist.md](launch-checklist.md) | Ordered 2-week runbook + weekly 30-min review ritual | Daily during launch, then weekly |

## The funnel

```
                    PAID                            ORGANIC
        Google Ads      Meta Ads            Blog / X / LinkedIn / PH
             │              │                        │
             ▼              ▼                        ▼
   /for/[vertical] page  or  /scan  ◄────────────────┘
             │                │
             └───────┬────────┘
                     ▼
          FREE 60-SECOND SCAN  (alphaa.app/scan — the lead magnet)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
     SIGNUP                 scan-lead email nurture
   (14-day trial)          (day 0/2/5/9 — see email-flows.md)
        │                         │
        ▼                         └──► back to signup
  ACTIVATION EMAILS
  (welcome → connect-Google nudges → day-7 recap)
        │
        ▼
   TRIAL → PAID ($99 Starter / $199 Pro)
```

## Who/what runs each piece

| Piece | Runs how | Cadence | Human time |
|---|---|---|---|
| Free scan + results | Automated (`/api/scan`) | Always on | 0 |
| Lifecycle emails (welcome, trial-ending, weekly recap) | Automated in code (Clerk webhook + crons) | Always on | 0 |
| GBP posts / weekly reports for customers | Automated (crons) | Always on | 0 |
| Scan-lead nurture | ⚠️ NOT automated yet (see email-flows.md) | — | Blocked on unsubscribe infra |
| Google Ads | Human launches, then weekly review | Weekly 15 min | Founder |
| Meta Ads | Human launches, then weekly review | Weekly 10 min | Founder |
| Blog posts | Human (Claude-assisted) | 2/week | ~2 hrs/week |
| Post distribution (X, LinkedIn, Reddit) | Human | Per post | ~20 min/post |
| Weekly review ritual | Human | Monday 30 min | Founder |

## KPI targets

| Metric | Target | Why |
|---|---|---|
| Visitor → scan started | ≥ 8% | Scan is zero-friction (no signup, 60s) |
| Scan → signup | ≥ 25% | Results page shows the gap + CTA |
| Trial → paid | ≥ 40% | Autopilot value visible in week 1 (posts published, score tracked) |
| CAC (blended paid) | ≤ $300 | ≈ 3-month payback at $99/mo |
| CPC ceiling | ≤ $8 | Above this, unit math breaks at 8%/25% rates |
| LTV assumption | ~$1,200–$1,800 | $99–$199/mo × assumed 12–15 mo retention (⚠️ unproven — revisit at 6 months of churn data) |

**Budget:** $2,000/mo → Google Search $1,200 (~$40/day), Meta $600 (~$20/day), $200 testing reserve.

**Back-of-envelope at target rates:** $40/day ÷ $5 CPC = 8 clicks/day → 0.64 scans → 0.16 signups → ~0.06 paid/day ≈ 2 paid customers/mo from Google alone at CAC ≈ $600. That's above target — which is why the /for/ vertical pages (higher intent, higher scan rate) and retargeting exist. Expect blended CAC to land under $300 only once retargeting + organic assist kick in (month 2–3).
