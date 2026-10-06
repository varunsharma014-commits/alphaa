# Alphaa: Backlink and Credibility Submission Kit

> v1.0, 2026-10-06. Nothing has been submitted and no accounts have been created. Track progress in `tracker.csv` next to this file.
> Costs and link types were checked by web search on 2026-10-06. Directories change prices often, so check the live form before paying.

---

## 0. Fix these before you submit anywhere

Reviewers at G2, Capterra, Product Hunt and BetaList open the site before they approve a listing. So do journalists.

1. **The live /case-studies page has made-up content.** As of 2026-10-06, https://alphaa.app/case-studies says "Every case study below is a real customer" and shows "1,200+ businesses on Alphaa", "2 weeks avg. time to first AI mention" and "Bright Smile Dental … 23 new patients in 60 days". None of this is backed by real data, and it breaks the copy rules. Take the page down or remove it from the nav before the first submission. A reviewer who finds it can reject the listing, and a journalist who finds it will drop the quote.
2. **The homepage says "millions of consumers"** are asking AI who to hire. That's an unsourced stat. Cut it or cite a source.
3. **Site schema still says "Google"** as an engine. The Organization JSON-LD in `src/app/layout.tsx` says "recommended on Google, ChatGPT, Claude, Gemini, and Perplexity". Change it to the four engines.
4. **Old Product Hunt copy breaks today's rules.** The tagline and maker comment in `marketing/pr-launch-kit.md` §1 use "Google AI", "no signup", the old /scan URL, orange colours and the founder's name. Use section 3 of this kit instead.
5. **Product Hunt status:** pr-launch-kit.md planned a launch for Jul 28, 2026. Check https://www.producthunt.com/products/alphaa. If Alphaa already launched there, skip the launch, keep the page up to date, and only relaunch after a big product change.
6. **Have the social profile URLs ready.** Most forms ask for LinkedIn, X and so on. The site code mentions linkedin.com/company/alphaa and x.com/alphaa, but both are commented out. Check that both exist and are named "Alphaa AI Agent".

---

## 1. Prioritized target list

Key for the **Dofollow?** column:
- **Yes (confirmed)** means the site's own pages say the link is dofollow.
- **Yes (reported)** or **No (reported)** means third-party SEO lists say so, but the site itself doesn't.
- **Unknown** means no reliable source was found.

Nofollow links still matter here. AI engines and Google use these profiles to confirm that Alphaa is a real company, and that entity signal is the main goal, not PageRank.

| # | Site | URL to submit | Cost | Dofollow? | Effort | Why it matters |
|---|---|---|---|---|---|---|
| 1 | Crunchbase | https://www.crunchbase.com (Resources > Create Profile; log in with LinkedIn) | Free | No (reported) | 20 min | The main company-entity record. LLMs and journalists check it first. |
| 2 | G2 | https://sell.g2.com/create-a-profile | Free | Yes (reported; conflicting) | 30 min + reviews | The biggest B2B review site, and it now owns Capterra/GetApp/Software Advice (deal closed Feb 2026). Products need 10 reviews to qualify for the category Grid. |
| 3 | Capterra + GetApp + Software Advice | https://digital-markets.gartner.com/capterra-vendor-signup (free "Launch" listing; may move to a G2 URL after the acquisition) | Free (PPC optional, don't buy) | No (reported) | 30 min | One listing shows on all three sites. These pages rank for "[category] software" and get cited by AI. |
| 4 | SaaSHub | https://www.saashub.com (Submit) | Free | No (reported; conflicting) | 15 min | Ranks well for "X alternatives" and adds Alphaa to competitors' alternatives pages. |
| 5 | AlternativeTo | https://alternativeto.net (User menu > Suggest new application) | Free | Unknown (likely nofollow) | 15 min | Gets Alphaa listed as an alternative to the big SEO and GEO tools. High traffic. |
| 6 | There's An AI For That | https://theresanaiforthat.com/submit/ | $49 basic (up to $347); a free monthly entry exists via their X threads | Yes (reported) | 20 min | The largest AI-tool directory. Its buyers are looking for AI tools by job. |
| 7 | Toolify.ai | https://www.toolify.ai/submit | $99 one-time | Yes (reported) | 15 min | High-authority AI directory. Lists within ~48h. |
| 8 | Product Hunt | https://www.producthunt.com/posts/new | Free | No (reported) | High (launch prep, ~2 wks) | The strongest single launch signal for tech buyers and press. Launch on a Tue or Wed. See section 3. |
| 9 | Source of Sources (SOS) | https://sourceofsources.com | Free | Varies by publication | 10 min signup, then 15 min/day | The free HARO successor run by HARO's founder. Earned editorial links are the best links you can get. |
| 10 | BetaList | https://betalist.com/submit | Paid only now (FAQ: "no free option"; ~$129 reported) | **Yes (confirmed)** | 20 min | Accepts "recently launched" startups. Its FAQ confirms the dofollow 301 link. |
| 11 | Qwoted | https://www.qwoted.com | Free plan: 2 pitches/mo (Pro $149/mo, skip) | Varies | 15 min | Reporters from Forbes, Business Insider and TechCrunch request expert sources here. |
| 12 | Featured.com | https://featured.com | Free plan (~2–3 opportunities/wk); paid from $29/mo | Varies | 15 min | Expert Q&A answers get syndicated to publisher sites. |
| 13 | TopAI.tools | https://topai.tools/submit | $47 fast listing | Yes (reported) | 15 min | High-traffic AI directory, editorially reviewed, with a refund if rejected. |
| 14 | Future Tools | https://www.futuretools.io/submit-a-tool | Free (curated; may not be accepted) | Unknown | 5 min | A well-known curated AI-tool list. |
| 15 | TrustRadius | https://www.trustradius.com/vendors (request vendor portal access) | Free profile | Unknown | 30 min | B2B review site that enterprise buyers and AI engines both cite. |
| 16 | SourceForge | https://sourceforge.net/software/vendors/ (free business-software listing) | Free | No (reported) | 20 min | Very high domain authority. Big business-software comparison pages. |
| 17 | Trustpilot | https://business.trustpilot.com/signup | Free (50 review invites/mo) | No (reported) | 20 min | The public trust page that local-business owners recognize. Only invite real paying customers. |
| 18 | Wellfound | https://wellfound.com/recruit (free company profile) | Free | Unknown | 20 min | Startup entity profile that investors, press and AI engines read. |
| 19 | F6S | https://www.f6s.com (create company profile) | Free | Unknown | 15 min | Large startup network. The company profile is free. |
| 20 | Indie Hackers | https://www.indiehackers.com/products (add product) | Free | Unknown | 15 min | Founder community. Gives a product page plus a build-in-public channel. |
| 21 | Hacker News (Show HN) | https://news.ycombinator.com/submit | Free | No | 30 min + replies | One honest Show HN post can bring a lot of traffic and press. Post a link to the free check, not the pricing page. |
| 22 | Launching Next | https://www.launchingnext.com/submit/ | Free ($99 express, skip) | Unknown | 10 min | Startup launch directory with a newsletter. Free path is fine. |
| 23 | Startup Stash | https://startupstash.com/add-listing/ | Free (reported) | No (reported) | 10 min | Curated startup-tools directory. |
| 24 | SaaSworthy | https://www.saasworthy.com (contact them to get listed; they research and list free) | Free | Unknown | 10 min | SaaS comparison site with "alternatives" pages. |
| 25 | Fazier | https://fazier.com/submit | Free needs a backlink on your homepage; Lite $29 removes that | Yes (reported, for top-3 / paid) | 15 min | Product Hunt alternative. Use Lite rather than adding their link to the footer. |
| 26 | Microlaunch | https://microlaunch.net | Free; $39 Pro skips the queue | Yes (reported) | 15 min | Smaller indie launch board. Good the week after Product Hunt. |
| 27 | Peerlist Launchpad | https://peerlist.io/launchpad | Free (weekly launch) | Unknown | 20 min | Builder audience with tight curation. Needs a Peerlist account. |
| 28 | DMZ "Oh Canada" Tech Directory | https://dmz.torontomu.ca/oh-canada-directory | Free | Unknown | 15 min | National directory of Canadian-owned tech, used by government and procurement buyers. Alphaa qualifies (Canadian corp, HQ, IP). |
| 29 | Founded in Canada | https://tally.so/r/w5VM6b (form linked from foundedincanada) | Free | Unknown | 10 min | New national innovation directory. Check it lists startups and not only service providers before you submit. |
| 30 | BetaKit (Canadian tech news) | https://betakit.com (news tips / contact) | Free (editorial) | Yes (reported) | 30 min pitch | The main Canadian startup news site. Pitch real news (the PH launch, a new integration), not a listing. |
| 31 | Kanata North Business Association | https://www.kanatanorthba.ca (contact; 1000 Innovation Dr is in the Kanata North tech park) | Membership (cost unknown; ask) | Unknown | 15 min email | Local tech-park association with 540+ members and a newsletter (Kanata Networker). Good local credibility and a chance at a local story. |
| 32 | WordPress.org plugin directory | https://wordpress.org/plugins/developers/add/ | Free | No (reported) | 2–4 hrs (review) | The Alphaa Connector plugin (`wordpress/alphaa-connector`) already has a readme.txt. A wordpress.org listing is a very high-authority page and an install channel. |
| 33 | Futurepedia | futurepedia.io (submit page moves; basic tier was sold out) | $497 "Verified" (basic $247 sold out) | Conflicting reports | 15 min | Big AI directory but expensive. **Optional:** only after the cheaper AI directories are live. |

**Paid total if you do everything except Futurepedia:** about $350–$400 (TAAFT $49, Toolify $99, TopAI $47, BetaList ~$129, Fazier $29, plus Microlaunch $39 if you want it).

### Considered and left out

| Site | Why it's out |
|---|---|
| Google Business Profile | **Not eligible.** Google's rules exclude online-only businesses and virtual offices; a profile needs in-person contact with customers at the address. Alphaa is online software, so a GBP risks suspension and doesn't help. |
| Bing Places | Same issue: it's built for local storefronts and service-area businesses. Low value for a SaaS, and a bad listing can hurt the entity. Skip. |
| Clutch | Built for service agencies and needs 3+ verified client reviews. Doesn't fit software. Revisit only if Full Service grows into an agency offer. |
| Ottawa Board of Trade | Membership starts around $2,000/yr. Too costly for a directory line. |
| Uneed | Reports conflict on whether it shut down in 2026. Check before spending time. |
| DevHunt | Developer tools only. |
| Help a B2B Writer | helpab2bwriter.com now redirects to MentionMatch, which says "launching soon". Join only once it's live. |
| "Submit to 100+ directories" services, Gumroad fast-track listing sellers, link farms | Spam signals that can hurt the domain. |

---

## 2. Fact sheet (copy-paste block)

Use this exact text everywhere. Consistent spelling and wording across directories is what builds the entity.

```
NAME
Alphaa
(On social profiles: Alphaa AI Agent. Always two a's. Never "Alpha".)

LEGAL ENTITY
9629033 Canada Inc.

TAGLINE (≤60 chars, pick by field length)
- The AI agent that gets local businesses recommended by AI   (57)
- Get recommended by ChatGPT, Gemini, Claude and Perplexity   (57)
- Get your business recommended by ChatGPT and Gemini         (51)
- Your AI agent for AI search                                 (27)

ONE-LINER
Alphaa is an AI agent that gets your business recommended by ChatGPT, Gemini, Claude and Perplexity.

50-WORD DESCRIPTION
Alphaa is an AI agent that gets local businesses recommended by ChatGPT, Gemini, Claude and Perplexity. It checks what each AI says about you every week, then writes and publishes the pages, fixes and code those engines read. You approve anything public with one tap. $99/month, month to month.

100-WORD DESCRIPTION
When customers ask ChatGPT who to call, they get one answer with a few names. Alphaa is an AI agent that works to put your business in that answer. It asks ChatGPT, Gemini, Claude and Perplexity the questions your customers ask, shows you the real answers and who got named instead, and re-checks weekly. Then it does the work: it writes FAQ pages and blog posts, fixes facts AI gets wrong, adds structured data and llms.txt, and keeps your Google Business Profile active. You approve anything public with one tap, and every change can be undone. Plans start at $99/month.

250-WORD DESCRIPTION
Customers used to Google a business and get ten links. Now many ask ChatGPT, Gemini, Claude or Perplexity and get one answer with a few names. If you're not one of them, that customer never knew you existed.

Alphaa is an AI agent that works to get your business into that answer. It's built for local businesses in the US and Canada, like dentists, contractors, law firms, med spas and restaurants, and for small online businesses that want to be cited by AI.

Every week, Alphaa asks the four AI engines the questions your customers actually ask. It shows you the real answers, who got recommended instead of you, and what those businesses have that you don't.

Then it does the work. It writes and publishes FAQ pages and blog posts that AI engines quote. It fixes facts AI gets wrong, like your hours or services. It adds structured data and llms.txt to your site, keeps your Google Business Profile active, and drafts replies to your reviews.

It talks to you in plain English, not a dashboard. Anything public needs your one-tap approval, and every change can be undone. A short weekly email is all you have to read. It connects to WordPress today, with Webflow and Shopify coming soon.

Plans start at $99/month, month to month, with no contract. Nobody can promise a top spot in AI answers, so Alphaa shows you the measured change every week instead. You can see what AI says about your business with a free check at alphaa.app/start.

PRIMARY CATEGORY
AI Search Optimization / Generative Engine Optimization (GEO)
(Fallbacks if the form has none: SEO Software > Local SEO; Marketing Automation; AI Agents)

SECONDARY CATEGORIES
Local Marketing, Answer Engine Optimization (AEO), Review Management, Local SEO, AI Agents

TAGS (pick what the form allows)
AI search, AI visibility, GEO, AEO, ChatGPT, Gemini, Claude, Perplexity, local SEO, local business marketing, AI agent, llms.txt, structured data, schema markup, Google Business Profile, small business, marketing automation

WHO IT'S FOR
Local businesses in the US and Canada (dental, medical spa, chiropractic, home services, legal, accounting, restaurants, salons, real estate, auto repair) and small online/SaaS businesses.

PRICING (exact; don't change)
- Starter: $99/month (1 location)
- Pro: $199/month (up to 3 locations)
- Full Service: $299/month (a person does the website work)
- Annual billing: save 20%
- Month to month, cancel anytime. 7-day refund on the first charge.
- Free AI check at alphaa.app/start (asks for an email to send the full report).
- Pricing model to pick on forms: "Paid" / "Subscription". If asked "Free trial?": No. If asked "Free plan?": No. If there's a "free tool" field: "Free AI check".

GUARANTEE (only where a form asks)
90-day AI Visibility Guarantee: if none of the four AIs names your business in any weekly check during your first 90 days, your next month is free (once per customer).

INTEGRATIONS
WordPress (plugin, live). Webflow and Shopify: coming soon.

FOUNDED
2026

HEADQUARTERS
1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada
(City field: Ottawa / Kanata. Region: Ontario. Country: Canada.)

COMPANY SIZE
1–10

FOUNDER / CONTACT NAME
Use "Alphaa team". Don't put a personal name in public description fields. Personal accounts are needed for login only.

LINKS
Website:      https://alphaa.app
Free check:   https://alphaa.app/start
Pricing:      https://alphaa.app/pricing
About:        https://alphaa.app/about
How it works: https://alphaa.app/how-it-works
Support:      hi@alphaa.app
LinkedIn:     https://www.linkedin.com/company/alphaa   (confirm before use)
X:            https://x.com/alphaa                      (confirm before use)
(Do not link /case-studies until it's rebuilt with real data.)

ASSETS (all black & white)
Logo / square icon:  brand/mono/alphaa-mono-icon-512.png (also 256, 900, 1200)
Logo wordmark:       brand/mono/Alphaa logo.png (900x900)
Screenshots (16:9):  brand/apps/listing/mono/s1.png, s2.png, s3.png (1600x900)
Feature/hero image:  brand/apps/listing/mono/feature.png (1600x900)
Promo frames:        brand/apps/listing/mono/promo-title.png, promo-end.png
Video:               brand/apps/listing/mono/alphaa-shopify-promo.mp4 (Shopify-specific; for general sites record a 60s scan → results video)
Covers:              brand/mono/alphaa-mono-linkedin-cover.png, -facebook-cover.png
```

### Rules for every form

- No "#1", "best", "leading" or "top-rated". No customer counts, ratings, testimonials or results.
- Name only ChatGPT, Gemini, Claude and Perplexity as engines. No Copilot, no "Google AI Overviews".
- Never write "free trial" or "no signup". The only free thing is the check at alphaa.app/start.
- Shopify and Webflow are always "coming soon".
- Don't fill optional "customers", "users" or "revenue" fields. Leave them blank or put "Not disclosed".
- Where a form asks for founders, put the company or "Alphaa team" in public fields.

---

## 3. Per-site notes

### Product Hunt (launch prep checklist)
Check first whether Alphaa already launched (see section 0). If it hasn't:
- [ ] Make or claim the product page under the exact name "Alphaa". Use the 512 icon and screenshots s1–s3 plus feature.png. PH gallery images are 1270x760; re-export from `brand/apps/listing/mono/src` if the crop looks off.
- [ ] Tagline: "Get recommended by ChatGPT, Gemini, Claude and Perplexity" (57 chars).
- [ ] Write a short maker first comment in plain words, posted from the team account:
  - Lead with the honest angle: nobody can guarantee a spot in AI answers, so the agent shows the real answers and the measured change every week.
  - Point people to the free check at alphaa.app/start.
  - **No "no signup"** (the check asks for an email), no founder name, no Google AI.
- [ ] Record a 60-second black-and-white video: type a website into /start, see what the four AIs said, one-tap approve a fix.
- [ ] Pick a Tuesday or Wednesday 2–3 weeks out. Launches go live at 12:01 AM PT.
- [ ] Line up real people who've used it to leave comments. **Never ask for upvotes.** PH now flags vote spikes and brand-new accounts.
- [ ] Make sure /start can handle a traffic spike.
- [ ] Reply to every comment that day. Afterwards, add the PH badge to the site footer only if it placed.

### G2 and Capterra (reviews needed)
- Both create a free listing. Ranking and badges come from **reviews**: G2 needs 10 reviews for Grid eligibility.
- Only ask **real paying customers**. Ask right after their first good weekly report. Never review your own product, never pay for reviews, and never offer incentives that break the site's rules. Both sites detect it.
- G2 now owns Capterra, GetApp and Software Advice, so expect the vendor portals to merge. Keep the same name, description and categories on both.
- G2 name rule: the profile name must be "Alphaa" with no description or symbols.
- Don't buy Capterra PPC.

### Trustpilot
- Claim the page for free. The free plan allows 50 review invites a month.
- Only invite real customers, and invite all of them, not just happy ones. Selective inviting breaks Trustpilot's rules.
- Reply to every review in the plain voice.

### There's An AI For That / Toolify / TopAI.tools
- All three are paid and editor-reviewed. Use the 100-word description, the 512 icon and s1 as the hero.
- Category: "SEO" / "Marketing" / "AI agents". On TAAFT, set the task as "AI search optimization" or "Local SEO".
- Pricing field: "Paid, from $99/mo". Not "Freemium".

### BetaList
- Its FAQ says every submission is now paid. Expedited review is about $129 per third-party reports, and you see the exact price on the form.
- They take "pre-launch and recently launched" startups. Alphaa counts as recently launched, so submit soon before it ages out.

### Journalist-request sites (SOS, Qwoted, Featured)
- Set up the profile as "Alphaa team" with topic tags: AI search, ChatGPT for business, local marketing, SEO, small business.
- Answer only requests that fit (AI search, local SEO, small-business marketing). Keep answers to 3–5 sentences of real advice plus one line on who Alphaa is.
- No made-up stats. If a reporter wants numbers, use only real data from your own checks, labelled as such.
- On SOS, off-topic replies get you removed, so be strict.
- Qwoted's free plan allows 2 pitches a month. Save them for the best requests.

### Hacker News (Show HN)
- Title: "Show HN: Alphaa – see what ChatGPT, Gemini, Claude and Perplexity say about a business".
- Link to alphaa.app/start. Write a short, technical first comment on how the checks work and what you can't promise. HN readers punish marketing language.
- Post on a weekday morning ET. Only post once. Don't ask for votes.

### Canadian and local
- **DMZ Oh Canada:** stress Canadian ownership, HQ and IP (9629033 Canada Inc., Kanata).
- **BetaKit:** pitch news, not a listing. Example: the Product Hunt launch, or WordPress plugin live on wordpress.org. Two short paragraphs, offer data from Alphaa's own public checks if you have it.
- **Kanata North BA:** email to ask whether membership includes a member-directory listing and a Kanata Networker mention, and what it costs. Join only if the price is reasonable.

### WordPress.org plugin
- Submit `wordpress/alphaa-connector` as a zip. Review takes days to weeks.
- Read the guidelines first: the plugin must not require paid services without saying so clearly, and it must not phone home without disclosure. The readme already discloses AI-referral counting. Add a line that the plugin needs an Alphaa account.

### After each listing goes live
- Add the profile URL to `sameAs` in the Organization schema (`src/app/layout.tsx`, currently commented out): LinkedIn, X, Crunchbase, G2, Product Hunt, Capterra, Wellfound, Trustpilot. This is the step that turns listings into entity signals AI engines can read.
- Log the live URL and date in `tracker.csv`.

---

## 4. Four-week schedule

**Week 0 (before day 1):** fix section 0 (case studies page, "millions" line, schema, PH copy) and confirm the social URLs.

### Week 1: Entity foundation (all free, ~4 hrs)
- Crunchbase
- G2
- Capterra (covers GetApp and Software Advice)
- SaaSHub
- AlternativeTo
- TrustRadius
- SourceForge
- Wellfound
- F6S
- Trustpilot (claim only)
- Sign up for Source of Sources, Qwoted and Featured, then answer 2–3 fitting requests
- Pick the Product Hunt date (a Tue/Wed in week 3) and start the launch checklist

### Week 2: AI and startup directories (~$195 paid, ~3 hrs)
- There's An AI For That ($49)
- Toolify ($99)
- TopAI.tools ($47)
- Future Tools (free)
- Startup Stash
- SaaSworthy
- Launching Next (free)
- Indie Hackers product page
- Canadian: DMZ Oh Canada, Founded in Canada
- Email Kanata North BA
- Finish the PH video and gallery
- Journalist sites: 2–3 answers

### Week 3: Launch week (~$29, plus launch-day time)
- **Product Hunt** on Tue or Wed (or skip if it already launched)
- Show HN on Thursday
- Fazier (Lite $29) and Peerlist Launchpad the same week to ride the launch
- Pitch BetaKit with the launch news
- Journalist sites: 2–3 answers

### Week 4: Follow-through (~$130–170)
- BetaList (~$129)
- Microlaunch (free, or $39)
- Submit the WordPress plugin to wordpress.org
- Start asking for reviews (G2, Capterra, Trustpilot) from real paying customers after their first weekly report
- Add every live profile to `sameAs` and update tracker.csv
- Check that weeks 1–2 listings are live and fix anything pending
- Decide on Futurepedia ($497) based on traffic from the other AI directories
- Journalist sites: keep a weekly rhythm
