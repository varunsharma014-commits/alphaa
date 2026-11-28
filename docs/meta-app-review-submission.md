# Meta App Review submission pack: Alphaa (App ID 29091869270477242)

Round 1 (decided 2026-11-19): **5 permissions, Page + Instagram posting only**: pages_show_list,
pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish (+ default
public_profile). ads_management, ads_read, business_management, pages_manage_ads and
leads_retrieval were removed from the App Review draft and move to round 2. Round 2 also adds
Instagram data: instagram_manage_insights, read_insights and the Instagram Public Content Access
feature (built 2026-11-28; see "Round 2 additions: Instagram data" for the final list, paste
text, recording script and Varun's to-do).

Why: on 2026-11-19 the "Alphaa connect v2" login (system-user token) never granted the three ads
permissions, even to the app admin with the ad account ticked and after removing/re-adding the
connected app; Graph answered "Ad account owner has NOT grant ads_management or ads_read
permission". Round 2 needs either Advanced Access first or a user-token login configuration for
"turn on ads". Draft submission id 29094602640203905: descriptions and videos are filled in for
all 5; Varun still ticks each "I agree" box, the Data Handling answers and Reviewer instructions
(test login), then submits.
Scripts and background: `docs/meta-app-review.md`. Status: `docs/growth-platform-applications.md`.
Prepared 2026-11-18. **Round 1 SUBMITTED 2026-11-19** (submission 29094602640203905, "Review in progress", Meta says up to 20 days). Reviewer login: meta-review@alphaa.app (comped via COMP_ACCESS_EMAILS; password held by Varun, rotate after review). Processors listed: Railway, Anthropic, Resend (US, IT services); responsible entity 18355355 Canada Inc. (Canada).

## Videos

Edited from `recordings/meta-review-take.mov` (gitignored) into `recordings/meta-review/`.
1920x1080 H.264, captions in a bar under the picture, browser chrome, other tabs and the
desktop cropped out, the Facebook feed behind the post blurred.

| File | Length | Shows |
|---|---|---|
| `a-connect-pages_show_list.mp4` | 0:46 | Facebook Login for Business: portfolio GT, Page Alphaa AI Agent, Instagram alphaa.ai.agent, ad account Alphaa.app; the review screen with every permission (held 6 s); Confirm; "GT has been connected to Alphaa"; Alphaa listing the connected Page and Instagram account |
| `b-page-posting-pages_manage_posts-pages_read_engagement.mp4` | 0:49 | Recap of granted permissions; Page shown as Connected in Alphaa; post drafted ("Busy Season? Approve With One Tap"); owner taps Post now; "Posted to Facebook, Instagram"; See it on Facebook; the live post on the Alphaa AI Agent Page |
| `c-instagram-basic-content_publish.mp4` | 1:10 | Instagram account picked in the dialog; Instagram permissions on the review screen; @alphaa.ai.agent shown as Connected; Post now; "Posted to Facebook, Instagram"; the post first in the @alphaa.ai.agent grid; the post opened with its caption (from `meta-review-ig2.mov`) |
| ads video | round 2 | not recorded: the ads permissions were never granted (see top) |

### Still to record before submitting

1. ~~Instagram result~~ done 2026-11-19.
2. **The in-app button that opens the dialog:** the take starts with the Facebook dialog already
   open; "Social accounts & posts" → "Connect Facebook & Instagram" in Alphaa is not on screen.
   Nice to have for video a.
3. **Ads (round 2):** script B in `docs/meta-app-review.md` end to end: ad account / Page /
   Instagram / Pixel card in Alphaa (also the business_management and pages_show_list proof
   inside Alphaa), plan, "Build it, paused", Ads Manager showing it Off, Instant Form under the
   Page, Turn it on, test lead via the Lead Ads Testing Tool appearing in Alphaa, results card,
   Pause.

## Per permission

Paste text is tightened from `docs/meta-app-review.md`. Every permission's video also needs the
reviewer test login in "App verification details" (Varun enters the password; never paste it here).

### pages_show_list
**Video:** a
**Paste:**
> Alphaa is a marketing assistant for small local businesses. After the owner connects through
> Facebook Login for Business, Alphaa lists the Facebook Pages they chose to share (shown at the
> end of the video: "Your social accounts", Alphaa AI Agent, Connected), so they can see which
> Page Alphaa posts to and which Page their ads run from.

### business_management
**Video:** a (then the ads video once recorded)
**Paste:**
> The owner connects through Facebook Login for Business and picks the business portfolio and
> the assets Alphaa may use (video: portfolio GT, Page, Instagram account, ad account). Alphaa
> uses business_management only to read the ad accounts and pixels the owner shared from that
> portfolio (GET /me/adaccounts, /act_{id}/adspixels) so the owner can choose which to use for
> their campaigns. Alphaa never changes business settings, users or roles.

### pages_manage_posts
**Video:** b
**Paste:**
> Alphaa writes social posts for the business in the owner's voice with an image in their brand
> colours. A post is published to the owner's Facebook Page only after the owner approves it in
> Alphaa (video: the owner taps "Post now") or after the owner turned on "Post without asking"
> for social posts. The video ends on the published post on the Page.

### pages_read_engagement
**Video:** b (and a)
**Paste:**
> Alphaa reads the Pages the owner connected (name, picture, Page access token and the linked
> Instagram account) to show them in the dashboard (video: "Alphaa AI Agent, Facebook,
> Connected") and to publish approved posts and run approved ads from that Page. For lead ads it
> reads the lead and ad details of the forms Alphaa created.

### instagram_basic
**Video:** c (needs the Instagram clip appended)
**Paste:**
> Alphaa reads the Instagram professional account linked to the owner's Page (id, username,
> profile picture) to show it in the dashboard (video: "@alphaa.ai.agent, Instagram, Connected"),
> publish approved posts to it and use it as the Instagram identity of the owner's ads.

### instagram_content_publish
**Video:** c (needs the Instagram clip appended)
**Paste:**
> Alphaa publishes the posts the owner approved (an image with a caption) to their Instagram
> professional account, at the scheduled time or when the owner taps "Post now" (video). The
> video ends on the post on the Instagram profile.

### ads_management
**Video:** ads, pending new take
**Paste:**
> When the owner connects their ad account, Alphaa proposes one Facebook and Instagram campaign
> written from the business's own website and shows it for approval. Only after the owner
> approves the plan and daily budget does Alphaa create the campaign, ad set, images, creatives
> and ads in the owner's ad account, all paused; ads turn on only when the owner taps "Turn it
> on". Weekly, Alphaa proposes (or, if the owner allowed it, applies) small changes inside the
> owner's monthly cap: pausing an ad that spent without results and moving budget between the
> owner's campaigns. Every change is logged and shown to the owner. Alphaa never exceeds the
> owner's budget and never pays for or marks up ad spend.

### ads_read
**Video:** ads, pending new take
**Paste:**
> Alphaa reads spend, impressions, clicks and leads for the campaigns it created in the owner's
> ad account to show the last 7 and 30 days of results and cost per lead in the dashboard, and to
> decide the weekly changes described for ads_management. It reads only campaigns Alphaa built
> for that owner.

### pages_manage_ads
**Video:** ads, pending new take
**Paste:**
> Facebook and Instagram ads run from the owner's Page. After the owner approves a campaign in
> Alphaa, Alphaa uses pages_manage_ads to create the lead form (Instant Form) on that Page and
> ads whose identity is that Page.

### leads_retrieval
**Video:** ads, pending new take
**Paste:**
> For lead campaigns Alphaa creates an Instant Form on the owner's Page and reads new leads from
> it every hour, so the owner sees them in the Alphaa dashboard and can call or email them
> quickly. Alphaa stores only the name, email and phone number the form collected, encrypted,
> uses them only to show them to the owner and count results, never adds them to Alphaa's own
> marketing, and deletes them on request.

### Notes for the reviewer (paste)
> Every action is started by the business owner inside Alphaa. Alphaa drafts posts and
> campaigns; nothing is published and no budget is spent until the owner approves it. The videos
> use our own test business (Page "Alphaa AI Agent", Instagram @alphaa.ai.agent, ad account
> "Alphaa.app"), never a customer's.

## Round 2 additions: Instagram data (added 2026-11-28, Varun; BUILT 2026-11-28)

Goal: Instagram and Facebook data from Meta's own API: the owner's own post stats (reach, saves,
shares, views) and follower growth in Social Studio, the calendar and the Briefing; competitors'
Instagram (Business Discovery) and niche hashtags (hashtag search) in Research. Requirements checked
against Meta's docs (Graph API v27.0) on 2026-11-28.

### Final round 2 permission list

| Ask | Type | What Alphaa uses it for (in the app) |
|---|---|---|
| `ads_management`, `ads_read`, `business_management`, `pages_manage_ads`, `leads_retrieval` | permissions | the ads flow (script B in `docs/meta-app-review.md`); `ads_read` is also required by Business Discovery and IG media insights because our Page role comes through Business Manager |
| `instagram_manage_insights` | permission (new) | own IG post insights (reach, views, saves, shares) in Social Studio / calendar / Briefing, and Business Discovery of competitors' IG accounts in Research → Competitors |
| `read_insights` | permission (new) | Facebook Page post views, reach and clicks in Social Studio / calendar / Briefing |
| Instagram Public Content Access | feature (new) | hashtag search (`ig_hashtag_search` + `top_media`) for "What's working nearby"; max 30 unique hashtags per IG account per 7 days (counted in code) |
| `instagram_basic`, `pages_read_engagement`, `pages_show_list` | round 1 | required by all of the above; likes/comments counts and follower counts already work with these |

Not possible this way: other businesses' Facebook Page posts (Page Public Content Access, rarely
granted), personal Instagram accounts (Business Discovery covers Business/Creator only), Meta ads of
competitors outside politics in the US/CA.

### What the app does (code, so the paste text matches)
- `src/lib/social/meta-stats.ts`: per published post, IG `GET /{media-id}?fields=like_count,comments_count,...`
  (round 1) and, with `instagram_manage_insights`, `GET /{media-id}/insights?metric=reach,views,likes,comments,shares,saved,total_interactions`;
  FB `GET /{post-id}?fields=shares,reactions.summary,comments.summary` (round 1) and, with `read_insights`,
  `/{post-id}/insights?metric=post_media_view,post_total_media_view_unique,post_clicks`. No deprecated
  metric (impressions, plays, video_views, post_impressions*) is requested. Saved on `PostResult.stats`;
  refreshed daily (`/api/cron/social-stats` 04:00 UTC) and in the background when Social Studio opens.
  Followers: one `followers_count` snapshot per account per day (MockActivity `social_audience`).
- Granted permissions: `debug_token` on the brand's business token (cached 6h). Missing ones show
  "Reconnect to allow Instagram stats" in Social Studio (only with `META_INSIGHTS_IN_LOGIN=1`; before
  that: "Reach and saves are coming").
- `src/lib/social/meta-insights.ts` + `lib/niche-posts.ts`: Business Discovery of up to 2 competitors'
  IG usernames (from the Instagram link on their homepage) → stored as `rivalsIg` (followers, last 12
  posts' link + like/comment/view counts); hashtag top posts (only with `META_HASHTAG_SEARCH=1`).
  Captions and images of other accounts are never requested or stored.
- Best time to post (calendar): Instagram/Facebook posts with stats count as "Your data" once there
  are 6+ posts with numbers.

### Paste text (matched to the UI)

**instagram_manage_insights**
> Alphaa publishes Instagram posts the business owner approved. In Social Studio, each published post
> shows the numbers Instagram reports for it (video: "1,204 reached · 18 likes · 3 comments · 2 shares
> · 4 saves"), the account's follower count and growth is shown above the posts, and the Briefing shows
> "People reached · 30 days". The calendar uses these numbers to suggest the owner's best times to post
> ("Your data"). In Research → Competitors, Alphaa looks up the public Instagram Business accounts of the
> competitors the owner tracks (video: "Instagram @rival, 2,140 followers, last 12 posts: … likes, …
> comments", each post linked) so the owner can make their own original version of what works. Alphaa
> stores counts and post links only, never other accounts' captions or images.

**read_insights**
> For posts Alphaa published to the owner's Facebook Page, Social Studio shows the views, people reached
> and clicks Facebook reports for each post (video: "Facebook · 840 reached · 1,120 views · 12 reactions
> · 2 comments"), and the calendar uses them to suggest the owner's best times to post. Alphaa reads
> insights only for the Page the owner connected and only for posts it published.

**Instagram Public Content Access**
> In Research → "What's working nearby", Alphaa looks up a few hashtags for the owner's industry and
> city (video: "Instagram · #dentistottawa") and shows the top public posts' like and comment counts
> with a link to each post, so the owner sees which formats get engagement. "Make my version" writes an
> original post for the owner to approve. Alphaa stays under 30 hashtags per week per connected account,
> stores counts and links only, and never reposts other people's content.

### Recording script (round 2, Instagram data video; the ads take is script B in docs/meta-app-review.md)
Our own test business only: Page "Alphaa AI Agent", Instagram @alphaa.ai.agent, ad account
"Alphaa.app", signed in as the alphaa.app brand. Public Business accounts only for competitors.
Before recording: at least 6 posts published to @alphaa.ai.agent and the Page through Alphaa (for
"Your data" in the calendar), Social Studio opened the day before (follower growth needs 2 days of
snapshots), one competitor in Research whose homepage links an Instagram Business account, and
"Look now" run in "What's working nearby" after the reconnect.

1. **Connect (0:00-0:40).** Alphaa → menu → "Social accounts & posts" → "Connect Facebook & Instagram".
   Facebook Login for Business: portfolio, Page "Alphaa AI Agent", Instagram @alphaa.ai.agent, ad
   account "Alphaa.app". Hold the permissions screen 6 s so `instagram_manage_insights` and
   `read_insights` are readable. Confirm. Back in Alphaa: both accounts Connected.
2. **Social Studio, own Instagram stats (0:40-1:20).** Sidebar → Social Studio. Show the
   "Instagram followers · @alphaa.ai.agent" card (count, "+N since …", the line). Scroll to "Posted":
   a post with "1,… reached · … likes · … saves". Open it: "Numbers from the platform" → Instagram and
   Facebook lines. Cut to the same post's insights on Instagram so the numbers match.
3. **Facebook Page stats (1:20-1:40).** Same drawer: the Facebook line (reached, views, reactions,
   comments). Caption: "read_insights".
4. **Briefing + calendar (1:40-2:10).** Briefing tile "People reached · 30 days". Sidebar → Calendar:
   a published post chip with its numbers; open a draft's time picker: "Best times · Your data" with
   "Your data: from N of your Instagram posts, …".
5. **Competitors (2:10-2:45).** Research → Competitors: the card with "Instagram @rival, N followers,
   last 12 posts: … likes, … comments" and "Their Instagram ↗". Open the card: "Instagram post" rows
   with counts, each linked; click one to show it is the public post. "Make my version" (if shown).
6. **Hashtags (2:45-3:15).** Research → "What's working nearby": an Instagram card "Instagram ·
   #<tag>" with likes/comments and Source ↗; X-Ray; "Make my version" → the original draft. Caption:
   "Instagram Public Content Access: hashtag top posts, counts + links only".
7. **End (3:15).** Caption: "Alphaa stores counts and links only. Nothing is posted without the owner's
   approval."

### Varun's to-do (in this order)
1. **Add the permissions to the Login configuration** (only Varun's Meta account can):
   developers.facebook.com → My Apps → Alphaa (29091869270477242) → Facebook Login for Business →
   Configurations → "Alphaa connect v2" → Edit → Permissions: tick `instagram_manage_insights` and
   `read_insights` (keep every existing one, incl. the ads ones) → Save. If Meta doesn't allow editing
   it, create a new configuration with the same settings (System-user access token, expires Never,
   assets: Pages, Instagram accounts, ad accounts, pixels, same permissions + the two new ones) and
   replace `META_LOGIN_CONFIG_ID` on Railway with its id.
2. **App Review → Permissions and features**: request Advanced access for `instagram_manage_insights`,
   `read_insights` and the "Instagram Public Content Access" feature (in the round 2 submission with
   the ads permissions).
3. **Railway (service alphaa)**: set `META_INSIGHTS_IN_LOGIN=1` (turns on the "Reconnect to allow
   Instagram stats" button) and `META_HASHTAG_SEARCH=1` (hashtag search; as an app admin it should work
   on our own account in development mode).
4. **Reconnect** in Alphaa (Social Studio → "Reconnect Facebook & Instagram"), tick everything.
   Next day: check Social Studio shows "reached" and "saves" on our posts and Research shows the
   competitor's Instagram line. If not, the server log `[meta-stats]` / `[meta-insights]` lines say
   which call Meta refused.
5. **Record** the script above (and the ads take), edit like round 1 (1920x1080, captions bar,
   feeds blurred), upload one video per permission or one covering all three with captions.
6. **Paste** the text above per permission, add the reviewer test login, **submit**.

Live-verified on 2026-11-28: nothing yet (no token had the new permissions). Parsers are tested
against doc-shaped answers (`scripts/test-meta-insights.ts`, `scripts/fixtures/meta-insights/`).

## Data Handling questionnaire (draft answers)

Checked against the code on 2026-11-18 (`src/lib/social/`, `src/lib/metaads/`,
`src/lib/agent/`, `src/app/api/agent/chat/route.ts`) and https://alphaa.app/privacy (section 6a,
anchor `#meta-data-deletion`, and sections 4, 8, 11).

**Who is responsible for the Platform Data?**
18355355 Canada Inc. (operating as Alphaa), 1000 Innovation Drive, Suite 500, Kanata, ON
K2K 3E7, Canada (address as on the privacy page). VARUN TO CONFIRM: the app is under the GT
business portfolio (574311160209067); confirm Meta accepts 18355355 Canada Inc. as the
responsible entity with GT as the verified business, or which name to enter.

**Do you have data processors or service providers with access to Platform Data?** Yes:

| Processor | What Meta-derived data it sees | Basis in code |
|---|---|---|
| Railway (hosting + Postgres, United States) | All stored Platform Data: Page/Instagram/ad account IDs, names, handles, profile picture URLs; encrypted tokens (AES-256-GCM); posts and ads Alphaa created and their results; encrypted lead name/email/phone | everything runs and is stored there |
| Anthropic (Claude) | No Graph API responses, tokens or leads are put in prompts. The post and ad writers use the business profile, website facts, insights and public niche data (`lib/agent/week.ts`, `lib/metaads/plan.ts`). The dashboard chat (`api/agent/chat`) sends up to 2,500 characters of Alphaa's own activity ledger, which can include lines such as "Posted to Facebook, Instagram" and ad-change summaries (Page names, campaign changes). | grep 2026-11-18 |
| OpenAI | Only when the owner opts into "AI-made picture" images (`lib/post-images.ts`): a scene prompt from the post topic. No Platform Data. | |
| Resend (email) | The weekly briefing email to the owner can include the same ledger lines (published social posts, ad changes). Leads are not emailed (shown only in the dashboard). | `lib/agent/briefing.ts` ledger types include `social_published`, `ads_change` |

VARUN TO CONFIRM: whether to list Anthropic and Resend as processors of Platform Data given the
ledger lines above (safer answer: yes, list them). Clerk and Stripe see no Platform Data.

**Do you share Platform Data with third parties (other than processors)?** No. Not sold, not
shared, not used for Alphaa's own marketing or to train models (privacy 6a: "we do not sell or
share this data"). Lead data: Alphaa is the owner's processor.

**Data retention and deletion** (privacy 6a and 8):
- Kept while the account is active and the connection exists.
- Disconnect in "Social accounts & posts" deletes the stored token and connection immediately.
- Owner can also remove Alphaa in Facebook Settings → Business Integrations.
- Full deletion of data received from Facebook/Instagram: email privacy@alphaa.app from the
  account email; deleted within 30 days and confirmed by email.
- Account deletion: personal information deleted or anonymised within 30 days.
- Leads: deleted on request or when the account closes.
- Posts already published stay on the owner's accounts until the owner removes them.
- Data deletion instructions URL: https://alphaa.app/privacy#meta-data-deletion (anchor exists).

VARUN TO CONFIRM: there is no Meta data-deletion *callback* endpoint, only the instructions URL;
confirm that is what the app settings use.

**How is Platform Data protected?** Tokens encrypted with AES-256-GCM before saving, decrypted
only server-side when Alphaa acts, never sent to the browser; lead contact details encrypted;
HTTPS only; access limited to the founders. VARUN TO CONFIRM any formal controls Meta asks
about (staff access policy, incident response, audits): the code shows encryption only.

**Requests from public authorities / national security requests in the past 12 months?** None.
Policy for future requests: VARUN TO CONFIRM (suggested: review legality, challenge overbroad
requests, disclose the minimum, notify the user where lawful).

## Things to fix or check before submitting

- Privacy 6a says social and ad accounts are "On the Growth plan", but social posting is sold on
  Pro and up (CLAUDE.md). VARUN TO CONFIRM and fix the wording.
- Privacy 6a lists "reading the comments ... replying to comments", which are round-2 features
  not built and not requested in round 1. Fine to keep, or soften to "when available".
- Privacy page uses both hi@alphaa.app and privacy@alphaa.app for privacy requests; pick one.
- Video a shows the dialog's "Dataset" set to Alphaa.app before it was cleared; harmless but
  visible.
