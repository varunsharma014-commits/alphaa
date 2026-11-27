# Webflow Marketplace submission: Alphaa (Data Client app)

Prepared 2026-11-27. Everything below is paste-ready. Nothing has been submitted.

**History:** first submitted 2026-10-05; review came back **Changes requested** on 2026-10-07 (install asked for Webflow authorization twice). That was fixed in October (140f25a, db79aeb). The resubmission then stalled on 2026-10-21 because the form demanded an App Review Preflight receipt (`wfpre_…`), which a Data Client app cannot produce. **That blocker is gone:** Webflow's current docs say a Data Client app without the Custom code scope is not asked for a receipt, and the form shows **"Not needed for this app"** once the Client ID is entered (see Sources).

Code was brought in line with the current Marketplace Guidelines on 2026-11-27 (commits `0badc73`, `ab24a73`, plus the privacy wording commit). Details are in "Code checks against the guidelines" at the end.

---

## 1. What only Varun can do (in order)

1. ~~Make the test site~~ **DONE 2026-11-27:** "Alphaa Test Blog" (free Notable blog template, Blog CMS + categories) in GT's Workspace, published at https://alphaa-test-blog.webflow.io. Both FairWayPay sites were archived (unpublished, off the dashboard; Webflow has no other delete).
2. **Create the reviewer login** `webflow-review@alphaa.app` (about 5 min): see §6. Set its password, add it to `COMP_ACCESS_EMAILS` on Railway, then install the app on the test site **from that login**.
3. **Record the reviewer demo video** (2:30 to 3:30, macOS screen recording): follow the shot list in §4. Upload it to YouTube as **Unlisted** (or Loom), then check that it plays in a private window.
4. **Upload the promo video** `brand/apps/listing/color/webflow/alphaa-webflow-listing.mp4` to YouTube as **Unlisted**, title "Alphaa for Webflow", thumbnail `alphaa-webflow-listing-poster.png`. It is optional, but it helps.
5. **Two-factor authentication** must be on for one admin of GT's Workspace (Webflow account settings, then Security).
6. **Before you submit**, make sure the dependency upgrade in §7 (npm audit: 1 critical, 20 high) has shipped.
7. **Open the form** at developers.webflow.com/submit (signed in with the Webflow account that owns GT's Workspace). Paste §2 field by field. Upload the icon and the 4 screenshots in the same sitting, because file uploads don't autosave. Tick the 2 checkboxes, then Submit.
8. After submitting, watch the **review contact inbox** (hi@alphaa.app forwards to your Gmail). Webflow aims to decide within **10 business days**. Keep the reviewer login, the test site and alphaa.app running the whole time, and keep them running after approval too, because Webflow audits later.

Don't change anything on the Webflow app's settings page (scopes, redirect URI). It already matches the code.

---

## 2. Form fields: final text

### App info

| Field | Value |
|---|---|
| App Review Preflight receipt | Leave empty. After the Client ID is entered, the form should show "Not needed for this app" (Data Client, no Custom code scope). If it still insists, **don't type anything**: reply on Webflow support ticket #1210247 and quote the docs line "A Data Client App without that scope is not asked for one." |
| Submission type | **New App** (Alphaa has never been approved, so this is a resubmission of a new app). If the form rejects the Client ID as already listed, use **App Update**. |
| App name | `Alphaa` (locked) |
| App client ID | `20063146a855b9ebf2dece522d03fdf3d1cb9b5f7852ae229a8091e207e38441` (public: it is in the install URL). Then click **Check Client ID**. |
| App capabilities | **Data Client** |
| Scopes | **Sites: read** · **CMS: write** (read + write) · **Pages: write** (read + write). Add nothing else. Never Custom code. |
| Install URL (if asked) | `https://alphaa.app/api/connect/webflow/start` (redirects straight to Webflow's authorize screen with this client_id and exactly these 5 scopes, plus a state nonce) |
| Does your app run server-side code? | **Yes** |
| App icon image | `brand/apps/listing/color/webflow/Alphaa multicolour orb logo.png` (900x900 PNG, 37.7 KB, opaque white background, orb logomark, no text). The file name is the alt text, as the form asks. |
| App icon image alt text | `Alphaa multicolour orb logo` |
| Pricing | **Paid** (no ongoing free tier) |
| Marketplace visibility | **Public** |

### Creator info

| Field | Value |
|---|---|
| Creator name | `Alphaa` |
| Webflow account email | The email of the Webflow account you are signed in with: the owner of GT's Workspace, where the app is registered. |
| Review contact email | `hi@alphaa.app` (a Cloudflare catch-all that forwards to Varun's Gmail) |

### App details

**App category** (max 2): **AI**, **SEO**

**App preview description (short)** (98 of 100 characters):
```
AI marketing agent that writes the pages your customers search for and publishes them to your CMS.
```

**App detail description** (paste as is; Markdown):
```
Alphaa is an AI marketing agent for small businesses. Every week it checks what ChatGPT, Gemini, Claude and Perplexity tell your customers, finds the questions they ask, and writes the pages that answer them. With the Webflow app, those pages go straight into your Webflow CMS after you approve them, and every change has an Undo.

## What Alphaa does on your Webflow site
- **Blog posts and FAQ pages:** published as items in your blog collection (title, slug, body, summary and featured image mapped to your fields). Required fields in your collection, like a category or a date, are filled automatically.
- **Page titles and descriptions:** updates the SEO title and meta description of your static pages when you approve a new one. Webflow shows them on your live site the next time you publish.
- **Undo on everything:** Undo unpublishes a post and keeps it in your CMS as a draft, or puts a page title and description back to what they were. Alphaa never deletes your content.
- **Sites that aren't published yet:** posts are saved in your CMS and go live with your next site publish.

## You stay in control
Nothing goes live until you approve it in Alphaa. On the Pro plan you can turn on auto-publish for blog posts; it only publishes posts that have no missing facts, and each one still has Undo. You can check, reconnect or disconnect the connection any time in Alphaa under Settings, Website connection. Disconnecting revokes Alphaa's Webflow access and deletes its token.

## Permissions and why
- **Sites: read** to find your site and its public address, so links to new posts are right.
- **CMS: read and write** to find your blog collection and its fields, publish the posts you approve, and unpublish them on Undo.
- **Pages: read and write** to match a page to its Webflow page and save the title and description you approve, and to put them back on Undo.

Alphaa adds no custom code or scripts to your site, doesn't change your designs, forms or site settings, and never publishes your whole site. You need a CMS collection with a rich-text field (like a Blog) for posts.

## Setup
1. Install Alphaa from the Webflow Marketplace.
2. Choose your site and click Authorize.
3. Create your Alphaa account (or sign in). You authorize Webflow only once.
4. Approve your first post and it goes live on your site.

## Plans
Billed monthly on alphaa.app (15% off yearly), cancel online any time. There is no free plan or trial; the free AI check on alphaa.app shows what AI says about your business before you pay.
- **Starter, $99/month:** AI search. Weekly checks on ChatGPT, Gemini, Claude and Perplexity, wrong facts corrected, website fixes, 2 blog posts a month.
- **Pro, $499/month:** everything except ads. Starter plus social media posts, Google Business posts and review replies, email to your customers, 4 blog posts a month, auto-publish.
- **Growth, $799/month (early access):** Pro plus Google or Meta ads.

All three plans publish to Webflow.

## Data and privacy
Alphaa stores your site's ID and address, the CMS collection it publishes to and its field names, and an access token encrypted with AES-256-GCM on our servers. The token is never sent to your browser, and it is deleted when you disconnect, uninstall or delete your account. Full details are in our privacy policy.

Alphaa works in English. Support: hi@alphaa.app.
```

**App promo video URL** (optional): the YouTube **Unlisted** link of `alphaa-webflow-listing.mp4` (1:28).

**App screenshots** (4 required, all 1280x846 PNG, under 2 MB), in this order:

| # | File | Alt text |
|---|---|---|
| 1 | `brand/apps/listing/color/webflow/alphaa-webflow-1.png` | Alphaa dashboard briefing showing what ChatGPT, Claude, Perplexity and Gemini tell customers about an example dental practice, next to the headline "Your AI marketing agent". |
| 2 | `brand/apps/listing/color/webflow/alphaa-webflow-2.png` | Alphaa Social Studio with branded social posts ready to publish in one tap, using example data. |
| 3 | `brand/apps/listing/color/webflow/alphaa-webflow-3.png` | Alphaa Research and Ideas page suggesting a "Family dentist FAQ" page to publish to the Webflow CMS, using example data. |
| 4 | `brand/apps/listing/color/webflow/alphaa-webflow-4.png` | Alphaa plans: Starter $99 per month, Pro $499 per month, Growth $799 per month in early access. |

**Source map artifact:** leave empty (Data Client only; no bundle).

**Features overview** (5):
1. `Publishes the blog and FAQ posts you approve to your Webflow CMS collection`
2. `Undo on every change: posts go back to draft, page titles go back`
3. `Updates page SEO titles and descriptions you approve`
4. `Checks what ChatGPT, Gemini, Claude and Perplexity say about you weekly`
5. `Nothing goes live without your OK; Pro can auto-publish complete posts`

**Website URL:** `https://alphaa.app/integrations/webflow`

**Additional Notes** (reviewer notes; no credentials here):
```
HOW TO TEST (about 10 minutes)

Install and OAuth
1. In a private window, open the install URL: https://alphaa.app/api/connect/webflow/start
   It goes straight to Webflow's authorization screen (scopes: sites:read cms:read cms:write pages:read pages:write, with a one-time state value tied to your browser).
2. Deny: click Cancel. Alphaa shows "Webflow isn't connected: You cancelled the Webflow connection, so nothing was connected and Alphaa has no access to your site", with Try again. No token is requested or stored.
3. Approve: click Try again, choose a site that has a CMS collection with a rich-text field, click Authorize. Alphaa asks you to create an account or sign in (use the credentials provided, or sign up with marketplaceteam@webflow.com, which gets full access automatically). You authorize Webflow only once: the code is exchanged at the callback and the token is held server-side until you finish signing in.
4. You land in Alphaa with "I'm connected to your Webflow site." Alphaa found the site's blog collection and its required fields (Settings > Website connection shows it).

Publish and Undo
5. Open https://alphaa.app/dashboard?ask=content (Posts & Pages). Tap "Write a post now", then "Do it on my site" on the draft.
6. Alphaa answers "Done — it's live on your site" with the live URL on the .webflow.io site and an Undo button. Open it: the post uses the site's own Collection template.
7. Tap Undo: the item is unpublished and kept in the CMS as a draft (never deleted). Reload the live URL: it's gone.
   If the site was never published, the item is saved in the CMS (Alphaa says so) and goes live with the next site publish.

Page titles
8. Research & Ideas and the weekly checks suggest page title/description fixes. "Do it on my site" saves them to the page's SEO settings (staged until you publish in Webflow); Undo restores the previous title and description.

Disconnect, reconnect, uninstall
9. Settings > Website connection (https://alphaa.app/dashboard/settings/website): shows the site and a live check. Disconnect calls Webflow's revoke_authorization and deletes the stored token at once. Reconnect runs the same install flow.
10. Uninstalling Alphaa in Webflow revokes the token. Webflow sends apps no uninstall event, so Alphaa deletes the stored token the first time Webflow refuses it (any request, plus a daily check of every connection).
    Alphaa adds no custom code or scripts, so uninstalling leaves nothing in the site's code. Posts the owner approved stay in the CMS as their content; the docs page explains how to remove them (Undo, or delete the item in the CMS).

TESTING SITE
The published testing site has Alphaa installed and connected to the review login. It shows one post Alphaa published and one it published and then undid (now a draft in the CMS).

PRICING
Billed on alphaa.app through Stripe: Starter $99, Pro $499, Growth $799 (early access) per month, 15% off yearly. No in-app purchases inside Webflow. All plans can publish to Webflow. The review login is comped with every feature unlocked and never expires.

DATA HANDLING
Stored per connection: site ID and address, the target CMS collection ID and field slugs, and the OAuth access token. Attestations:
- The Webflow OAuth token is encrypted at rest (AES-256-GCM, key held only on our server).
- It is stored server-side only: never in browser storage, cookies, client code, logs or API responses. A signed-out install keeps it in server memory for at most 30 minutes; the browser holds only an encrypted random handle.
- It is deleted on disconnect, on uninstall/revocation (first 401 from Webflow, plus a daily check), and on account deletion (where it is also revoked at Webflow).
OAuth codes are exchanged immediately and never stored or logged. Every Data API call has a 20 s timeout; 429s are retried with exponential backoff (1 s, 2 s, 4 s, max 3 retries). All endpoints are HTTPS on alphaa.app; every endpoint that uses the token requires the signed-in Alphaa session (Clerk, SameSite cookies, no CORS allowances).

Documentation: https://alphaa.app/integrations/webflow  ·  Privacy: https://alphaa.app/privacy (section 6)  ·  Support: hi@alphaa.app
```

### App Access Credentials

| Field | Value |
|---|---|
| Published testing site | `https://<new-test-site>.webflow.io` (from §5; fill in the real address) |
| App Access Credentials (max 2,000 chars) | see the block below |
| "I confirm…" checkbox | tick (the login has the highest tier and doesn't expire) |

```
Alphaa review login (every plan feature unlocked, including the highest tier; no payment; does not expire)
Sign in: https://alphaa.app/login
Email: webflow-review@alphaa.app
Password: <VARUN TYPES IT HERE>
No one-time code is asked at sign-in.

This login is already connected to the published testing site.
To test the install yourself, open https://alphaa.app/api/connect/webflow/start (signed in or not) and authorize your own Webflow site; connecting a new site replaces the current one for this login.

Alternative: sign up at https://alphaa.app/signup with marketplaceteam@webflow.com. That address gets the same full access automatically, with no payment step.
```

### Support info

| Field | Value |
|---|---|
| Review Team Demo Video URL | The YouTube Unlisted (or Loom) link of the recording from §4 |
| Documentation URL | `https://alphaa.app/integrations/webflow` |
| Privacy Policy URL | `https://alphaa.app/privacy` |
| How can users reach support? | **Email** |
| Support email | `hi@alphaa.app` |
| Terms and Conditions URL | `https://alphaa.app/terms` |
| Acknowledgements | tick |

All of these URLs were checked on 2026-11-27: they returned 200, or 307 to Webflow for the install URL.

---

## 3. Asset checklist

| Asset | Path | Spec check |
|---|---|---|
| Icon (form upload) | `brand/apps/listing/color/webflow/Alphaa multicolour orb logo.png` | 900x900, PNG, opaque, 37.7 KB (under 50 KB), logomark ✓ |
| Screenshots 1-4 | `brand/apps/listing/color/webflow/alphaa-webflow-{1..4}.png` | 1280x846 PNG, 62-107 KB ✓ (4 required, 5 max) |
| Promo video (YouTube) | `brand/apps/listing/color/webflow/alphaa-webflow-listing.mp4` | 1:28, 1920x1080, 30 fps, H.264, silent, 9.6 MB ✓ (1-2 min) |
| Promo thumbnail | `brand/apps/listing/color/webflow/alphaa-webflow-listing-poster.png` | 1280x720 |
| Promo source | `brand/apps/listing/color/webflow/video/make-video.mjs` | 12 HTML scenes rendered with headless Chrome, then ffmpeg. Real dashboard UI from `/preview` (sample data "Example Dental"). The Webflow steps use the app's own wording. No people, voice, stock, AI media or music. |
| Reviewer demo video | recorded by Varun (§4) | 2-5 min, English, approve AND deny, Loom or YouTube Unlisted |
| Publisher logo (20x20) | inherited from GT's Workspace settings | check it isn't a GT logo that confuses users; Webflow says the workspace name and icon should match the listing |

---

## 4. Reviewer demo video: shot list (target 2:45, hard limits 2:00 to 5:00)

**Setup before recording**
- Chrome, a **new guest/incognito window** at 1440x900, zoom 100%, bookmarks bar hidden. Close other tabs and silence notifications (Focus mode).
- Signed **out** of alphaa.app in that window. In a second normal tab, be signed in to Webflow with the account that owns the test site.
- Test site from §5 published. **Disconnect** it in the reviewer login first (Settings, Website connection, Disconnect), so the recording starts from "not connected".
- Record with ⌘⇧5, "Record Selected Portion", over the browser window. No microphone. Add on-screen captions afterwards: iMovie titles, or YouTube's subtitle editor with the caption text below. English captions satisfy "English or English subtitles".

| # | Time | Do this (exact clicks) | Caption |
|---|---|---|---|
| 1 | 0:00-0:10 | Show the published test site's home page (`https://<test-site>.webflow.io`) and its /blog page. | "Test site: a published Webflow site with a Blog CMS collection." |
| 2 | 0:10-0:25 | In the incognito tab, paste `https://alphaa.app/api/connect/webflow/start`. Webflow's authorization screen opens. Hover over the permissions list. | "Install starts Webflow OAuth. Alphaa asks for Sites read, CMS read/write, Pages read/write." |
| 3 | 0:25-0:40 | **Deny:** click **Cancel**. The Alphaa page "Webflow isn't connected" appears. Hold 3 seconds. | "Deny: nothing is connected and no token is requested." |
| 4 | 0:40-1:05 | **Approve:** click **Try again**, select the test site, click **Authorize App**. The Alphaa sign-up page appears. Click "Sign in", then type `webflow-review@alphaa.app` and the password (blur or crop the password field; never show it). | "Approve: pick the site, authorize once, then sign in to Alphaa." |
| 5 | 1:05-1:15 | You land on the dashboard with "I’m connected to your Webflow site. ✓" (new logins finish the short onboarding first). | "Connected. Alphaa found the blog collection and its required fields." |
| 6 | 1:15-1:40 | Go to `alphaa.app/dashboard?ask=content`, click **Write a post now**, wait for the draft, scroll it, click **Do it on my site**. Show "Done — it's live on your site" with the URL. | "Nothing is published until the owner approves." |
| 7 | 1:40-1:55 | Click **Open it**. The post is live on the .webflow.io site in the site's own template. | "Published as a live item in the blog collection." |
| 8 | 1:55-2:05 | In the Webflow tab, open the site's CMS, then Blog Posts. Show the new item as Published. | "It's a normal CMS item the owner can edit." |
| 9 | 2:05-2:20 | Back in Alphaa, click **Undo**. Read "Undone. It's unpublished on your site, and kept as a draft…". Reload the live URL: 404. In the Webflow CMS, the item now shows as Draft. | "Undo unpublishes and keeps a draft. Alphaa never deletes content." |
| 10 | 2:20-2:35 | Go to `alphaa.app/dashboard/settings/website`. Show "Connected" and click **Check again**. Click **Disconnect** and confirm. | "Disconnect revokes Alphaa's Webflow access and deletes the token." |
| 11 | 2:35-2:50 | In Webflow, open the workspace's Apps & Integrations, Installed apps: Alphaa is gone or shows no access. Then show the install again (one Authorize click) to leave the test site connected for reviewers. | "Uninstalling in Webflow also revokes access; Alphaa deletes the token when Webflow refuses it." |
| 12 | 2:50-2:55 | End on `alphaa.app/integrations/webflow`. | "Docs: alphaa.app/integrations/webflow · Support: hi@alphaa.app" |

Re-record if anything shows: a real customer's data, any client site (FairWayPay, GT clients), the password, other browser tabs, or another Alphaa account in the site switcher.

---

## 5. Test site plan

**Status 2026-11-27:** created and published: https://alphaa-test-blog.webflow.io (site "Alphaa Test Blog"). Remaining: install the Alphaa app on it from the reviewer login (step 2).


**Don't reuse "Copy of FairWayPay"** (`fairwaypayg-6537782e4c146322cfdfe82cadb.webflow.io`, published 2026-09-29, still connected to the founder account). It copies a live Reg CF offering (Invest Now, Form C links). Reviewers publishing posts onto it, and a public copy of an offering page, both break our legal-safety rules.

**Make a clean one in GT's Workspace (Varun, Webflow Designer):**
1. Workspace dashboard, **New site**, then a free **blog** template (any free template with a Blog collection), or Blank site plus a CMS collection. If the workspace is at its site limit, delete the FairWayPay copy first.
2. Name it **"Alphaa Test Bakery"** (fictional; no real business, people or photos of people). Delete any template content that names a real company.
3. In the CMS, make sure the collection is called **Blog Posts** (slug `blog`). It needs Name, Slug, a **Rich text** body, a plain-text summary and a main image (templates usually have these). Keep 2 neutral sample posts from the template.
4. Home page settings: title "Alphaa Test Bakery", any short description.
5. Click **Publish** to the `.webflow.io` staging domain. Copy the address (for example `https://alphaa-test-bakery.webflow.io`) into the form's "Published testing site" field and into this doc.
6. In the browser signed in as **webflow-review@alphaa.app** (§6), open `https://alphaa.app/api/connect/webflow/start`, select **Alphaa Test Bakery**, then **Authorize App**. The app is now installed on that site and connected to the reviewer login.
7. In that login: `dashboard?ask=content`, **Write a post now**, **Do it on my site** (stays live as the example). Then write and publish a second post and **Undo** it (it stays as a CMS draft, showing Undo works). Optionally approve one page title fix.
8. Load the live post URL to confirm it renders, and check the home page.
9. Leave the site published and the app installed until well after approval. Webflow audits later.

---

## 6. Reviewer login

**Recommendation: a dedicated login, `webflow-review@alphaa.app`. Don't reuse `meta-review@alphaa.app`.** An Alphaa login holds one website connection per website. Installing Webflow on the meta-review login would replace whatever that login's open website is connected to, and the Meta, Shopify and Canva reviews are using that login right now. A separate login also keeps reviewers away from any other review's data.

Steps (Varun; nothing has been created):
1. Railway, project alphaa.app, service **alphaa**, Variables. Append `,webflow-review@alphaa.app` to `COMP_ACCESS_EMAILS`. It currently holds 7 addresses, including `marketplaceteam@webflow.com`. Railway redeploys; wait for SUCCESS.
2. In a fresh incognito window, sign up at `https://alphaa.app/signup` with `webflow-review@alphaa.app` and a new strong password from your password manager. The verification code arrives through the alphaa.app catch-all in your Gmail.
3. Finish onboarding as **Alphaa Test Bakery** (website: the test site's .webflow.io address, a fictional city). Comped logins skip payment.
4. Sign out and back in once to confirm that no one-time code is asked (Clerk Device Trust is off for the Alphaa instance).
5. Do §5 steps 6-8 in this login.
6. Paste the password only into the form's credentials field. Never put it in this repo, chat or email. Rotate it after Webflow's decision, and keep the login active afterwards.

`marketplaceteam@webflow.com` (Webflow asks reviewers to sign up with it) is already in `COMP_ACCESS_EMAILS`. No Alphaa account exists for it yet (checked 2026-11-27), so if a reviewer signs up with it, they get full access with no payment.

---

## 7. Code checks against the guidelines (2026-11-27)

| Guideline | Status |
|---|---|
| Unique `state` on every authorize request, verified before the code exchange | **Fixed** (`0badc73`): random nonce per request in an httpOnly `wf_state` cookie (15 min, one use). A missing or forged state is refused before the code is touched. Verified live: a forged state shows "That Webflow sign-in link expired…". Installs started from Webflow's own Install button arrive with no state and are still accepted for the browser's session. |
| Install URL starts a valid install (form check: client_id + scopes) | **Fixed**: `/api/connect/webflow/start` now goes straight to `webflow.com/oauth/authorize` with the client_id and exactly the 5 configured scopes, signed in or not (before, signed-out visitors got a 307 to /signup). |
| Deny handled gracefully | ✓ `?error=access_denied`: signed in, a message in the dashboard thread; signed out (new), a plain page with Try again. Verified live. |
| Token encrypted at rest, server-side only | ✓ AES-256-GCM (`encryptSecret`, key from `CONNECTOR_SECRET`) in agent settings. **Fixed:** a signed-out install used to park the encrypted token in a browser cookie. It now stays in server memory (30 min, one use, revoked at Webflow if never claimed); the cookie holds only an encrypted random handle. Railway runs 1 replica; a deploy during a signed-out install means "connect again". |
| Codes exchanged immediately, never stored or logged | ✓ (callback logs only error messages) |
| Revoke / disconnect | ✓ Settings › Website connection › Disconnect → `revoke_authorization` (**now the documented `https://webflow.com/oauth/revoke_authorization`**; `api.webflow.com` also answered) + delete. |
| Uninstall/revocation → stop using and delete the token | **Fixed**: any Webflow 401 deletes the token (`forgetRevokedWebflow`, in status checks, publish, undo and title changes), plus `/api/cron/webflow-tokens` daily at 03:00 UTC (one read per connection). Account deletion (Clerk `user.deleted`) revokes first. |
| Uninstall cleanup | ✓ No custom code is ever added (no custom_code scope). The docs page now explains what stays (approved posts) and how to remove it. |
| Rate limits: exponential backoff + retry cap | **Fixed**: 429 retried at 1 s, 2 s, 4 s (max 3; honours a Retry-After of 8 s or less, otherwise gives a plain "try again in a minute"). 20 s timeout per call. |
| Scopes: least privilege, all used | ✓ sites:read (`/sites`, `/sites/{id}`), cms:read/write (collections, items, live items), pages:read/write (`/sites/{id}/pages`, `/pages/{id}` PUT). No workspace or custom_code scope. |
| OAuth once, not on login; sign-out doesn't revoke | ✓ |
| Endpoints using the token need a session; no hostile origins | ✓ Every `/api/connect/*` and publish route requires the Clerk session (SameSite=Lax cookie, no CORS headers). Verified live: a cross-origin POST to `/api/connect/disconnect` with no session gets 404. |
| Webflow stays the source of truth | ✓ Alphaa keeps no editable copy of CMS items; only a change log with ids for Undo. |
| Privacy policy covers Webflow | ✓ §6 of /privacy (what's stored, AES-256-GCM, disconnect). **Added** the Webflow-uninstall sentence and bumped "Last updated". |
| Dependency CVE scan | **Open, do before submitting.** `npm audit --omit=dev` on 2026-11-27 found 1 critical (`next`: Server Actions DoS/SSRF) and 20 high (direct deps: `next`, `prisma`, `undici`, `zod`; also `sharp`/libvips, `ws`, `postcss` and others). npm says all have non-breaking fixes. Do it in a separate change: `npm audit fix` (never `--force`), then tsc, next build, `scripts/e2e-trial.sh`-style checks and the deploy. Webflow lists "known-vulnerable dependencies" as a rejection reason. |

**Bigger items worth doing (not done here):**
- **No sidebar entry for "Posts & pages" or "Website connection"** in the Nov 26 workspace shell. Reviewers reach them only through the URLs in the notes (`/dashboard?ask=content`, `/dashboard/settings/website`). Shopify's reviewer rejected us on 2026-11-04 for exactly this kind of missing navigation. A "Your website" item in `WorkspaceShell.tsx` would remove the risk (the /start agent is working nearby, so it was left alone).
- **EU-hosted Webflow workspaces** use separate OAuth hosts and client credentials (developers.webflow.com/data/reference/eu-hosting). They are unsupported today; installs from EU workspaces will fail.
- "Show when Webflow data was last fetched": the connection page has a live "Check again"; drafts aren't Webflow data. Fine as is.

---

## Sources (read 2026-11-27)
- Marketplace Guidelines: developers.webflow.com/apps/docs/marketplace-guidelines (OAuth, token, uninstall, rate-limit, Data Client and attestation rules; demo video 2-5 min with approve and deny; reviewer account with the highest tier that never expires; decision in about 10 business days)
- Submitting your app: developers.webflow.com/apps/docs/marketplace/submitting-your-app (Preflight: "A Data Client App without that scope is not asked for one… the form marks the field Not needed for this app"; the form's install URL, link and alt-text checks; 2FA on a workspace admin; Direct-to-Webflow-OAuth recommended for Data Clients)
- Listing your app: developers.webflow.com/apps/docs/marketplace/listing-your-app (name 30, short description 100, long 10,000, 3-5 screenshots 1280x846 under 2 MB, logo 900x900 PNG under 50 KB, promo 1-2 min on YouTube, up to 5 features)
- OAuth: developers.webflow.com/data/reference/oauth-app (revoke = POST webflow.com/oauth/revoke_authorization; codes single-use, valid 15 min)
- Rate limits: developers.webflow.com/data/reference/rate-limits (60 requests a minute on Starter/Basic, 120 on CMS/Business, 429 + Retry-After)
- The submission form itself (public HTML of webflow-app-form.webflow.io/app-form/complete-form): field list, "up to 2" categories, 4 screenshots required, 2,000-character credentials, the marketplaceteam@webflow.com signup instruction, Paid App Requirements
