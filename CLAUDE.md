# CLAUDE.md — Alphaa Codebase Reference

## 1. Project Overview

Alphaa is a local-business SEO SaaS that replaces an SEO agency. It automatically improves a business's visibility on Google, ChatGPT, and Maps via: AI-powered visibility audits (anonymous public scan + authenticated dashboard scan), Google Business Profile post generation and publishing, website crawling for on-page SEO issues, schema markup generation, competitor analysis, content gap analysis, keyword ranking tracking via Google Search Console, review management via GMB API, and weekly automated reports. Paid plans (owner decision 2026-11-26, max 3 plans; annual = 15% off, `ANNUAL_DISCOUNT_PERCENT`): **Starter** $99/month ($84/mo billed yearly, $1,010/yr) = AI search (AEO) ONLY: weekly AI checks (ChatGPT, Gemini, Claude, Perplexity), 10 customer questions/week, wrong-fact corrections, NAP/profile/Bing checks, website fixes, 2 AI-answer blog posts/month, content gaps, weekly briefing, 1 location; **Pro** $499/month ($424/mo yearly, $5,090/yr) = everything except ads: Starter + social media (branded-image posts, one-tap publish, direct posting as platforms approve), Google Business Profile posts (4/week), review replies + review requests, email campaigns, lead tracking, 4 blogs/month, 20 questions, up to 3 locations, auto-approve; **Growth** $799/month ($679/mo yearly, $8,150/yr) = Pro + Google or Meta ads for 1 ad account IN TOTAL (Google + Meta = 2 ad accounts, Varun 2026-11-27), +$200/month per additional ad account, Google or Meta (`EXTRA_AD_ACCOUNT_PRICE`, $170/mo yearly = $2,040/yr; the "Extra ad account" Stripe add-on, see §10 rule 16 and "Extra ad accounts" in §6; nothing sold while Growth is early access). Growth is an early-access waitlist (no checkout) until ads are approved: `GROWTH_ON_SALE` / `NEXT_PUBLIC_GROWTH_ON_SALE` in `src/lib/growth.ts`, button `GROWTH_CTA` "Join early access" → `GROWTH_EARLY_ACCESS_HREF`. Homepage + /pricing cards run Growth → Pro (Recommended) → Starter with a Monthly/Annual toggle (`pricing-data.ts` `plans`, `components/marketing/home/HomePlans.tsx`). Full Service ($299) and the $149 setup are retired from sale (never had subscribers); `fullservice` rows still read as Pro-level. Plan prices live in `src/lib/constants.ts` `PLAN_PRICES`, feature lists in `src/lib/plan-features.ts`. There is no free trial — the free public scan is the trial (decided 2026-09-24).

---

## 2. Tech Stack

| Layer | Package / Version |
|---|---|
| Framework | Next.js ^15.5.29 (App Router) |
| Language | TypeScript ^5 |
| Auth | @clerk/nextjs ^7.3.7 |
| Database | PostgreSQL via Prisma ^7.10.1 + @prisma/adapter-pg ^7.10.1 |
| AI — primary | @anthropic-ai/sdk ^0.97.1 |
| AI — scan | openai ^6.39.0 (GPT-4o-mini + Perplexity via OpenAI-compat) |
| AI — scan | @google/generative-ai ^0.24.1 (Gemini 1.5 Flash) |
| Payments | stripe ^22.1.1 |
| Email | resend ^6.12.3 + @react-email/components ^1.0.12 |
| PDF | @react-pdf/renderer ^4.5.1 |
| Google APIs | googleapis ^172.0.0 |
| Crawler | cheerio ^1.2.0 |
| UI primitives | @radix-ui/* (accordion, dialog, progress, select, separator, switch, tabs, tooltip) |
| Icons | lucide-react ^1.16.0 |
| Styling | Tailwind CSS ^3.4.1 + tailwind-merge ^3.6.0 + clsx ^2.1.1 |
| Validation | zod ^4.6.7 |
| Toast | sonner ^2.0.7 |
| Webhooks | svix ^1.94.0 (Clerk webhook verification) |

---

## 3. Project Structure

```
alphaa/
├── prisma/
│   ├── schema.prisma          # All DB models
│   ├── migrations/            # Migration history
│   └── config.ts              # prisma.config.ts — datasource from DATABASE_URL
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout — ClerkProvider, Toaster, fonts
│   │   ├── globals.css        # CSS vars, glass-card, btn-orange, btn-ghost, .dot-grid, .serif-italic, .mono
│   │   ├── (auth)/            # /login, /signup — Clerk catch-all routes
│   │   ├── (marketing)/       # /, /pricing, /how-it-works, /scan, /scan/results, /case-studies, /terms, /privacy, /refer
│   │   ├── (dashboard)/       # /dashboard/* — requires auth
│   │   │   └── dashboard/
│   │   │       ├── page.tsx         # Home/overview
│   │   │       ├── visibility/      # AI engine status
│   │   │       ├── keywords/        # Search rankings (GSC)
│   │   │       ├── audit/           # Website issues (crawl)
│   │   │       ├── speed/           # Page speed
│   │   │       ├── posts/           # GBP posts
│   │   │       ├── reviews/         # GMB reviews
│   │   │       ├── content-plan/    # Content calendar
│   │   │       ├── content-gaps/    # Topic ideas vs competitors
│   │   │       ├── competitors/     # Competitor tracker
│   │   │       ├── reports/         # Reports history
│   │   │       └── settings/        # User settings + Google integration
│   │   ├── onboarding/        # Post-signup onboarding flow
│   │   └── api/               # All API routes (see §7)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardSidebar.tsx
│   │   │   ├── DashboardTopBar.tsx
│   │   │   ├── MarketingNav.tsx
│   │   │   └── Footer.tsx
│   │   └── common/
│   │       ├── GlassCard.tsx
│   │       ├── HeadlineWithSerif.tsx
│   │       ├── MonoNumber.tsx
│   │       ├── OrangePillButton.tsx
│   │       ├── ScoreRing.tsx
│   │       └── SectionLabel.tsx
│   ├── emails/                # React Email templates
│   │   ├── WelcomeEmail.tsx
│   │   ├── WeeklyReportEmail.tsx
│   │   ├── AuditResultsEmail.tsx
│   │   └── PaymentFailureEmail.tsx
│   ├── lib/
│   │   ├── db.ts              # Prisma singleton (PrismaPg adapter)
│   │   ├── claude.ts          # Anthropic client + buildAuditPrompt()
│   │   ├── ai-engines.ts      # scanAllEngines() — Claude/GPT/Gemini/Perplexity in parallel
│   │   ├── crawler.ts         # crawlWebsite() — Cheerio-based site spider
│   │   ├── schema-generator.ts # generateSchemaMarkup() — Claude → JSON-LD
│   │   ├── competitor-analyzer.ts # analyzeCompetitor() — crawl + Claude
│   │   ├── content-gaps.ts    # analyzeContentGaps() — Claude
│   │   ├── gbp-poster.ts      # generateGbpPost() + postToGmb()
│   │   ├── google.ts          # OAuth2 flow, token refresh, getAuthenticatedClient()
│   │   ├── ga.ts              # Google Analytics data fetching
│   │   ├── gsc.ts             # Google Search Console keyword rankings
│   │   ├── gmb.ts             # GMB review fetching
│   │   ├── stripe.ts          # Stripe singleton (lazy), STRIPE_PRICE_IDS
│   │   ├── email.ts           # Resend wrappers (sendWelcomeEmail, etc.)
│   │   ├── resend.ts          # Low-level Resend sendEmail()
│   │   ├── engine-evidence.ts # getEngineEvidence() — merges weekly/scan/sandbox evidence per engine
│   │   ├── pagespeed.ts      # fetchPageSpeed() — shared PSI helper (protocol fix, 25s, 6h cache)
│   │   ├── scan-insights.ts  # business profile, mention extraction, loss estimate, SERP
│   │   ├── constants.ts       # PLANS, PLAN_NAMES, PLAN_PRICES, SUPPORT_EMAIL
│   │   └── utils.ts           # cn(), formatCurrency(), formatDate(), slugify(), truncate()
│   └── types/
│       ├── user.ts            # AppUser interface
│       ├── audit.ts           # AuditResult, AuditIssue, IssueSeverity, AiSearchStatus
│       └── scan.ts            # ScanInput, ScanResult
├── next.config.mjs            # images.domains: clerk CDN
├── tailwind.config.ts
├── prisma.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Database Schema Summary

All models use `String @id @default(cuid())`. Cascade deletes on all child → User FK relationships.

| Model | Key Fields | Notes |
|---|---|---|
| **User** | clerkId (unique), email, businessName, businessType, city, state, zip, websiteUrl, voiceDescription, topicsToAvoid, onboardingCompleted, onboardingStep, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, plan, trialEndsAt | Central entity; all others FK to this |
| **Audit** | userId, visibilityScore (Int), issues (Json), competitorInsight, aiSearchStatus (Json), rawResponse | Created by the dashboard audit scan |
| **AiEngineResult** | auditId, engine, query, response, appeared, position, snippet | Per-engine results within an Audit |
| **Integration** | userId (unique — one per user), accessToken, refreshToken, expiresAt, gaPropertyId, gscSiteUrl, gmbAccountId, gmbLocationId | Google OAuth tokens + selected properties |
| **KeywordRanking** | userId, query, clicks, impressions, ctr, position, date | Synced from GSC |
| **AnalyticsSnapshot** | userId, sessions, pageViews, bounceRate, avgSessionDuration, organicSessions, topPages (Json), trafficSources (Json), date | Synced from GA |
| **GmbReview** | userId, reviewId, authorName, rating, comment, reply, publishedAt | Unique on (userId, reviewId) |
| **CrawlResult** | userId, url, pagesScanned, issues (Json), schemaFound (String[]), schemaMissing (String[]), metaIssues (Json) | Output of crawlWebsite() |
| **Competitor** | userId, url, name, crawlData (Json), analyzedAt | crawlData includes aiSummary field |
| **ContentGap** | userId, competitorUrl, gaps (Json array of GapItem), summary | Claude-generated content gap analysis |
| **GbpPost** | userId, content, postType (UPDATE/OFFER/EVENT), status (draft/posted/failed/scheduled), gmbPostId, postedAt, scheduledFor | status "draft" until published to GMB |
| **SchemaMarkup** | userId, schemas (Json array of SchemaItem) | Generated JSON-LD, multiple types per record |
| **WeeklyReport** | userId, postsPublished, reviewsNew, visibilityDelta (Json), keywordMovers (Json), summary, emailSent | Created by /api/cron/weekly |
| **ScanLead** | email, businessName, businessUrl, visibilityScore, issues (Json), aiSearchStatus (Json), city, ogData (Json), engineResponses (Json), converted, userId? | Public scan results — no auth required |
| **MockActivity** | userId, type, title, description, metadata (Json) | Demo/placeholder activity feed |
| **Report** | userId, auditId?, type, pdfUrl, sentAt | Report records (PDF generation) |

---

## 5. Environment Variables

All must be set in `.env.local`. Variables not in `.env.local` but required at runtime are noted.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma + PrismaPg adapter) |
| `ANTHROPIC_API_KEY` | Claude API — audits, GBP posts, schema gen, competitor analysis, content gaps, weekly summaries |
| `CLERK_SECRET_KEY` | Clerk server-side auth |
| `CLERK_WEBHOOK_SECRET` | Svix webhook signature verification for Clerk events |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/signup` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post-login redirect |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post-signup redirect |
| `STRIPE_SECRET_KEY` | Stripe server-side billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `STRIPE_STARTER_MONTHLY_PRICE_ID` | Stripe price ID for Starter monthly ($99, + EUR/GBP/AED options) |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | Stripe price ID for Starter annual ($1,010/yr = $84/mo) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe price ID for Pro monthly ($499, + EUR/GBP/AED options) |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Stripe price ID for Pro annual ($5,090/yr = $424/mo) |
| `STRIPE_GROWTH_MONTHLY_PRICE_ID` | Stripe price ID for Growth monthly ($799; not sold while early access) |
| `STRIPE_GROWTH_ANNUAL_PRICE_ID` | Stripe price ID for Growth annual ($8,150/yr = $679/mo) |
| `STRIPE_EXTRA_AD_ACCOUNT_MONTHLY_PRICE_ID` | Growth add-on "Extra ad account", $200/mo (+ EUR 199 / GBP 159 / AED 739 currency options) |
| `STRIPE_EXTRA_AD_ACCOUNT_ANNUAL_PRICE_ID` | Same add-on yearly, $2,040/yr ($170/mo) |
| `STRIPE_CREDITS_50_PRICE_ID` / `_120_` / `_300_` | Usage credit packs, one-time: 50 credits $25, 120 $50, 300 $100 (+ EUR/GBP/AED currency options) |
| `QUOTAS_JSON` | Optional. Overrides any plan quota without a deploy (lib/quota-rules.ts), e.g. `{"pro":{"content_piece:blog":{"month":12}},"*":{"sandbox_question":{"day":80}},"public":{"scan_ip_day":10}}`; `null` removes a period's limit |
| `AI_DAILY_BUDGET_USD` | Optional (default 20). Platform-wide AI spend per UTC day; at 100% non-essential crons skip, at 80% the founders get one email |

Prices created 2026-11-26 by `scripts/stripe-create-plan-prices.mjs` (idempotent via lookup keys `alphaa_<plan>_<monthly|yearly>_2026_11`, metadata `alphaa_plan` + `interval`). The same script created the add-on on 2026-11-27: product "Extra ad account" (product metadata `alphaa_addon: extra_ad_account`), lookup keys `alphaa_extra_ad_account_<monthly|yearly>_2026_11`, price metadata `alphaa_addon` + `interval`. Credit packs too (2026-11-27): product "Alphaa credits" (metadata `alphaa_credits_product: 1`), one-time prices, lookup keys `alphaa_credits_<50|120|300>_2026_11`, metadata `alphaa_credits`. The webhook maps a price to its plan with `planFromPrice()` in `lib/stripe.ts` (env ids, then metadata, then product name). Railway's `STRIPE_SECRET_KEY` is a LIVE restricted key; there is no Stripe test key anywhere (`.env.local` has a placeholder).
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `RESEND_API_KEY` | Resend transactional email |
| `RESEND_FROM_EMAIL` | Sender address (default: hello@alphaa.app) |
| `NEXT_PUBLIC_APP_URL` | Canonical base URL (e.g. https://alphaa.app) — used in OAuth callbacks and email links |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID (for GA/GSC/GMB integration) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret |
| `OPENAI_API_KEY` | GPT-4o-mini for AI engine scan (optional — scan degrades gracefully if absent) |
| `GEMINI_API_KEY` | Gemini 1.5 Flash for AI engine scan (optional) |
| `PERPLEXITY_API_KEY` | Perplexity for AI engine scan (optional — uses OpenAI SDK compat) |
| `CRON_SECRET` | Bearer token protecting `/api/cron/*` endpoints from unauthorized invocation |
| `STRIPE_FULLSERVICE_MONTHLY_PRICE_ID` | Retired $299/mo Full Service (webhook mapping only; not sold since 2026-11-18) |
| `PAGESPEED_API_KEY` | Optional. Google PageSpeed Insights key. **Without it the keyless quota 429s permanently and the speed page shows its honest failure state.** |
| `APIFY_TOKEN` | Google SERP scraping for scan competitor evidence (optional; scan degrades without it) |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | Shopify app client id + secret (OAuth, callback HMAC, webhook HMAC) |
| `SHOPIFY_APP_HANDLE` | Optional. App handle in the Shopify-hosted Managed Pricing URL (`admin.shopify.com/store/{store}/charges/{handle}/pricing_plans`). Default `alphaa`. |
| `COMPANY_MAILING_ADDRESS` | Physical mailing address in every marketing email footer (CAN-SPAM/CASL). **Unset = the nurture cron and abandoned-checkout email send nothing.** |

---

## 6. Key Architectural Patterns

### Authentication
- Clerk is the sole auth provider. `ClerkProvider` wraps the root layout.
- `src/middleware.ts` uses `clerkMiddleware` + `createRouteMatcher`. Everything except the public routes list is protected via `auth.protect()`.
- Public routes: `/`, `/pricing`, `/how-it-works`, `/case-studies/**`, `/scan/**`, `/login/**`, `/signup/**`, `/terms`, `/privacy`, `/api/scan/**`, `/api/webhooks/**`.
- In API route handlers: `const { userId: clerkId } = await auth()` then `db.user.findUnique({ where: { clerkId } })` to get the internal `User.id`. Never pass `clerkId` directly to child records — always resolve to `user.id` first.

### Database Access
- Single Prisma client singleton exported as `db` from `src/lib/db.ts`. Uses `PrismaPg` driver adapter (not the default Node.js driver).
- Dev hot-reload guard: `globalThis.prisma` caches the instance.
- Always import `db` from `@/lib/db` — never instantiate `PrismaClient` directly elsewhere.

### Server vs Client Components
- All API routes and data-fetching components are Server Components by default (Next.js App Router).
- Interactive components (sidebar active state, forms, buttons with onClick) must have `"use client"` at the top.
- Layout components `DashboardSidebar` and `DashboardTopBar` are client components.
- The root `layout.tsx` has no `"use client"` — it's a Server Component wrapping `ClerkProvider`.

### AI Usage
- All Claude calls go through the singleton in `src/lib/claude.ts` (`anthropic` export).
- Model usage: `claude-sonnet-4-6` for public scans and GBP posts/schema/competitor analysis/content gaps, `claude-opus-4-8` for weekly summaries and cron GBP posts, `claude-haiku-4-5` for AI engine scan check.
- All AI responses expect raw JSON; strip markdown fences before `JSON.parse`. Always have a fallback for parse failures.
- `scanAllEngines()` runs Claude + GPT-4o-mini + Gemini + Perplexity in `Promise.allSettled` — handles missing API keys gracefully with `status: "not_configured"`.

### Google OAuth Flow
- User initiates connect → `/api/integrations/google/connect` → redirect to Google OAuth URL.
- Google redirects to `/api/integrations/google/callback` → exchange code for tokens → upsert `Integration` record.
- State param is base64url-encoded JSON `{ userId: clerkId, nonce }`.
- Token refresh is handled in `getAuthenticatedClient()` in `src/lib/google.ts` — auto-refreshes if token expires within 60 seconds.

### Cron Jobs
- `/api/cron/weekly` (GET): generates `WeeklyReport` + sends email for all active/trialing users. Protected by `Authorization: Bearer <CRON_SECRET>`.
- `/api/cron/gbp-posts` (GET, Mon/Tue/Thu/Fri 13:00 UTC): drafts a GBP post per active Pro/Growth user, 4/week (Starter gets none since 2026-11-26: AI search only). Drafts wait in the agent feed ("Post it" → `/api/gbp/posts/[id]/publish`). Publishes directly only for Pro/Growth with `autoPublishPosts` on, a connected listing and no `[placeholders]`. Same auth guard.
- Both have `maxDuration = 300` (5 minutes).
- `/api/cron/nurture` (GET, daily 16:00 UTC): scan-lead nurture via `lib/nurture.ts` + `emails/NurtureEmail.tsx`. Daily burst Day 1-4 (why AI named a rival, drafted fix, guarantee, $99 offer; sent strictly in order on consecutive days), then weekly Day 11/18/25/32/39/46/53 (one useful tip + one CTA each) and Day 60 break-up = the last email. Max one email per address per 20h. State in `ScanLead.ogData.nurture` `{ step, schedule: 2, lastSentAt }` (merged, never overwritten); steps without `schedule: 2` are from the old 1/3/5/7/10/14/30/60/90 schedule and are mapped by `currentStep()` so nothing is resent. Only leads after the consent cutoff (2026-10-04 16:00 UTC). Stops on unsubscribe, conversion, or an account with that email. `?dryRun=1` previews without sending.
- **Personal drip copy (`lib/personal/`)**: nurture + convert emails are written per recipient. `research.ts` builds a keyed fact dossier (scan/audit/competitors/GSC + fresh: one AI re-asked today, rivals' and own newest sitemap URL, homepage social links, optional Apify IG/FB posts; fresh part cached in `ScanLead.ogData.dossier` 6 days). `writer.ts` (claude-opus-5-5, structured output) + a strict validator (word count, no dashes/banned phrases/other AI names, every number must be in the dossier, required sentences verbatim); one retry, then the template. Used fact keys: `ogData.nurture.used` (leads) / `email_sent` metadata.factKeys (accounts). Preview without sending: `scripts/preview-personal-email.ts`.
- `/api/cron/convert` (GET, daily 17:00 UTC): onboarded accounts with no paid plan, days 1/3/5/8/12/17/24/31/45 after signup, deduped via MockActivity `email_sent` emailKey `convert-dN`; max one email per account per 20h across lifecycle + convert. Same legal gates as nurture; CTA → `/dashboard/settings/billing`. `?dryRun=1&limit=N`.
- `/api/cron/review-drafts` (GET, daily 06:00 UTC, Pro and up only since 2026-11-26): writes a reply (MockActivity `review_draft`, metadata `{reviewId, text}`) for each unreplied Google review from the last 60 days, max 5 per account per night. Nothing is posted; the briefing shows the finished reply for one-tap approval.
- **Weekly email = the briefing** (`/api/cron/weekly` → `emails/BriefingEmail.tsx` via `lib/agent/briefing-email.ts`): headline + 4 AI lights, items waiting for the owner with signed no-login "Approve & publish" links (`lib/approve-token.ts`, 14-day, one item each, CRON_SECRET-signed) → `/approve` page (public; the owner taps once more, so mail scanners publish nothing) → `POST /api/agent/approve`. Preview: `npx tsx scripts/preview-briefing-email.tsx [--user <id>] --out file.html`.
- Marketing email goes through `lib/marketing-email.ts` (footer + `List-Unsubscribe` one-click headers). Unsubscribe links are HMAC-signed (`lib/unsubscribe.ts`): `/unsubscribe` page (GET) and `/api/unsubscribe` (POST one-click). Abandoned checkout (`checkout.session.expired`) → `lib/abandoned-checkout.ts`, once per account.

### Workspace shell (2026-11-26, replaces AgentShell for everyone)
- `(dashboard)/layout.tsx` renders `components/workspace/WorkspaceShell.tsx` (scoped CSS `(dashboard)/workspace.css`, every rule under `.ax`): frosted sidebar (Briefing; Research & Ideas, Social Studio, Email & Flows [Pro], Ads [Growth, gated by `hasGrowth`], Tracking & Setup; Your rules → /dashboard/settings; "More" lists every older detail page, led by "Website posts & pages" (opens the `content` chat thread in place; href `/dashboard?ask=content`) and "Website connection" (/dashboard/settings/website), added 2026-11-27 for Shopify/Webflow reviewers), status island, Autopilot switch = the existing auto-approve consent (`openAutoApprove` / `turnOffAutoApprove`). Light only (dark mode off 2026-11-26; the theme cookie is ignored). Under 1024px the sidebar is a drawer behind a top bar.
- The ⌘K ask bar opens a panel that mounts the real `DashboardAgent` (`composerOpen`). Pages drive it with `askAlphaa({ topic | chip | say | push })` (`lib/workspace/events.ts`): topics go through `ASK_EVENT`, chips/messages through `AGENT_EVENT`, which DashboardAgent handles with its own `onChip`/`send`. `?ask=<topic>` on any dashboard URL opens the chat on that thread.
- Pages: `/dashboard` (Briefing), `/dashboard/research|social|email|ads|tracking`. Data in `lib/workspace/*.ts`, real rows only, honest empty states. Headline = calls + leads over 30 days: Google listing CALL_CLICKS (`getProfileActions`, cached 6h) + website lead beacons (`tracking_event`) + Meta lead-form leads; prev is null when there is nothing to compare with. "Going out soon" = scheduled social posts + scheduled GbpPosts; Stop/Undo = `POST /api/workspace/hold` (back to draft / back on schedule). "One question" = at most one of: an AI fact to confirm, a first-time connection (setup step), the ad budget (money), or turning autopilot on when finished work is waiting.
- Briefing top = 4 AI cards (`lib/workspace/ai-cards.ts`): verdict from `getEngineEvidence()` (question scan as fallback), question/answer/"names instead" from `storedAnswers()` (lib/agent/first-answer.ts) when it agrees with the verdict, else the weekly question scan's `named`. Never-checked = "Not checked yet". FirstAnswer is no longer shown.
- **Autopilot declaration** (`lib/auto-approve-text.ts`, `CONSENT_VERSION` "2026-11-26.1", `CONSENT_DECLARATION` points i-vi, linked to `/terms#ai-autopilot` = Terms §8A): accepted in `AutoApproveModal`; stored as MockActivity `autopilot_consent` (version, full text + sha256, userId, email, plan, scope, IP, user agent) + settings `autoApprove {acceptedAt, version, consentId}`. `consentCurrent(s)` gates every "without asking" setting (posts, reviews, social, now also email:auto and ads:budget). An older version re-prompts once per visit (`op: "auto_renew"` records the new acceptance and keeps every setting; "Turn Autopilot off" is the alternative). Crons are unchanged. "Alphaa is AI and can make mistakes…" (`AI_NOTE`) sits in the chat panel and under "Going out soon".
- **Research → Competitors / gaps (2026-11-26)**: relevance gate `lib/competitor-relevance.ts`: domain rules (`blockedHost`: wikis/fandom, directories & review sites, forums, social, marketplaces, website builders, big platforms, news/media, .gov/.edu) on every row; a Haiku niche check (`nicheVerdicts`, cached per host in settings `competitorRelevance`) for rows not added by hand (`crawlData.source === "manual"`, set by POST /api/competitors); owner dismissals in settings `competitorsDismissed` (`POST /api/workspace/competitor` op dismiss, then one background `discoverCompetitors(user, 1)`, max once/30 min). Discovery (`discover-competitors.ts`) runs the same gate on search results before crawling. No rows are deleted. **Every surface uses the same gate** (`competitorGate` / `relevantCompetitors` / `relevantGaps`): Research, /dashboard/competitors, /dashboard/content-gaps, GET /api/competitors, the chat `competitors` thread and chat context, feed.ts, ad-plan `competitorAds()`, niche rival socials, the personal email dossier, insights, the blog writer's topic pick, and the competitors cron (only real competitors count). Attack cards + winning moves: `lib/workspace/rivals.ts` (tag + Winning at / Weak spot / My counter-move only from stored data: AI question-scan rivals, ad-plan Ad Library ads, niche rival posts, crawl analysis only when pages were read, ContentGap rows; `ourTitle()` strips brands/separators; signals = Search Console impressions/position + buyer-intent words). "Draft it" = `components/workspace/DraftSheet.tsx` → `/api/agent/draft` mode post → Autopilot on: "Add to Going out soon" (`/api/workspace/site-post` schedule: post_draft status "scheduled" + scheduledFor +72h, published by `/api/cron/site-posts` every 10 min via `approveSitePost` while Autopilot is on; Stop/Undo through `/api/workspace/hold` kind "site"), off: "Publish" (approveSitePost now). Pages set the status island with `ISLAND_EVENT`.
- **Research round 3 (2026-11-26)**: What's working = niche gate (writer's `fits` verdict at scrape time; older items: `lib/niche-fit.ts` Haiku check cached per item in settings `nicheFit`) + engagement gate (`engagementRate` = (likes+comments+shares)/views, or /followers; only items above the SAME scrape's median survive; badge "N× typical engagement"; ads need 30+ days running). New scrapes also store `hook` (the post's own first line, ≤140 chars, quoted with the source link), `format`, `thumb`/`duration` (private reference view, never reused). Hashtag picker refuses ambiguous tags (#saaslife). Ideas: proof pill from the cited fact key (ai:lost → "X of Y AIs name you", ai:rival, gsc:near/ctr/fall → "#N on Google", gsc:top/rise → clicks), social hooks written once and cached (settings `ideaHooks`), "My top pick this week" = strongest AI idea. X-Ray / Make my version / Write it → `components/workspace/ReadySheet.tsx` → `POST /api/workspace/make` (lib/workspace/make.ts: SocialPost / GbpPost / post_draft) → ONE action `POST /api/workspace/schedule` (lib/workspace/schedule.ts: Autopilot on = +72h stop window, off = the owner's approval: social in 5 min, Google at the next gbp-posts run, website now).
- **Social & Email round (2026-11-26)**: social card images (`lib/social-card.ts` `cardSvg`) have 4 named styles (`CARD_STYLES`: minimal / editorial / gradient / warm): 96px safe margins, accent rule, 4-5 word headline as the largest element (up to 3 lines, optically centred), optional subline, hairline + logo/name footer. Saved style = settings `images.cardStyle` (set from Social Studio Preview swatches → `POST /api/workspace/restyle`, which re-draws that post). alphaa.app itself always uses the house style (`HOUSE_STYLE` "alphaa", `house: true`, set from the brand's website = alphaa.app): a pastel service-tone block picked from the headline, ink type, the orb + "alphaa" footer (`lib/brand-orb.ts`); it replaced black & white `mono` on 2026-11-26 and is never offered to customers. Social Studio keeps 3+ upcoming posts: fewer than 3 drafts/scheduled with an active account starts the existing week run (at most once per 3 days). Account chips show expired logins (amber, Reconnect = `/api/social/connect/<provider>`). Email: this month's note is written in the background when there's no draft under 30 days old and previewed as "Issue #N" (rendered with the real email template; placeholder address until one is saved); Welcome/Win-back are "Coming soon" cards. Pages set the island text with `ISLAND_EVENT`.
- **Tracking & Setup (2026-11-27)**: `lib/workspace/tracking.ts` rows have `state` ok / needs / optional (Meta and Google Ads are optional until used), `warn` for a broken sub-connection (expired social login → amber + Reconnect), and `verified` from stored data only (GBP: newest synced review; GA: newest AnalyticsSnapshot; GSC: newest KeywordRanking row; website: WP plugin `lastSeenAt`; lead tracking: `tracking.check.at` from the 07:00 cron; social: last published post; Meta: last lead poll; Google Ads: none). Setup steps that aren't connections are not on this page. The sidebar badge = `needs` from the same function. Lead tracking can't be auto-installed on Webflow/Shopify/Wix (no site-code scope): the signals box says so and opens the setup thread; WordPress installs through the plugin. Top fade under the island (`.ax-main::before`).
- **Briefing round (2026-11-27)**: "One question" sits at the very top; the AI-fact question opens "Review & fix" (inspector: claim vs. the site's truth, "Confirm & write the correction" = draft chip). The hero collapses to a setup bar ("N of M connected" + next connect action + "Run my marketing for this week") while metrics are mostly unconnected; "Play the recap" only when something was published or a lead came in (30 days). AI cards show "Named instead of you" as chips and a "See N pages in progress →" / "See my plan →" button. Nothing scheduled → this week's plan from the newest week run (`getPlan` in lib/workspace/briefing.ts; no run in 7 days on a paid plan = start one in the background); Autopilot off → "Approve this week's plan" (`POST /api/workspace/approve-plan`: each waiting item through `scheduleMade`, social keeps its planned day, and the run's item statuses are updated).
- **Ads round (2026-11-27)**: while nothing is live the default tab is "Your first ads": 2 Meta statics (with images) + 1 Google search ad from the ad plan, LinkedIn only for B2B plans ("In your plan · I prepare these, you run them"); no plan = `startStrategy` (Pro+). The limit card is a $250–$5,000 slider that re-splits live with the real `testingPlan()` and shows playbook facts per channel; "Save limit & prepare launch" saves `autopilot.adBudget` only (no spend, no campaign). Results show account numbers only, a calm retry line only when a fetch for a live campaign failed, and "Competitor ads I'm watching" (plan's Ad Library ads, only real competitors) until a week of my own spend. "What I changed" lists the enforced guardrails when empty; Google change rows get inline Undo (campaign pause/enable, latest applied tune-up via `tune_undo`).
- **Ads: pixel, KPIs, fatigue (2026-11-28)**: the picked Meta pixel is now used. `deliveryFor()` (lib/metaads/graph.ts, ODAX table) = instant form: LEAD_GENERATION + ON_AD + promoted_object `{page_id}`; website leads (plan `leadsOn: "website"`, owner chip "Collect leads on my website (pixel)" → metaads op `leads_on`, needs pixel + website, no lead form): OFFSITE_CONVERSIONS + WEBSITE + `{pixel_id, custom_event_type: "LEAD"}`; traffic: LINK_CLICKS, no promoted_object. Every ad gets `tracking_specs` `[{action.type:[offsite_conversion], fb_pixel:[id]}]` when a pixel is picked. KPIs (`lib/ads-kpis.ts` `kpisOf`, pure): impressions, CTR, CPC, CPM, conversion rate (conversions ÷ clicks; Meta uses `inline_link_clicks`), cost per lead, 7 + 30 days on the Ads page (`ResultBox.windows`, toggle) and in both chat threads. No ROAS (no conversion values). Creative fatigue (`detectFatigue` in metaads/rules.ts, `lib/metaads/fatigue.ts`): per-ad daily insights since go-live (max 90 days); flag when frequency > 3 AND link CTR down > 30% vs the ad's own first 7 days (both weeks ≥ `THRESHOLDS.metaJudgeImpressions`), or cost per result up > 40% (both weeks ≥ `metaJudgeSpend`, first week ≥ 1 result); needs 14+ days. Flags only: one `ads_change` row `kind: "fatigue"` per ad per week (Ads "What I changed" + Briefing ledger), Results tab card; checked from the hourly meta-ads leads cron (6h cache) and the Ads page. Tests: `npx tsx scripts/test-meta-ads.ts`.
- Dev-only preview with sample data: `/preview?ws=briefing|research|social|email|ads|tracking` (`&empty=1`, `&dark=1`); 404 in production.

### Dashboard home = the morning briefing (HISTORY: the components below were deleted 2026-11-27 — AgentShell, Briefing, BriefingV2, BriefingHero, FirstAnswer, ToolsRail(V2), AgentMemory, lib/dash-v2, /api/agent/hero, /api/agent/first-answer. The libs they used (lib/agent/briefing.ts for the weekly email, hero.ts, recap.ts, first-answer.ts storedAnswers) remain. DashboardAgent is the ⌘K chat panel.)
- `lib/agent/briefing.ts` → `components/agent/Briefing.tsx`: (1) "Am I winning?" yes/no light per AI + rival named instead + what I'm doing about it, (2) inbox of items waiting for the owner, one card at a time, Approve & publish / Edit (in-place textarea), (3) plain-English ledger of real work grouped by day with "See it" links. The ledger maps activity types to owner language in `ledgerText()`; setup/billing/email rows are excluded on purpose. The older detail cards (`lib/agent/feed.ts`) sit folded under "Show me why".
- Top of the briefing = `components/agent/BriefingHero.tsx` ← `/api/agent/hero` (`lib/agent/hero.ts`, loaded after paint): people AI sent them in the last 30 days vs the 30 before (GA `getAiReferrals(integ, days, endDaysAgo)`, else our `ai_visit` rows), falling back to "named in X of Y answers". Never claim to count "recommendations" (unmeasurable). Customer value = `lib/customer-value.ts`: Haiku estimate saved once in agent settings `customerValue {amount, source: "estimate"|"owner", basis}`, owner edits it inline ("Change it" → POST /api/agent/settings `customerValue`). "One customer pays for N months of Alphaa" = floor(value / plan price).
- Briefing also: "Next up" (next scheduler slot, `nextSlot()` in briefing.ts — keep in sync with cron-scheduler), Share it (`POST /api/agent/share` → a `win` row kind `engine_named`, only when evidence says that AI named them → public `/w/[id]` with `opengraph-image.tsx`), Milestones (first `engine_appeared` win per AI), and "You're all caught up". First week of a month: last month's recap card (`lib/agent/recap.ts`). `/api/cron/monthly-recap` (1st, 18:00 UTC) emails `emails/MonthlyRecapEmail.tsx` to paying accounts once per month (emailKey `recap-YYYY-MM`, `?dryRun=1`).
- First visit: `components/agent/FirstAnswer.tsx` ← `/api/agent/first-answer` (`lib/agent/first-answer.ts`) shows the real ChatGPT answer (their name, or the rivals named, highlighted) once at the top of the briefing. Answer = freshest stored one (Audit AiEngineResult / ScanLead engineResponses / `sandbox_result` metadata.lead), saved in agent settings `firstAnswer`; "seenAt" set on dismiss. Brand-new accounts with nothing asked: the card runs `/api/sandbox/ask` itself (DashboardAgent skips its own firstCheck when a briefing is present).
- Left "Details" rail (`components/agent/ToolsRail.tsx`): the under-the-hood pages (sandbox, vault, citations, per-AI, rankings, health, speed, posts, reviews, content, competitors, reports), folded to 5 section icons by default (localStorage `alphaa.tools.v1`); a drawer behind the header menu button under 900px.
- One-tap approvals live in `lib/approvals.ts` (review reply, Google post, website post), shared by the dashboard, `/api/gbp/reviews/[id]/reply` and the email links. Site publishing logic is `lib/connector/push.ts` (`/api/connect/wp/push` is a thin wrapper).

### Voice, autopilot and the live work log (2026-11-17)
- **Voice** (`lib/voice.ts`, agent settings `voice`): reads the owner's own words (homepage, about, services, a blog post, review replies they wrote themselves), detects the language, and writes 3 options (first = "Like your website") with a sample each (Opus 5.5, structured output). The owner picks one or writes their own, and sets language / tone / emoji / length / "we" or "I" in the "How I sound" thread (`?ask=voice`, `lib/agent/voice-narration.ts`, `/api/agent/voice`). Every writer adds `voiceFor(userId)` / `voiceText()` to its prompt: blog posts, meta, location pages, drafts, Google posts (manual + cron), review replies. **Never store the voice in `User.voiceDescription`**: that's the business description and it feeds the schema markup and llms.txt.
- **Autopilot** ("What I do without asking", `lib/agent/autopilot.ts`, `/api/agent/autopilot`, settings `autopilot`): posts = `autoPublishPosts` (Pro+); review replies ask/positive/all are honoured by `/api/cron/review-drafts`; social, review replies and email are Pro and up; ads (+ monthly `adBudget`) are Growth-only. Starter has nothing that publishes without asking.
- **Live work log**: `lib/agent/worklog.ts` turns ledger rows into Claude-style `log` blocks. The `work` thread shows 14 days, and DashboardAgent polls `/api/agent/activity?since=` every 30s to drop new steps into the chat.
- **What's working** (`lib/insights.ts`, thread `?ask=insights`, `/api/agent/insights`, MockActivity type `insights`, weekly): working / not working / niche lines are written in code from real data (GSC 28-day snapshots 4 weeks apart, GA snapshots + published post views, the weekly AI question scan, content gaps, rivals' newest sitemap pages and the owner's social posts via `buildAccountDossier`). Opus only proposes 3-5 ideas (blog / google / social). An idea is dropped unless it cites real fact keys and every number in it appears in those facts. "Write it" → `/api/agent/draft` modes `post`, `gbp` (draft Google post) and `social` (copyable caption). The briefing card shows weekly until opened (`insightsSeenAt`).
- **Run my week** (`lib/agent/week.ts`, `/api/agent/week`, MockActivity `week_run`): "Run my marketing for this week" (button, typed, or spoken via the mic; `WEEK_RE` in DashboardAgent) starts a background run. Steps: brand kit + voice → insights and trends in parallel → Opus plan (1 blog, 2 Google if the listing is connected, 3 social on Pro and up; every "why" cites facts/trends, numbers validated) → write each piece → publish what autopilot allows (blog via `approveSitePost`; Google posts `status: "scheduled"` + `scheduledFor`, published by the gbp-posts cron). The chat polls `?id=` every 2.5s and shows each step; `lib/agent/week-narration.ts` renders the result (client-safe). Max one run per 6h (it returns the existing one).
- **Brand kit** (`lib/brand-kit.ts`, settings `brand`): logo (scored in `lib/brand-logo.ts`: header/nav image linked home, schema.org `Organization.logo` / `og:logo` on the same site and brand-named files win; client/partner logo strips, off-site images and alt text naming another company lose; icons are the fallback; `npx tsx scripts/test-brand-kit.ts`), colours (theme-color, CSS vars, buttons, weighted) and font read from the site, editable in the "Your brand & voice" thread. **Social images** (`lib/social-card.ts`): 1080² PNG, brand colour background, 4-5 word headline, logo on a white or dark tile chosen by the logo's lightness. Text only (Inter OFL from `scripts/assets/blog-cover`, resvg; `serverExternalPackages`), never stock or AI-made. Returns null if the headline has letters Inter can't draw.
- **Image styles** (`lib/post-images.ts` `postImageFor()`, settings `images`, panel "How your images look" in the brand thread, 2026-11-18): `card` (the text card above, default), `photo` (owner's own photos from their Google listing, their own domain or chat upload → `lib/brand-photos.ts` library `brand_photo`, `lib/photo-render.ts` overlay, EXIF/GPS stripped), `ai` (OpenAI scene, owner opt-in, labelled "AI-made picture", never people/faces/text/logos; only for the owner's own posts, never Alphaa's site), or a Canva design/brand template. Falls back to the card on any failure. The public demo week stays on text cards.
- **Brand library** (`lib/library/`, panel "Your brand library" in the brand thread via `imagesMessages`, `/api/agent/library`, 2026-11-18): owners link a brand book PDF, photos and videos from Google Drive (Picker, `drive.file` only, own grant `drive_account`, `/api/library/drive/connect|callback|token`) or Dropbox (Chooser, shared preview link). MockActivity `brand_asset` rows keep the LINK + ≤400px preview (`asset_thumb`) + Haiku vision tags, never the file; cap 300. Ingest runs in the background per brand (`ingest.ts`). Brand book → Sonnet PDF read → "Here’s what I learned from your brand book" chips (brand kit colours/font, `voice.rules` in `voiceText()`). `nextPhoto(userId, topic)` uses library photos first (Use this next → topic tags → least used), read fresh each time; unreadable files go `missing` with one `library_missing` ledger row. Videos: "Use this next" → next FB/IG `social_post.videoAssetId` → `/api/asset/[id]` (public, HMAC-signed, Range, streams) → FB `/videos file_url`, IG Reels. Hidden until `GOOGLE_PICKER_API_KEY` / `NEXT_PUBLIC_DROPBOX_APP_KEY`. Direct uploads stay `brand_photo`.
- **Canva** (`lib/canva/`, `/api/canva/connect|callback`, `/api/agent/canva`, Pro and up): Connect API OAuth PKCE, encrypted tokens (`canva_account`), refresh tokens single-use (always save the new one). Use my designs (export → post image), Edit in Canva / Bring it back, brand template autofill when the account has it. Hidden until `CANVA_CLIENT_ID`/`CANVA_CLIENT_SECRET`.
- **What's working in your niche** (`lib/niche-posts.ts`, thread `niche`, card under insights, `/api/agent/niche`, `/api/cron/niche-posts` Sun 08:00 UTC): Apify IG hashtag / TikTok / rivals' IG+FB posts (hard `maxItems` + `maxTotalChargeUsd` caps) + Meta Ad Library if `META_AD_LIBRARY_TOKEN` (US/CA returns little: Meta only exposes political ads outside EU/UK). Stores link, handle, real metrics and our paraphrase only, never captions. "Make my version" writes an original post. Feeds the week plan as `niche:*` facts.
- **Tracking that checks itself** (`lib/tracking.ts`, `lib/tracking-events.ts`, `lib/tracking-health.ts`, `/api/tag/event`, `/api/cron/tracking-health` 07:00 UTC): reads GTM containers too, lists lead points, beacons each lead (counts only, `tracking_event`), signed `?alphaa_test=` self-test confirmed via our beacon + GA4 realtime + Meta CAPI `events_received`, optional owner CAPI token (encrypted, GPC respected), auto-fixes duplicates/missing WP output. WP plugin 1.4.0. Google Ads conversion import: not built.
- **Trends** (`lib/trends.ts`): Opus + `web_search_20260209`. A trend is kept only if its URL appears in the returned search/code-execution blocks. Handles `pause_turn`, caches non-empty results for 3 days.
- **Voice input**: Web Speech API mic in the chat bar ("Hey Alphaa" prefix stripped); replies are read aloud with speechSynthesis when the owner spoke.
- **Public first week** (`lib/demo-week.ts`, `/api/scan/week` + `/img`, stored on the ScanLead as `ogData.demoWeek` / `demoWeekImages`): after the free AI check on /start (and the homepage box, which hands off to /start), the visitor's email unlocks a real first week: 1 Google update + 2 social posts with branded images, in their voice, planned around the AI answers and live trends. One per email (a repeat returns the first), 3 per IP a day, `DEMO_WEEK_DAILY_CAP` (default 150) across everyone. StartAgent: `weekGate()` → `runWeekDemo()` → `priceMessage(scanId, true)`. **/start rebuild (2026-11-27)**: orb header + orb avatar; email asked ONCE (the ask while scanning; if unanswered, the week gate is the only other ask and the first form is removed). After the AI answers: grounded FAQ draft (`/api/scan/quick-fix`, Opus 5.5 structured, reads homepage + pricing + About via `lib/site-facts.ts` (cached 10 min), every number must appear on the site, one retry, else hidden), then 3 cards from `lib/scan-snapshot.ts` via `POST /api/scan/snapshot` (called at scan start to warm the brand read, again after the result; saved as `ogData.snapshot`): brand (brand kit + Haiku 5.5 tone line + a quoted title/summary/heading mismatch only when verified), content (site-check blog date/count, homepage social links, 2-3 page ideas tied to the AI questions, numbers only from the questions/site), competitors (AI-named rivals through `blockedHost`, what their site has that this one lacks). Then ONE finished social post before the email (`POST /api/scan/week/teaser`, `ogData.demoTeaser` + `demoTeaserImage`, image `/api/scan/week/img?n=t`; the week reuses it as one of its 2 posts). The close (`pitch()`) = "What I'd do this week" across AI search / website & blog / social / Google / email / competitors / ads (early access), tied to the findings, Autopilot described truthfully, Pro $499 → `/signup?plan=pro_monthly&scan=`, Starter $99 (AI search only) and Growth early access as chips. Public caps `teaser` 10/IP 500/day, `snapshot` 30/IP 1,500/day. Site check: About = homepage link/words, sitemap or a probe of /about, /about-us, /company, /team, /our-story with a soft-404 guard; reviews count testimonial sections; FAQ/blog also from the sitemap; no Bing tag = "can't tell" (null), never "No".
- **Social posting** (`src/lib/social/`): own OAuth apps per platform (Varun's choice, 2026-11-17): Meta (Facebook Pages + linked Instagram), LinkedIn (profile; Pages with `LINKEDIN_ORG_SCOPES=1`), TikTok (photo Direct Post; private until `TIKTOK_AUDITED=1`), X (OAuth2 PKCE). A provider is "coming soon" until its env keys exist (`providerConfigured`). Accounts = MockActivity `social_account` (tokens AES-GCM encrypted via `encryptSecret`); queue = `social_post` (draft/scheduled/published/partial/failed, per-account results). `/api/social/connect|callback/[provider]` (state HMAC-signed and bound to the signed-in brand), `/api/agent/social` (approve/post_now/unschedule/delete/disconnect), `/api/cron/social-publish` every 10 min (scheduler `setInterval`). Social images are JPEG (Instagram/TikTok reject PNG). The week run queues its social posts on connected accounts: scheduled if `autopilot.social === "auto"`, else drafts. Threads: `social`, `channels` (every channel's status). Setup checklist: docs/growth-platform-applications.md. **Post stats** (`lib/social/stats.ts`): LinkedIn company Page posts get views/likes/comments/reposts/clicks from `organizationalEntityShareStatistics` saved on `PostResult.stats`; `/api/cron/social-stats` daily 04:00 UTC + a background refresh when the Social thread opens (6h stale). Personal-profile posts have no app-readable stats (the thread says so).
- **Ad plan** (`lib/ad-strategy/`, thread `adplan` (rail: Marketing → Your ad plan), `/api/agent/adplan`, printable `/dashboard/ad-strategy` (browser "Save as PDF"), MockActivity `ad_strategy`, Pro + Growth, built 2026-11-25 from the GIGABOOST ads handoff): `playbook.ts` = Alphaa's built-in ad knowledge (formats + hit rates, hook types in priority order, specs, licensed-music sources, AI rules, kill/hold/scale thresholds, legal + per-vertical rules), versioned (`PLAYBOOK_VERSION`, review monthly, `NEXT_REVIEW`). Not shown as a manual. `generate.ts` (background, in-process `inFlight`): competitors' active Meta ads via Apify `apify~facebook-ads-scraper` (3 competitors × 8 ads, ~$0.005/ad; Meta's own Ad Library API only returns political ads in US/CA), then 2 Opus 5.5 structured calls: (1) vertical/b2b/local, 2 angles, clichés/gaps, ~24 hooks, Meta/LinkedIn/Google statics; (2) 12 scripts scene by scene with 3 hook swaps. Every line goes through the gads `copyProblem` claims check (numbers only from facts, no superlatives, platform char limits); a script with one bad line is dropped. Code (`rules.ts`) decides the budget split (local: Meta 60/Google 40; B2B adds LinkedIn when its share ≥ $10/day), creatives judgeable ($60 each on Meta, $250 on LinkedIn) and the vertical rules. Meta statics get images via `postImageFor`. No video rendering yet (scripts + statics). Tests: `npx tsx scripts/test-ad-strategy.ts`.
- **Email outreach** (`lib/email-campaigns/`, thread `email`, `/api/agent/email` + `/upload`, `/api/cron/email-campaigns` daily 15:00 UTC, Pro and up since 2026-11-26 (was Growth), built 2026-11-20): the owner pastes customers or uploads a CSV (consent checkbox required, each import logged as `email_import` with the consent text = CASL/CAN-SPAM proof), list = one `email_contacts` row (cap 2,000). Business mailing address is required (`emailOutreach.address` in agent settings) and goes in every footer. `write.ts` (Opus 5.5, structured) writes subject/preview/2-4 paragraphs + a button that only links to the owner's homepage or their published blog posts; rejected (1 retry, then a plain template) on any number, price or offer not in the facts or the owner's note, hype words, dashes, AI names. Owner approves (or autopilot `email: "auto"` = the monthly cron sends it). Sent from "<Business>" <RESEND_FROM_EMAIL>, reply-to the owner, Resend batch 50 at a time, recipients frozen on the campaign so a restart resumes (cron picks up stale `sending`). Max 1 send per brand per 7 days, 1 auto draft per 28 days. Unsubscribe = signed `c_<userId>.<sha256>` subject → `email_optout` row for THAT business only + removed from the list; re-read before every batch. Bounces/complaints: `/api/webhooks/resend` (svix, `RESEND_WEBHOOK_SECRET`, events email.bounced + email.complained) reads the `alphaa_brand`/`alphaa_campaign` tags every campaign email carries; a hard bounce or spam complaint = `email_optout` (reason) + removed from the list + counted on the campaign; complaints also log `email_complaint` (ledger). Untagged mail is ignored.
- **Extra brands** are 50% off: `isExtraBrand()` (lib/billing.ts) → checkout adds the `EXTRA_BRAND_50` coupon (self-created if missing).
- **Usage metering** (`lib/usage.ts`, fixed 2026-11-20): `installUsageMeter` wraps `messages.create`; **every file gets its client as `const anthropic = claudeFor("<feature>")`** (lib/claude.ts; never import the bare `anthropic`, never `new Anthropic()` without `installUsageMeter` + `tagClient`). Attribution via AsyncLocalStorage: `auth()` and `currentUser()` create the context with `usageCtx()` BEFORE their first await (a store entered after an await never reaches the caller); crons call `asUser`. Per brand per day in MockActivity `usage_day` (tokens by model, `features`, `searches`), no-brand calls (public scans) in `usage_house` on the founder account; flushed every 30s. Founders: `/dashboard/admin/usage` (cost by brand and by feature, list prices built in, `AI_PRICES_JSON` overrides).
- **Usage + quotas (2026-11-27)**: ONE ledger = the `usage_day` rows above. `tallyUsage(userId, key, n)` adds a count (was `countUsage` before 2026-11-27), `countUsage(userId, kind, "day"|"week"|"month")` / `usedSince()` read it back (stored rows + what's still in memory, so bursts see their own uses). Periods are UTC: day, Monday week, calendar month. Numbers + pure logic: `lib/quota-rules.ts` (BASE_QUOTAS per plan none/starter/pro/growth, `limitsFor`, `decide`, `createLimiter` = per-brand lock so N parallel requests can't all take the last slot, first-person `quotaMessage`, `QuotaError`). DB wiring: `lib/quotas.ts`: `checkQuota(user|id, kind, {n, record})` (records when allowed; `record:false` only looks), `requireQuota` / `withQuota` (throws QuotaError, refunds when the work fails), `quotaHere`/`withQuotaHere` (brand from the request/cron context), `quotaBody(e)` → `{error, quota:true}` 429, `cronAllowed(name)`, `publicHit(name, req)`, `ownerUsage(user)`. Comped/founder accounts are measured against Growth's numbers and never blocked (logged). QUOTAS_JSON overrides any number. Tests: `npx tsx scripts/test-quotas.ts`.
  - **Kinds**: `ai_cost_usd` (tokens × lib/ai-prices.ts list prices + $0.01/web search), `search` (Claude web_search, auto-counted, + Apify SERP pages), `apify_usd` (each run at its charge cap/estimate), `image_gen`, `scan`, `engine_check` (one question to one AI engine; scanAllEngines = 4), `sandbox_question`, `content_piece:blog|gbp|social|email|review|draft`, `publish:social|gbp|site`, `email_send` (recipients), `ad_plan`, `ad_change` (Growth: × ad accounts), `week_run`.
  - **Per-plan numbers** (day / week / month): Starter: AI $1/day $10/mo, blogs 4/mo (2 promised + 2 regenerations), sandbox 20/day, engine checks 150/day 1,000/mo, scans 3/day 15/mo, searches 20/day 120/mo, Apify $0.50/day $1/mo, images 3/day 8/mo, drafts 10/day 30/mo, week runs 2/wk 6/mo, site publishes 2/day 4/mo; Pro-only kinds get small caps (the plan gate in billing.ts says no first; quotas protect cost, gates decide features). Pro: AI $4/day $40/mo, blogs 8/mo, Google posts 6/wk 26/mo (4/wk promised), social 10/wk 30/mo (3/wk promised), customer emails 8/mo, review replies 10/day 150/mo, drafts 30/day 100/mo, sandbox 50/day, engine checks 320/day 2,500/mo, scans 5/day 30/mo, searches 60/day 400/mo, Apify $2/day $8/mo, images 6/day 40/mo, publish social 3/day 7/wk, Google 2/day 6/wk, site 3/day 10/mo, email recipients 2,000/day 10,000/mo, ad plans 2/mo, week runs 3/wk 12/mo. Growth = Pro + AI $8/day $80/mo, searches 100/day 600/mo, Apify $3/day $15/mo, images 8/day 60/mo, ad plans 4/mo, ad changes 30/day per ad account. No plan (first 14 days / cancelled): AI $0.50/day $3/mo, sandbox 5/day, blogs 3/mo. Real per-brand AI cost when set (prod usage_day, 30 days to 2026-11-27, founder/comped brands only, no paying customers yet): $0.01-$0.19 per active day, max day $0.44, max month $0.93; platform max day $0.59. The ceilings are 2-20x that so normal use never hits them; they stop runaway loops.
  - **AI ceiling** = the meter itself (`installUsageMeter`): every Claude call is costed as it lands (`addCost`), an estimate is held while it's in flight (`estimateCallCost`), and a brand over its day/month `ai_cost_usd` gets a rejected promise (QuotaError) before the call leaves the server. Brand totals load once and reload every 10 min (`loadBrandCost`); the first call of a day is allowed while they load. Public/house calls aren't capped per brand (public endpoints have their own caps). **Platform**: `AI_DAILY_BUDGET_USD` (default $20) over everyone today → `cronAllowed()` false for the non-essential crons (ads-tune, checks, competitors, content, convert, gbp-posts new drafts (scheduled posts still go out), niche-posts, nurture, questions, review-drafts, visibility-scan). Essential = publishing/sending already-made work, stats, weekly briefing.
  - **Enforced at**: writers (`writePost` blog, `writeSocial` social, `generateGbpPost` gbp, `writeMeta`/`writeLocationPage` draft in lib/content.ts + gbp-poster.ts; `writeCampaign` email; `draftReviewReply` review), so every route/cron/chat tool/agent-op/week run that writes goes through them; `/api/agent/draft` FAQ path (draft); gbp-posts cron (gbp + publish:gbp, over = kept as draft); `startWeekRun` (week_run; per-piece quota hits become run notes); `scanAllEngines` (engine_check ×4; question scan pre-checks room for all its questions, visibility scan needs scan + 4 checks); sandbox routes (sandbox_question, replaced the old 10/rolling-24h count; the page reads the same quota); images (`generatePostImage`, `aiScene` → no picture / text card); Apify (`runActor`, niche `actor`, research `runApify`, ad-library), SERP (`googleSearch` → search), trends (search pre-check, empty list when out); ad plans (adplan route, workspace auto-start, `startStrategy`, Google/Meta `plan` ops), ad changes (Google create, Meta approve); publishing (`publishPost` social: a QuotaError leaves a scheduled post scheduled so it goes out when room opens; `approveGbpPost` + `/api/gbp/posts/[id]/publish`; `publishContent` + WordPress post/page in `pushChange`); email (`startSend` recipients). Routes turn a QuotaError into 429 `{error, quota:true}` with the owner-facing sentence; crons log and skip.
  - **Public caps** (per UTC day, in memory, signed-in visitors skip the per-IP cap): `/api/scan` 5/IP, 300 total; `/api/scan/identify` 30/IP, 1,500; `/api/scan/quick-fix` 10/IP, 500 (QUOTAS_JSON `public`). The demo week keeps its own caps (3/IP, DEMO_WEEK_DAILY_CAP).
  - **Visibility**: `/dashboard/admin/usage` adds "Usage vs plan quota" (AI today/month vs ceiling, every kind at 50%+, yellow at 80%, red at 100%, platform vs budget). Owners: "This month" card on Your rules (`components/dashboard/UsageCard.tsx` ← `GET /api/usage` ← `ownerUsage`: posts written/published, AI checks, searches, live questions, emails; counts only, never money). `/api/cron/usage-alert` (hourly) emails ADMIN_EMAILS (not the comp list) once per UTC day when a brand passes 80% of its daily AI ceiling or the platform passes 80% of the budget (MockActivity `usage_alert` on the founder account, `?dryRun=1`).
- **Extra ad accounts (2026-11-27)**: the allowance is a TOTAL across platforms (Varun: "1 ad account means 1 ad account. Google + Meta = 2 ad accounts."). Growth includes 1 ad account; each add-on unit adds 1 more on Google or Meta, so using a Google Ads account and a Meta ad account takes 1 add-on. Rules (pure, tested): `lib/ad-account-rules.ts` (`allowanceFor`, `accountsAfter`, `adAccountDecision`, `adAccountLimitMessage`); state: `lib/ad-accounts.ts` (`adAccountState`, `adAccountAllowance(user)` = 1 + agent settings `billing.extraAdAccounts` on Growth, Infinity for comped, 0 otherwise). An account is in use when it's the brand's pick on its platform or still has a campaign of ours turned on (Google: latest enable/pause in `ads_change`; Meta: active built campaigns); the same platform's old pick is replaced, the other platform's pick stays. `checkAdAccount(user, "google"|"meta", id)` blocks picking, building or turning on ads in one more account than allowed (402 + "Your plan covers 1 ad account in total, Google or Meta…"); pausing is never blocked. Copy everywhere: "+$200/month per additional ad account (Google or Meta)". Checkout: Growth `{ purchase: "growth", extraAdAccounts: 0..20 }` adds the add-on line item for the same interval (`verifiedAddonPrice` checks amount/interval/metadata); an existing Stripe sub gets the plan item switched and the add-on item set/removed (`planItem()` finds the plan item whatever the order). Webhook (`checkout.session.completed`, `customer.subscription.updated|deleted`) writes `billing { extraAdAccounts, subscriptionId, at }` via `saveAdAllowance`, and maps the plan with `planItem()` (an add-on item first in the list used to read as Starter). The stepper (`UpgradeButton` `addon`) shows on /dashboard/upgrade?plan=growth and as "Ad accounts" on Billing only while `GROWTH_ON_SALE`. The extra-brand 50% coupon applies to the whole subscription, add-on included.
- **Usage credits (2026-11-27)**: one balance per brand, bought in one-time packs (50 credits $25, 120 $50, 300 $100; EUR/GBP/AED options), each pack expires 12 months after purchase. Rules (pure, tested): `lib/credit-rules.ts` (`CREDIT_PACKS`, `BASE_CREDIT_COSTS` + `creditCost(kind)` with QUOTAS_JSON `{"credits":{kind: n}}`, `replay()` = balance/lots/spent today+month/expired, `grantEntry`, `refundEntry`, `aiHeadroom`). Costs: blog 5, social 1, Google 1, customer email 3, review reply 0.5, ad plan 10, week run 8, AI image 1, sandbox question 0.2, engine check 0.1, web search 0.2, scan 2 (Varun's), plus ours: draft 1, publish social/Google 0.5, publish site 1, email recipient 0.01, ad change 0.5, Apify $1 = 4, AI headroom $1 = 10. Storage: `lib/credits.ts`, MockActivity `credit_ledger` rows (`purchase` / `spend` (negative = give-back) / `refund`), settings `credits.autoUse` ("Use credits when I run out", turned on by the first purchase unless the owner turned it off).
  - **How they meet limits**: `createLimiter(store, creditProvider, creditCost)` (quota-rules): plan quota first; over it, if the call allows credits, auto-use is on and the balance covers `cost × n`, it spends inside the same per-brand lock (no double-spend) and lets it through (`decision.credits`); otherwise the decision carries `buy {need, balance, autoUse}` and the sentence gets " Buy more credits to keep going now." (or how to turn auto-use on). Credits are spent only in an owner's own request (`ownerRequest()` in lib/usage.ts = the auth()/currentUser() context) or when a path the owner started passes `credits: true` (the adplan route's `startStrategy`); crons and background work never spend them (`credits: false`, e.g. the Ads page auto-start). The week run started by the owner inherits the request context, so its pieces can use credits. `refundQuota` also gives back credits spent in the last 15 min for that kind. The daily AI ceiling and the platform budget stay hard limits: credits spent today raise that brand's daily and monthly AI ceiling by $1 per 10 (`noteCreditsSpent` → BrandCost.creditsDay/Month), and in an owner's request a brand at its AI ceiling auto-spends 10 credits for +$1 (`buyAiHeadroom`, one at a time). Never the platform budget. Comped accounts never need credits.
  - **Buying**: `POST /api/stripe/credits { pack }` → Checkout mode=payment (`verifiedCreditPrice`: active, USD, one_time, amount, metadata), session + PaymentIntent metadata `{ alphaa_credits, userId }`, market currency like plans, 1h expiry. Webhook `checkout.session.completed` (mode payment, `payment_status: paid`) → `grantCredits` (idempotent by session id). `charge.refunded` → `refundCredits` (by PaymentIntent; full refund removes what's left of the pack, partial a proportional share; idempotent per charge + refunded amount). **`charge.refunded` must be enabled on the Stripe webhook endpoint (we_1UUwH7…, alphaa.app/api/webhooks/stripe)**; it was not on 2026-11-27. **Shopify-billed merchants can't buy credits** (App Store billing; a one-time `appPurchaseOneTimeCreate` flow would need a new webhook topic deployed with the Shopify CLI): the sheet and the card show "Upgrade your plan in Shopify" instead, and `/api/stripe/credits` refuses.
  - **UI**: `components/workspace/CreditsSheet.tsx` (mounted in WorkspaceShell) watches every dashboard API answer; a 429 with `quota: true` (quotaBody adds `buy`; approvals, schedule, site-post, email send, week, draft, sandbox, social pass the flag) or any 429 from `/api/agent/*` shows the sentence in a sonner toast with "Buy more" → the sheet (balance, next expiry, 3 packs, the auto-use switch; costs come from `GET /api/credits`). `openCredits()` opens it from anywhere. "This month" card (Your rules) shows the balance + "Buy credits". `/dashboard/admin/usage` "Usage credits": balance, purchases, bought/paid, spent in 30 days by action, refunded/expired.
- **Guided setup** (`lib/agent/setup.ts`, `/api/agent/setup`, thread `setup`, settings `setup`): a card pinned above the briefing ("3 of 7 done") asks one step at a time: Google, website, voice, brand + images, autopilot, on Pro social, and on Pro tracking (tested). Done = real state; brand/voice/autopilot can be confirmed as-is. Steps waiting on us (no social app keys) show "Opening soon" and aren't counted. DashboardAgent keeps it in its own slot (`setupMsgs`, ids `setup`) and re-fetches it after each change. Hidden once the owner closes the finished card.
- Owner choices use the generic `agent-op` chip (`POST /api/agent/<endpoint>`, optional form first). The returned messages replace the old copies with the same id, so a panel redraws instead of stacking.
- **Draft dedupe** (`lib/draft-dedupe.ts`, 2026-11-18): the gbp-posts cron skips a listing that has an unapproved draft from the last 14 days or a scheduled post still to go, and passes the last 5 posts to the prompt (prod had up to 22 near-identical "Looking for a … in Ottawa?" drafts per user). `/api/agent/week` POST and `/api/agent/draft` (post/gbp/social) run one at a time per brand (`once()`), and a draft for the same topic from the last 15 min is returned instead of a new one. `createPost()` returns the waiting post with the same text from the last 24h. The briefing collapses near-identical drafts (`draftKey`).
- **Saved draft editor + version history (2026-11-28)**: website/blog drafts (`post_draft` rows) are edited in `components/editor/DraftEditor.tsx` (Markdown textarea + toolbar H2/H3/bold/link/lists, ⌘B/⌘K/⌘S, Write/Preview via `mdToHtml`, mobile = one column). Edits autosave (1.2s debounce) via `PUT /api/workspace/drafts/[id]` into `metadata.markdown/title` (+ `rev`, `editedAt`, `editedBy`); `baseRev` refuses a stale tab (409 → "Load the newest / Keep mine"); unsent text is kept in localStorage until saved. **The saved text is what every publish path sends**: `approveSitePost` (Research "Draft it", schedule cron, email approvals) and `/api/connect/wp/push` (chat) call `textToPublish()` (text passed in is saved first) and `markPublished()` after success; the chat's "Publish it"/"Email it" re-read the saved draft when the card wasn't edited (`savedDraftText` in DashboardAgent). Published drafts are read only. Versions = MockActivity `post_revision` rows (`{draftId, markdown, title, by: owner|agent, reason: original|save|publish|ai_rewrite|restore}`, lib/draft-versions.ts) written only at checkpoints (first edit keeps the agent's original, "Save version", publish, restore, `saveAiRewrite()` for any future AI rewrite), never per keystroke; excluded from the chat/memory/feed activity lists. History shows when/who, a word diff (`lib/text-diff.ts`) and Restore (keeps the current text as a version first). Opened from chat doc blocks that carry `draftId` (content thread, "Write a post", week run), Research "Draft it" (Edit / "Fill in the facts") and Briefing → Going out soon (Edit on website posts). `DRAFT_SAVED_EVENT` (components/editor/events.ts) keeps every open view in sync.
- **Content graders (2026-11-28, pure code, `lib/content-grade.ts`)**: direct answers (each H2/H3 ending in "?" or starting how/what/why/when/where/who/can/does/is needs a first paragraph of 40-60 words that stands alone; flags short/long/missing/list-first/opens with "It/This/Yes"); readability (Flesch-Kincaid grade ≤8, avg sentence ≤20, sentences >25 words, passive share ≤10%, paragraphs >80 words or >4 sentences). Score 0-100 (answers 40% when there are question headings). `components/editor/GradeCard.tsx` shows it live in the editor and compact in the publish flow (chat draft cards, Research "Draft it"). Advice only, never blocks publishing. Tests: `npx tsx scripts/test-content-grade.ts` (pure) and `scripts/test-draft-versions.ts` (needs a local throwaway Postgres, see header).
- **Ads need a city**: the Google and Meta ads `plan` ops answer with `askCityMessages()` (`lib/agent/city.ts`: "Add my city" agent-op form → `POST /api/agent/city` saves `User.city`/`state`, then offers the plan chip again) when the profile has no city, instead of failing or guessing.

### Webhooks
- `/api/webhooks/clerk`: Creates `User` row on `user.created`, sends welcome email; deletes on `user.deleted`. Verified with Svix.
- `/api/webhooks/stripe`: Handles `checkout.session.completed` (subscriptions; credit packs in mode payment), `customer.subscription.updated/deleted`, `charge.refunded` (credit packs), `invoice.payment_succeeded/failed`. Updates `User.subscriptionStatus` and `User.plan`.
- `/api/webhooks/shopify/{topic}` (HMAC-verified, `lib/connector/shopify-webhooks.ts`; topics declared in `shopify-app/shopify.app.toml`, deployed by the owner with the Shopify CLI): `app/uninstalled`, `app_subscriptions/update`, and the 3 GDPR topics.
- **Shopify billing (Managed Pricing, `lib/connector/shopify-billing.ts`)**: App Store merchants pay for Starter, Pro or Growth through Shopify. Paid state = `stripeSubscriptionId: "shopify:<shop>.myshopify.com"` + `subscriptionStatus: "active"` + `plan` from `shopifyPlanFor()`: the Partner Dashboard plan name containing "growth" / "pro" / "starter" wins (expected names: "Starter", "Pro", "Growth"; yearly variants may add "yearly"), else the recurring price vs `PLAN_PRICES` (EVERY_30_DAYS = monthly price, ANNUAL = annual×12 or annual), default `starter`; with overlapping subs the highest plan wins, and a plan change re-writes `plan` (no schema change; `hasPaidPlan()` and the crons' "stripeSubscriptionId not null" filters cover it). Set by the Shopify OAuth callback (queries `currentAppInstallation.activeSubscriptions`; no plan and not Stripe-paid/comped → redirect to Shopify's hosted plan page) and by `app_subscriptions/update` (re-reads subscriptions with the shop token). Cleared on ended statuses and on `app/uninstalled`/`shop/redact`. Never overwrites a live Stripe sub; Stripe webhooks never match the marker. `test: true` charges count only when `NODE_ENV !== "production"` or the user is in `FOUNDER_EMAILS`. `/api/stripe/portal` sends Shopify-billed users to the Shopify plan page.

---

## 7. API Routes Inventory

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/scan` | Public | Public visibility scan — runs Claude audit + AI engine scan + OG fetch in parallel; stores `ScanLead` |
| GET | `/api/scan/result` | Public | Poll for scan result by `scanId` |
| POST | `/api/dashboard/scan` | Clerk | Authenticated dashboard scan — saves `Audit` + `AiEngineResult` records |
| POST | `/api/crawl` | Clerk | Crawls user's `websiteUrl`, saves `CrawlResult` |
| GET | `/api/crawl/latest` | Clerk | Returns most recent `CrawlResult` for user |
| GET/POST | `/api/competitors` | Clerk | List competitors (GET) or analyze + save new competitor (POST) |
| GET/PUT/DELETE | `/api/competitors/[id]` | Clerk | Get, update, or delete single competitor |
| POST | `/api/content-gaps` | Clerk | Run content gap analysis vs a competitor URL, save `ContentGap` |
| POST | `/api/gbp/generate` | Clerk | Generate a GBP post draft with Claude, save as `GbpPost` status=draft |
| POST | `/api/gbp/generate-month` | Clerk | Bulk generate a month of GBP posts |
| GET | `/api/gbp/posts` | Clerk | List GBP posts for user |
| GET/PUT/DELETE | `/api/gbp/posts/[id]` | Clerk | CRUD single GBP post |
| POST | `/api/gbp/posts/[id]/publish` | Clerk | Publish draft post to GMB API |
| POST | `/api/gbp/reviews/[id]/reply` | Clerk | Post AI-generated reply to a GMB review |
| GET | `/api/integrations/google/connect` | Clerk | Generate Google OAuth URL + redirect |
| GET | `/api/integrations/google/callback` | Public (state-validated) | Handle OAuth callback, store tokens |
| POST | `/api/integrations/google/disconnect` | Clerk | Delete Integration record |
| GET | `/api/integrations/google/status` | Clerk | Return integration status + selected properties |
| GET | `/api/integrations/google/properties` | Clerk | List available GA properties + GSC sites + GMB locations |
| POST | `/api/integrations/google/save-properties` | Clerk | Save selected GA/GSC/GMB property IDs |
| POST | `/api/integrations/sync` | Clerk or internal header | Sync GSC keywords + GA snapshot + GMB reviews |
| POST | `/api/schema/generate` | Clerk | Generate JSON-LD schema markup with Claude, save `SchemaMarkup` |
| GET | `/api/schema/latest` | Clerk | Return most recent `SchemaMarkup` for user |
| POST | `/api/stripe/checkout` | Clerk | Create Stripe Checkout session for subscription |
| POST | `/api/stripe/portal` | Clerk | Create Stripe Customer Portal session |
| GET | `/api/stripe/trial-status` | Clerk | Return trial days remaining + subscription status |
| POST | `/api/user/onboarding-complete` | Clerk | Mark `onboardingCompleted = true` |
| GET | `/api/reports` | Clerk | List reports for user |
| POST | `/api/concierge` | Clerk | Retired 2026-11-18 (returns 410). `/dashboard/concierge` shows "no longer offered" |
| POST | `/api/sandbox/ask` | Clerk | Live multi-engine question. Rate-limited via `sandbox_query` activity rows; persists verdicts as `sandbox_result` rows (evidence source) |
| POST | `/api/webhooks/clerk` | Svix-verified | Handle Clerk user lifecycle events |
| POST | `/api/webhooks/stripe` | Stripe-verified | Handle Stripe billing events |
| GET | `/api/cron/weekly` | Bearer token | Generate weekly reports + send emails |
| GET | `/api/cron/gbp-posts` | Bearer token | Draft GBP posts on the plan's schedule (auto-publish only for Pro + `autoPublishPosts`) |
| GET/POST | `/api/credits` | Clerk | Credit balance, packs, costs, Shopify/comped flags (GET); "Use credits when I run out" switch (POST `{ autoUse }`) |
| POST | `/api/stripe/credits` | Clerk | One-time Checkout for a credit pack `{ pack: 50|120|300 }` (not for Shopify-billed or comped) |
| GET | `/api/usage` | Clerk | The owner's "This month" usage vs what the plan includes (lib/quotas.ts ownerUsage) |
| GET | `/api/cron/usage-alert` | Bearer token | Hourly; one founder email a day at 80%+ of a brand's AI ceiling or the platform budget |

---

## 8. Shared Components Inventory

### `src/components/layout/`
- **`DashboardSidebar`** — `"use client"`. Fixed 224px (`w-56`) sidebar. Nav groups: Getting Found, Your Reputation, Content, Research. Active state uses `bg-brand-orange/15 text-brand-orange`. Settings and Upgrade Plan links in bottom section.
- **`DashboardTopBar`** — `"use client"`. Receives `AppUser` prop. Shows business name, location, trial countdown badge (amber, only when ≤7 days left). Clerk `<UserButton>` themed orange.
- **`MarketingNav`** — Marketing site navigation.
- **`Footer`** — Marketing site footer.

### `src/components/common/`
- **`GlassCard`** — Wrapper div with `glass-card rounded-2xl p-6`. Props: `hover` (hover border/bg transition), `glow` (hover shadow-glow-sm), `className`, `style`.
- **`HeadlineWithSerif`** — Splits headline into plain text + one `serif-italic text-brand-orange` word. Props: `before`, `serifWord`, `after`, `as` (h1/h2/h3).
- **`MonoNumber`** — Wraps children in `font-geist-mono tabular-nums` span.
- **`OrangePillButton`** — Button or Link. Variants: `primary` (uses `.btn-orange`), `ghost` (uses `.btn-ghost`). Sizes: sm/md/lg. Has loading spinner. Renders `<Link>` if `href` passed, otherwise `<button>`.
- **`ScoreRing`** — SVG circular progress ring. Color: green (≥75), orange (≥50), red (<50). Props: `score`, `size` (default 88), `strokeWidth` (default 7).
- **`SectionLabel`** — `text-xs uppercase tracking-[0.18em] text-brand-orange` span.

### `src/emails/`
- **`WelcomeEmail`** — Sent on user.created. Props: `firstName`, `businessName`, `trialEndDate`.
- **`WeeklyReportEmail`** — Weekly summary with posts, reviews, keyword movers, visibility delta.
- **`AuditResultsEmail`** — Audit results with score + engine found count.
- **`PaymentFailureEmail`** — Payment failure with amount, retry date, update URL.

---

## 9. Styling Conventions

### Color System
Dark, warm palette. Primary background is near-black `#0A0806`. Brand accent is orange `#FF6B1A`.

```
bg-bg-primary   #0A0806   — page background
bg-bg-secondary #13100C   — sidebar, top bar, card surfaces
bg-bg-tertiary  #1F1812   — slightly lighter surface
brand-orange    #FF6B1A   — primary CTA, active nav, accent text
brand-orange-light #FF8845 — hover state
text-white/[opacity] — most text uses white with opacity (white/40, white/60, white/80, white/85)
text-muted / #A8A29E — secondary text color
cream / #F5EDE0 — used for light surface elements
```

Status colors (not in Tailwind config, use standard Tailwind): `text-green-500` (#22C55E), `text-amber-400`, `text-red-500` (#EF4444).

### Typography
- **Sans**: Inter Tight (loaded via Google Fonts). Body text default.
- **Serif italic**: Instrument Serif italic, via `.serif-italic` CSS class or `font-serif` + italic. Used for decorative headline words.
- **Mono**: Geist Mono via `.mono` CSS class or `font-mono`. For numbers and code.

### Component Patterns
- Cards: use `<GlassCard>` or raw `glass-card` CSS class (white/3% bg, white/8% border, backdrop-blur-12px).
- Buttons: `<OrangePillButton>` for CTAs. Raw classes: `.btn-orange` (filled orange pill), `.btn-ghost` (transparent orange border pill).
- Borders: `border-white/[0.06]` for structural dividers, `border-white/[0.08]` for card borders.
- Rounded: `rounded-2xl` for cards, `rounded-full` / `rounded-lg` for buttons and nav items.
- Glow effects: `shadow-glow` (40px), `shadow-glow-sm` (20px), `animate-pulse-glow`.
- Background texture: `.dot-grid` is a fixed radial-gradient dot pattern at 3% opacity — always present via root layout. `.radial-bg` / `bg-radial-warm` for warm gradient backgrounds on marketing pages.
- All transitions default to 200ms.

### Tailwind Usage
- Use `cn()` from `@/lib/utils` for conditional classes (clsx + tailwind-merge).
- Custom Tailwind tokens available: `bg-brand-orange`, `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`, `text-muted`, `shadow-glow`, `shadow-glow-sm`, `shadow-card`, `rounded-card` (24px), `font-sans`, `font-serif`, `font-mono`, `text-hero`, `text-section`, `bg-radial-warm`, `bg-radial-hero`, `animate-pulse-glow`, `animate-fade-up`, `animate-spin-slow`.

---

## 10. Important Rules and Gotchas

1. **Never use `clerkId` as the child-record FK.** Always resolve to `user.id` (internal DB ID). Pattern: `auth()` → `clerkId` → `db.user.findUnique({ where: { clerkId } })` → use `user.id`.

2. **Prisma uses PrismaPg adapter — not standard Node.js driver.** The `db` singleton in `src/lib/db.ts` must be used everywhere. Never import `PrismaClient` directly in route files.

3. **Stripe client is lazy-loaded.** Use `getStripe()` or the proxy `stripe` from `@/lib/stripe`. Do not call `new Stripe(...)` inline. `STRIPE_SECRET_KEY` may not exist at build time.

4. **All protected API routes need `export const dynamic = "force-dynamic"`.** Required for routes using `auth()`, `req.headers`, or `cookies()` to prevent Next.js from statically generating them.

5. **Long-running API routes need `export const maxDuration`.** Scan route: 90s. Crawl, schema gen, competitor analysis, content gaps: 60s. Cron routes: 300s.

6. **Cron endpoints are protected by `Authorization: Bearer <CRON_SECRET>` header**, not Clerk. Do not add Clerk auth to cron routes.

7. **Webhook routes (`/api/webhooks/*`) must NOT require Clerk auth.** They are in the public routes list in middleware and verified by their own signature mechanisms (Svix for Clerk, Stripe SDK for Stripe).

8. **`/api/scan` is fully public** (no auth). The `ScanLead` model is used — not `Audit`. Dashboard scans use the `Audit` model and require Clerk auth.

9. **AI response parsing:** Claude is instructed to return raw JSON, but always strip markdown fences before parsing: `.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()`. Always wrap in try/catch with a fallback.

10. **Google OAuth state param** is base64url-encoded JSON `{ userId: clerkId, nonce }`. Decode with `Buffer.from(state, 'base64url').toString()` on callback.

11. **`Integration` is one-per-user** (`userId @unique`). Use `upsert` when saving, not `create`.

12. **GbpPost `status` flow:** `draft` → `posted` (success) or `failed` (GMB API error). The publish endpoint checks `gmbAccountId` and `gmbLocationId` are set on Integration before calling GMB.

13. **Competitor `crawlData` JSON** stores an extra top-level `aiSummary` field alongside the typed crawl stats — it's not in the Prisma schema's comment type but is stored inline.

14. **`next.config.mjs` allowlists** `img.clerk.com` and `images.clerk.dev` for Next.js Image optimization. Add other image domains there if needed.

15. **There is no free trial** (removed 2026-09-24; see `/api/stripe/checkout`). `TRIAL_DAYS`, `TrialEndingEmail` and `sendTrialEndingEmail` were deleted on 2026-10-27. `User.trialEndsAt` and the `trialing` status are legacy columns — never gate work on `trialing`.

16. **Plans:** `none` (no plan), `starter`, `pro`, `growth`, plus legacy `fullservice` (retired 2026-11-18, treated as Pro). Gates (plans set 2026-11-26) in `src/lib/billing.ts`: `hasPro(user)` (pro|fullservice|growth|comped) = everything except ads: social, Canva, Google listing posts (gbp-posts cron, `/api/gbp/*`, `approveGbpPost`, week run, draft mode gbp), review replies + review requests (review-drafts cron, `approveReviewReply`, reply route), email (`/api/agent/email*`, Email & Flows), lead tracking (`/api/agent/tracking`, `/api/tag/*`, tracking-health cron), setup social + tracking steps. Aliases `hasEmail`/`hasTracking`/`hasGoogleProfile` = hasPro. `hasGrowth(user)` = `hasAds` (growth|comped): Google Ads, Meta ads, ad budget. Starter = AI search only (visibility scans, questions, checks, site fixes, blog posts, content gaps, competitors, rankings). `PRO_RE` (plan only) for auto-publishing posts and 3 locations. Checkout (`/api/stripe/checkout`) takes `{ purchase: starter|pro|growth, annual, extraAdAccounts? }` and `verifiedPrice()` refuses any price id whose Stripe amount/interval doesn't match `PLAN_PRICES` (monthly, or `annualTotal` for yearly); `verifiedAddonPrice()` does the same for the "Extra ad account" add-on (`EXTRA_AD_ACCOUNT_PRICE`). Always read the plan from `planItem(sub.items)`, never `items.data[0]` (lib/stripe.ts). Shopify Managed Pricing plans/prices are set in the Shopify Partner dashboard, not code (names must contain starter/pro/growth, see Shopify billing). `User.subscriptionStatus` mirrors Stripe statuses: `trialing`, `active`, `cancelled`, plus custom `"none"` default.

17. **`src/lib/resend.ts` vs `src/lib/email.ts`:** `resend.ts` is a low-level `sendEmail({ to, subject, react })` function. `email.ts` is higher-level wrappers (sendWelcomeEmail, etc.) that render React Email templates and call `send()`. Use the typed wrappers in `email.ts` unless you need to send ad-hoc email.

18. **Engine verdicts must come from `getEngineEvidence()`** (`src/lib/engine-evidence.ts`), never from a single source. It merges the weekly Audit, public ScanLeads matched by email, and sandbox results, and returns `found | partial | missing | unknown`. **`unknown` (no data anywhere) must never render as "Not yet"** — "we don't know" and "you're not mentioned" are different claims to a paying customer.

19. **Never interpolate an empty `city` into a prompt or template.** An unset profile city produced "based right here in [City]" in a GBP draft and `Services in | Business` titles. Guard with `city.trim()` and branch the prompt. `containsPlaceholders()` in `src/lib/gbp-poster.ts` gates BOTH the autopilot cron and the manual publish route — bracket text must never reach Google.

20. **Generated schema must not invent facts.** `schema-generator.ts` derives `addressCountry` from the state/province (never hardcodes "US"), omits unknown address fields, forbids `sameAs` in the prompt, and strips any off-domain `sameAs` from model output.

21. **`user.websiteUrl` is stored WITHOUT a protocol** ("growthturbine.com"). `new URL()` throws on it — this silently broke every crawl and every PageSpeed call. Always normalize with `https://` first (see `crawler.ts` and `lib/pagespeed.ts`).

22. **`POST /api/scan` returns immediately** and runs the pipeline in a background `processScan()` (safe on Railway's persistent process). The client redirects to `/scan/results` and polls. Failures write a fallback so polling always terminates.

23. **The `claude` engine is stored under the `google_ai` key** in `aiSearchStatus` (Audit + ScanLead) for legacy reasons. Every place that renders the key labels it "Claude" (fixed 2026-10-27). Never rename the storage key — existing rows use it.

24. **`src/app/api/audit/` directory exists** but there is no `route.ts` in it at the top level — audits are triggered from `/api/dashboard/scan`. Do not confuse the directory name with a standalone audit endpoint.

25. **One login, many websites (2026-11-12, `src/lib/sites.ts`).** Each website is its own `User` row with its own plan, Stripe customer/subscription, data and crons. Extra websites have `clerkId = "site:<ownerClerkId>:<tag>"` and email `name+as-<tag>@domain` (User.email is unique; no schema change). The open website is the `alphaa_site` cookie (a row id, only the owner's rows accepted). **Always import `auth` from `@/lib/auth`** (it swaps `userId` to the open website's clerkId); `realAuth()` gives the real Clerk id (sites API, Clerk webhook, middleware). **Never send mail to `user.email` raw**: the four send functions (`lib/resend.ts`, `lib/email.ts`, `lib/marketing-email.ts`, `lib/connector/mail.ts`) apply `realEmail()`; use `isComped(email)` / `compedEmailWhere()` instead of `FOUNDER_EMAILS.includes`. Switcher = `components/agent/SiteSwitcher.tsx`; API = `/api/sites` (GET list, POST add, DELETE unpaid extra) + `/api/sites/switch`.

---

## 11. Build and Dev Commands

**Dependency audit (2026-11-27):** `npm audit` = 0. `package.json` `overrides` pin `effect` ^3.22.5 (prisma 7.10's @prisma/config pins a vulnerable 3.20) and Next 15's own `postcss` to ^8.5.33 (Next 15.5.29 pins 8.4.31; Next 16 ships 8.5.x). Drop both when moving to Prisma 8 / Next 16.

```bash
# Install dependencies (also runs prisma generate via postinstall)
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build (runs prisma migrate deploy then next build)
npm run build

# Start production server
npm start

# Lint
npm run lint

# Database: generate Prisma client after schema changes
npx prisma generate

# Database: create a new migration
npx prisma migrate dev --name <migration-name>

# Database: apply pending migrations (also runs in npm run build)
npx prisma migrate deploy

# Database: open Prisma Studio
npx prisma studio
```

---

## 12. Legal safety (images, claims, privacy)

All content follows `~/growth-ops/rules/legal-safety.md` (no stock or web images, no invented claims, securities and privacy rules). Read it before adding any page, post or image.

- **No stock, web-sourced or AI-generated images** on the marketing site and blog, and no photos of people (Copytrack claim against growthturbine.com, 2026-11). Brand visuals use the colour system (Varun, 2026-11-26; replaced black & white `brand/mono/`): the orb + "alphaa" wordmark, the site's pastel service tones (Social pink, Ads blue, Content yellow, SEO & AI search green, Email purple), ink #111114 and the final-CTA gradients. Text-only, typography and gradient art only: still no stock, web-sourced or AI photos and no photos of people. Kit, sizes and generators: `brand/color/README.md`; post images: `brand/social/base-color.css` + `brand/social/posts/build.py` (writes `brand/social/posts/color/`). `brand/mono/` and `base-mono.css` are retired (kept only for images already posted).
- **Site mark:** `.v3-orb` (v3.css) in the header (turns slowly, still under prefers-reduced-motion) and footer; favicon/icon/apple-icon/`public/logo.png`/the /og mark come from `node brand/color/make-site-icons.mjs`. The nav label for /services is "Solutions" (URLs and slugs stay /services/... for SEO).
- **Blog covers are generated:** `scripts/blog-covers.mjs` renders a colour-system title cover per post (since 2026-11-26: pastel service-tone block picked by topic → tag → slug hash via `toneFor()`, ink headline, orb + "alphaa"; was black & white) (`public/blog-covers/<slug>.jpg`, Inter OFL fonts, resvg) plus a text-free `_backdrop.jpg`. `src/content/blog/index.ts` sets every post's `meta.image` to its cover (hero, og:image, sitemap, RSS), so posts carry no `image` field; `npm run check:content` rejects one. `npm run build` makes any missing cover; `node scripts/blog-covers.mjs --slug <slug>` regenerates one, `--force` all.
- Page social cards come from the self-rendered `/og` route (colour card, orb mark from `src/app/og/orb.ts`); keep it text-only.
