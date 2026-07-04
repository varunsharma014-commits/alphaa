# Meta Ads — Launch Plan

> v1.0. Total **$20/day** ($600/mo): Retargeting $10/day, Prospecting $10/day. Geo US + Canada. Objective: **Leads/Conversions** optimizing for the `ScanCompleted` pixel event. Advantage+ placements ON except Audience Network (exclude — junk traffic for B2B-ish offers).

## Pixel events (install before launch — Day 1 of runbook)

| Event | Fires when | Used for |
|---|---|---|
| `PageView` | All pages | Retargeting audiences |
| `ScanStarted` | Scan form submitted on /scan or hero input | Scan-abandoner audience |
| `ScanCompleted` | /scan/results renders | **Optimization event** + exclusions |
| `CompleteRegistration` | Clerk signup done | Value reporting, exclusions |
| `StartTrial` | Onboarding complete | Purchaser-equivalent exclusion |

## Campaign 1: Retargeting — $10/day

One ad set. Audiences (OR):
- Website visitors, last 30 days
- `ScanStarted` last 30 days AND NOT `ScanCompleted` (scan abandoners)

Exclusions: `StartTrial` last 180d, `CompleteRegistration` last 30d (already in the lifecycle emails).
Frequency watch: if 7-day frequency > 4, add creative or trim budget.
Ads: run variants **1, 2, 5** below. Destination `https://alphaa.app/scan?utm_source=facebook&utm_medium=cpc&utm_campaign=retargeting&utm_content={ad-name}`.

## Campaign 2: Prospecting — $10/day

Two ad sets at $5/day each (consolidate into the winner after 3 weeks):

**Ad set A — Health-practice owners:** Interest stack: (Small business owners OR Business owner behavior) AND (Dentistry OR Dental practice management OR Medical spa OR Aesthetic medicine). Age 30–60.

**Ad set B — Home-services owners:** Interest stack: (Small business owners) AND (HVAC OR Plumbing OR Home improvement contractor OR Field service management). Age 30–60.

*(Lawyers convert better on search + LinkedIn organic; don't spend Meta prospecting budget there yet.)*

Exclusions: same as retargeting + `ScanCompleted` last 30d.
Ads: run variants **3, 4, 6** (curiosity/how-it-works angles work cold; fear/savings work warm). Destination `/scan` with `utm_campaign=prospecting-health` / `prospecting-home`.

---

## The 6 ads (copy + creative spec)

Shared creative language: dark background `#0A0806`, orange `#FF6B1A` accents, Inter Tight type, the **ChatGPT-answer-mockup motif** (a chat bubble showing an AI answer naming a business). Formats: 1080×1080 feed + 1080×1920 story/reels crop of the same concept. Build in Canva.

### Ad 1 — FEAR: "Your competitor is ChatGPT's answer" (retargeting)

**Primary text (≈100 words):**
Somebody in your city just asked ChatGPT: "Who's the best [dentist / HVAC company / lawyer] near me?"

It gave them one confident answer. Was it you?

Here's the uncomfortable part: AI engines don't show ten blue links. They recommend one or two businesses — and they pick based on public signals most owners have never touched: your content, your reviews, your Google Business Profile, your site's structure.

Alphaa reads what every major AI engine says about your business, then fixes the signals automatically. No agency. No contracts. $99/month.

Run the free 60-second scan. No signup needed.

**Headline (≤40):** Is ChatGPT recommending your competitor?
**Description:** Free 60-second scan. No signup.
**CTA button:** Learn More

**Creative spec:** 1080×1080. Dark `#0A0806` bg with subtle dot-grid texture. Center: a rounded chat UI mockup — user bubble "best dentist near me?" at top, AI answer bubble below recommending "⭐ [Competitor Dental] — 4.9 stars…". The competitor name highlighted in orange `#FF6B1A`. Bottom strip: white text "Is this you? Find out free →" + small Alphaa wordmark. No faces needed.

### Ad 2 — SAVINGS: the $22,800 math (retargeting)

**Primary text (≈95 words):**
Quick math for anyone paying an SEO agency:

Typical agency retainer: ~$2,000/month = $24,000/year. What you get: a monthly PDF, a 6-month contract, and zero presence on ChatGPT, Gemini, or Perplexity — because AI search isn't what they were built for.

Alphaa: $99/month = $1,188/year. What you get: content, schema, reviews, and Google Business Profile handled automatically, tracked across Google and five AI engines, reported in one plain-English weekly email.

That's up to $22,800/year back in your pocket. 14-day free trial, no contracts, cancel in one click.

**Headline:** Save up to $22,800/year vs an agency
**Description:** $99/mo. No contracts. Free trial.
**CTA:** Learn More

**Creative spec:** 1080×1080, split-screen ledger. Left column (dim, red-tinted): "SEO AGENCY — $24,000/yr" with a strikethrough, small red ✗ list: "PDF reports · 12-mo contract · invisible on AI". Right column (bright, orange-glow border): "ALPHAA — $1,188/yr" with ✓ list: "AI + Google · autopilot · cancel anytime". Bottom banner in orange: "Save up to $22,800/year". Big numbers in mono font, tabular.

### Ad 3 — CURIOSITY: "Try this right now" (prospecting)

**Primary text (≈90 words):**
Try this right now — it takes ten seconds.

Open ChatGPT and ask: "Who's the best [med spa / plumber / dentist] in [your city]?"

Go ahead. We'll wait.

…Did your business come up? If yes — great, you're ahead of 90% of your competitors. If no, that's the new problem nobody's agency is solving: over a billion questions a day are asked to AI engines, and they only recommend businesses whose public signals they can read and trust.

Alphaa scans what every AI engine says about you — free, 60 seconds, no signup — then fixes it on autopilot for $99/month.

**Headline:** Ask ChatGPT who's best in your city
**Description:** Then run our free 60-second scan.
**CTA:** Learn More

**Creative spec:** 1080×1080. Looks like a phone screenshot of ChatGPT on the dark bg: user message "who is the best med spa in Austin?" and the AI answer partially blurred with an orange "Is it you? →" sticker over the blur. Minimal text overlay; the blur creates the itch. Story crop: same, full-bleed phone.

### Ad 4 — HOW-IT-WORKS: honest mechanism (prospecting)

**Primary text (≈110 words):**
How does a business end up recommended by ChatGPT?

No one can buy their way in, and anyone promising "guaranteed AI rankings" is lying to you. But AI engines aren't random — they read public signals: your website content, your schema markup, your reviews, your Google Business Profile, even a little file called llms.txt.

Alphaa is an autopilot for those signals. It scans what six AI engines currently say about your business, publishes optimized content and GBP posts, fixes your site's structured data, monitors reviews, and sends you one plain-English report a week.

You run your business. Alphaa runs your visibility. $99/month, 14-day free trial, no contracts.

Start with the free 60-second scan.

**Headline:** How businesses get picked by AI
**Description:** The honest version. Free scan inside.
**CTA:** Learn More

**Creative spec:** 1080×1080 diagram card. Dark bg. Center: your business (orange dot with glow) with five labeled orange lines radiating to nodes: "Content · Schema · Reviews · Google Profile · llms.txt", and those feeding into a row of AI engine chips (ChatGPT, Gemini, Perplexity, Claude, Google AI) at top. Caption bottom: "Alphaa manages the signals AI reads. Automatically." Clean, technical, no hype.

### Ad 5 — SOCIAL PROOF (retargeting)

⚠️ **HOLD until customer counts/testimonials are verified.** The site's "1,000+ customers / 4.9 rating" hero claim is a placeholder (marked so in code). FTC + Meta ad policy are stricter than a homepage — do not run this variant until you have real numbers or 2–3 real named testimonials with permission. Swap the bracketed proof below with verified facts.

**Primary text (≈90 words):**
"[Real customer quote — e.g., 'Two weeks in, our practice showed up in a ChatGPT answer for the first time. I checked myself.' — Dr. ____, ____, TX]"

Business owners are done paying $2,000/month retainers for PDF reports. Alphaa handles the work — content, schema, reviews, Google Business Profile — and tracks how you show up across Google and five AI engines.

[Verified proof point: e.g., "___ businesses scanned this month."]

14-day free trial. No contracts. See where you stand first with the free 60-second scan.

**Headline:** Why owners are switching to Alphaa
**Description:** Free scan. 14-day trial. No contract.
**CTA:** Learn More

**Creative spec:** 1080×1080 testimonial card. Dark bg, large white quote in Inter Tight, orange quotation mark glyph, customer name + business + city in muted gray, 5 orange stars ONLY if the rating is real. Optional real customer headshot (with signed release) in a circular frame.

### Ad 6 — DEMO: the scan itself (prospecting + retargeting)

**Primary text (≈95 words):**
This is what 60 seconds gets you (no signup, no credit card):

→ Your AI Visibility Score
→ What ChatGPT, Gemini, Perplexity and Google AI actually say when asked about businesses like yours
→ The specific signals holding you back — missing schema, thin content, unanswered reviews, a stale Google profile

Most owners have never seen this. It's usually somewhere between eye-opening and mildly upsetting.

If you like what you see, do nothing. If you don't, Alphaa fixes it on autopilot for $99/month — 14-day free trial, no contracts.

Scan your business free at alphaa.app/scan.

**Headline:** See your AI visibility score — free
**Description:** 60 seconds. No signup required.
**CTA:** Learn More

**Creative spec:** 1080×1080 or 15-sec screen-recording video (preferred). Video: cursor types a business name into the scan input on the real dark UI → loading beat → results page reveals the orange ScoreRing (e.g., 41/100) and red/amber issue rows. End card: "Your score is waiting. alphaa.app/scan". Static fallback: dashboard-style card with the ScoreRing at 41, three issue rows, orange "Scan free →" pill.

---

## Launch checklist

- [ ] Pixel + Conversions API installed; all 5 events verified in Events Manager
- [ ] Domain verified; `ScanCompleted` prioritized for optimization
- [ ] Audiences built (visitors 30d, scan-abandoners, exclusion audiences)
- [ ] Ads 1, 2, 6 live in Retargeting; 3, 4, 6 in Prospecting; **Ad 5 held pending verified proof**
- [ ] Audience Network excluded; frequency + spend alerts set
- [ ] UTM naming applied to every destination URL
