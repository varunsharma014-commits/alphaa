# Email Flows

> v2.0 (Oct 2026). Two systems, both automated: (A) the **customer lifecycle flow**, transactional/relationship email to signed-up users; (B) the **scan-lead nurture**, marketing email to people who ran the free check and haven't bought.

## A. Customer lifecycle flow (automated in-app)

Sent via Resend from `RESEND_FROM_EMAIL` (`ai-agent@alphaa.app`) using React Email templates in `src/emails/`.

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

## B. Scan-lead nurture sequence (automated)

**Live in code.** Route `/api/cron/nurture` runs daily at 16:00 UTC (noon ET) from `src/lib/cron-scheduler.ts`. Copy and schedule: `src/lib/nurture.ts`. Template: `src/emails/NurtureEmail.tsx` (plain black-on-white text, one link CTA). Sender: `src/lib/marketing-email.ts`.

- **From:** `Alphaa <ai-agent@alphaa.app>` (`RESEND_FROM_EMAIL`). **Reply-to:** `hi@alphaa.app`. A person reads every reply.
- **Voice:** the agent, first person. 60-130 words, one idea, one CTA. Only facts from the lead's own scan; empty name falls back to "your business", empty city is left out.
- **Offer (exact):** no free trial (the free check is the trial). Starter $99/month, month to month, cancel in two clicks, 7-day refund on the first charge, 90-day AI Visibility Guarantee. Never "#1", "best", "free trial", "no signup", invented stats or customers, or any engine beyond ChatGPT, Gemini, Claude and Perplexity. Lead with getting customers from AI; the agency price comparison appears only as the last line of the Day 4 offer.

### Schedule

Day 0 is the report email (`src/lib/scan-email.ts`), sent when the scan finishes. People are most likely to buy in the first four days, so those go daily, then one email a week. Day 60 is the last email, ever.

| Day | Subject | Purpose | CTA |
|---|---|---|---|
| 1 | Why AI named {rival} instead | The gap: who got named and what their sites have that theirs doesn't | Their full report |
| 2 | I already drafted your fix | Shows the stored quick-fix FAQ draft (fallback: "What I'd write first for {name}") | Start today |
| 3 | Can anyone guarantee ChatGPT? | Honesty: nobody can. The 90-day guarantee + 7-day refund instead | Start today |
| 4 | What $99 a month does for {name} | The offer, itemised. Agency comparison only as the last line | Start today |
| 11 | AI answers change. Has yours? | Answers shift; re-run the check | Re-check (`/start`) |
| 18 | 3 things AI checks before it names a business | Clear answers, consistent facts, readable reviews | Start today |
| 25 | Ask ChatGPT why it picked them | A test they can run themselves | Free check (`/start`) |
| 32 | When AI gets your hours wrong | The fact fix, as a labelled example | Start today |
| 39 | Reviews AI can actually read | What makes a review count | Re-check (`/start`) |
| 46 | One page per service | Why one services list gets passed over | Start today |
| 53 | Put the answer in the first sentence | Writing so AI can quote you | Re-check (`/start`) |
| 60 | Should I stop checking for {name}? | Break-up. Clearly the final email; reply "later" | Start today |

"Start today" links to `/signup?scan={leadId}` so onboarding picks up their check. UTM: `utm_source=email&utm_medium=nurture&utm_campaign=scan-nurture&utm_content=day{N}`.

### Rules (enforced in code)

- **Who:** `ScanLead` with an email, a completed scan and a sent report email, created after the consent notice shipped (2026-10-04 16:00 UTC) and within the last 65 days. One sequence per address, anchored on their newest scan.
- **Stops for good on:** unsubscribe (any lead or account for that address), any lead converted, or an account with that email.
- **Pacing:** at most one email per address per 20 hours, one step per run. Days 1-4 go strictly in order on consecutive days (a missed run delays a step, never skips it). Weekly steps send only the latest due one, so an outage never becomes a backlog. A step is never resent; `ogData.nurture = { step, schedule: 2, lastSentAt }`, and steps stored under the old schedule are mapped by content.
- **Every send:** footer with "you ran a free AI check at alphaa.app", Alphaa + `COMPANY_MAILING_ADDRESS`, a signed unsubscribe link, and RFC 8058 one-click `List-Unsubscribe` headers. **Without `COMPANY_MAILING_ADDRESS` nothing is sent.**
- **Preview:** `GET /api/cron/nurture?dryRun=1` (with `CRON_SECRET`) lists what would go out, with subjects and word counts, without sending or writing.
