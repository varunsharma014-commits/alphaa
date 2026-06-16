# CLAUDE.md — Alphaa Codebase Reference

## 1. Project Overview

Alphaa is a local-business SEO SaaS that replaces an SEO agency. It automatically improves a business's visibility on Google, ChatGPT, and Maps via: AI-powered visibility audits (anonymous public scan + authenticated dashboard scan), Google Business Profile post generation and publishing, website crawling for on-page SEO issues, schema markup generation, competitor analysis, content gap analysis, keyword ranking tracking via Google Search Console, review management via GMB API, and weekly automated reports. Paid plans are Starter ($99/month) and Pro ($199/month), with a 14-day free trial.

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
│   │   ├── TrialEndingEmail.tsx
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
│   │   ├── constants.ts       # TRIAL_DAYS, PLANS, PLAN_PRICES, BUSINESS_TYPES, ROUTES
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
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe price ID for Pro monthly ($199) |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Stripe price ID for Pro annual ($159/mo) |
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
- `/api/cron/gbp-posts` (GET): auto-generates and publishes GBP posts for connected users. Same auth guard.
- Both have `maxDuration = 300` (5 minutes).

### Webhooks
- `/api/webhooks/clerk`: Creates `User` row on `user.created`, sends welcome email; deletes on `user.deleted`. Verified with Svix.
- `/api/webhooks/stripe`: Handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_succeeded/failed`. Updates `User.subscriptionStatus` and `User.plan`.

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
| POST | `/api/webhooks/clerk` | Svix-verified | Handle Clerk user lifecycle events |
| POST | `/api/webhooks/stripe` | Stripe-verified | Handle Stripe billing events |
| GET | `/api/cron/weekly` | Bearer token | Generate weekly reports + send emails |
| GET | `/api/cron/gbp-posts` | Bearer token | Auto-publish GBP posts for connected users |

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
- **`TrialEndingEmail`** — Trial expiry warning. Props include `daysLeft`.
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

15. **Trial is 14 days** (`TRIAL_DAYS = 14` in constants). Stripe checkout also sets `trial_period_days: 14`. The `User.trialEndsAt` field is set by the Stripe webhook on `checkout.session.completed`.

16. **Plans:** `none` (free trial), `starter`, `pro`. `User.subscriptionStatus` mirrors Stripe statuses: `trialing`, `active`, `cancelled`, plus custom `"none"` default.

17. **`src/lib/resend.ts` vs `src/lib/email.ts`:** `resend.ts` is a low-level `sendEmail({ to, subject, react })` function. `email.ts` is higher-level wrappers (sendWelcomeEmail, etc.) that render React Email templates and call `send()`. Use the typed wrappers in `email.ts` unless you need to send ad-hoc email.

18. **`src/app/api/audit/` directory exists** but there is no `route.ts` in it at the top level — audits are triggered from `/api/dashboard/scan`. Do not confuse the directory name with a standalone audit endpoint.

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
