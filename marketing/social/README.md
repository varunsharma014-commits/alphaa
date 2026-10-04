# Alphaa social queue (4 weeks: Oct 5 to Nov 1, 2026)

`queue.json` is the single source of truth for scheduled social posts. It is **state**, not generated output: edit statuses in place, never regenerate it over a partly-posted queue.

Source rules: `marketing/growth-playbook.html`, `marketing/social-copy-brief.md`, and the founder rules (1 image, 4-5 word self-contained headline naming AI/ChatGPT, lead with getting customers from AI, never lead with price or agency fees, no em-dashes, no "#1"/"best"/"leading", examples labelled, four AIs only).

## Fields

| Field | Meaning |
|---|---|
| `id` | `w{week}-{day}-{channel}[-varun]`, unique |
| `week`, `day`, `date` | Week 1 starts Mon 2026-10-05. `date` is the planned day (ISO) |
| `channel` | `linkedin`, `facebook`, `instagram`, `x`, `tiktok_reels_shorts` (one video item = post to TikTok, Reels and Shorts) |
| `account` | `alphaa_page` (company page / brand handle) or `varun_personal` (Varun's LinkedIn) |
| `pillar` | Proof / Teach / Agent / Founder / Offer (target mix 40/25/15/10/10, achieved exactly) |
| `series` | "Are you in the answer?", "Agent diary", "SEO said / AI says", "60-second fix", "Building Alphaa", or null |
| `hook_family` | Playbook hook: self-test, screen-proof, contrarian, agent-diary, insider, callout, or `offer` |
| `format` | `image`, `carousel`, `video_script` |
| `image_headline` | The headline on the image (or the video's on-screen hook). Max 5 words |
| `caption` | Post text, ready to paste |
| `first_comment` | Post as the first comment (LinkedIn) or first reply (X). Holds the link so the body stays link-free |
| `image` | PNG to attach (1080x1350 feed; `-x.png` = 1600x900 for X). For carousels, the cover |
| `slides` | Carousel slide PNGs in order (IG carousel; LinkedIn: upload as a document/PDF) |
| `video_script` | `duration_s`, `on_screen_hook`, `shots[]` (t, shot, on_screen, voiceover), full `voiceover`, `notes` |
| `needs_human` | Present when a person must act first. **Do not post an item with `needs_human` until it is removed** |
| `status` | `queued` -> `posted` or `skipped` |
| `posted_url`, `posted_at` | Fill when posted (URL of the live post, ISO timestamp) |

### Status flow
- `queued`: ready (unless `needs_human` is set).
- `posted`: set `posted_url` and `posted_at`.
- `skipped`: not posted; add a `skip_reason` field. Don't delete items, so the history stays intact.

### Link rules per channel
- LinkedIn (page and Varun): no link in the body; caption says "link in comments", link goes in `first_comment`. Varun's posts carry a link only 3 times in 4 weeks.
- X: link only in `first_comment` (reply), on offer posts.
- Instagram / TikTok: "link in bio" (bio must point to alphaa.app/start).
- Facebook: link in body is fine.

## Images
Built by `brand/social/posts/build.py` (HTML in `brand/social/posts/src/`, CSS `src/post.css` extends `brand/social/base-mono.css`). Black and white only. Rebuild all: `python3 brand/social/posts/build.py`; one: `python3 brand/social/posts/build.py w2_hvac`. Any image showing an AI answer or agent message is an **example** and carries an "Example" label; the businesses in it are placeholders (Practice A, Firm B), never real names.

Spare renders not in the queue: `w3_myth_keywords.png`, `w3_seo_vs_ai-x.png`, `w2_agent_approve-x.png`, `w1_dogfood-x.png`.

## Weekly calendar
Per week: LinkedIn Varun 5, LinkedIn page 3, Facebook 3, Instagram 3 (2 carousels + 1 image), X 7, video 4 = 25. 100 items total. `[human]` = needs a person first.

**Week 1** (2026-10-05 onward)

| Day | Posts (channel: image headline) |
|---|---|
| Mon | LI (Varun): Your customers ask ChatGPT now<br>LI: Is ChatGPT naming your practice?<br>IG carousel: How ChatGPT picks a business<br>X: ChatGPT gives one answer<br>Video: ChatGPT picked three dentists **[human]** |
| Tue | LI (Varun): Ask ChatGPT who to hire<br>FB: Will AI recommend your business?<br>X: Ask ChatGPT who to hire<br>Video: Google: 10 links. ChatGPT: one. **[human]** |
| Wed | LI (Varun): Your AI agent checked ChatGPT<br>LI: ChatGPT gives one answer<br>IG: Your AI agent checked ChatGPT<br>X: Your AI agent checked ChatGPT |
| Thu | LI (Varun): Does ChatGPT recommend Alphaa yet? **[human]**<br>FB: ChatGPT gives one answer<br>X: Will AI recommend your business?<br>Video: Customers ask ChatGPT now **[human]** |
| Fri | LI (Varun): Is ChatGPT naming your practice?<br>LI carousel: How ChatGPT picks a business<br>IG carousel: Test your business on ChatGPT<br>X: Your customers ask ChatGPT now |
| Sat | FB: See what ChatGPT says, free<br>X: See what ChatGPT says, free<br>Video: Your AI agent checked ChatGPT **[human]** |
| Sun | X: Is ChatGPT naming your practice? |

**Week 2** (2026-10-12 onward)

| Day | Posts (channel: image headline) |
|---|---|
| Mon | LI (Varun): 3 things AI looks for<br>LI: Plumbers: does ChatGPT name you?<br>IG carousel: Fix what AI gets wrong<br>X: Plumbers: does ChatGPT name you?<br>Video: Plumbers: does ChatGPT send jobs? **[human]** |
| Tue | LI (Varun): ChatGPT got your hours wrong<br>FB: Does Gemini recommend your HVAC?<br>X: ChatGPT got your hours wrong<br>Video: ChatGPT got our hours wrong **[human]** |
| Wed | LI (Varun): Nobody can guarantee AI rankings<br>LI: Why AI picked your competitor<br>IG: Does Gemini recommend your HVAC?<br>X: 3 things AI looks for |
| Thu | LI (Varun): Plumbers: does ChatGPT name you?<br>FB: AI agent works. You approve.<br>X: Why AI picked your competitor<br>Video: 3 things AI looks for **[human]** |
| Fri | LI (Varun): AI agent works. You approve.<br>LI carousel: Trades: get recommended by ChatGPT<br>IG carousel: Trades: get recommended by ChatGPT<br>X: Nobody can guarantee AI rankings |
| Sat | FB: AI agent. No contract.<br>X: AI agent. No contract.<br>Video: Does AI recommend Alphaa yet? **[human]** |
| Sun | X: Does Gemini recommend your HVAC? |

**Week 3** (2026-10-19 onward)

| Day | Posts (channel: image headline) |
|---|---|
| Mon | LI (Varun): SEO ranks. AI recommends.<br>LI: Lawyers: does Claude recommend you?<br>IG carousel: SEO said vs AI says<br>X: Lawyers: does Claude recommend you?<br>Video: Lawyers: is AI naming you? **[human]** |
| Tue | LI (Varun): Perplexity shows its sources. Yours?<br>FB: SEO ranks. AI recommends.<br>X: AI wants answers, not keywords<br>Video: SEO said / AI says **[human]** |
| Wed | LI (Varun): Owners don't want AI dashboards<br>LI: Inside an AI agent's week<br>IG: Perplexity shows its sources. Yours?<br>X: Perplexity shows its sources. Yours? |
| Thu | LI (Varun): Inside an AI agent's week<br>FB: Lawyers: does Claude recommend you?<br>X: Inside an AI agent's week<br>Video: Your AI agent's week **[human]** |
| Fri | LI (Varun): Reviews AI can actually verify<br>LI carousel: Lawyers: get named by AI<br>IG carousel: Lawyers: get named by AI<br>X: Reviews AI can actually verify |
| Sat | FB: Your free AI check<br>X: Your free AI check<br>Video: Ask ChatGPT: why them? **[human]** |
| Sun | X: Owners don't want AI dashboards |

**Week 4** (2026-10-26 onward)

| Day | Posts (channel: image headline) |
|---|---|
| Mon | LI (Varun): Ask ChatGPT: why them?<br>LI: ChatGPT picked three med spas<br>IG carousel: Why ChatGPT names your competitor<br>X: ChatGPT picked three med spas<br>Video: ChatGPT picked three med spas **[human]** |
| Tue | LI (Varun): You can't see AI losses<br>FB: Accountants: will AI recommend you?<br>X: You can't see AI losses<br>Video: Nobody can guarantee ChatGPT rankings **[human]** |
| Wed | LI (Varun): Some weeks AI doesn't change<br>LI: Accountants: will AI recommend you?<br>IG: ChatGPT picked three med spas<br>X: Ask ChatGPT: why them? |
| Thu | LI (Varun): Our 90-day AI visibility guarantee<br>FB: Your AI agent answers reviews<br>X: Your AI agent answers reviews<br>Video: Does ChatGPT know your hours? **[human]** |
| Fri | LI (Varun): Your AI agent answers reviews<br>LI carousel: Your AI agent, explained<br>IG carousel: Your AI agent, explained<br>X: Accountants: will AI recommend you? |
| Sat | FB: Our 90-day AI visibility guarantee<br>X: Our 90-day AI visibility guarantee<br>Video: See what AI says, free **[human]** |
| Sun | X: Some weeks AI doesn't change |

## Needs a human (17 items)
- **All 16 videos** (`tiktok_reels_shorts`): Varun records them. Live-check videos must show a real check on screen; if staged, keep "Example" on screen. Blur any real business names that appear (playbook: never shame named small businesses).
- **Dogfood posts (real data only, never staged):** `w1-thu-linkedin-varun` (fill the `[FILL IN]` line, then set the 4 pills in `build.py` `w1_dogfood` from `????` to y/n and rebuild) and `w2-sat-tiktok_reels_shorts` (bracketed lines).
- **Recommended, not required:** the playbook prefers real screenshots over examples. Any "Example check" image can be swapped for a real check screenshot (same headline) if you have permission from the business.
- **Bios:** Instagram and TikTok bios must link to alphaa.app/start before the "link in bio" posts go out.
