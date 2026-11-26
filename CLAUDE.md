# CLAUDE.md — Alphaa Codebase Reference

## 1. Project Overview

Alphaa is a local-business SEO SaaS that replaces an SEO agency. It automatically improves a business's visibility on Google, ChatGPT, and Maps via: AI-powered visibility audits (anonymous public scan + authenticated dashboard scan), Google Business Profile post generation and publishing, website crawling for on-page SEO issues, schema markup generation, competitor analysis, content gap analysis, keyword ranking tracking via Google Search Console, review management via GMB API, and weekly automated reports. Paid plans (owner decision 2026-11-18, max 3 plans): **Starter** $99/month ($79/mo billed yearly) = SEO & AI search (Google Business Profile posts, blog posts, review replies, website fixes, weekly AI checks, weekly briefing); **Pro** $399/month ($319/mo yearly) = Starter + social media management (branded-image posts for Facebook/Instagram/LinkedIn/TikTok, direct posting as platforms approve), 4 Google posts/week, 4 blogs/month, up to 3 locations, auto-approve; **Growth** $499/month ($399/mo yearly, early access via `GROWTH_ON_SALE` in `src/lib/growth.ts`) = Pro + Google & Meta ads, email, lead tracking. Full Service ($299) and the $149 setup are retired from sale (never had subscribers); `fullservice` rows still read as Pro-level. Plan prices live in `src/lib/constants.ts` `PLAN_PRICES`, feature lists in `src/lib/plan-features.ts`. There is no free trial — the free public scan is the trial (decided 2026-09-24).

---

## 2. Tech Stack

| Layer | Package / Version |
|---|---|
| Framework | Next.js ^15.3.0 (App Router) |
| Language | TypeScript ^5 |
| Auth | @clerk/nextjs ^7.3.7 |
| Database | PostgreSQL via Prisma ^7.8.0 + @prisma/adapter-pg ^7.8.0 |
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
| Validation | zod ^4.4.3 |
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
| `STRIPE_STARTER_MONTHLY_PRICE_ID` | Stripe price ID for Starter monthly ($99) |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | Stripe price ID for Starter annual ($79/mo) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe price ID for Pro monthly ($399) |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Stripe price ID for Pro annual ($3,828/yr = $319/mo) |
| `STRIPE_GROWTH_MONTHLY_PRICE_ID` | Stripe price ID for Growth monthly ($499) |
| `STRIPE_GROWTH_ANNUAL_PRICE_ID` | Stripe price ID for Growth annual ($4,788/yr = $399/mo) |
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
- `/api/cron/gbp-posts` (GET, Mon/Tue/Thu/Fri 13:00 UTC): drafts a GBP post per active user on the plan's schedule (Starter Mon/Thu = 2/week, Pro/Growth all four = 4/week). Drafts wait in the agent feed ("Post it" → `/api/gbp/posts/[id]/publish`). Publishes directly only for Pro/Growth with `autoPublishPosts` on, a connected listing and no `[placeholders]`. Same auth guard.
- Both have `maxDuration = 300` (5 minutes).
- `/api/cron/nurture` (GET, daily 16:00 UTC): scan-lead nurture via `lib/nurture.ts` + `emails/NurtureEmail.tsx`. Daily burst Day 1-4 (why AI named a rival, drafted fix, guarantee, $99 offer; sent strictly in order on consecutive days), then weekly Day 11/18/25/32/39/46/53 (one useful tip + one CTA each) and Day 60 break-up = the last email. Max one email per address per 20h. State in `ScanLead.ogData.nurture` `{ step, schedule: 2, lastSentAt }` (merged, never overwritten); steps without `schedule: 2` are from the old 1/3/5/7/10/14/30/60/90 schedule and are mapped by `currentStep()` so nothing is resent. Only leads after the consent cutoff (2026-10-04 16:00 UTC). Stops on unsubscribe, conversion, or an account with that email. `?dryRun=1` previews without sending.
- **Personal drip copy (`lib/personal/`)**: nurture + convert emails are written per recipient. `research.ts` builds a keyed fact dossier (scan/audit/competitors/GSC + fresh: one AI re-asked today, rivals' and own newest sitemap URL, homepage social links, optional Apify IG/FB posts; fresh part cached in `ScanLead.ogData.dossier` 6 days). `writer.ts` (claude-opus-5-5, structured output) + a strict validator (word count, no dashes/banned phrases/other AI names, every number must be in the dossier, required sentences verbatim); one retry, then the template. Used fact keys: `ogData.nurture.used` (leads) / `email_sent` metadata.factKeys (accounts). Preview without sending: `scripts/preview-personal-email.ts`.
- `/api/cron/convert` (GET, daily 17:00 UTC): onboarded accounts with no paid plan, days 1/3/5/8/12/17/24/31/45 after signup, deduped via MockActivity `email_sent` emailKey `convert-dN`; max one email per account per 20h across lifecycle + convert. Same legal gates as nurture; CTA → `/dashboard/settings/billing`. `?dryRun=1&limit=N`.
- `/api/cron/review-drafts` (GET, daily 06:00 UTC): writes a reply (MockActivity `review_draft`, metadata `{reviewId, text}`) for each unreplied Google review from the last 60 days, max 5 per account per night. Nothing is posted; the briefing shows the finished reply for one-tap approval.
- **Weekly email = the briefing** (`/api/cron/weekly` → `emails/BriefingEmail.tsx` via `lib/agent/briefing-email.ts`): headline + 4 AI lights, items waiting for the owner with signed no-login "Approve & publish" links (`lib/approve-token.ts`, 14-day, one item each, CRON_SECRET-signed) → `/approve` page (public; the owner taps once more, so mail scanners publish nothing) → `POST /api/agent/approve`. Preview: `npx tsx scripts/preview-briefing-email.tsx [--user <id>] --out file.html`.
- Marketing email goes through `lib/marketing-email.ts` (footer + `List-Unsubscribe` one-click headers). Unsubscribe links are HMAC-signed (`lib/unsubscribe.ts`): `/unsubscribe` page (GET) and `/api/unsubscribe` (POST one-click). Abandoned checkout (`checkout.session.expired`) → `lib/abandoned-checkout.ts`, once per account.

### Workspace shell (2026-11-26, replaces AgentShell for everyone)
- `(dashboard)/layout.tsx` renders `components/workspace/WorkspaceShell.tsx` (scoped CSS `(dashboard)/workspace.css`, every rule under `.ax`): frosted sidebar (Briefing; Research & Ideas, Social Studio, Email & Flows [Growth], Ads [Top plan, gated by `hasGrowth` for now], Tracking & Setup; Your rules → /dashboard/settings; "More" lists every older detail page), status island, Autopilot switch = the existing auto-approve consent (`openAutoApprove` / `turnOffAutoApprove`). Light only (dark mode off 2026-11-26; the theme cookie is ignored). Under 1024px the sidebar is a drawer behind a top bar.
- The ⌘K ask bar opens a panel that mounts the real `DashboardAgent` (`composerOpen`). Pages drive it with `askAlphaa({ topic | chip | say | push })` (`lib/workspace/events.ts`): topics go through `ASK_EVENT`, chips/messages through `AGENT_EVENT`, which DashboardAgent handles with its own `onChip`/`send`. `?ask=<topic>` on any dashboard URL opens the chat on that thread.
- Pages: `/dashboard` (Briefing), `/dashboard/research|social|email|ads|tracking`. Data in `lib/workspace/*.ts`, real rows only, honest empty states. Headline = calls + leads over 30 days: Google listing CALL_CLICKS (`getProfileActions`, cached 6h) + website lead beacons (`tracking_event`) + Meta lead-form leads; prev is null when there is nothing to compare with. "Going out soon" = scheduled social posts + scheduled GbpPosts; Stop/Undo = `POST /api/workspace/hold` (back to draft / back on schedule). "One question" = at most one of: an AI fact to confirm, a first-time connection (setup step), the ad budget (money), or turning autopilot on when finished work is waiting.
- Briefing top = 4 AI cards (`lib/workspace/ai-cards.ts`): verdict from `getEngineEvidence()` (question scan as fallback), question/answer/"names instead" from `storedAnswers()` (lib/agent/first-answer.ts) when it agrees with the verdict, else the weekly question scan's `named`. Never-checked = "Not checked yet". FirstAnswer is no longer shown.
- **Autopilot declaration** (`lib/auto-approve-text.ts`, `CONSENT_VERSION` "2026-11-26.1", `CONSENT_DECLARATION` points i-vi, linked to `/terms#ai-autopilot` = Terms §8A): accepted in `AutoApproveModal`; stored as MockActivity `autopilot_consent` (version, full text + sha256, userId, email, plan, scope, IP, user agent) + settings `autoApprove {acceptedAt, version, consentId}`. `consentCurrent(s)` gates every "without asking" setting (posts, reviews, social, now also email:auto and ads:budget). An older version re-prompts once per visit (`op: "auto_renew"` records the new acceptance and keeps every setting; "Turn Autopilot off" is the alternative). Crons are unchanged. "Alphaa is AI and can make mistakes…" (`AI_NOTE`) sits in the chat panel and under "Going out soon".
- **Research → Competitors / gaps (2026-11-26)**: relevance gate `lib/competitor-relevance.ts`: domain rules (`blockedHost`: wikis/fandom, directories & review sites, forums, social, marketplaces, website builders, big platforms, news/media, .gov/.edu) on every row; a Haiku niche check (`nicheVerdicts`, cached per host in settings `competitorRelevance`) for rows not added by hand (`crawlData.source === "manual"`, set by POST /api/competitors); owner dismissals in settings `competitorsDismissed` (`POST /api/workspace/competitor` op dismiss, then one background `discoverCompetitors(user, 1)`, max once/30 min). Discovery (`discover-competitors.ts`) runs the same gate on search results before crawling. No rows are deleted. Attack cards + winning moves: `lib/workspace/rivals.ts` (tag + Winning at / Weak spot / My counter-move only from stored data: AI question-scan rivals, ad-plan Ad Library ads, niche rival posts, crawl analysis only when pages were read, ContentGap rows; `ourTitle()` strips brands/separators; signals = Search Console impressions/position + buyer-intent words). "Draft it" = `components/workspace/DraftSheet.tsx` → `/api/agent/draft` mode post → Autopilot on: "Add to Going out soon" (`/api/workspace/site-post` schedule: post_draft status "scheduled" + scheduledFor +72h, published by `/api/cron/site-posts` every 10 min via `approveSitePost` while Autopilot is on; Stop/Undo through `/api/workspace/hold` kind "site"), off: "Publish" (approveSitePost now). Pages set the status island with `ISLAND_EVENT`.
- Dev-only preview with sample data: `/preview?ws=briefing|research|social|email|ads|tracking` (`&empty=1`, `&dark=1`); 404 in production.

### Dashboard home = the morning briefing (pre-2026-11-26; Briefing.tsx/BriefingV2 are no longer the home, DashboardAgent is now the ⌘K chat panel)
- `lib/agent/briefing.ts` → `components/agent/Briefing.tsx`: (1) "Am I winning?" yes/no light per AI + rival named instead + what I'm doing about it, (2) inbox of items waiting for the owner, one card at a time, Approve & publish / Edit (in-place textarea), (3) plain-English ledger of real work grouped by day with "See it" links. The ledger maps activity types to owner language in `ledgerText()`; setup/billing/email rows are excluded on purpose. The older detail cards (`lib/agent/feed.ts`) sit folded under "Show me why".
- Top of the briefing = `components/agent/BriefingHero.tsx` ← `/api/agent/hero` (`lib/agent/hero.ts`, loaded after paint): people AI sent them in the last 30 days vs the 30 before (GA `getAiReferrals(integ, days, endDaysAgo)`, else our `ai_visit` rows), falling back to "named in X of Y answers". Never claim to count "recommendations" (unmeasurable). Customer value = `lib/customer-value.ts`: Haiku estimate saved once in agent settings `customerValue {amount, source: "estimate"|"owner", basis}`, owner edits it inline ("Change it" → POST /api/agent/settings `customerValue`). "One customer pays for N months of Alphaa" = floor(value / plan price).
- Briefing also: "Next up" (next scheduler slot, `nextSlot()` in briefing.ts — keep in sync with cron-scheduler), Share it (`POST /api/agent/share` → a `win` row kind `engine_named`, only when evidence says that AI named them → public `/w/[id]` with `opengraph-image.tsx`), Milestones (first `engine_appeared` win per AI), and "You're all caught up". First week of a month: last month's recap card (`lib/agent/recap.ts`). `/api/cron/monthly-recap` (1st, 18:00 UTC) emails `emails/MonthlyRecapEmail.tsx` to paying accounts once per month (emailKey `recap-YYYY-MM`, `?dryRun=1`).
- First visit: `components/agent/FirstAnswer.tsx` ← `/api/agent/first-answer` (`lib/agent/first-answer.ts`) shows the real ChatGPT answer (their name, or the rivals named, highlighted) once at the top of the briefing. Answer = freshest stored one (Audit AiEngineResult / ScanLead engineResponses / `sandbox_result` metadata.lead), saved in agent settings `firstAnswer`; "seenAt" set on dismiss. Brand-new accounts with nothing asked: the card runs `/api/sandbox/ask` itself (DashboardAgent skips its own firstCheck when a briefing is present).
- Left "Details" rail (`components/agent/ToolsRail.tsx`): the under-the-hood pages (sandbox, vault, citations, per-AI, rankings, health, speed, posts, reviews, content, competitors, reports), folded to 5 section icons by default (localStorage `alphaa.tools.v1`); a drawer behind the header menu button under 900px.
- One-tap approvals live in `lib/approvals.ts` (review reply, Google post, website post), shared by the dashboard, `/api/gbp/reviews/[id]/reply` and the email links. Site publishing logic is `lib/connector/push.ts` (`/api/connect/wp/push` is a thin wrapper).

### Voice, autopilot and the live work log (2026-11-17)
- **Voice** (`lib/voice.ts`, agent settings `voice`): reads the owner's own words (homepage, about, services, a blog post, review replies they wrote themselves), detects the language, and writes 3 options (first = "Like your website") with a sample each (Opus 5.5, structured output). The owner picks one or writes their own, and sets language / tone / emoji / length / "we" or "I" in the "How I sound" thread (`?ask=voice`, `lib/agent/voice-narration.ts`, `/api/agent/voice`). Every writer adds `voiceFor(userId)` / `voiceText()` to its prompt: blog posts, meta, location pages, drafts, Google posts (manual + cron), review replies. **Never store the voice in `User.voiceDescription`**: that's the business description and it feeds the schema markup and llms.txt.
- **Autopilot** ("What I do without asking", `lib/agent/autopilot.ts`, `/api/agent/autopilot`, settings `autopilot`): posts = `autoPublishPosts` (Pro+); review replies ask/positive/all are honoured by `/api/cron/review-drafts`; social is Pro and up; email / ads (+ monthly `adBudget`) are Growth-only and saved until those features ship.
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
- **Public first week** (`lib/demo-week.ts`, `/api/scan/week` + `/img`, stored on the ScanLead as `ogData.demoWeek` / `demoWeekImages`): after the free AI check on /start (and the homepage box, which hands off to /start), the visitor's email unlocks a real first week: 1 Google update + 2 social posts with branded images, in their voice, planned around the AI answers and live trends. One per email (a repeat returns the first), 3 per IP a day, `DEMO_WEEK_DAILY_CAP` (default 150) across everyone. StartAgent: `weekGate()` → `runWeekDemo()` → `priceMessage(scanId, true)`.
- **Social posting** (`src/lib/social/`): own OAuth apps per platform (Varun's choice, 2026-11-17): Meta (Facebook Pages + linked Instagram), LinkedIn (profile; Pages with `LINKEDIN_ORG_SCOPES=1`), TikTok (photo Direct Post; private until `TIKTOK_AUDITED=1`), X (OAuth2 PKCE). A provider is "coming soon" until its env keys exist (`providerConfigured`). Accounts = MockActivity `social_account` (tokens AES-GCM encrypted via `encryptSecret`); queue = `social_post` (draft/scheduled/published/partial/failed, per-account results). `/api/social/connect|callback/[provider]` (state HMAC-signed and bound to the signed-in brand), `/api/agent/social` (approve/post_now/unschedule/delete/disconnect), `/api/cron/social-publish` every 10 min (scheduler `setInterval`). Social images are JPEG (Instagram/TikTok reject PNG). The week run queues its social posts on connected accounts: scheduled if `autopilot.social === "auto"`, else drafts. Threads: `social`, `channels` (every channel's status). Setup checklist: docs/growth-platform-applications.md. **Post stats** (`lib/social/stats.ts`): LinkedIn company Page posts get views/likes/comments/reposts/clicks from `organizationalEntityShareStatistics` saved on `PostResult.stats`; `/api/cron/social-stats` daily 04:00 UTC + a background refresh when the Social thread opens (6h stale). Personal-profile posts have no app-readable stats (the thread says so).
- **Ad plan** (`lib/ad-strategy/`, thread `adplan` (rail: Marketing → Your ad plan), `/api/agent/adplan`, printable `/dashboard/ad-strategy` (browser "Save as PDF"), MockActivity `ad_strategy`, Pro + Growth, built 2026-11-25 from the GIGABOOST ads handoff): `playbook.ts` = Alphaa's built-in ad knowledge (formats + hit rates, hook types in priority order, specs, licensed-music sources, AI rules, kill/hold/scale thresholds, legal + per-vertical rules), versioned (`PLAYBOOK_VERSION`, review monthly, `NEXT_REVIEW`). Not shown as a manual. `generate.ts` (background, in-process `inFlight`): competitors' active Meta ads via Apify `apify~facebook-ads-scraper` (3 competitors × 8 ads, ~$0.005/ad; Meta's own Ad Library API only returns political ads in US/CA), then 2 Opus 5.5 structured calls: (1) vertical/b2b/local, 2 angles, clichés/gaps, ~24 hooks, Meta/LinkedIn/Google statics; (2) 12 scripts scene by scene with 3 hook swaps. Every line goes through the gads `copyProblem` claims check (numbers only from facts, no superlatives, platform char limits); a script with one bad line is dropped. Code (`rules.ts`) decides the budget split (local: Meta 60/Google 40; B2B adds LinkedIn when its share ≥ $10/day), creatives judgeable ($60 each on Meta, $250 on LinkedIn) and the vertical rules. Meta statics get images via `postImageFor`. No video rendering yet (scripts + statics). Tests: `npx tsx scripts/test-ad-strategy.ts`.
- **Email outreach** (`lib/email-campaigns/`, thread `email`, `/api/agent/email` + `/upload`, `/api/cron/email-campaigns` daily 15:00 UTC, Growth, built 2026-11-20): the owner pastes customers or uploads a CSV (consent checkbox required, each import logged as `email_import` with the consent text = CASL/CAN-SPAM proof), list = one `email_contacts` row (cap 2,000). Business mailing address is required (`emailOutreach.address` in agent settings) and goes in every footer. `write.ts` (Opus 5.5, structured) writes subject/preview/2-4 paragraphs + a button that only links to the owner's homepage or their published blog posts; rejected (1 retry, then a plain template) on any number, price or offer not in the facts or the owner's note, hype words, dashes, AI names. Owner approves (or autopilot `email: "auto"` = the monthly cron sends it). Sent from "<Business>" <RESEND_FROM_EMAIL>, reply-to the owner, Resend batch 50 at a time, recipients frozen on the campaign so a restart resumes (cron picks up stale `sending`). Max 1 send per brand per 7 days, 1 auto draft per 28 days. Unsubscribe = signed `c_<userId>.<sha256>` subject → `email_optout` row for THAT business only + removed from the list; re-read before every batch. Bounces/complaints: `/api/webhooks/resend` (svix, `RESEND_WEBHOOK_SECRET`, events email.bounced + email.complained) reads the `alphaa_brand`/`alphaa_campaign` tags every campaign email carries; a hard bounce or spam complaint = `email_optout` (reason) + removed from the list + counted on the campaign; complaints also log `email_complaint` (ledger). Untagged mail is ignored.
- **Extra brands** are 50% off: `isExtraBrand()` (lib/billing.ts) → checkout adds the `EXTRA_BRAND_50` coupon (self-created if missing).
- **Usage metering** (`lib/usage.ts`, fixed 2026-11-20): `installUsageMeter` wraps `messages.create`; **every file gets its client as `const anthropic = claudeFor("<feature>")`** (lib/claude.ts; never import the bare `anthropic`, never `new Anthropic()` without `installUsageMeter` + `tagClient`). Attribution via AsyncLocalStorage: `auth()` and `currentUser()` create the context with `usageCtx()` BEFORE their first await (a store entered after an await never reaches the caller); crons call `asUser`. Per brand per day in MockActivity `usage_day` (tokens by model, `features`, `searches`), no-brand calls (public scans) in `usage_house` on the founder account; flushed every 30s. Founders: `/dashboard/admin/usage` (cost by brand and by feature, list prices built in, `AI_PRICES_JSON` overrides).
- **Guided setup** (`lib/agent/setup.ts`, `/api/agent/setup`, thread `setup`, settings `setup`): a card pinned above the briefing ("3 of 7 done") asks one step at a time: Google, website, voice, brand + images, autopilot, on Pro social, and on Growth tracking (tested). Done = real state; brand/voice/autopilot can be confirmed as-is. Steps waiting on us (no social app keys) show "Opening soon" and aren't counted. DashboardAgent keeps it in its own slot (`setupMsgs`, ids `setup`) and re-fetches it after each change. Hidden once the owner closes the finished card.
- Owner choices use the generic `agent-op` chip (`POST /api/agent/<endpoint>`, optional form first). The returned messages replace the old copies with the same id, so a panel redraws instead of stacking.
- **Draft dedupe** (`lib/draft-dedupe.ts`, 2026-11-18): the gbp-posts cron skips a listing that has an unapproved draft from the last 14 days or a scheduled post still to go, and passes the last 5 posts to the prompt (prod had up to 22 near-identical "Looking for a … in Ottawa?" drafts per user). `/api/agent/week` POST and `/api/agent/draft` (post/gbp/social) run one at a time per brand (`once()`), and a draft for the same topic from the last 15 min is returned instead of a new one. `createPost()` returns the waiting post with the same text from the last 24h. The briefing collapses near-identical drafts (`draftKey`).
- **Ads need a city**: the Google and Meta ads `plan` ops answer with `askCityMessages()` (`lib/agent/city.ts`: "Add my city" agent-op form → `POST /api/agent/city` saves `User.city`/`state`, then offers the plan chip again) when the profile has no city, instead of failing or guessing.

### Webhooks
- `/api/webhooks/clerk`: Creates `User` row on `user.created`, sends welcome email; deletes on `user.deleted`. Verified with Svix.
- `/api/webhooks/stripe`: Handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_succeeded/failed`. Updates `User.subscriptionStatus` and `User.plan`.
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

16. **Plans:** `none` (no plan), `starter`, `pro`, `growth`, plus legacy `fullservice` (retired 2026-11-18, treated as Pro). Gates: `hasPro(user)` (pro|fullservice|growth|comped: social, Canva, social autopilot, setup social step) and `hasGrowth(user)` (growth|comped: ads, email, lead tracking) in `src/lib/billing.ts`; `PRO_RE` (plan only) for auto-publishing posts and 3 locations. Checkout (`/api/stripe/checkout`) takes `{ purchase: starter|pro|growth, annual }` and `verifiedPrice()` refuses any price id whose Stripe amount/interval doesn't match `PLAN_PRICES`. Shopify Managed Pricing plans/prices are set in the Shopify Partner dashboard, not code (names must contain starter/pro/growth, see Shopify billing). `User.subscriptionStatus` mirrors Stripe statuses: `trialing`, `active`, `cancelled`, plus custom `"none"` default.

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

- **No stock, web-sourced or AI-generated images** on the marketing site and blog, and no photos of people (Copytrack claim against growthturbine.com, 2026-11). Brand visuals stay black & white (`brand/mono/`).
- **Blog covers are generated:** `scripts/blog-covers.mjs` renders a black & white title cover per post (`public/blog-covers/<slug>.jpg`, Inter OFL fonts, resvg) plus a text-free `_backdrop.jpg`. `src/content/blog/index.ts` sets every post's `meta.image` to its cover (hero, og:image, sitemap, RSS), so posts carry no `image` field; `npm run check:content` rejects one. `npm run build` makes any missing cover; `node scripts/blog-covers.mjs --slug <slug>` regenerates one, `--force` all.
- Page social cards come from the self-rendered `/og` route; keep it text-only.
