# Google OAuth verification: adwords demo video (round 2)

Google rejected round 1 (2026-11) because the video didn't show every feature that uses
`https://www.googleapis.com/auth/adwords`, and didn't show write actions appearing in the user's
Google Ads account. This version shows each feature, and right after each write it opens
ads.google.com to show the change landed.

## Before recording
- Sign in to alphaa.app as **meta-review@alphaa.app** (it's on the comp list, so it sees Connect
  Google Ads while `GOOGLE_ADS_ENABLED` is unset). Use a brand with a real business profile
  filled in (name, city, services).
- Use a Google account that can sign in to **your own** Google Ads account. No client accounts.
  Keep a second tab open on ads.google.com → Campaigns.
- Budget: when Alphaa asks, set the daily budget to the minimum ($1). The campaign is created
  PAUSED. Turning it on (shot 6) can spend; pause it within the same minute.
- Resolution 1440x900 or higher, notifications off, no other brands' data on screen.
- Record in one take, 4 to 6 minutes, with English captions or voice-over.
- If Google is already connected on this brand, disconnect it first so the consent screen shows.

## Shot list
1. **Intro (15s).** alphaa.app. Say: "Alphaa is a marketing agent for small businesses. Owners
   connect their own Google Ads account. Alphaa plans a Search campaign, creates it paused,
   and turns it on, pauses it or tunes it only when the owner says so."
2. **Open Ads (10s).** Dashboard → Ads thread → **Connect Google Ads**.
3. **Consent screen (30s).** On Google's screen, click the scope so it **expands** (or "Show all
   services" if shown). The text must be readable: "See, edit, create and delete your Google Ads
   accounts and data". Pause 3 seconds on it. Say: "The Google Ads API has only this one scope.
   There is no read-only or narrower scope, so this is the least we can ask for." Click Allow.
4. **Account pick (15s).** Back in Alphaa: the ad account's name and currency are shown (read).
   Pick it if there are several.
5. **Plan (45s).** Tap **Plan my first campaign**. Show keywords with their monthly searches,
   which come from Google's Keyword Planner (read), plus the ad headlines, negatives, area and
   budget. Say that nothing is created yet.
6. **Create, then show it in Google Ads (60s).** Tap **Create it (paused)** and confirm $1/day.
   Switch to the ads.google.com tab and refresh. Show the new campaign with status **Paused**.
   Open it and show its keywords, negative keywords, ad and location. That shows the write landed.
7. **Turn on / pause, shown in Google Ads (40s).** In Alphaa tap **Turn it on**, refresh Google
   Ads, and show **Enabled**. Then tap **Pause** in Alphaa, refresh again, and show **Paused**.
8. **Weekly report + tune-up (40s).** In the Ads thread, show the performance numbers Alphaa
   reads (clicks, cost, conversions). Show the tune-up card if one is there (pause a keyword,
   add a negative, lower the budget), tap **Apply**, and show the change in Google Ads.
   If the account has no spend history yet, say: "Each week Alphaa reads these numbers and
   suggests pausing a keyword, adding a negative or lowering the budget. It never raises a
   budget or turns a campaign on by itself."
9. **Disconnect (15s).** Tap **Disconnect Google Ads**. Say tokens are encrypted and deleted on
   disconnect, and point to alphaa.app/privacy.

## Reply to Google (paste with the new video link)

> Thank you for the review. We've recorded a new video that shows every feature using the
> https://www.googleapis.com/auth/adwords scope:
> 1. The consent screen with the scope expanded (0:xx).
> 2. Reading the user's accessible Google Ads accounts and Keyword Planner search volumes (0:xx).
> 3. Creating a paused Search campaign, then the same campaign shown in the user's Google Ads
>    account (0:xx).
> 4. Enabling and pausing it from Alphaa, with each status change shown in Google Ads (0:xx).
> 5. Reading performance and applying a suggested change, which is also shown in Google Ads (0:xx).
>
> On least privilege: the Google Ads API offers only the adwords scope. There is no read-only
> or narrower scope, so this is the minimum scope for these features. Our app requests only this
> scope, in a separate incremental-auth step.
>
> While verification is pending, the scope is offered only to our internal test accounts, not to
> production users.
>
> Test credentials: alphaa.app → Sign in → meta-review@alphaa.app / [password]. No phone or card
> step. Steps: Dashboard → Ads → Connect Google Ads → sign in with a Google account that has a
> Google Ads account → Plan my first campaign → Create it (paused).
