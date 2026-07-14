# Cold Email Outreach Kit — Scan-Led Sequence

> v1.0 — 2026-07-14. The backbone channel of 1000-customers-plan.md. Motion: **run THEIR scan first, lead with THEIR result.** Every email is about the prospect's business, never about us. Not legal advice — compliance box below is a working checklist, confirm with counsel before Canada sends.

---

## 1. Infrastructure checklist (do in this order; nothing sends before warmup completes)

- [ ] **Buy 2 outreach domains** — never send cold from alphaa.app. Candidates: `getalphaa.com`, `tryalphaa.com`, `alphaa-app.com` (check availability; pick 2). Set both to 301-redirect the root to alphaa.app.
- [ ] **3 inboxes per domain** (Google Workspace, $6/user/mo): e.g. `varun@`, `v@`, `hello@`. Real names, real photos, filled signatures.
- [ ] **DNS on each domain:** SPF, DKIM, DMARC (`p=none` first month, then `p=quarantine`), custom tracking domain (CNAME), MX verified.
- [ ] **Sending tool:** Smartlead or Instantly (~$40–100/mo) — inbox rotation, warmup, unified inbox, per-domain suppression.
- [ ] **Warmup 2–3 weeks minimum** before first real send (tool's warmup network, 20–40 warm emails/inbox/day). Never skip; a burned domain costs a month.
- [ ] **Verification:** Debounce or NeverBounce every list — send only to `valid`; drop `catch-all` unless the account is seasoned. Bounce target < 2%.
- [ ] **Volume cap: 30–50/inbox/day** at steady state. 2 domains × 3 inboxes = **180–300/day ceiling**. Moonshot (500+/day) = 4 domains × 3–4 inboxes, added only after 4 clean weeks.
- [ ] **Suppression list** shared across tools: unsubscribes, existing customers/trialists, angry replies, competitors.
- [ ] **Scan batch pipeline (Claude, nightly):** run prospects through the scan engine and store results for merge fields. ⚠️ Ops note: don't pollute the production `ScanLead` table/funnel metrics with outreach scans — tag them (add a `source` field or run an internal script) so "external scans" stays an honest metric.
- [ ] **Plus-addressed test row** in every list (our own inbox) to spot-check rendering + links.

## 2. List-building recipes (beachhead ICPs: dentists, med-spas, HVAC, lawyers)

Qualification bar for ALL lists: has a website + has a Google Business Profile + ≥20 Google reviews + rating ≥4.0 *(successful enough to afford $99/mo; matches icp.md disqualifiers)*. Exclude franchises/chains and anyone already a customer or in-sequence.

| Source | Recipe | Yield / cost *(est.)* |
|---|---|---|
| **Apify — Google Maps scraper** | Query `"{vertical} in {city}"` across top-200 US metros. Fields: name, site, phone, rating, review count, category. Then Apify contact-details scraper on each site for emails. | ~500–1,000 qualified/wk per vertical; ~$30–60/10K places |
| **State license directories** | Dental boards (state license lookups), state bar member directories, state contractor-license lookups (HVAC/plumbing). Cross-match name → GMB → website → email. Check each directory's ToS before scraping; some bars prohibit solicitation use — skip those states. | Slower, cleaner; good for lawyers |
| **Yelp** | Apify Yelp scraper by category + metro; useful as a second signal (review velocity) and to fill metros where GMB scrape is thin. | Supplement |
| **Email finding** | Site scrape first (free) → Hunter.io / Anymail Finder for the owner's name-based email. Prefer `dr.{last}@`, `{first}@` over `info@` — but `info@` is acceptable for owner-operator SMBs where the owner reads it. | ~$50–100/mo |
| **Verification** | Debounce every batch. Only `valid`. | ~$10/5K |

**Weekly quota:** 500 net-new verified leads per active vertical. Claude does all of this nightly; founder approves the batch Friday.

## 3. The scan-led sequence — 4 emails, 3–4 days apart

Merge fields: `{{first_name}}` `{{business_name}}` `{{city}}` `{{vertical_noun}}` (dentist / med spa / HVAC company / law firm) `{{customer_noun}}` (patients / clients / homeowners / clients) `{{competitor_name}}` `{{engine}}` (ChatGPT / Gemini / Perplexity) `{{score}}` `{{scan_url}}` `{{query_used}}` (e.g. "best dentist in Plano"). Plain text, no images, one link per email, first line does the work.

**Fallback rule:** if the scan found no named competitor, use variant lines marked (B). Never fabricate a competitor result — every claim in these emails must come from that prospect's actual stored scan.

### Email 1 — Day 0. Subject: `{{business_name}} — what ChatGPT says`

> {{first_name}} — I ran a quick check before writing you.
>
> When someone asks ChatGPT "{{query_used}}", it recommends {{competitor_name}}. It doesn't mention {{business_name}}.
>
> (B): When someone asks ChatGPT "{{query_used}}", {{business_name}} doesn't come up in the answer at all.
>
> That's not an opinion — it's the live answer. We scanned your visibility across ChatGPT, Gemini, Perplexity and Google AI: {{business_name}} scored {{score}}/100. The full report (what each engine actually said, and why) is here:
>
> {{scan_url}}
>
> No signup to view it. If it's useful, reply and I'll tell you the 2–3 fixes that matter most for a {{vertical_noun}} in {{city}}.
>
> — Varun Sharma, founder, Alphaa

### Email 2 — Day 3–4. Subject: `re: {{business_name}} — the "why"`

> {{first_name}} — quick follow-up on the report I sent ({{score}}/100).
>
> AI engines don't show ten blue links. When {{customer_noun}} in {{city}} ask, they name one or two businesses and most people never look further. They pick from public signals: recent content, structured data on your site, review activity, and an up-to-date Google Business Profile.
>
> {{competitor_name}} is feeding those signals. Right now {{business_name}} isn't — that's the whole gap.
>
> (B): Whoever is getting named right now is feeding those signals. {{business_name}} isn't yet — that's the whole gap.
>
> Your report shows exactly which signals are missing: {{scan_url}}
>
> Happy to walk you through it in a reply — no call needed.
>
> — Varun

### Email 3 — Day 7–8. Subject: `$1,188 vs $24,000 — same job`

> {{first_name}} — the honest math, then I'll leave you alone soon.
>
> Most {{vertical_noun}}s who care about this pay an SEO agency $1,000–$2,500/mo — and the report I sent shows how that's going on the AI side.
>
> Alphaa does the same work — content, schema, reviews, Google Business Profile — automatically, for $99/mo. No contract, cancel in a click. That's up to $22,800/yr back.
>
> One honest caveat: nobody can guarantee AI rankings, and anyone who does is lying to you. What we do is fix the signals engines read and show you the measured change, every week, in plain English.
>
> 14-day trial: https://alphaa.app/signup — or just re-read your report first: {{scan_url}}
>
> — Varun

### Email 4 — Day 11–12. Subject: `closing the file on {{business_name}}`

> {{first_name}} — last note from me, promise.
>
> Your AI-visibility report stays live here if you ever want it: {{scan_url}}
>
> Two things worth knowing before I go:
>
> 1. AI answers shift monthly as competitors publish content and collect reviews. Today's {{score}}/100 is a snapshot, not a verdict.
> 2. If you'd rather never think about this again — that's literally the product. $99/mo, runs itself, one weekly email.
>
> Either way, thanks for reading, and good luck in {{city}}.
>
> — Varun
>
> P.S. Replies come to me, not a bot. Even "how did you get my email?" gets an honest answer.

## 4. Compliance box — every send, no exceptions

| Requirement | Implementation |
|---|---|
| **CAN-SPAM: no deceptive headers/subjects** | Subjects above describe real content ("re:" is only used on genuine thread continuations — email 2 threads on email 1). From-name is a real person. |
| **CAN-SPAM: physical postal address in footer** | Registered business address (or USPS/virtual mailbox) in every email footer. Set once in the sending tool. |
| **CAN-SPAM: working unsubscribe** | One-click list-unsubscribe header + visible "Don't want these? One click and I'm gone: {unsub}" line. Honor within 10 business days (we do it instantly, tool-enforced, synced to global suppression). |
| **Identify it's from us** | Signature: Varun Sharma · Alphaa · alphaa.app + address. |
| **CASL (Canada)** | Stricter: consent-based. **Phase 1: US recipients only.** If/when we open Canada: rely on conspicuously-published-address implied consent (CASL s.10(9)(b)) only where the address was published without a no-solicitation note AND the message is relevant to their business role; keep records of where/when each address was found. Confirm with counsel first. |
| **Data hygiene** | Never buy opaque "leads databases"; every contact traceable to a public source. Suppress on first ask, forever. |

## 5. Daily volume ramp

| Week (w/c) | Inboxes live | Per-inbox/day | Total/day | Cum. sends/mo | Milestone |
|---|---|---|---|---|---|
| Jul 14 | 0 (warmup starts) | 0 | 0 | 0 | Domains + DNS + warmup on |
| Jul 21 | 0 (warming) | 0 | 0 | 0 | Lists built: 1,000 dentists verified |
| Jul 28 | 0 (warming) | 0 | 0 | 0 | Scan batch pipeline tested on 100 |
| Aug 4 | 6 | 10 | 60 | ~1.2K | First real sends (dentists) |
| Aug 11 | 6 | 20 | 120 | ~3.6K | Add med-spas |
| Aug 18 | 6 | 30 | 180 | ~7K | Add HVAC |
| Aug 25 | 6 | 40 | 240 | ~12K | First conversion data readable |
| Sep 8 | 6 | 50 | 300 | ~18K/mo | Add lawyers; domains 3–4 begin warmup |
| Oct 1 | 9–12 | 40–50 | 400–500 | ~9–11K/wk | **Moonshot rate.** Only if complaint rate <0.1% and reply ≥2% |

Expected yield *(est., benchmark ranges for hyper-personalized scan-led B2SMB)*: reply 3–8%, positive reply 1–3%, **send→customer 0.2–0.5%**. At 10K sends/mo ⇒ 20–50 customers/mo; at 15K ⇒ 30–75. These are the numbers the whole plan leans on — measure them in week 1 of September and re-forecast.

## 6. Reply-handling playbook (founder, ~20 min/day; Claude pre-drafts everything)

| Reply type | Move |
|---|---|
| **Positive / "tell me more"** | Answer in-thread same day, plain text. Give the 2–3 concrete fixes from their scan free, THEN: "Or Alphaa just does all of it — 14-day trial, cancel anytime." Only offer a call if they ask; this is a $99 product, not a demo sale. |
| **"How much / what do I get"** | One-paragraph answer + pricing link. No PDF decks. |
| **"How did you get my email?"** | Honest: "Your address is public on {source}. I ran your scan because the result seemed worth telling you about. One click below and you'll never hear from me again." Converts surprisingly often; suppress if they ask. |
| **"We have an agency"** | "Keep them — run Alphaa alongside for a month and compare what each finds. That comparison is kind of the point." Link the agency-math blog post. |
| **Skeptical / "is this snake oil?"** | Agree with the skepticism, link /blog/is-aeo-real, restate the no-guarantees stance. Lawyers especially convert on this. |
| **"Not now"** | Tag 60-day snooze; one re-scan email with their fresh (changed) score in 60 days. |
| **Referral to office manager / partner** | Start a NEW thread to that person, reference the intro, attach same scan link. |
| **OOO** | Auto-bump 5 business days (tool). |
| **Angry / unsubscribe / any opt-out phrasing** | Instant global suppression, no reply unless an apology is warranted. Never argue. |
| **Bounce > 2% on a batch** | Stop the batch, re-verify the list, find the source problem before resuming. |
