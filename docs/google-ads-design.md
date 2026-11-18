# Alphaa: Google Ads API design document

For Google's Google Ads API **Standard access** application and the Required Minimum
Functionality (RMF) review. Google Cloud project: `alphaa-497512` (project number
501685903093), currently at **Basic** access (15,000 operations a day). API version: **v26**,
called over REST (`https://googleads.googleapis.com/v26`).

Last updated: 2026-11-18.

---

## 1. The tool

**Name:** Alphaa ([alphaa.app](https://alphaa.app))

**What it is:** an AI marketing agent for small local businesses (dentists, plumbers, salons,
clinics and similar). The owner talks to Alphaa in a chat window. Alphaa already runs their
Google Business Profile posts, review replies, website content and social posts; Google Ads is
part of the Growth plan.

**Who uses it:** small business owners managing **their own** Google Ads account. Each owner
signs in to Alphaa, then connects their own Google Ads account with Google's OAuth consent
screen. Alphaa is not an agency: it does not hold client accounts under its own manager account,
does not pay for media, and never resells ad spend. Google bills the owner's account directly.

**Tool type (RMF):** Full-service tool (creation, management and reporting) used by external
advertisers, each on their own account.

**Markets:** United States and Canada first.

---

## 2. How it works

### 2.1 Account linking
1. In the chat, the owner opens **Ads** (or "Your marketing channels") and taps **Connect Google Ads**.
2. Alphaa sends them to Google's OAuth consent screen asking for the
   `https://www.googleapis.com/auth/adwords` scope only (incremental authorization; offline
   access, so Alphaa can run the weekly check).
3. Google returns them to `https://alphaa.app/api/gads/callback`. The OAuth `state` is
   HMAC-signed, bound to the signed-in Alphaa account and valid for 60 minutes.
4. Alphaa calls `customers:listAccessibleCustomers`, reads each account's name, currency and
   status with a GAQL query on `customer`, and **skips manager accounts**. One account is
   selected automatically; with several, the owner picks one in the chat.

`[Screenshot 1: the Ads thread with the "Connect Google Ads" button]`
`[Screenshot 2: Google's consent screen for Alphaa]`
`[Screenshot 3: picking the ad account]`

### 2.2 Keyword planning and campaign creation
1. The owner taps **Plan my first campaign**.
2. Alphaa drafts **one Search campaign** from the business's real facts: its profile (name,
   type, city), the owner's chosen writing voice, the Google Search Console queries that already
   bring them visitors, and their weekly performance insights.
3. Every proposed keyword is checked with `KeywordPlanIdeaService.GenerateKeywordIdeas`
   (Google Search network, the business's city via `geoTargetConstants:suggest`, the owner's
   language). Keywords Google reports with zero searches are dropped; the monthly search
   volume is shown next to each keyword.
4. The plan shown to the owner contains:
   - 1–2 ad groups, 10–20 keywords (phrase or exact match);
   - three themed lists of campaign negative keywords (for example jobs, do-it-yourself,
     services not offered);
   - a responsive search ad: up to 15 headlines (30 characters max) and 4 descriptions
     (90 characters max). Code rejects any line over the limit, with superlatives or
     unverifiable claims ("best", "#1", "guaranteed", "award-winning"…), exclamation marks in
     headlines, all capitals, emoji, or any number that isn't in the business's own facts;
   - proximity targeting: a radius around the business's city / postal code;
   - language targeting (English or French);
   - bidding: Maximize Clicks, or Maximize Conversions when the account already records
     conversions;
   - the daily budget: the owner's monthly ad budget ÷ 30.4, or, if none is set, a suggestion of
     about 10 clicks a day at Google's top-of-page bid estimate, which the owner must confirm or
     change.
5. The owner taps **Create it (paused)** and confirms the daily budget. Alphaa creates the
   budget, campaign, location and language criteria, negatives, ad groups, keywords and ad in a
   **single atomic** `googleAds:mutate` request, with the campaign status **PAUSED**.
6. Alphaa then asks **"Turn it on?"**. The campaign is enabled only when the owner taps
   **Turn it on**. No automated process ever enables a campaign.

`[Screenshot 4: the campaign plan in the chat: keywords with monthly searches, the ad, negatives]`
`[Screenshot 5: confirming the daily budget; "Create it (paused)"]`
`[Screenshot 6: "Turn it on?" after creation]`

### 2.3 Management (weekly tune-up)
Once a week Alphaa reads, for the campaign it built (last 30 days):
`search_term_view` (search term, status, cost, clicks, conversions), `keyword_view`
(keyword, status, cost, clicks, conversions) and whether the account has enabled conversion
actions. Rules, all from real numbers:
- a search term that cost at least half a day's budget (minimum 5) over 3+ clicks with no
  conversion → added as an exact-match campaign negative keyword;
- a keyword that cost at least 3 days' budget (minimum 30) with no conversion → paused
  (at least 3 keywords are always left running);
- if the owner lowers their monthly cap below the campaign's budget → the daily budget is
  lowered to fit. **Alphaa never raises a budget.**
- with no conversion tracking in the account, nothing is cut (zero conversions would mean
  "not measured", not "not working").

The owner chooses how this works: **"Ask me before each change"** (default: Alphaa shows the
changes with the reason for each and waits for **Make these changes**) or **"Run campaigns
within my budget"** (Alphaa applies them, still inside the owner's cap, and reports them).
Every tune-up can be undone in one tap (negatives removed, keywords re-enabled). The owner can
pause or resume the campaign at any time.

`[Screenshot 7: "What I'd change, and why" with real spend and clicks per item]`
`[Screenshot 8: "What I changed, and why" with Undo]`

### 2.4 Reporting
The **Ads** thread shows, from GAQL on `customer` and `campaign`: cost, clicks, impressions,
conversions and cost per lead for the last 7 and 30 days, plus a log of every change Alphaa
made in the account (time, what changed, who approved it).

`[Screenshot 9: the Ads report: last 7 / 30 days]`

---

## 3. API usage

| Purpose | Endpoint (v26 REST) |
|---|---|
| List the owner's accounts | `GET customers:listAccessibleCustomers` |
| Reporting and reads (GAQL) | `POST customers/{id}/googleAds:searchStream` |
| Keyword research | `POST customers/{id}:generateKeywordIdeas` |
| City for keyword research | `POST geoTargetConstants:suggest` |
| Create the campaign (atomic) | `POST customers/{id}/googleAds:mutate` (budget, campaign, campaign criteria, ad group, ad group criteria, ad group ad) |
| Enable / pause campaign | `POST customers/{id}/campaigns:mutate` |
| Add / remove negatives | `POST customers/{id}/campaignCriteria:mutate` |
| Pause / re-enable keywords | `POST customers/{id}/adGroupCriteria:mutate` |
| Lower the budget | `POST customers/{id}/campaignBudgets:mutate` |

Headers: `Authorization: Bearer <OAuth access token>`; `login-customer-id` is not needed
(manager accounts are excluded). No developer token is sent: access is managed by the Cloud
project.

**Expected volume:** creating one campaign is a single request of about 40–60 operations.
A weekly tune-up is 4 reads plus at most 3 mutate requests (up to ~20 operations). Every
mutate operation is counted per business, per day, in Alphaa's usage records.

---

## 4. Data handling

- **What we store:** the OAuth refresh token (encrypted with AES-256-GCM at rest; never logged,
  never shown), the chosen customer ID, account name and currency, the resource names of the
  campaign Alphaa created, the plan the owner approved, weekly tune-up results, and a log of every
  change Alphaa made. Access tokens are kept in memory only.
- **What we don't store:** the owner's Google password (Google's own sign-in is used), payment
  details, or data from accounts the owner didn't pick.
- **Use:** only to plan, create, manage and report on the owner's own campaigns inside Alphaa.
  Google Ads data is not sold, shared with other customers, or used to train models. Facts sent
  to the AI model that writes the plan are the business's own profile, its Search Console queries
  and Google's keyword volumes; no other advertiser's data.
- **Disconnect:** one tap in the Ads thread deletes the stored token and account link. The
  campaign stays in the owner's account untouched. Owners can also revoke Alphaa at
  myaccount.google.com/permissions.
- **Infrastructure:** Railway (application + PostgreSQL), TLS everywhere.
- **Privacy policy:** https://alphaa.app/privacy

---

## 5. RMF status (Full-service tool)

Built = live in the code today. Planned = to be built before Standard access takes effect.

| RMF | Feature | Status |
|---|---|---|
| C.10 | Create campaign | Built (Search) |
| C.20 | Geo targeting | Built (proximity) |
| C.30 | Language targeting | Built |
| C.65 | Website/call conversion + code snippet | Planned (Alphaa already installs GA4 / Meta Pixel lead tracking; Google Ads conversion actions not yet) |
| C.75 | Callout extensions (account level) | Planned |
| C.96 | Target CPA bidding | Planned |
| C.97 | Target ROAS bidding | Planned |
| C.98 | Maximize Conversions | Built |
| C.120 | Set budget | Built |
| C.190 | Create ad group | Built |
| C.260 | Add keyword | Built |
| C.270 | Campaign negative keywords | Built |
| C.300 | Keyword match type | Built (phrase, exact) |
| M.10 | Edit campaign settings | Partly built (status, budget down); full edit planned |
| M.96 / M.97 | Edit tCPA / tROAS | Planned |
| M.98 | Edit Maximize Conversions | Planned |
| M.110 | Pause / enable / remove campaign | Pause and enable built; remove planned |
| M.130 | Pause / enable / remove ad | Planned |
| M.140 | Pause / enable / remove keyword | Pause and enable built; remove planned |
| R.10 / R.20 | Customer / Campaign report | Built: clicks, cost, impressions, conversions (last 7 / 30 days). "All conversions" column planned |
| R.40 | Ad group ad report | Planned |
| R.50 | Keyword view report | Read for tuning; owner-facing table with first-page / first-position CPC estimates planned |
| R.70 | Search term view report | Read for tuning; owner-facing table with match type planned |
| R.130 | Bidding strategy report | Planned |
| — | Status fields, 30-day default range, CSV download | Planned with the reporting tables |

---

## 6. Contact

Varun Sharma, founder. Support: see https://alphaa.app.
