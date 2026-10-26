# Alphaa: every email the product sends (current as of 2026-10-26)

Source: `/Users/varunsharma/alphaa`. This reflects the owner-approved rewrite (`Alphaa_Email_Rewrites.md`) as implemented on 2026-10-26. 29 emails in total (26 live, 1 dead template, 2 internal).

Notation: `[X / Y]` means X when it's known, otherwise Y. With no first name, greetings read "Hi," (never "Hi there"). Every fallback was render-checked with all optional data missing.

## Senders (applies to everything below)

One helper decides the sender: `src/lib/email-sender.ts`. The address is `RESEND_FROM_EMAIL`, falling back to `hi@alphaa.app` if it is unset (never `<undefined>`). The support address everywhere is **hi@alphaa.app**.

| Helper | From line the recipient sees | Reply-To | Used by |
|---|---|---|---|
| `src/lib/email.ts` | `Alphaa AI Agent <RESEND_FROM_EMAIL>` | hi@alphaa.app | Welcome, Connect-Google nudges, Week-one recap, Win, Payment failed, Google reconnect, Scan report, Email-me-this-report, Trial ending (dead) |
| `src/lib/marketing-email.ts` | `Alphaa AI Agent <RESEND_FROM_EMAIL>`, plus footer and one-click `List-Unsubscribe` | hi@alphaa.app | Nurture series, abandoned checkout, **weekly report** |
| `src/lib/resend.ts` (`sendEmail`) | `Alphaa AI Agent <RESEND_FROM_EMAIL>` | hi@alphaa.app | Weekly report fallback when no unsubscribe link can be signed |
| `src/lib/connector/mail.ts` (`sendAs`) | `<per-email name> <RESEND_FROM_EMAIL>` | set per email | Guarantee credit ("Alphaa AI Agent", reply-to hi@), web-person handoff ("[Business / Our business] via Alphaa", reply-to owner), review request ("[Business]", reply-to owner) |
| inline `resend.emails.send` | `Alphaa <RESEND_FROM_EMAIL>` | none | Internal concierge emails |

Sign-offs: account emails end "— Your AI Agent"; lead emails (scan report, nurture, abandoned checkout) end "— Alphaa".

---

## 1) Welcome & onboarding

### 1.1 Welcome email
- **When:** Clerk webhook `user.created`, immediately at sign-up (before payment and onboarding). `src/app/api/webhooks/clerk/route.ts`.
- **Subject:** `I am ready to work for [Business name / you].`
- **Preview:** Your agent is live. Here is what I am starting on today.
- **Body** (`src/emails/WelcomeEmail.tsx`):
  - Hi [First name],
  - Your agent is live.
  - My only job is to get [Business name / your business] recommended when your customers ask ChatGPT, Gemini, Claude, and Perplexity who to hire.
  - Here is what I am starting on today:
    - **Checking your baseline:** Asking all 4 AIs what they say about you now.
    - **Fixing your facts:** Writing the verified details AI engines look for before they recommend you.
    - **Connecting to Google:** Preparing your Google Business Profile for weekly updates.
  - I don't use a complicated dashboard. When I draft an update or finish a report, I send it straight to you. You just tap approve.
  - I'll reach out when your first visibility report is ready.
  - — Your AI Agent
  - Small print: $99/mo · No contract · Cancel anytime in Settings
  - Footer: Alphaa · AI Search Visibility for Local Businesses · Privacy · Terms · Unsubscribe (`/dashboard/settings`)
- **Variables:** [First name] = Clerk `first_name`. [Business name] = the business from the newest free scan run with the same email (name, else the site's domain); onboarding hasn't happened yet, so with no prior scan it falls back to "your business" (subject: "you").

---

## 2) Lifecycle (`/api/cron/lifecycle`, daily 14:00 UTC)

Onboarded users created 1-10 days ago, at most one email per user per day, deduped via the activity ledger.

### 2.1 Connect-Google nudge #1 (Day 1-3, not connected)
- **Subject:** I am paused. Please connect your Google account.
- **Preview:** Connecting takes about 30 seconds. You sign in with Google once, and I handle the rest.
- **Body** (`src/emails/ConnectGoogleNudgeEmail.tsx`):
  - Hi [First name],
  - I am set up for [Business name / your business], but my autopilot is paused.
  - Until I am connected to your Google account, I cannot publish updates to your Business Profile, check your reviews, or track your visibility.
  - Connecting takes about 30 seconds. You sign in with Google once, and I handle the rest.
  - **Button:** Connect Google (30 seconds) → `/dashboard/settings/integrations`
  - I use read-only access wherever possible, and you can disconnect anytime in Settings.
  - — Your AI Agent

### 2.2 Connect-Google nudge #2 (Day 4-6, still not connected)
- **Subject:** Reminder: I am still paused.
- **Preview:** I am still waiting on a connection to your Google account.
- **Body:** Hi [First name], / A quick reminder that I am still waiting on a connection to your Google account. / I cannot publish updates or track your visibility until this is connected. It takes 30 seconds, and you can disconnect at any time. / **Button:** Connect Google (30 seconds) → / — Your AI Agent

### 2.3 Week-one recap (Day 7-10, Google connected)
- **Subject:** Your first week on autopilot.
- **Preview:** Here is what I actually did in your first week, and what I am doing next.
- **Body** (`src/emails/WeekOneRecapEmail.tsx`, counts from the activity ledger, last 7 days):
  - Hi [First name],
  - I have been running [Business name / your business] on autopilot for a week.
  - Here is what I actually did: (each line only when its count is real and non-zero)
    - ✓ Published [N] post(s) to your Google Business Profile. (`gbp_post`)
    - ✓ Found your top local competitors for AI tracking. (`competitors`)
    - ✓ Tracked [N] new review(s). (`reviews`)
    - ✓ Found new questions to answer in your content plan. (`content_gaps`)
  - With no activity, the list is replaced by "My first automated runs are still warming up."
  - CURRENT AI VISIBILITY SCORE: [score]/100 (only when an audit exists)
  - Here is what I am doing next week:
    - Checking ChatGPT, Gemini, Claude, and Perplexity for changes.
    - Publishing to Google on Monday and Thursday. (only when a Business Profile location is connected)
    - Sending your weekly report. (only for active/trialing Stripe subscribers, the weekly cron's filter)
  - **Button:** See the details in your dashboard → `/dashboard`
  - — Your AI Agent

### 2.4 Win alert
- **When:** after a dashboard visibility audit, if an engine newly named the business or the score rose 5+ points. Max 1 per user per 7 days (`src/lib/wins.ts`).
- **Subject:** engine win `🎉 [Engine] just recommended [Business name / you].`; score-only win `🎉 Your AI visibility score rose from [old] to [new].`
- **Body** (`src/emails/WinEmail.tsx`):
  - Hi [First name], / Good news.
  - (engine win) A customer asking [Engine] about businesses like yours[ in City] now sees you in the answer.
  - (score-only win) Your AI visibility score rose from [old] to [new].
  - I measured this on your latest visibility scan, on [scan date]. This is a real answer from a live AI engine, not an estimate. (score-only: "This is a real measurement, not an estimate.")
  - (engine win that also had a score jump) Your AI visibility score also rose from [old] to [new] on that scan.
  - **Button:** See the exact answer in your dashboard → `/dashboard` (score-only: "See it in your dashboard →")
  - I will keep checking all four AIs every week and tell you the moment your name comes up again.
  - — Your AI Agent
- **Date:** the audit's `createdAt` (the scan date), not the send date.

---

## 3) Scan-lead nurture series (`/api/cron/nurture`, daily 16:00 UTC)

- **Who / rules:** unchanged. Leads after the 2026-10-04 consent cutoff whose Day-0 report went out; stops on unsubscribe, conversion or an account. Days 1-4 daily, then 11/18/25/32/39/46/53, Day 60 is the last. Needs `COMPANY_MAILING_ADDRESS` + `RESEND_API_KEY` + `RESEND_FROM_EMAIL`.
- **Format** (`src/emails/NurtureEmail.tsx`): plain text style, no logo, one underlined link, sign-off "— Alphaa", footer (reason, Alphaa · address, Unsubscribe).
- **Copy:** `src/lib/nurture.ts`.
- **Links:** Start today → `/signup?scan=[id]`; See your full report → tokenised report URL; Re-check your business / Run the free check → `/start`.
- **Variables:** [Business] = business name, else domain; fallbacks "you" / "your website". [City] dropped when empty or "your area". [Named line] counts only engines that actually answered, e.g. "1 of the 3 AIs I could reach named you (ChatGPT)"; if none answered, the sentence becomes "I checked what the AIs say about [Business / your website]."

| Day | Subject | Body (summary of the exact copy) | CTA |
|---|---|---|---|
| 1 | Why AI picked [Rival 1 / them] instead of you. | When I checked [Business / your website], [named line]. When people ask ChatGPT or Gemini who to hire[ in City], they get one answer with a few names. The names I saw most were [Rival 1] and [Rival 2] (if any). When I compared your website with theirs, here is why AI likely skipped you: [up to 3 gaps] (if any). AI names businesses it can verify. It looks for clear answers, identical hours everywhere, and code it can read. None of this is hard. It just has to be done. | See your full report |
| 2 (draft exists) | I already drafted your first fix. | I already drafted a fix for [Business / your website]. It answers a question your customers ask, written so AI can quote it easily: "[question] [answer]". Anything in brackets is a fact only you know, so I left it for you. I never guess. Once you start, I keep writing these. I add the code AI reads, and you approve each one before it goes live. | Start today |
| 2 (no draft) | What I'd write first for [Business / you]. | Here is what I'd draft first for [Business / your website]. An FAQ that answers the questions your customers ask AI[ in City]... Then the code AI reads... I never guess facts... You approve each piece before it goes live. | Start today |
| 3 | Can anyone guarantee ChatGPT? | Short answer: no. Nobody controls what ChatGPT says... What can be done is fixing the facts AI reads about you, then checking every week... If none of the 4 major AIs names [Business / you] in our weekly checks during your first 90 days, your next month is free. Once per customer. | Start today |
| 4 | What $99 a month does for [Business / you]. | Customers ask AI who to hire. Here is what I do every week so you are in the answer: ask the 4 AIs about you; tell you exactly what changed; draft the answers AI needs to read; keep your Google profile active. That is $99 a month. Month to month. Cancel in two clicks. An agency is often $2,000 a month, and most still focus on Google links. I focus entirely on AI answers. | Start today |
| 11 | AI answers change. Has yours? | It has been over a week since I checked [Business / your website]. Back then, [named line]. AI answers shift... The only way to know is to ask again. It takes about a minute, and it is free. | Re-check your business |
| 18 | 3 things AI checks before it names a business. | Before ChatGPT or Perplexity names a business... 1. Clear answers to customer questions. 2. The exact same hours and address everywhere. 3. Reviews it can actually read. If [Business / you] is missing one, that is where I start. Once you hire me, I work on this every week... | Start today |
| 25 | Ask ChatGPT why it picked them. | Here is a test you can run yourself today. Ask ChatGPT for a business like yours[ in City]. Then ask it: "Why did you recommend them and not us?" It will often tell you... Write down what it says. That is your to-do list. Or, you can have me do it for you. | Run the free check to see all four AIs at once |
| 32 | When AI gets your hours wrong. | Here is how this can happen. Someone asks ChatGPT if a business is open on Saturday... AI repeats what it finds... The fix is putting the exact same facts on your website and Google profile, plus adding the specific code AI engines read. Once you start, I check these facts every week and fix what is wrong. | Start today |
| 39 | Reviews AI can actually read. | Reviews help you get recommended, but only the ones AI can find. What counts: recent reviews; reviews that name the specific service provided; your replies to the customer. A simple habit: after a great job, ask the customer to mention exactly what you fixed... Want to see what the AIs say about you today? | Re-check your business |
| 46 | One page per service. | When a customer asks AI for a specific service... Each service needs its own page... Once you start, I draft these pages for [Business / you]. You tap approve, and I publish them. | Start today |
| 53 | Put the answer in the first sentence. | One small writing change makes it easier for AI to quote you: put the answer first... AI skips paragraphs of background... Want to see if this changed your AI visibility today? | Re-check your business |
| 60 | Should I stop checking? | I have written a few times since I first checked your AI visibility. I do not want to be noise. This is my last email. If you want me working on getting you recommended by AI, start today. I saved your scan, so we can pick up right where we left off. If the timing is wrong, just reply "later." A real person reads every reply. | Start today |

---

## 4) Billing / transactional

### 4.1 Payment failed
- **When:** Stripe `invoice.payment_failed`, every failed attempt. `src/app/api/webhooks/stripe/route.ts`.
- **Subject:** Action required: Your payment failed.
- **Body** (`src/emails/PaymentFailureEmail.tsx`): ⚠ PAYMENT FAILED banner / Hi [First name], / Your subscription payment of **[$amount]** for **[Business name / your business]** was declined. / I am still working, but I will try the charge again on **[retry date]** ("again soon" when Stripe gives no date). / If the next attempt fails, your account will be paused. Please update your payment method to keep your AI visibility tracking active. / **Button:** Update payment method → `/dashboard/settings/billing` / — Your AI Agent
- **Variables:** business is `user.businessName` (no longer the person's name).

### 4.2 Abandoned checkout
- **When:** Stripe `checkout.session.expired` (subscription mode), once per account ever. `src/lib/abandoned-checkout.ts`.
- **Subject:** You were one step away.
- **Body** (plain nurture template): You started checkout for [Business name / your business] but did not finish. You were not charged. / If it helps you decide, here is what protects you when you start: A 7-day refund on your first charge, no questions asked · Our 90-day AI Visibility Guarantee (if none of the 4 major AIs names you in our weekly checks in your first 90 days, your next month is free) · No contracts. Cancel in two clicks. / If something broke during checkout, just reply and tell me. / Pick up where you left off → `/onboarding` / — Alphaa

### 4.3 Guarantee credit
- **When:** `/api/cron/guarantee`, once per Stripe customer 90-150 days in with no AI naming them; a one-month Stripe credit is applied at the same time. Shopify-billed users never get it. `src/lib/guarantee.ts`.
- **From:** Alphaa AI Agent, reply-to hi@alphaa.app. **Subject:** Your next month is free.
- **Body:** Hi [First name], / In your first 90 days, none of the 4 major AIs named [Business name / your business] during my weekly checks. / That is exactly what our guarantee covers. I have applied a **[$amount] credit** to your account. Your next month is free, and there is nothing you need to do. / I am still working on this every week, and I will alert you the moment your name comes up. / — Your AI Agent

### 4.4 Trial ending (DEAD, never sent)
- `sendTrialEndingEmail` / `src/emails/TrialEndingEmail.tsx` have no caller. Left unchanged on purpose.

---

## 5) Reports

### 5.1 Scan report ready (Day 0, automatic)
- **When:** the public scan finishes and an email is known (`src/lib/scan-email.ts`, from `/api/scan` and `/api/scan/claim`).
- **Subject:** Your AI visibility score is [score]/100.
- **Preview:** [found] of the 4 AIs I checked named [Business / you]. (or "...of the [N] AIs that answered...")
- **Body** (`src/emails/AuditResultsEmail.tsx`, variant "ready"):
  - Here is your free AI visibility scan.
  - I checked what ChatGPT, Gemini, Claude, and Perplexity say about [Business / you][ in City].
  - (if any engine didn't answer) [Engines] didn't answer this time, so I left [it/them] out of the count.
  - VISIBILITY SCORE: [score]/100 · ENGINES THAT NAMED YOU: [found]/[engines that answered] (with "of the N that answered" when fewer than 4)
  - **Button:** View your full report → tokenised `/scan/results?id=…&t=…` / "This unique link shows exactly what the AI assistants said."
  - **Let me fix it.** I am an AI agent. I write the facts AI needs to read, update your Google profile, and check your visibility every week. You just tap approve.
  - **Button:** Hire your AI Agent → `/signup?scan=[id]` (carries the scan into signup/onboarding)
  - Month to month. Cancel in two clicks.
  - — Alphaa
  - Footer: Privacy · Terms / results-vary disclaimer; "not affiliated with OpenAI, Google, Anthropic, or Perplexity."
- **Unknown ≠ missing:** engine verdicts come from `src/lib/scan-engines.ts`. On current rows an engine counts only if it has an answer in `engineResponses`; an engine that errored, timed out or isn't configured is "didn't answer", never "not named".

### 5.2 "Email me this report"
- **When:** the button on `/scan/results` → `/api/scan/email-report`, once per scan, to the address the scan was run with.
- **Subject:** Your AI visibility score is [score]/100.
- **Body** (variant "requested"): Here is the AI visibility scan you requested[ for Business]. / (didn't-answer line if needed) / score card / **WHAT EACH AI SAID**: ✓ [Engine] "[first 160 chars of its answer]" · ✗ [Engine] Didn't name you in its answer. · – [Engine] Didn't answer this time. / **Button:** View your full report → (tokenised link, now included) / **Let me fix it.** I am an AI agent that does the work to get you recommended. I write the answers, update your profile, and check your visibility weekly. / **Button:** Hire your AI Agent → `/signup?scan=[id]` / — Alphaa

### 5.3 Weekly report
- **When:** `/api/cron/weekly`, Mondays 13:00 UTC, active/trialing users with a `stripeSubscriptionId`. Skipped (report still saved to the dashboard) if the address has unsubscribed.
- **From:** Alphaa AI Agent via `sendMarketingEmail`, with one-click `List-Unsubscribe` headers.
- **Subject:** `Your weekly report for [Business name].` ("Your weekly report." when unknown)
- **Body** (`src/emails/WeeklyReportEmail.tsx`):
  - Header: ✦ alphaa / Weekly report · [date]
  - Hi [First name], / Here is my weekly report for [Business name / you].
  - (if measurable) "Your results this week" box from `src/lib/roi.ts` (AI visitors, Google listing calls/directions, AI answers naming you, website visits). Wrong-fact line now reads "[N] AI answer(s) get a fact about you wrong." (no "flagged below").
  - Weekly note written by Claude from real counts (unchanged prompt).
  - **This week's work:** [N] posts published. · [N] new reviews found. · [N] visibility changes tracked.
  - AI VISIBILITY CHANGES: ChatGPT / Gemini / Claude / Perplexity, each "Started naming you", "Stopped naming you" or "No change".
  - The Google keyword-position table was removed from the email (still stored on the report).
  - **Button:** View Full Report in Dashboard → `/dashboard/t/briefings`
  - — Your AI Agent
  - Footer: You're receiving this because you have an active Alphaa subscription. / Alphaa · [mailing address] / Unsubscribe (signed link; the /unsubscribe page says it also stops weekly report emails)

---

## 6) Connector / other

### 6.1 Google reconnect
- **When:** a Google sync hits 401/`invalid_grant`, at most once per 72 hours (`src/app/api/integrations/sync/route.ts`).
- **Subject:** I lost access to your Google account.
- **Body** (`src/emails/ReconnectEmail.tsx`): ⚠ AUTOPILOT PAUSED banner / Hi [First name], / Google disconnected me from **[Business name / your business]**. This usually happens when a password or security setting changes. / My autopilot is paused. I cannot publish posts, track rankings, or monitor reviews until you reconnect. / Reconnecting takes 30 seconds, and I will pick up right where I left off. / **Button:** Reconnect Google → `/dashboard/settings/integrations` / — Your AI Agent

### 6.2 "Email it to my web person"
- **When:** owner taps "email it to my web person" (`src/app/api/agent/handoff/route.ts`), max 20/day.
- **From:** `[Business / Our business] via Alphaa`, reply-to the owner.
- **Subject:** `[Business / Our business]: Website update request.` (one subject for all 8 update types)
- **Body** (`src/lib/connector/handoff.ts`): Hi, / [Owner name] asked us to send you a quick website update for [Business / our website]. It is ready to paste and should only take a few minutes. (no owner name: "Here is a quick website update for [Business / our website]. ...") / **What it is** / **Why it matters** / **Where it goes** / code box / **To check it:** [check] / If you have any questions, just reply to this email. Your reply goes straight to [Owner name / the owner]. / Thank you, Alphaa (on behalf of [Business / our business])

### 6.3 Review request
- **When:** owner adds a customer + consent in the agent UI (`src/app/api/agent/review-request/route.ts`). Max 50/day, never the same person twice in 90 days. Phone numbers get a pre-written text instead.
- **From:** `[Business]` (no business name: the owner's name), reply-to the owner. **Subject:** How did we do?
- **Body:** Hi [Customer first name], / Thanks for choosing [Business / us]. / If you have a minute, would you mind leaving us a quick review on Google? Mentioning the specific service we provided really helps other people nearby find us. / **Button:** Leave a review → / Thank you, [Owner full name / Business] / Footer: one-time note, reply reaches them directly, Sent with Alphaa.

---

## 7) Internal (to hi@alphaa.app)

### 7.1 Concierge intake
- **Subject:** `🛠 Concierge Intake — [Business or Email] ([Setup | Full Service])`
- **Body:** New "Do it for me" request received. / Business / Email / Website / Platform / Service: Setup ($149 one-time) or Full Service ($299/mo) / Notes / Waiting on Stripe confirmation.

### 7.2 Setup PAID
- **Subject:** `💰 Setup PAID — [Business or Email]`
- **Body:** [Business] ([Email]) paid the setup fee. / SLA: Install and verify within 2 business days. / Website: [URL] / Intake details: the "concierge_request" activity for the user.
