# LinkedIn Advertising API: what to apply for

Owner: Varun (it's his LinkedIn developer app). Company on the application: **9629033 Canada INC** (Alphaa), same Kanata address as the LinkedIn company Page verification.

The code is built and hidden: `src/lib/linkedin-ads/` (client, request builders, OAuth, promote flow), `/api/linkedin-ads/connect|callback`, Ads → "Promote a post". Nothing shows until LinkedIn grants access and `LINKEDIN_ADS=1` is set.

## What it's for

One feature: **promote an existing company Page post as Sponsored Content**. The business owner picks one of their own published Page posts (ranked by LinkedIn's own post stats from the Community Management API), I build a campaign for it **paused**, and nothing spends until the owner taps "Turn it on". Budget is capped by the owner's monthly ad limit and the dates they pick (3, 7 or 14 days). Owners can pause at any time. Later: read campaign results for the owner's ad report (`r_ads_reporting`).

We do NOT: create ads for anyone who didn't connect their own ad account, manage ads for third parties without their login, target by sensitive traits, run political ads, or use member data for anything except the owner's own campaign.

## Which product and scopes

1. **Advertising API** (LinkedIn Marketing Developer Platform). Apply from the developer portal: app → **Products** → "Advertising API" → Request access. It starts at the **Development tier** (test accounts and a few real ad accounts the app's members admin), then **Standard tier** after review.
2. Scopes we request: `r_ads` (read ad accounts and campaigns), `rw_ads` (create and change campaigns, campaign groups and creatives), `r_ads_reporting` (results for the owner's report).
3. Separate app: LinkedIn requires the **Community Management API** (company Pages, under appeal) to be the **only** product on its app. So the Advertising API goes on the main app (`LINKEDIN_CLIENT_ID`), or on a third app. The code reads `LINKEDIN_ADS_CLIENT_ID` / `LINKEDIN_ADS_CLIENT_SECRET` first and falls back to `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`.
4. Redirect URL to add on that app (Auth tab): `https://alphaa.app/api/linkedin-ads/callback`.

## Use-case text (paste into the application)

> Alphaa (9629033 Canada INC) is an AI marketing assistant for small businesses. Business owners connect their own LinkedIn company Page and their own LinkedIn ad account. Alphaa shows them which of their published company Page posts performed best (from the Page's own post statistics) and lets them promote one as Sponsored Content in their own ad account. Every campaign is created paused with the owner's chosen daily budget and end date, inside a monthly limit the owner sets; it only goes live when the owner taps "Turn it on" in Alphaa, and they can pause it at any time. We use rw_ads to create the campaign group, campaign and creative for that post and to turn it on or pause it at the owner's request, r_ads to list the ad accounts the owner can manage, and r_ads_reporting to show the owner spend, clicks and results for their own campaigns in their monthly report. We do not run ads on anyone else's behalf, do not offer political or sensitive-category targeting, and do not store LinkedIn member data beyond what the owner's own campaigns need.

## Steps for Varun

1. developer.linkedin.com → My apps → open the main Alphaa app (not the Pages app).
2. Products → **Advertising API** → Request access. Fill the form with the use-case text above; company 9629033 Canada INC; website alphaa.app; privacy policy alphaa.app/privacy; terms alphaa.app/terms.
3. Auth → add redirect URL `https://alphaa.app/api/linkedin-ads/callback`. Confirm `r_ads`, `rw_ads`, `r_ads_reporting` appear under OAuth scopes once access is granted.
4. While in Development tier: create a LinkedIn **test ad account** (Campaign Manager → create account; the app's admins can use it) to verify the first build. Make sure your LinkedIn member has a role on the ad account (CAMPAIGN_MANAGER or ACCOUNT_MANAGER) and is ADMINISTRATOR (or DIRECT_SPONSORED_CONTENT_POSTER) on the company Page.
5. When granted, set on Railway (service `alphaa`): `LINKEDIN_ADS=1` (+ `LINKEDIN_ADS_CLIENT_ID` / `LINKEDIN_ADS_CLIENT_SECRET` if it's a separate app). Optional `LINKEDIN_ADS_VERSION` (default `202611`).
6. Company Page posts must be connectable first (Community Management API approved and `LINKEDIN_ORG_SCOPES=1`): a promotion needs a Page post URN, and the ranking needs Page post stats.
7. First real check (Development tier, test account): Ads → Promote a post → a company Page post → Build it paused. Confirm in Campaign Manager: group ACTIVE, campaign PAUSED, creative referencing the post, budget and end date right. Verify the bidding fields there (costType CPM + optimizationTargetType MAX_IMPRESSION are not verified live yet). Then apply for Standard tier.

## Rules the code keeps

- Built PAUSED; on only from the owner's tap; pausing never blocked.
- Daily budget ≥ 10 (LinkedIn's floor) and inside the owner's monthly limit after Google, Meta and other LinkedIn spend.
- LinkedIn counts as one ad account in the Growth allowance (1 included, +$200/month each extra).
- `politicalIntent` is `NOT_POLITICAL` only when the owner ticks the confirmation (checked by default, as LinkedIn requires for EU targeting); otherwise `NOT_DECLARED`.
- Every change: `ad_change` quota + an `ads_change` row (platform `linkedin`) in What I changed.
