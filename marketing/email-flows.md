# Email Flows

> v1.0. Two systems: (A) the **customer lifecycle flow** — transactional/relationship email to signed-up users, runs in code; (B) the **scan-lead nurture** — marketing email to non-customers. **(B) is copy-drafts only. NOT YET AUTOMATED.**

## A. Customer lifecycle flow (automated in-app)

Sent via Resend from `hello@alphaa.app` using React Email templates in `src/emails/`.

| Step | Trigger | Template / route | Status in code |
|---|---|---|---|
| Welcome | Signup (`user.created` Clerk webhook) | `WelcomeEmail.tsx` via `/api/webhooks/clerk` | ✅ Live |
| Day 1 connect-nudge | 24h after signup, Google not connected | `/api/cron/lifecycle` | ✅ **LIVE** — `ConnectGoogleNudgeEmail`, runs daily 14:00 UTC, deduped via activity ledger |
| Day 4 connect-nudge | Day 4, still not connected | `/api/cron/lifecycle` | ✅ **LIVE** — second nudge variant |
| Day 7 recap | Day 7, Google connected — real activity + score | `/api/cron/lifecycle` | ✅ **LIVE** — `WeekOneRecapEmail`, only-real-data honesty |
| Trial ending | ~3 days before `trialEndsAt` | `TrialEndingEmail.tsx` | ✅ Template exists — verify a cron actually sends it |
| Weekly report | Every week, active/trialing users | `WeeklyReportEmail.tsx` via `/api/cron/weekly` | ✅ Live |
| Payment failure | Stripe `invoice.payment_failed` | `PaymentFailureEmail.tsx` | ✅ Live |

These are fine to send without marketing-unsubscribe infra: recipients are account holders and the content is about their service (transactional/relationship under CAN-SPAM; existing-business-relationship under CASL). Still include an address footer + a way to manage notification prefs.

**Nudge copy as implemented (see `src/emails/ConnectGoogleNudgeEmail.tsx` / `WeekOneRecapEmail.tsx`):**
- Day 1 subject: `Your autopilot is idling — 2 minutes to switch it on` — body: one job only: connect Google. One orange button.
- Day 4 subject: `We can't fix what we can't see yet` — body: what connecting unlocks (rankings, reviews, GBP posts published FOR them), 2-min promise, button.
- Day 7 subject: `Week 1: here's what changed` — body: score delta, posts published, engines checked; if not connected, honest "here's what we could do with access."

---

## B. Scan-lead nurture sequence

> ⚠️ **NOT YET AUTOMATED — DO NOT SEND.** These recipients are non-customers who ran a free scan (`ScanLead` records). Sending them marketing email requires: (1) a working one-click unsubscribe link + suppression list, (2) physical mailing address in the footer, (3) for Canadian recipients, CASL express/implied-consent handling — add a consent checkbox or clear notice at scan-email capture. Build unsubscribe infra first (Resend Audiences supports suppression), then wire these as a cron. Until then this section is copy on a shelf.

Sequence targets `ScanLead` where `converted = false`. Stop the sequence immediately on signup. From: `Varun at Alphaa <hello@alphaa.app>`. Plain-ish text beats heavy HTML for this audience.

### Day 0 — results delivery (send within minutes of scan)

**Subject:** `Your AI visibility score: {score}/100`
**Preheader:** What ChatGPT, Gemini and Perplexity say about {businessName} — full results inside.

> Hi {firstName|there},
>
> You just scanned **{businessName}** — here's the short version:
>
> **AI Visibility Score: {score}/100**
>
> - Engines where you appeared: {appearedCount} of {checkedCount}
> - Biggest issue we found: {topIssue}
>
> Your full results, including what each AI engine actually said, are here:
>
> **[View my full results →]({resultsUrl})**
>
> A quick honest note: nobody can guarantee AI rankings — anyone who says otherwise is selling snake oil. What CAN be done is fixing the public signals AI engines read: your content, schema, reviews, and Google Business Profile. That's exactly what Alphaa automates, for $99/month instead of a $1,000+/month agency retainer.
>
> If you want it handled: **[Start your 14-day free trial →](https://alphaa.app/signup?utm_source=email&utm_medium=lifecycle&utm_campaign=scan-nurture&utm_content=day0)** — no credit card to start.
>
> — Varun, founder of Alphaa

### Day 2 — competitor fear

**Subject:** `Someone is getting recommended in {city}. Is it you?`
**Preheader:** AI engines pick one or two answers. Here's how they decide.

> Hi {firstName|there},
>
> When someone in {city} asks ChatGPT for "the best {businessType} near me," it doesn't show a list of ten links like Google used to. It names one or two businesses, confidently, and most people never look further.
>
> Your scan on {scanDate} scored {businessName} at **{score}/100**. That number is really a proxy for one question: when AI has to pick, are you pickable?
>
> The engines decide from public signals — recent content, structured data, review activity, an up-to-date Google Business Profile. Businesses that feed those signals get named. Businesses that don't stay invisible, no matter how good they are at the actual work.
>
> Alphaa feeds those signals automatically, every week, and shows you what each engine says about you over time.
>
> **[Re-check my results →]({resultsUrl})** · **[Start free trial →](.../signup?...&utm_content=day2)**
>
> — Varun

### Day 5 — the savings math

**Subject:** `$24,000/yr vs $1,188/yr — same job`
**Preheader:** The honest math on agencies vs autopilot.

> Hi {firstName|there},
>
> If you're paying an SEO agency, here's the math nobody puts in the monthly PDF:
>
> | | Typical agency | Alphaa |
> |---|---|---|
> | Cost | ~$2,000/mo → $24,000/yr | $99/mo → $1,188/yr |
> | Contract | 6–12 month lock-in | None — cancel in one click |
> | AI search (ChatGPT, Gemini, Perplexity) | Not their world | The whole point |
> | Reporting | Jargon PDF | One plain-English email/week |
>
> That's up to **$22,800/year** back — and coverage on the search channel that's actually growing.
>
> And if you're paying nobody right now? $99/month is the price of not being invisible while your competitors figure this out.
>
> There's a 14-day free trial and no credit card required, so the worst case is you spent two minutes connecting your Google account.
>
> **[Start my free trial →](.../signup?...&utm_content=day5)**
>
> — Varun

### Day 9 — last touch

**Subject:** `Closing the file on {businessName}`
**Preheader:** One last thing before we stop emailing you.

> Hi {firstName|there},
>
> This is the last email in this series — no drip campaign that never ends, promise.
>
> Your scan from {scanDate} scored **{score}/100**. Two things worth knowing before I go:
>
> 1. That result is a snapshot. AI answers shift as competitors publish content and collect reviews. You can re-scan free anytime at alphaa.app/scan.
> 2. If you'd rather never think about this again, that's literally the product: Alphaa runs your visibility on autopilot for $99/month, 14-day free trial, cancel anytime.
>
> **[Start my free trial →](.../signup?...&utm_content=day9)**
>
> Either way — thanks for scanning, and good luck out there.
>
> — Varun
>
> *P.S. Reply to this email with any question. It's me reading, not a bot.*

### Sequence rules (for whoever automates this)

- Suppress instantly on: signup (`converted = true`), unsubscribe, hard bounce.
- Send window: 9am–5pm recipient-local-ish (fallback: 11am ET), never weekends for day 2/5/9.
- UTM: `utm_source=email&utm_medium=lifecycle&utm_campaign=scan-nurture&utm_content=day{N}`.
- Every send needs: unsubscribe link, physical address, "you're receiving this because you ran a scan at alphaa.app" line.
