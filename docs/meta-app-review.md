# Meta App Review: Alphaa (App ID 29091869270477242)

What to paste into App Review → Permissions and features for each permission, and the screen
recording to make for it. All recordings use the real product at https://alphaa.app with a test
business (a Growth-plan account) that owns a Facebook Page, a linked Instagram professional
account, an ad account and a pixel. Checked against developers.facebook.com on 2026-11-18
(Graph/Marketing API v27.0, introduced 2026-11-04).

## Before you start

- Business Verification for the business portfolio (GT, id 574311160209067) must be done.
- Data deletion URL: https://alphaa.app/privacy#meta-data-deletion. Privacy: https://alphaa.app/privacy.
- Login: Facebook Login for Business, configuration "Alphaa connect (business)" (`META_LOGIN_CONFIG_ID`).
- The reviewer needs a way in: give them a Growth test account (email + password in the
  "App verification details" box, never in a public field) and say where to click.
- Recording rules Meta enforces: show the Facebook login dialog with the permission being
  granted, then show the app *using* that permission end to end, with the result visible on
  Facebook/Instagram. English UI, cursor visible, captions or a voice-over are fine. One video
  can cover several permissions if each is clearly shown.
- **Do not request a permission whose feature isn't live.** Meta rejects a request if the
  recording can't show it in use. Today that means: hold back `pages_read_user_content`,
  `pages_manage_engagement` and `instagram_manage_comments` until the comment-reply feature
  ships (marked NOT READY below). `instagram_manage_insights`, `read_insights` and Instagram
  Public Content Access are built (2026-11-28) and go in round 2: paste text and the recording
  script are in `docs/meta-app-review-submission.md` ("Round 2 additions").

## Shared recording A: connect (used by every permission)

1. Sign in at https://alphaa.app/login as the test business. The dashboard chat opens.
2. Open the menu (left rail, or the header button on a narrow screen) → "Social accounts & posts".
3. Tap "Connect Facebook & Instagram". The Facebook Login for Business dialog opens.
4. Choose the test business, then tick the Page, the Instagram account, the ad account and the
   pixel. Pause on the permissions screen so every permission is readable. Continue.
5. Back in Alphaa, the chat says "Connected <Page name>, @<instagram>." and lists both accounts.

## Shared recording B: ads (ads_management, ads_read, business_management, pages_manage_ads, leads_retrieval)

1. After A, open the menu → "Ads" (or the "Plan my Meta ads" chip in "Your marketing channels").
2. Show the "Facebook & Instagram ads" card: ad account, Page, Instagram, Meta Pixel. If asked,
   tap the ad account and Page to use.
3. Tap "Plan my first campaign". Show the plan: goal, who sees it (city + radius, adults 18+),
   daily budget, and the 2-3 ads with their images.
4. Tap "Approve and build it (paused)", enter the daily budget and the privacy policy link,
   tap "Build it, paused". The chat says it's built and paused.
5. Open Meta Ads Manager in another tab ("See it in Meta Ads Manager"): show the campaign,
   ad set and ads, all Off/Paused, and the lead form under the Page's Instant Forms.
6. Back in Alphaa, tap "Turn it on". Show Ads Manager: now On (In review).
7. Submit a test lead with Meta's Lead Ads Testing Tool
   (developers.facebook.com/tools/lead-ads-testing) for that form, wait for the hourly poll (or
   have an engineer trigger `/api/cron/meta-ads?job=leads`), reopen "Ads": the lead shows with
   name, email and phone, and "Call"/"Email" chips.
8. Show the results card ("Facebook & Instagram results", last 7 and 30 days) and, if a weekly
   check has run, "What I changed this week, and why" with "Make these changes".
9. Tap "Pause it". Show Ads Manager: Off.

## Shared recording C: posting (pages_manage_posts, instagram_content_publish)

1. After A, in the chat type "run my marketing for this week" (or open "Social accounts & posts"
   if a draft is already waiting).
2. Show a social post draft with its image; tap "Post now".
3. Open the Facebook Page and the Instagram profile: the post is there. Tap "See it on Facebook".

---

## Permissions

### ads_management
**How will you use it:**
Alphaa is a marketing assistant for small local businesses. When the business owner connects
their ad account, Alphaa proposes one Facebook and Instagram campaign written from the business's
own website, shows it in the Alphaa dashboard for approval, and only after the owner approves the
plan and daily budget creates the campaign, ad set, ad images, creatives and ads in the owner's ad
account, all paused. Ads are turned on only when the owner taps "Turn it on". Once a week Alphaa
reads the results and proposes (or, if the owner allowed it, applies) small changes inside the
owner's monthly budget cap: pausing an ad that spent without results and moving budget between
the owner's campaigns. Every change is logged and shown to the owner. Alphaa never exceeds the
budget the owner set and never pays for or marks up ad spend.
**Recording:** A, then B steps 1-6 and 9.

### ads_read
**How will you use it:**
Alphaa reads spend, impressions, clicks and leads for the campaigns it created in the owner's ad
account, to show the owner their last 7 and 30 days of results and cost per lead in the dashboard
and to decide the weekly optimisations described for ads_management. It only reads campaigns
Alphaa built for that owner.
**Recording:** A, then B step 8 (results card), cutting to Ads Manager to show the same numbers.

### business_management
**How will you use it:**
The owner connects through Facebook Login for Business and chooses which business assets
Alphaa may use. Alphaa uses business_management to read the ad accounts and pixels the owner
shared from their business portfolio (GET /me/adaccounts and /act_{id}/adspixels), so the owner
can pick the ad account and pixel for their campaigns. Alphaa does not change business settings,
users or roles.
**Recording:** A (asset picker), then B step 2 (the ad account and pixel listed in Alphaa).

### leads_retrieval
**How will you use it:**
For lead campaigns, Alphaa creates an Instant Form on the owner's Page and, every hour, reads new
leads from that form so the owner sees them in their Alphaa dashboard and can call or email them
quickly. Alphaa stores only the name, email and phone number the form collected, encrypted,
uses them only to show them to the owner and to count results, never adds them to Alphaa's own
marketing, and deletes them on request.
**Recording:** A, then B steps 4-5 (form created) and 7 (test lead appears in Alphaa).

### pages_manage_ads
**How will you use it:**
Ads on Facebook and Instagram run from the owner's Page. Alphaa uses pages_manage_ads to create
the lead form (Instant Form) on the owner's Page and to create ads whose identity is that Page,
after the owner approves the campaign in Alphaa.
**Recording:** A, then B steps 4-5 (form under the Page's Instant Forms; ads shown as the Page).

### pages_manage_posts
**How will you use it:**
Alphaa writes social posts for the business in the owner's voice, with an image in their brand
colours. Each post is published to the owner's Facebook Page only after the owner approves it in
Alphaa (or after the owner turned on "Post without asking" for social posts), at the time shown.
**Recording:** A, then C.

### pages_read_engagement
**How will you use it:**
Alphaa reads the Pages the owner connected (name, picture, Page access token, the linked
Instagram account) to show them in the dashboard and to publish approved posts and run approved
ads from that Page. For lead ads it reads the lead and ad details of the forms Alphaa created.
**Recording:** A step 5 (Page name and picture shown in Alphaa), then C.

### pages_show_list
**How will you use it:**
After the owner connects, Alphaa lists the Facebook Pages they chose to share so they can see
which Page Alphaa will post to and pick the Page their ads come from.
**Recording:** A step 5, then B step 2 (Page picker/summary).

### instagram_basic
**How will you use it:**
Alphaa reads the Instagram professional account linked to the owner's Page (id, username,
profile picture) to show it in the dashboard, publish approved posts to it and use it as the
Instagram identity of the owner's ads.
**Recording:** A step 5 (@username shown), then B step 2 (Instagram row).

### instagram_content_publish
**How will you use it:**
Alphaa publishes the social posts the owner approved (an image with a caption) to their Instagram
professional account, at the scheduled time or when the owner taps "Post now".
**Recording:** A, then C (show the post on the Instagram profile).

### pages_read_user_content — NOT READY (comment replies not built)
**How will you use it (when built):**
Alphaa reads the comments people leave on the posts and ads it published to the owner's Page so
it can show them in the dashboard and draft replies for the owner to approve.
**Recording (when built):** A, then open the post in Alphaa, show the comments pulled in, approve a reply.

### pages_manage_engagement — NOT READY
**How will you use it (when built):**
Alphaa posts the replies to Page comments that the owner approved in the dashboard, as the Page.
**Recording (when built):** as above, then show the reply under the post on Facebook.

### instagram_manage_comments — NOT READY
**How will you use it (when built):**
Alphaa reads comments on the owner's Instagram posts it published and posts the replies the owner
approved in the dashboard.
**Recording (when built):** A, an Instagram post's comments in Alphaa, approve a reply, show it on Instagram.

### instagram_manage_insights, read_insights, Instagram Public Content Access — BUILT 2026-11-28
Round 2. Paste text per permission and the scene-by-scene recording script:
`docs/meta-app-review-submission.md` → "Round 2 additions: Instagram data".

---

## Marketing API access tier (was "Ads Management Standard Access")

Verified on developers.facebook.com/docs/marketing-api/overview/authorization, 2026-11-18:

- Meta renamed it: "Ads Management Standard Access" is now the **Marketing API Access Tier**
  feature. Levels: **Limited Access** (was Standard; default when you add the Marketing API
  product, "heavily rate-limited per ad account", for development only) and **Full Access**
  (was Advanced; "lightly rate limited per ad account"). No code change between them.
- To qualify for Full Access the app must have made **at least 500 successful Marketing API
  calls in the last 15 days** (lowered from 1,500) with an **error rate under 15% over the last
  500 calls**.
- Where: App Dashboard → App Review → Permissions and features → "Marketing API Access Tier" →
  "+Upgrade". The same screen shows the current level.
- How we get there: while in Limited Access, the app can manage ad accounts of people with a
  role on the app (admins, developers, testers) and their businesses. Run real campaigns on
  our own and test ad accounts through Alphaa (plan → build paused → turn on → reports →
  hourly lead polls → weekly check): the hourly lead poll and report reads add up fast, and keep
  errors low (fix any recurring Meta error before applying; a 15% error rate blocks the upgrade).
- Also needed for live advertisers: the permissions above approved for Advanced access, Business
  Verification, and the app switched to Live.

## Still unconfirmed

- Lead form params `privacy_policy {url, link_text}`, `follow_up_action_url`, `locale`: the
  Page leadgen_forms reference does not mark them required; we send them (Meta's form builder
  requires a privacy policy). Test on a real Page.
- `is_adset_budget_sharing_enabled=false` on campaign create (Meta's examples send it, the
  reference doesn't describe it).
- Zero-decimal currencies for budgets (JPY, KRW, CLP…) are from memory of Meta's currency table.
- `CREDIT` is still listed as a special category; we use `FINANCIAL_PRODUCTS_SERVICES` for
  credit, loans, insurance and other financial businesses, which Meta's special-category page
  now covers together.
