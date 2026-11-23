# LinkedIn Community Management API: Standard tier screencast

LinkedIn moves an app from Development to Standard after reviewing a screen recording that shows
every permission in use, end to end, in the real product. Record this once the Development tier
is approved and a company page is connected (app "Alphaa Pages", client id 86i9jxzk9ilc4n).

## Before recording
- Use a test brand on alphaa.app with Pro or Growth, signed in.
- Have admin access to a LinkedIn company page you can post to (the Alphaa page). Do not use a client's page.
- Have one LinkedIn post already published from Alphaa at least a day old, so stats show real numbers.
- Clear browser tabs, 1440x900 or larger, no notifications, no other people's data on screen.
- 3 to 5 minutes, no editing tricks, voice-over or on-screen captions in English.

## Shot list (one take)
1. **Intro (15s).** alphaa.app homepage. "Alphaa is a marketing agent for local businesses. Owners connect their LinkedIn company page so Alphaa can publish posts they approve and show how each post performed."
2. **Sign in and open Social (15s).** Dashboard → Social thread. Show "Connect LinkedIn company page".
3. **OAuth consent (30s).** Click Connect. LinkedIn's consent screen lists the scopes. Say what each is for:
   - `rw_organization_admin`: find which pages this person administers, so they pick the right one.
   - `w_organization_social`: publish the posts the owner approved, as the page.
   - `r_organization_social`: read each post's views, likes, comments and reposts to report results.
   Click Allow. Back on Alphaa the page shows as Connected (its name comes from the organizations API).
4. **Draft and approval (45s).** Ask "Write a LinkedIn post about <topic>". The draft appears with its image. Show that nothing posts until the owner taps Approve. Edit a word to show the owner is in control.
5. **Publish (30s).** Tap "Post now". Show "Posted". Click "See it on LinkedIn" and show the post live on the company page (author = the page).
6. **Stats (30s).** Back in Social, "Recently posted" shows views, likes, comments for the older post. Open the same post on LinkedIn to show the numbers match.
7. **Control and disconnect (20s).** Show "Disconnect <page>" and say tokens are encrypted, used only for this page, and removed on disconnect. Mention the privacy policy at alphaa.app/privacy.
8. **Close (10s).** "Alphaa only posts what the owner approves, only to pages they administer, and only reads stats for those posts."

## What not to show
- Any API keys, Railway, or the LinkedIn developer portal secrets.
- Other brands' data or real customer names.
- Comment management or messaging (we don't request those scopes).

## Submit
Developer portal → Alphaa Pages → Products → Community Management API → request Standard tier.
Upload the video (or an unlisted link), and use the same use case wording as the Development form:
Platform, Page management + Page analytics.
