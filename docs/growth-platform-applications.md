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

Where: developers.facebook.com → the Alphaa Meta app → App Review → Permissions and features.
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
