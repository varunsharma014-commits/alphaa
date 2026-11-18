# Growth plan: platform applications (drafts for Varun to submit)

Drafted 2026-11-17. Ads and social posting for the Growth plan ($499/mo) can't go live until
these are approved. Each one is submitted from the account that owns it (see the account
ownership memory). Nothing here has been submitted.

Shared facts used in every form:
- App / product: Alphaa (https://alphaa.app), an AI marketing agent for small businesses
- Company: 18355355 Canada Inc.
- Contact: hi@alphaa.app
- Privacy policy: https://alphaa.app/privacy · Terms: https://alphaa.app/terms
- Core rule, stated everywhere: **the business owner approves every post, campaign and budget
  before anything goes live or spends. Campaigns are created paused.**

---

## 1. Google Ads API: developer token (Basic access)

Where: Google Ads **manager account (MCC)** → Admin → API Center → apply for Basic access.
Needs first: a manager account owned by Alphaa, and the Google Cloud project that will hold
the OAuth client (add scope `https://www.googleapis.com/auth/adwords`; it's a sensitive
scope, so the OAuth consent screen needs re-verification).

**Company type:** Advertiser tools / third-party tool for advertisers (not an agency).

**Intended use (paste):**
> Alphaa is an AI marketing agent for small local businesses. With the business owner's
> OAuth consent, Alphaa connects to the owner's own Google Ads account and: (1) researches
> keywords and drafts Search campaigns, ad groups, responsive search ads and negative keyword
> lists; (2) creates them in a PAUSED state for the owner to review in Alphaa; (3) enables
> them only after the owner explicitly approves the campaign and daily budget; (4) reads
> performance reports weekly and proposes changes (pausing wasted keywords, adding negatives,
> refreshing ads, shifting budget between campaigns), each applied only after owner approval;
> (5) sets up conversion actions for phone calls, form submissions and website leads.
> Alphaa never pays for media: spend is billed by Google to the owner's own account.
> Alphaa does not manage accounts for businesses that haven't connected and approved.

**API services used:** GoogleAdsService (search/reporting), CampaignService,
CampaignBudgetService, AdGroupService, AdGroupAdService, AdGroupCriterionService,
KeywordPlanIdeaService, ConversionActionService, CustomerService (list accessible customers).

**Design doc:** Google asks for one. Attach a 1–2 page PDF: the flow above plus 3
screenshots (connect Google Ads → paused campaign preview → approve budget). I can produce
it once the ads screens exist.

---

## 2. Meta: App Review (ads + Facebook/Instagram posting)

Where: developers.facebook.com → create the Alphaa Meta app first (none exists yet as of 2026-11-17; only the Pixel is set up) → App Review → Permissions and features.
Needs first: **Business Verification** for 18355355 Canada Inc. in Meta Business Manager,
the app in Live mode, privacy policy URL and data deletion instructions URL set.

**Permissions to request, and the use for each (paste per permission):**

| Permission | Use |
|---|---|
| `ads_management` | Create campaigns, ad sets and ads in the owner's ad account, created paused; enable only after the owner approves budget and creative in Alphaa. Apply approved weekly optimisations. |
| `ads_read` | Read campaign performance for the weekly report and to propose optimisations. |
| `business_management` | List the ad accounts, Pages and Pixels the owner chooses to connect. |
| `pages_show_list` | Let the owner pick which Facebook Page Alphaa posts to. |
| `pages_manage_posts` | Publish a Page post the owner approved in Alphaa. |
| `pages_read_engagement` | Read likes/comments on posts Alphaa published, for the weekly report. |
| `instagram_basic` | Read the Instagram business account linked to the Page. |
| `instagram_content_publish` | Publish an Instagram post the owner approved in Alphaa. |

**Screencast (one per permission group, ~1 min each):** sign in → connect Facebook → pick
Page / ad account → Alphaa drafts a post → owner taps Approve → post appears on the Page;
and: Alphaa builds a paused campaign → owner approves budget → campaign shows Active in Ads
Manager. Recorded with a test Page and a test ad account, never a customer's.

**Notes for the reviewer (paste):**
> Every action is initiated by the business owner inside Alphaa. Alphaa drafts content and
> campaigns; nothing is published and no budget is spent until the owner taps Approve.
> Test login: [test account email, created for review] / password supplied in the
> review form (Varun enters it).

---

## 3. LinkedIn: Community Management API (company page posting)

Where: linkedin.com/developers → create app "Alphaa" (associated with the Alphaa LinkedIn
Page, which a Page admin must verify) → Products → request **Community Management API**.

**Scope:** `w_organization_social` (post as a company Page), `r_organization_social` (read
post stats), `rw_organization_admin` (list Pages the member administers).

**Use case (paste):**
> Alphaa is an AI marketing agent for small businesses. A business owner who administers a
> LinkedIn company Page connects it to Alphaa. Alphaa drafts Page posts in the owner's voice;
> each post is published to the Page only after the owner approves it in Alphaa. Alphaa reads
> post statistics for a weekly report. Alphaa never posts to personal profiles, never sends
> messages or connection requests, and never scrapes member data.

LinkedIn's review asks for a company LinkedIn Page, a privacy policy and a short demo video
of the approve-then-post flow.

---

## Order and timing (typical, not promised)
1. Meta Business Verification (often days to 2 weeks), then App Review (often 1–3 weeks).
2. Google Ads Basic access (often a few business days to 2 weeks after the design doc).
3. LinkedIn Community Management (varies; can take weeks).

When an approval lands: build that feature's screens, record the screencast if the review
needs one, then set `NEXT_PUBLIC_GROWTH_ON_SALE=1` on Railway once ads + social are live.


---

## Social posting: what Varun sets up (built 2026-11-17)

The code to connect, schedule and publish is live (`src/lib/social/`). Each platform turns on
the moment its keys are on Railway; until then the dashboard says "coming soon".

| Platform | Create the app at | Callback URL to register | Railway env vars | Approval needed before customers (not just you) can use it |
|---|---|---|---|---|
| Facebook + Instagram | developers.facebook.com → the Alphaa app → add "Facebook Login for Business" | `https://alphaa.app/api/social/callback/meta` | `META_APP_ID`, `META_APP_SECRET` | Business Verification + App Review for `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, `business_management` (section 2 above). Works today for people with a role on the app. |
| LinkedIn | linkedin.com/developers → app "Alphaa" → Products: "Sign In with LinkedIn using OpenID Connect" + "Share on LinkedIn" (self-serve) | `https://alphaa.app/api/social/callback/linkedin` | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (+ `LINKEDIN_ORG_SCOPES=1` once Community Management is approved) | Personal profiles: none. Company Pages: Community Management API (section 3 above). |
| TikTok | developers.tiktok.com → app → Login Kit + Content Posting API (Direct Post), verify the domain `alphaa.app` | `https://alphaa.app/api/social/callback/tiktok` | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` (+ `TIKTOK_AUDITED=1` after the audit) | Content Posting API audit. Until then posts are private ("only me"). |
| X | developer.x.com → project → app → User authentication: OAuth 2.0, Web App, read + write | `https://alphaa.app/api/social/callback/x` | `X_CLIENT_ID`, `X_CLIENT_SECRET` | None, but posting volume depends on the X API plan (the free tier is very limited). |

Google Business Profile posting already works through the existing Google connection.

## Extra brands

Every brand after the first on one login gets the Stripe coupon `EXTRA_BRAND_50` (50% off,
forever) at checkout. It exists in Stripe test mode (created 2026-11-17); checkout creates it
automatically in live mode the first time it's needed.

## Usage

Founders see what Alphaa did for each brand and the AI tokens it used at
`/dashboard/admin/usage`. To show estimated AI cost, set `AI_PRICES_JSON` on Railway, e.g.
`{"claude-opus-5-5":[in,out],"claude-sonnet-4-6":[in,out]}` in dollars per million tokens.

## Canva (2026-11-18)
Create a Connect API integration at canva.com/developers → Your integrations → Create. Redirect URL: `https://alphaa.app/api/canva/callback` (local testing needs `http://127.0.0.1:3000/api/canva/callback`, not localhost). Scopes: `design:meta:read design:content:read design:content:write asset:read asset:write brandtemplate:meta:read brandtemplate:content:read profile:read`. Set `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` on Railway. Until Canva reviews and makes the integration public, only the creating account's team can connect. Brand template autofill needs a Canva plan with brand templates.

## What's working in your niche
Needs `APIFY_TOKEN` (set). Optional `META_AD_LIBRARY_TOKEN` (Meta developer account with identity confirmed, facebook.com/ads/library/api; long-lived user token, rotate ~60 days). Outside the EU/UK the Ad Library API returns only political/issue ads.

## Tracking self-check
No new keys. The GA4 realtime check needs the `analytics.readonly` scope (founders only until `GA_SCOPE_ENABLED=1` after Google re-verifies the consent screen). Meta Conversions API uses each owner's own token from Events Manager → Settings → Conversions API.
