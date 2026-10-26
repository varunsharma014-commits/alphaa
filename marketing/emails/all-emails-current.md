# Alphaa: every email the product sends

Source: `/Users/varunsharma/alphaa` (read-only audit, 2026-10-26). 29 emails in total (26 live, 1 dead template, 2 internal).

## Senders (applies to everything below)

The sender depends on which helper sends the email. `RESEND_FROM_EMAIL` is `hello@alphaa.app` in local `.env`/`.env.local`. `marketing/email-flows.md` says prod uses `ai-agent@alphaa.app`. I can't read Railway, so check the live value there.

| Helper | From line the recipient sees | Used by |
|---|---|---|
| `src/lib/email.ts:14-17` | **The bare address only, with no display name**: `RESEND_FROM_EMAIL`, falling back to `hello@alphaa.app`. No reply-to. | Welcome, Connect-Google nudges, Week-one recap, Win, Payment failed, Google reconnect, Scan report, Email-me-this-report, Trial ending (dead) |
| `src/lib/resend.ts:16` | `Alphaa <RESEND_FROM_EMAIL>`, with no fallback (it would render `Alphaa <undefined>`) | Weekly report |
| `src/lib/marketing-email.ts:27-29` | `Alphaa <RESEND_FROM_EMAIL>`, Reply-To `hi@alphaa.app`, one-click List-Unsubscribe header. Sends nothing if `RESEND_FROM_EMAIL` is unset. | Nurture series, abandoned checkout |
| `src/lib/connector/mail.ts:6,23` | `<fromName> <RESEND_FROM_EMAIL or hello@alphaa.app>`, reply-to set per email | Guarantee credit, web-person handoff, review request |
| inline `resend.emails.send` | `Alphaa <RESEND_FROM_EMAIL>` | Internal concierge emails |

Unless noted, "Alphaa logo" below means the text logo `✦ alphaa` at the top of the card.

---

## 1) Welcome & onboarding

### 1.1 Welcome email
- **When:** The Clerk webhook `user.created` fires on sign-up, immediately. That is **before any payment**, so everyone who creates an account gets it, including people who never pay. Source: `src/app/api/webhooks/clerk/route.ts:23-39`.
- **Live:** Yes, whenever `RESEND_API_KEY` is set.
- **From:** bare `RESEND_FROM_EMAIL` (see table).
- **Subject:** `Welcome to Alphaa, [First name] — your AI visibility starts now` (`src/lib/email.ts:27`)
- **Preview:** Welcome to Alphaa — your AI visibility starts now
- **Body** (`src/emails/WelcomeEmail.tsx:17-66`):
  - Logo: ✦ alphaa
  - **H1:** You're in, [First name].
  - Your agent is set up for **[Business name]**. Its job: get you recommended when people ask ChatGPT, Gemini, Claude and Perplexity.
  - Here's what it works on first:
    - ✓ AI citation profile — structured data every AI engine pulls from
    - ✓ First weekly content post to Google Business Profile
    - ✓ Asks all 4 AI assistants about you — and tells you who they named
    - ✓ Keyword tracking for your business category + city
  - **Button:** "Go to your dashboard →" links to `/dashboard`
  - Small print: $99 a month, month to month. Cancel anytime in Billing — no contract, no exit fees.
  - Questions? Reply to this email or email us at support@alphaa.app
  - Footer: Alphaa · AI Search Visibility for Local Businesses · Privacy · Terms · Unsubscribe (the Unsubscribe link goes to `/dashboard/settings`)
- **Variables / fallbacks:**
  - [First name]: Clerk `first_name`, falling back to **"there"**. That produces "Welcome to Alphaa, there —" and "You're in, there." Both read badly.
  - [Business name]: **always hard-coded to "your business"** (`clerk/route.ts:34`), because the business isn't known at sign-up. So every recipient reads "Your agent is set up for **your business**." This is a bug, not a fallback.
- **Notes:** "Reply to this email" goes nowhere useful, since no reply-to is set and the from address is a bare no-name address. support@alphaa.app differs from the support address used everywhere else (hi@alphaa.app). "First weekly content post to Google Business Profile" and "Keyword tracking" only happen after the customer connects Google. The email ships before the user has paid or onboarded.

---

## 2) Lifecycle (signed-up / paying users)

All three lifecycle emails come from `/api/cron/lifecycle`, which runs daily at 14:00 UTC (`src/lib/cron-scheduler.ts:46`). It only covers users with `onboardingCompleted = true` created 1-10 days ago, sends at most one email per user per day, and dedupes through the activity ledger (`src/app/api/cron/lifecycle/route.ts`). The users don't have to be paying; finishing onboarding is enough. These emails need `RESEND_API_KEY` set.

### 2.1 Connect-Google nudge #1 (Day 1-3)
- **When:** onboarded, no Google connection (GSC, GBP or GA), and account 1-3 days old (`lifecycle/route.ts:73`).
- **From:** bare `RESEND_FROM_EMAIL`.
- **Subject:** `alphaa is ready — one click to switch it on` (`src/lib/email.ts:61`)
- **Preview:** alphaa is ready — one click to switch it on
- **Body** (`src/emails/ConnectGoogleNudgeEmail.tsx:~18-74`):
  - **H1:** alphaa is ready, [First name] — one click to switch it on.
  - Your account for **[Business name]** is set up, but autopilot is still waiting on one thing: a connection to your Google account. Until it's connected, alphaa can't post to your Google Business Profile or track where you rank.
  - Grey box:
    - ○ Google Business Profile posting — waiting
    - ○ Google ranking tracking — waiting
    - ○ Review monitoring — waiting
  - Connecting takes about 30 seconds — one click, sign in with Google, done. Everything switches on from there, automatically.
  - **Button:** "Connect Google (30 seconds) →" links to `/dashboard/settings/integrations`
  - We use read-only access wherever possible, and you can disconnect anytime from Settings.
  - Stuck or have questions? Just reply to this email and we'll walk you through it.
  - Footer: You're receiving this because you have an alphaa account. Manage emails in Settings. · Manage preferences (`/dashboard/settings`) · Privacy
- **Variables:** [First name] is the first word of `fullName`; when it's missing, the ", Name" is dropped (this reads fine). [Business name] is `user.businessName`, falling back to "your business" ("Your account for **your business**").
- **Notes:** "Just reply" goes nowhere useful (no reply-to). "One click, 30 seconds" undersells the flow: after OAuth the user also has to pick GA/GSC/GBP properties. "Read-only access wherever possible" is a claim worth checking against the OAuth scopes, since GBP posting needs write access.

### 2.2 Connect-Google nudge #2 (Day 4-6)
- **When:** still not connected, account 4-6 days old (`lifecycle/route.ts:74`).
- Same template, subject, preview and body as 2.1, except the **H1** becomes: **"Quick reminder — alphaa is ready, [First name] — one click to switch it on."** That puts two em-dashes in one heading, which reads clumsily.

### 2.3 Week-one recap (Day 7-10)
- **When:** Google connected, account 7-10 days old (`lifecycle/route.ts:75,91-130`). It uses real counts from the activity ledger over the last 7 days.
- **From:** bare `RESEND_FROM_EMAIL`.
- **Subject:** `Your first week with alphaa — [Business name]` (`src/lib/email.ts:66`)
- **Preview:** Your first week with alphaa — here's what happened
- **Body** (`src/emails/WeekOneRecapEmail.tsx:~22-100`):
  - **H1:** One week in, [First name].
  - **If anything happened:** "**[Business name]** has been on autopilot for a week. Here's what alphaa actually did:", followed by only the lines that are true:
    - ✓ [N] Google post(s) published to your Business Profile
    - ✓ Keyword rank tracking switched on — your Google rankings are monitored daily
    - ✓ Local competitors found and added to your tracker
    - ✓ Content opportunities found — topic ideas waiting in your content plan
    - ✓ [N] new review alert(s) from your Google profile
  - **If nothing happened:** "**[Business name]** is connected and on autopilot. The first automated runs are still warming up, so here's what's scheduled next:"
  - Score box (only if an audit exists): CURRENT AI VISIBILITY SCORE: [score]/100
  - "And here's what stays on schedule:" (or "Coming up on the schedule:")
    - → Daily keyword + analytics sync from Google
    - → Google Business Profile posts every Monday and Thursday
    - → Competitor discovery and refresh every Sunday
    - → Your weekly report every Monday
  - **Button:** "See it all in your dashboard →" links to `/dashboard`
  - Questions about anything above? Just reply to this email.
  - Footer: same as 2.1.
- **Variables:** same fallbacks as 2.1.
- **Notes:** The email is SEO-centric ("keyword rank tracking", "analytics sync", "competitor discovery", "content opportunities") and doesn't mention AI answers or which AIs named them. "Google Business Profile posts every Monday and Thursday" only holds if GBP is connected and auto-posting is on.

### 2.4 Win alert
- **When:** After a dashboard visibility audit (the weekly `/api/cron/visibility-scan`, Wed 09:00 UTC, or a manual scan), if an AI newly named the business or the score rose 5 or more points. Capped at 1 per user per 7 days (`src/lib/wins.ts:90-120, 172-225`).
- **From:** bare `RESEND_FROM_EMAIL`.
- **Subject:** `🎉 [Headline]` (`src/lib/email.ts:71`). The headline is either `[Engine] now mentions [Business name]` or `Your visibility score jumped [old] → [new]`.
- **Preview:** [Headline] — measured on your latest alphaa visibility scan
- **Body** (`src/emails/WinEmail.tsx:~25-80`):
  - Banner: 🎉 NEW WIN — MEASURED ON YOUR LATEST SCAN
  - **H1:** [Headline], [First name].
  - Detail paragraph:
    - Engine win: "A customer asking [Engine] about [business type] in [City] now sees YOUR business. alphaa measured this on your latest visibility scan — real answer data, not a projection."
    - Score win: "Your AI visibility score rose from [old] to [new] between your last two scans — measured by alphaa, not estimated."
  - Box:
    - ✓ Found on alphaa's latest scan of [Business name]
    - ✓ Verified [today's date]
    - ✓ Real scan data — not a projection or an estimate
  - **Button:** "See it on your dashboard →" links to `/dashboard`
  - Worth showing off? There's a public page for this win you can post anywhere: [alphaa.app/w/id]
  - Know another owner who'd want to know what AI says about them? Send them alphaa.app/start (`/start?utm_source=email&utm_medium=win&utm_campaign=referral`). If you refer businesses often, our partner program (`/refer`) pays 30% recurring.
  - alphaa keeps checking your AI visibility every week. When the next win lands, you'll see it here and on your dashboard.
  - Footer: Manage preferences · Privacy
- **Variables / fallbacks:** [Business name] falls back to "your business", giving the subject "🎉 ChatGPT now mentions your business". [business type] falls back to "businesses like yours". [City] is dropped if missing. With a first name, the H1 can read "Your visibility score jumped 40 → 52, Sarah." which is awkward.
- **Notes:** "Now sees YOUR business" overclaims, because a single scan appearance doesn't mean every customer asking sees it. "Verified [date]" uses the send date, not the scan date.

---

## 3) Scan-lead nurture series (in send order)

- **Who:** people who ran the free public scan, gave an email and haven't bought. Day 0 is the scan-report email (5.1).
- **Trigger:** `/api/cron/nurture`, daily at 16:00 UTC (`src/lib/cron-scheduler.ts:66`, `src/app/api/cron/nurture/route.ts`).
- **Eligibility:** leads created after 2026-10-04 16:00 UTC (the consent cutoff), whose Day-0 report actually went out. Sending stops for good on unsubscribe, conversion, or an account existing with that email. One sequence per address, max one email per 20 hours.
- **Live?** Only if `COMPANY_MAILING_ADDRESS` is set **and** `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set (`nurture/route.ts:57-65`). With no address it sends nothing. Check Railway.
- **From:** `Alphaa <RESEND_FROM_EMAIL>`, Reply-To `hi@alphaa.app`.
- **Template** (`src/emails/NurtureEmail.tsx:29-67`): plain text-style email with no logo and no button. Body blocks are followed by a single underlined link "[CTA] →", then the sign-off "Alphaa". Footer: "You're getting this because you ran a free AI check at alphaa.app." / "Alphaa · [mailing address]" / "Unsubscribe" (signed link).
- **Copy:** all in `src/lib/nurture.ts:173-402`, in the agent's first-person voice.
- **Links (with UTM):**
  - "Start today" goes to `/signup?scan=[id]`
  - "See your full report" goes to the tokenised report URL
  - "Re-check [Business]" and "Run the free check" go to `/start`
- **Variables** (`extractLeadFacts`, `nurture.ts:63-145`):
  - [Business]: the business name, else the site's domain (e.g. "brightsmile.com"), else "your business".
  - [City]: dropped when empty or "your area".
  - [Rivals]: up to 2 competitors the AIs named.
  - [Gaps]: up to 3 site checks the lead fails and a rival passes.
  - [Named line]: e.g. "none of the 4 AIs named you" / "2 of the 4 AIs named you (ChatGPT and Gemini)"; when fewer than 4 AIs answered, "the 3 AIs I could reach".

### Day 1: Why AI named a rival (`nurture.ts:184-202`)
- **Subject:** `Why AI named [Rival 1] instead`. With no rivals: `Why AI picks other businesses over [Business]` ("…over yours" if generic).
- **Preview:** `What they have that [Business] doesn't, yet.` With no rivals: "What AI looks for before it names a business."
- **Body:**
  - When I checked [Business], [named line]. (If no engine answered: "I checked what the AIs say about [Business].")
  - People ask ChatGPT, Gemini, Claude and Perplexity who to hire[ in City]. They get one answer with a few names.
  - (if rivals) The names I saw most were [Rival 1] and [Rival 2].
  - (if gaps) When I compared your website with theirs, here is what stood out on yours:
    - [Gap 1], [Gap 2], [Gap 3], e.g. "No FAQ", "AI crawlers get turned away at the door", "No llms.txt", "Your page is blank until JavaScript runs; most AI readers don't run it"
  - (if no gaps) AI tends to name businesses it can verify. Clear answers to the questions customers ask. The same hours, address and services everywhere. Reviews it can read.
  - None of this is hard. It just has to be done, and kept up.
- **CTA:** See your full report → (tokenised report link)
- **Notes:** Gap labels come from `src/lib/site-check-labels.ts:35-59`, and some of them are jargon: "no llms.txt", "no structured facts", "your pages point search engines at a different page", "no sign you're set up with Bing".

### Day 2: The drafted fix (`nurture.ts:204-230`)
- **Variant A (a quick-fix FAQ draft exists):**
  - **Subject:** I already drafted your fix
  - **Preview:** A ready answer for "[Draft question]"
  - **Body:**
    - I already drafted a fix for [Business].
    - It answers a question your customers ask, written so AI can quote it:
    - > [Draft question] [Draft answer, up to ~320 chars]
    - Anything in [brackets] is a fact only you know, so I left it for you. I never guess.
    - Once you start, I keep writing these, add the code AI reads, and you approve each one before it goes live.
  - **CTA:** Start today → (`/signup?scan=…`)
- **Variant B (no draft):**
  - **Subject:** `What I'd write first for [Business]`
  - **Preview:** A plain FAQ, written so AI can quote it.
  - **Body:**
    - Here is what I'd draft first for [Business].
    - An FAQ that answers the questions your customers ask AI[ in City]. The answer comes in the first sentence, in plain words.
    - Then the behind-the-scenes code that tells AI your hours, address and services.
    - I don't guess facts. Anything only you know, I ask you for. You approve every piece before it goes live.
  - **CTA:** Start today →
- **Notes:** Variant B with a domain name as the business reads "What I'd write first for brightsmile.com". "Add the code AI reads" needs the customer to install it or connect WordPress; the email doesn't say so.

### Day 3: The guarantee (`nurture.ts:232-243`)
- **Subject:** Can anyone guarantee ChatGPT?
- **Preview:** Short answer: no. Here's what I put in writing instead.
- **Body:**
  - Short answer: no. Nobody controls what ChatGPT says. Anyone who promises you a top spot is guessing.
  - What can be done is fixing what AI reads about you, then checking every week to see if it worked.
  - So here is what I put in writing. If none of the 4 AIs names [Business] in our weekly checks during your first 90 days, your next month is free. Once per customer.
  - And there's a 7-day refund on your first charge if it isn't for you.
- **CTA:** Start today →
- **Notes:** The guarantee is **not available to Shopify-billed customers** (`src/lib/guarantee.ts:20`), and the email doesn't say so. Check that the 7-day refund is actually honoured and written in the Terms.

### Day 4: The $99 offer (`nurture.ts:245-264`)
- **Subject:** `What $99 a month does for [Business]`
- **Preview:** `What I'd do for [Business] every week.`
- **Body:**
  - Customers ask AI who to hire. Here is what I'd do every week so [Business] is in the answer:
    - Ask ChatGPT, Gemini, Claude and Perplexity about you, and tell you what changed
    - Publish 2 Google posts a week
    - Write 2 blog posts a month that AI can quote
    - Watch your reviews
  - That's Starter, $99 a month. Month to month. Cancel in two clicks. 7-day refund on the first charge.
  - For comparison, an agency is often around $2,000 a month, and most still work on Google links, not AI answers.
- **CTA:** Start today →
- **Notes:** "Publish 2 Google posts a week" needs GBP connected. The blog posts are drafts for the owner to approve, not published. "$2,000" is an unsourced claim. "Cancel in two clicks" is worth checking.

### Day 11: Re-check (`nurture.ts:268-280`)
- **Subject:** AI answers change. Has yours?
- **Preview:** `It's been over a week since I checked [Business].`
- **Body:**
  - It's been over a week since I checked [Business].
  - (if checked) Back then, [named line].
  - AI answers aren't fixed. They shift as businesses publish, collect reviews and update their details. Last week's answer can be different today.
  - The only way to know is to ask again. It takes about a minute and it's free.
  - You'll see the actual answer each AI gives, not a summary.
- **CTA:** `Re-check [Business] →` ("Re-check your business" if generic), links to `/start`
- **Notes:** The preview duplicates the first line of the body.

### Day 18: 3 things AI checks (`nurture.ts:282-300`)
- **Subject:** 3 things AI checks before it names a business
- **Preview:** What AI looks for, in plain words.
- **Body:**
  - Before ChatGPT, Gemini, Claude or Perplexity names a local business, it looks for things it can trust. Three matter most:
    - Clear answers. A page that answers what customers ask, in the first sentence.
    - The same facts everywhere. Hours, address and services that match on your site, your Google profile and directories.
    - Reviews it can read. Recent ones, on sites AI can see.
  - If [Business] is missing one, that's usually where I'd start.
  - Once you start, I work on all three every week. You approve each change before it goes live.
- **CTA:** Start today →
- **Notes:** "I work on all three every week" overclaims: Alphaa doesn't fix directory listings, and it can only ask for reviews.

### Day 25: Ask ChatGPT why (`nurture.ts:302-316`)
- **Subject:** Ask ChatGPT why it picked them
- **Preview:** A two-minute test you can run yourself.
- **Body:**
  - Here's a quick test you can run yourself today.
  - Ask ChatGPT for a business like yours[ in City]. Then ask it: "Why did you recommend [Rival 1] and not us?"
  - It will often tell you. More reviews. A clearer list of services. An FAQ that answers the question. Hours it could confirm.
  - Write down what it says. That list is your to-do list.
  - Want the same answer from Gemini, Claude and Perplexity too? The free check asks all four at once and shows who they named.
- **CTA:** Run the free check → (`/start`)
- **Fallback:** With no rival, [Rival 1] becomes **"them"**, so the quote reads `"Why did you recommend them and not us?"`, which is odd to say to ChatGPT.

### Day 32: When AI gets your hours wrong (`nurture.ts:318-330`)
- **Subject:** When AI gets your hours wrong
- **Preview:** AI repeats what it finds. Here's an example.
- **Body:**
  - Here's an example of how this happens.
  - Someone asks ChatGPT if a dental office is open on Saturday. It says no. The office is open on Saturday, but an old directory listing still had the old hours, and that's what AI repeated.
  - AI repeats what it can find. Old hours, a closed location or a service you stopped offering can all end up in the answer.
  - The fix is simple: the same facts on your website, your Google profile and the main directories, plus code on your site that states them clearly.
  - Once you start, I check these facts for [Business] every week and fix what's wrong. You approve each change.
- **CTA:** Start today →
- **Notes:** The example is hypothetical but reads like a real case. "Fix what's wrong" on directories is an overclaim.

### Day 39: Reviews AI can read (`nurture.ts:332-352`)
- **Subject:** Reviews AI can actually read
- **Preview:** Not every review helps you get named.
- **Body:**
  - Reviews help a business get recommended, but only the ones AI can find and trust.
  - What tends to count:
    - Recent reviews, not only old ones
    - Reviews that name the service, like "fixed our AC the same day"
    - Your replies, which show the business is active
    - Reviews on more than one site
  - A simple habit: after a good job, ask the customer to mention what you did for them. Specific words give AI something to quote.
  - Want to see what the four AIs say about [Business / "you"] now? The check is free and takes about a minute.
- **CTA:** `Re-check [Business] →` (`/start`)
- **Notes:** "Ask the customer to mention what you did" sits close to review steering. Google's policy forbids soliciting specific content, so this is worth softening.

### Day 46: One page per service (`nurture.ts:354-373`)
- **Subject:** One page per service
- **Preview:** Why one long services list gets passed over.
- **Body:**
  - When a customer asks AI for a specific service, AI looks for a page about that service.
  - One services page listing ten things gives it little to quote. A page for each service gives it a clear answer.
  - Each page needs three things:
    - What the service is, in plain words
    - Who it's for and where you offer it[ in City]
    - Answers to the questions people ask before they book
  - Once you start, I draft these pages for [Business]. You approve each one before it goes live.
- **CTA:** Start today →

### Day 53: Answer first (`nurture.ts:375-387`)
- **Subject:** Put the answer in the first sentence
- **Preview:** One small writing change AI notices.
- **Body:**
  - One small writing change makes a page easier for AI to quote.
  - Put the answer first. If someone asks "Do you do same-day repairs?", start with "Yes, same day, Monday to Saturday." Then explain.
  - AI looks for short, direct answers. A paragraph of background before the answer makes it easy to skip.
  - Look at your FAQ or service pages this week. Does each answer start with the answer?
  - Want to see whether the AIs name [Business / "you"] today? The check is free and takes about a minute.
- **CTA:** `Re-check [Business] →` (`/start`)

### Day 60: Break-up, the last email (`nurture.ts:389-400`)
- **Subject:** `Should I stop checking for [Business]?`, or with a generic name **"Should I stop checking for you?"**
- **Preview:** This is my last email.
- **Body:**
  - I've written to you a few times since you checked [Business]. I don't want to be noise.
  - So this is my last email. After today I won't write again.
  - If you want me working on it, start today. Your check is saved, so I'll pick up where we left off.
  - If now isn't the right time, that's fine. Just reply "later" and tell me what would help. A person reads every reply.
- **CTA:** Start today →
- **Notes:** "Should I stop checking for [Business]?" implies Alphaa has been checking all along, but nothing has run since Day 0. "Your check is saved, so I'll pick up where we left off" is only true if `/signup?scan=` actually carries the scan into onboarding.

---

## 4) Billing / transactional

### 4.1 Payment failed
- **When:** Stripe `invoice.payment_failed` webhook, sent right away on every failed attempt (no dedupe). Source: `src/app/api/webhooks/stripe/route.ts:104-123`.
- **From:** bare `RESEND_FROM_EMAIL`.
- **Subject:** Action required: your Alphaa payment failed (`src/lib/email.ts:51`)
- **Preview:** Action required: payment failed for your Alphaa subscription
- **Body** (`src/emails/PaymentFailureEmail.tsx:~20-72`):
  - Red banner: ⚠ PAYMENT FAILED
  - **H1:** We couldn't process your payment, [First name].
  - Your subscription payment of **[$amount]** for **[Business name]** was declined. Your AI visibility service is still active, but we'll retry on **[retry date]**.
  - If the retry fails, your account will be paused and your AI citation profile will stop updating. Please update your payment method now to avoid any interruption.
  - **Button:** "Update payment method →" links to `/dashboard/settings/billing`
  - COMMON REASONS FOR FAILURE
    - • Card expired — update your card number and expiry date
    - • Insufficient funds — ensure your account has sufficient balance
    - • Bank blocked the charge — contact your bank to authorize recurring charges from Alphaa
    - • Card details changed — update your billing information
  - Need help? Reply to this email or contact us at support@alphaa.app. We're happy to assist.
  - Footer: Billing settings · Privacy
- **Variables / fallbacks:**
  - [First name]: `fullName.split(" ")[0] ?? "there"`. The fallback never actually triggers, because a null `fullName` makes the expression undefined, which renders as **"We couldn't process your payment, ."**
  - **[Business name] is wrongly fed `user.fullName`** (`stripe/route.ts:114`), so it reads "payment of $99.00 for **Sarah Jones**". It falls back to "your business".
  - [retry date]: when Stripe sends no next attempt, it becomes "soon", giving **"we'll retry on soon."**
- **Notes:** "AI citation profile" is jargon. "Your account will be paused" should be checked against what actually happens.

### 4.2 Abandoned checkout
- **When:** Stripe `checkout.session.expired` for a subscription checkout, at most once per account ever. Skipped if the user has since subscribed, unsubscribed, or is suppressed (`src/lib/abandoned-checkout.ts:15-83`, called from `stripe/route.ts:72-81`).
- **Live?** Only if `COMPANY_MAILING_ADDRESS` + `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set.
- **From:** `Alphaa <RESEND_FROM_EMAIL>`, Reply-To `hi@alphaa.app`. Plain nurture template.
- **Subject:** You were one step from starting
- **Preview:** No charge was made. Here's what protects you if you start.
- **Body:**
  - You started checkout[ for Business name] but didn't finish. No charge was made.
  - In case it helps you decide:
    - 7-day refund on your first charge, no questions asked.
    - 90-day AI Visibility Guarantee. If none of ChatGPT, Gemini, Claude or Perplexity names you in our weekly checks in your first 90 days, your next month is free. Once per customer.
    - Month to month. Cancel in two clicks.
  - If something went wrong at checkout, reply and tell me. A person reads every reply.
  - **CTA:** Pick up where you left off → `/onboarding?utm_…`
  - Sign-off: Alphaa
  - Footer: You're getting this because you started checkout at alphaa.app. / Alphaa · [address] / Unsubscribe
- **Fallback:** without a business name, " for X" is dropped (this reads fine).
- **Notes:** This email only goes out for subscription-mode checkouts. Abandoned $149 setup checkouts get nothing. Stripe sessions expire after 24 hours by default, so the email lands about a day after the person drops off.

### 4.3 Guarantee credit ("next month free")
- **When:** `/api/cron/guarantee`, daily at 15:00 UTC. Sent once per customer when they are 90-150 days into an active Stripe subscription and no AI named them in any weekly check. A Stripe credit of one month's price is applied at the same time (`src/lib/guarantee.ts:48-66`).
- **From:** `Alphaa <RESEND_FROM_EMAIL or hello@alphaa.app>`. No reply-to.
- **Subject:** Your next month of Alphaa is free
- **Body** (HTML in `guarantee.ts:60-63`):
  - Hi [First name],
  - In your first 90 days, none of the AI assistants named [Business name] in my weekly checks. That's what our guarantee covers, so I've applied a **$[amount] credit** — your next month is free. Nothing to do on your side.
  - I'm still working on it every week, and I'll tell you the moment one of them names you.
  - — Alphaa
  - Footer: Alphaa 90-day AI Visibility Guarantee.
  - No button.
- **Fallbacks:** without a first name it reads "Hi," (fine). [Business name] falls back to "your business".
- **Notes:** "I'll tell you the moment one of them names you" is only true while the Win email (2.4) is capped at one per week. Shopify-billed users never get this email.

### 4.4 Trial ending (DEAD, never sent)
- `sendTrialEndingEmail` in `src/lib/email.ts:41-47` and `src/emails/TrialEndingEmail.tsx` have **no caller anywhere**, and trials ended in 2026-09.
- **Subject:** `Last day: keep your AI visibility for [Business]` / `[N] days left on your Alphaa trial`
- **Body summary:** "⏰ [N DAYS LEFT] ON YOUR FREE TRIAL", then "Don't lose the progress you've built, [First name].", then a list of what you'll lose, including "Presence on [N] of **6** AI engines" (wrong: Alphaa checks 4), "Visibility score … reset to zero", "AI citation profile we built — unpublished". Button: "Upgrade now — from $99/mo →". Then "Extend your trial".
- **Recommendation:** delete the template. Its claims are false today.

---

## 5) Reports

### 5.1 Scan report ready (Day 0, automatic)
- **When:** The public scan finishes and an email is known. This happens either through the classic scan form (`src/app/api/scan/route.ts:328-331`) or when the `/start` conversation attaches an email afterwards (`src/app/api/scan/claim/route.ts:37`). The send is in `src/lib/scan-email.ts:9-50`. The results page is gated, so **this email is the only way into the report**. It is a transactional email with no unsubscribe footer.
- **From:** bare `RESEND_FROM_EMAIL`.
- **Subject:** `[Business]: AI visibility score [score]/100 ([found]/4 engines found you)` (`src/lib/email.ts:38`)
- **Preview:** `[Business]: your AI visibility score is [score]/100 — [found]/4 engines found you`
- **Body** (`src/emails/AuditResultsEmail.tsx:~33-135`):
  - **H1:** Your free AI visibility scan is ready
  - We scanned [Business] ([City]) across 4 major AI assistants. Here's what we found.
  - Score card:
    - VISIBILITY SCORE [score]/100, labelled "Good" (70 or more), "Needs work" (40-69) or "Critical gaps" (under 40)
    - ENGINES FOUND YOU [found]/4, "[4-found] still missing you"
  - ENGINE-BY-ENGINE BREAKDOWN: ✓ or ✗ for ChatGPT, Claude, Perplexity, Gemini. A ✗ row says "Not mentioned in its answer about [City] businesses". The automatic email passes no snippets.
  - TOP ISSUE FOUND: [first issue's explanation or headline], else "Your business is missing from most AI answers about your area."
  - **Button:** "View your full report →" links to the tokenised results URL
  - This link is unique to you — it opens the full scan, including what each AI assistant actually said.
  - **Let your agent fix it.** Alphaa is an AI agent that does the work: it writes what AI needs to read about you, keeps your Google profile active, and asks ChatGPT, Gemini, Claude and Perplexity about you every week. You approve with one tap.
  - **Button:** "Start today →" links to **`/pricing`**
  - $99 a month. Month to month — cancel in two clicks.
  - Footer: Privacy · Terms / "AI visibility results vary by business, location, and industry. No specific rankings are guaranteed. Alphaa is not affiliated with OpenAI, Anthropic, Google, Microsoft, or Perplexity."
- **Variables / fallbacks:**
  - [Business]: business name, else the raw URL (e.g. "https://brightsmile.com/"), else **"Your business"** with a capital Y mid-sentence ("We scanned Your business").
  - [City]: dropped when blank.
- **Notes:**
  - An engine that **didn't answer or wasn't checked shows as ✗ "Not mentioned"**. This breaks the codebase's own rule that unknown must never read as missing.
  - The "Start today" button goes to `/pricing` while nurture uses `/signup?scan=`, so the scan isn't carried over.
  - There are two primary black buttons.

### 5.2 "Email me this report" (manual resend)
- **When:** The visitor clicks the email-report button on `/scan/results` (`src/app/(marketing)/scan/results/page.tsx:~959`). That calls `src/app/api/scan/email-report/route.ts`, which sends once per scan.
- **Same template, subject and preview as 5.1**, with these differences:
  - Snippets of up to 160 characters of each engine's answer appear under found engines.
  - The fallback top issue is "Your business is missing from most AI answers about your area — the signals AI reads aren't pointing at you yet."
  - **No `resultsUrl` is passed (`email-report/route.ts:76-83`), so the "View your full report" button and the unique-link line are missing.** The emailed "report" can't be opened again from the inbox. The only CTA is "Start today →" to `/pricing`.
- **Fallbacks:** same as 5.1.

### 5.3 Weekly report
- **When:** `/api/cron/weekly`, Mondays at 13:00 UTC (`cron-scheduler.ts:49`), to every user with status active or trialing and a non-null `stripeSubscriptionId` (`src/app/api/cron/weekly/route.ts:225-256`).
- **From:** `Alphaa <RESEND_FROM_EMAIL>`.
- **Subject:** `Your weekly Alphaa report — [Business name]` (`weekly/route.ts:203`)
- **Preview:** Your weekly Alphaa report — [Business name]
- **Body** (`src/emails/WeeklyReportEmail.tsx:~60-235`):
  - Header: ✦ alphaa / "Weekly Report · Week of [today's date]"
  - **H1:** Your Weekly Alphaa Report — [Business name]
  - (if measurable) "Your results this week" box, with lines from `src/lib/roi.ts:81-105` such as:
    - "AI assistants sent [N] people to your website this week — ChatGPT 3, Perplexity 1." / "No visitors came from an AI assistant this week yet. I count every one the moment it happens."
    - "From your Google listing: [N] calls, [N] requests for directions and [N] website visits."
    - "Across [N] customer questions, the four AIs named you in [x] of [y] answers." plus "[N] AI answers get a fact about you wrong — I've flagged them below."
    - "Your website had [N] visits this week — [channels]."
  - Weekly note: 2-3 sentences written by Claude in the first person from real counts (prompt at `weekly/route.ts:149-171`). If Claude fails: "This week, [Business] published [N] posts and received [N] new reviews."
  - Three stat boxes: [N] Posts Published · [N] New Reviews · [N] Visibility Gains
  - AI VISIBILITY CHANGES: ChatGPT / Perplexity / Claude / Gemini, each with +1, -1 or "—"
  - TOP KEYWORD MOVERS table (if any): Keyword · Before (#12) · After (#8) · Change (+4)
  - **Button:** "View Full Report →" links to `/dashboard/t/briefings`
  - Footer: You're receiving this because you have an active Alphaa subscription. / Alphaa · AI Search Visibility for Local Businesses
  - No unsubscribe or preferences link.
- **Fallbacks:** [Business name] becomes "your business" (subject: "Your weekly Alphaa report — your business").
- **Notes:**
  - "I've flagged them below": nothing is flagged below in the email.
  - "Visibility Gains" and the "+1 / —" grid are cryptic.
  - "TOP KEYWORD MOVERS" with Google positions is SEO jargon.
  - "Week of [date]" uses the send date.
  - The email goes to everyone including people with nothing connected, so most stats are 0.

---

## 6) Connector / other

### 6.1 Google reconnect ("lost access")
- **When:** a Google sync hits 401 or `invalid_grant`. At most once per 72 hours per user (`src/app/api/integrations/sync/route.ts:31-61`).
- **From:** bare `RESEND_FROM_EMAIL`.
- **Subject:** alphaa lost access to your Google account (`src/lib/email.ts:56`)
- **Preview:** alphaa lost access to your Google account — reconnect in 30 seconds to keep autopilot running
- **Body** (`src/emails/ReconnectEmail.tsx:~16-70`):
  - Banner: ⚠ AUTOPILOT PAUSED — ACTION NEEDED
  - **H1:** alphaa lost access to your Google account. (The first name is never passed, so ", [First name]" never shows.)
  - Google disconnected us from **[Business name]** — this usually happens when you change your Google password or security settings. Nothing is broken on your end, but until you reconnect, autopilot is paused:
    - ⏸ Google Business Profile posting — paused
    - ⏸ Google ranking tracking — paused
    - ⏸ New review monitoring — paused
  - Reconnecting takes about 30 seconds — one click, sign in with Google, done. Everything picks up right where it left off.
  - **Button:** "Reconnect Google →" links to `/dashboard/settings/integrations`
  - Your data and settings are safe. Nothing was lost.
  - Stuck? Just reply to this email and we'll walk you through it.
  - Footer: Manage preferences · Privacy
- **Fallback:** [Business name] becomes "your business".
- **Notes:** "Just reply" goes nowhere useful (no reply-to). A Google app still in Testing mode expires tokens every 7 days, which would make this email fire weekly.

### 6.2 "Email it to my web person" (handoff)
- **When:** The owner taps "email it to my web person" in the agent UI (`src/app/api/agent/handoff/route.ts`). Max 20 per day. Sent to the developer's address the owner types in.
- **From:** `[Business name] via Alphaa <RESEND_FROM_EMAIL or hello@alphaa.app>`. Reply-To is the owner's email.
- **Subject** (one of 8, `src/lib/connector/handoff.ts:51-124`):
  - `[Business]: add structured data to the site header (about 5 minutes)`
  - `[Business]: publish /llms.txt (about 5 minutes)`
  - `[Business]: let AI search assistants read the site (robots.txt)`
  - `[Business]: new page title and description (2 minutes)`
  - `[Business]: add four standard security headers (about 10 minutes)`
  - `[Business]: publish an XML sitemap`
  - `[Business]: new blog post to publish — "[Title]"`
  - `[Business]: publish a new page — "[Title]"` / `[Business]: publish a new FAQ page — "[Title or first question]"`
- **Body** (`handoff.ts:126-143`):
  - Hi,
  - [Owner name] asked us to send you a small website update for **[Business]**. It's ready to paste — most people finish it in a few minutes.
  - **Why it matters**, followed by one paragraph per type (`handoff.ts:33-45`). For example, schema: "When someone asks ChatGPT, Gemini or Google for a business like [Business][ in City], the AI favours businesses whose facts it can read with confidence…" Page/post: "…This one answers a question people are asking AI right now — where [Business] isn't currently being named."
  - **What it is**, a one-line description
  - **Where it goes**, the install instructions
  - [Grey code box with the exact code/content]
  - **How to check it**, e.g. "Run the homepage through https://validator.schema.org…"
  - Questions? Just reply — your reply goes straight to [Owner name].
  - Thank you, / Alphaa, on behalf of [Business]
  - Footer: Sent by Alphaa on behalf of [Business]. Alphaa is the AI agent [Business] uses to get recommended by AI assistants like ChatGPT.
- **Fallbacks:** [Business] becomes **"our business"**, which gives the sender name "our business via Alphaa" and the subject "our business: publish /llms.txt…". [Owner name] is `fullName`, else [Business], so with both missing it reads **"our business asked us to send you…"**. The site falls back to "our website".
- **Notes:** The page/post "why" claims the business "isn't currently being named" for that question without checking. The headers "why" says "some AI crawlers look for them", which is unproven.

### 6.3 Review request (to the owner's customer)
- **When:** The owner adds a customer's name and email in the agent UI and ticks consent (`src/app/api/agent/review-request/route.ts`). Max 50 per day; the same person is never asked twice within 90 days. For phone numbers the email isn't sent; the owner gets a pre-written text instead.
- **From:** `[Business name] <RESEND_FROM_EMAIL or hello@alphaa.app>`. Reply-To is the owner's email.
- **Subject:** `[Business]: how did we do?`
- **Body:**
  - Hi [Customer first name],
  - Thanks for choosing **[Business]**. If you have a minute, would you leave us a quick review on Google? It really helps people nearby find us.
  - **Button:** "Leave a review" links to the business's Google review link
  - Thank you, / [Owner full name or Business]
  - Footer: You're getting this one-time note because you were a customer of [Business][ in City]. Reply to reach them directly. Sent with Alphaa.
- **Fallbacks:** [Business] becomes **"us"**, giving the sender name "us", the subject **"us: how did we do?"** and the line "Thanks for choosing **us**". That's broken, though it's only reachable if the business name is empty.
- **Notes:** The subject asks "how did we do?" but the email only asks for a Google review. It's fine policy-wise (a neutral ask to everyone).

---

## 7) Internal (to our own team)

### 7.1 Concierge intake
- **When:** A signed-in user submits the "Do it for me" form (setup or Full Service), sent **before** Stripe checkout (`src/app/api/concierge/route.ts:41-56`).
- **To:** hi@alphaa.app (`SUPPORT_EMAIL`). **From:** `Alphaa <RESEND_FROM_EMAIL>`. Plain text.
- **Subject:** `🛠 Concierge intake — [Business or email] ([setup|fullservice])`
- **Body:**
  - New "do it for me" intake.
  - Business / Email / Website / Platform / Service: "White-glove setup ($149 one-time)" or "Full Service ($299/mo)" / Notes
  - Payment status arrives in a separate "PAID" email once Stripe confirms.
  - SLA: install + verify within 2 business days of payment.

### 7.2 White-glove setup PAID
- **When:** Stripe `checkout.session.completed` with `mode=payment` and `purpose=concierge_setup` (`src/app/api/webhooks/stripe/route.ts:45-69`).
- **To:** hi@alphaa.app. **From:** `Alphaa <RESEND_FROM_EMAIL>`. Plain text.
- **Subject:** `💰 White-glove setup PAID — [Business or email]`
- **Body:**
  - [Business, or "Unknown business"] ([email]) paid the $149 setup fee.
  - SLA: install + verify within 2 business days.
  - Intake details: see the "concierge_request" activity for user [id] (or the earlier intake email).
  - Website: [url or "not set"]
- **Note:** There is no PAID email for Full Service ($299/mo) subscriptions, even though the intake email says one will arrive.
