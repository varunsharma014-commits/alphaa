# Referral + Viral Loops — Spec & Honest Yield

> v1.0 — 2026-07-14. Four loops: (1) customer give/get referral, (2) partner program (/refer — needs urgent fixes), (3) shareable win pages (/w/[id], in build now), (4) "Powered by alphaa" badge. Loops multiply a customer base — with a small base until Q4, expect modest absolute numbers early and design for compounding.

---

## 1. Reconciliation: what /refer actually is (READ THIS FIRST)

`src/app/(marketing)/refer/page.tsx` exists and is a **30% recurring-commission partner/affiliate program** aimed at web designers, consultants, and creators — it is NOT a customer referral program. Two separate motions; keep both, but fix /refer immediately:

| Issue found on /refer | Severity | Fix |
|---|---|---|
| **Returns 404 in production** (2026-07-10 growth review) despite valid source | High | Redeploy / check build logs for the route |
| **Fabricated social proof:** "47 partners already earning", "$840 avg. partner earnings/mo after 6 months", testimonial "Jason M. … Made $2,400 last month … Partner since Jan 2025" | **Critical — FTC risk + contradicts our entire honesty positioning** | Delete all three. Replace with the commission table (real) and "New program — founding partners get direct access to the founder" |
| Apply form mailtos to `partners@alphaa.ai` — wrong domain (site is alphaa.app) | High | Change to partners@alphaa.app (create the inbox) |
| Claims "partner dashboard", "custom tracking link", "real-time dashboard" — none of this is built | High | Either ship tracking via an affiliate tool (Rewardful/Tolt, ~$49–59/mo, Stripe-native) or soften copy to "your unique link + monthly statement" until it exists |
| "White-label available" (Who This Is For section) | Medium | We have no white-label. Remove or mark "coming later" |

**Division of labor:** /refer = third parties earning cash (30% recurring). Give/get = existing customers earning service credit. Don't blend them — different audiences, different mechanics, different pages.

## 2. Customer referral: give-a-month / get-a-month (Stripe coupons)

**Offer:** refer another business; when they convert to paid, **you both get one month free** (Starter: $99 value each; referrer credit applies at their plan's rate).

**Mechanics (v1, buildable in a day, no new vendor):**

| Piece | Implementation |
|---|---|
| Referral link | `alphaa.app/scan?ref={userId-shortcode}` — lands on the scan (the wedge), not the pricing page. Cookie 60 days; store code on `ScanLead` → carries to signup |
| Friend's reward | Stripe **promotion code** auto-applied at checkout: 100% off first month post-trial (coupon: duration `once`) |
| Referrer's reward | On friend's first paid invoice (Stripe webhook `invoice.payment_succeeded`, first non-trial), add **customer balance credit** = one month of referrer's plan. Credit, not coupon — stacks cleanly for multiple referrals |
| Anti-abuse | Reward only on friend's PAID conversion (card-upfront trial helps here); no self-referral (match on card fingerprint/email domain); cap 12 free months earned/yr |
| Surface | Dashboard card + footer of the weekly report email: "Know another {vertical}? Give a month, get a month." + one-click copy link |
| Ask moments | Only at win moments (see §3) and after a 4–5★ NPS-style tap — never during onboarding or after a bad week |

**Honest yield:** with ~250–575 customers by Nov (Base–Aggressive), at a good-not-viral 5–10% of customers referring ≥1 paid friend over the period *(est.)* ⇒ **~15–50 customers total by Dec**. Moonshot lane (120) requires the win-page loop below to feed it. Cost per referred customer ≈ $198 in credits — under the $300 CAC target and they arrive pre-trusted (referred SMBs churn less — industry pattern, unproven for us).

## 3. Shareable win loop — public win pages `/w/[id]` (in build NOW)

**The loop:** customer gets a win → alphaa generates a public win page → customer shares it (their pride, our landing page) → viewer runs their own scan → trial → their wins get shared → repeat.

**Win page must have (spec for the build in flight):**

- The win, concrete and dated: "Bright Smile Dental — AI visibility 34 → 61 in 6 weeks. Now recommended by ChatGPT for 'dentist in Plano'." Engine-by-engine before/after.
- **Customer opt-in required** (private by default; one click to publish). Their name/brand is the hero; alphaa is the footnote.
- OG image auto-generated (score delta + business name) — the page must look great as a LinkedIn/Facebook card, that IS the product here.
- One CTA for viewers: "See what AI says about YOUR business — free 60-second scan" → /scan?ref={win-owner} — **wire it into give/get so sharing pays the sharer.**
- Honesty guardrail: only real, machine-verified deltas become win pages. No cherry-picked queries; show the date and the exact prompt used.

**Distribution plan:**

| Play | Detail |
|---|---|
| Auto-suggest at win moments | In-app + email trigger when: score +10, first AI-engine appearance, first review reply, 30-day recap. Copy: "Worth bragging about. Publish your win page + share it — if anyone scans and subscribes, you both get a month free." One click to LinkedIn/Facebook/X share with pre-filled text |
| Monthly "wins wall" | `/wins` — grid of opted-in win pages. Social proof page for the site + monthly founder post ("what customers' AI visibility did this month") + each featured customer gets pinged (they reshare) |
| Founder amplification | Every opted-in win = Friday content slot (dm-social-kit.md §3) |
| Outreach proof | Best win pages become links in cold email #2 and LinkedIn touch 2 — real proof beats any copy we could write |

**Honest yield:** this is the highest-variance item in the entire plan. If share rate is ~5–10% of wins and each shared page brings 20–100 views *(all est., no data)*: Base ~10–20 customers by Dec; if it genuinely catches (K ≈ 0.2–0.3 with give/get attached) it's the difference between Aggressive and Moonshot — **that's why it's being built now, but do not forecast on it until October data exists.** Kill rule (from master plan): <3% of win pages shared after 200 wins ⇒ redesign the share moment, don't add features.

## 4. "Powered by alphaa" website badge (backlink flywheel)

**Spec:** small footer badge for customer sites — dark/light variants, orange dot + "AI-visible with alphaa" (or "Powered by alphaa"), links to `https://alphaa.app?utm_source=badge&utm_medium=referral&utm_campaign={customerId}`. Served as self-hosted SVG/HTML snippet (no JS beacon — respect customers' sites). One-click copy in dashboard settings.

**Incentive:** badge live on their site = entry into give/get bonus (e.g. an extra scan-refresh or $10/mo credit — decide once margins are measured). Never require it.

**Honest note on the "backlink flywheel":** Google explicitly devalues widget/badge links (their guidance says such links should be nofollowed), so do NOT count on PageRank. The real value: (1) referral clicks from local-business sites whose visitors are other local-business owners, (2) brand impressions in exactly the right context, (3) entity co-mention signals that plausibly help AI-engine visibility (our own category). Mark every badge link `rel="nofollow sponsored"` ourselves — being caught link-scheming while selling honesty would be fatal.

**Honest yield:** ~directly negligible in 2026 (maybe 5–15 customers *(est.)* at Q4 scale); it's a 2027 compounder. Cost ≈ one day of build.

## 5. Summary table — loops vs the master plan lanes

| Loop | Build cost | 2026 expected yield *(est.)* | Confidence | Status |
|---|---|---|---|---|
| /refer partner program (30% recurring) | Fixes + affiliate tool ~$59/mo | 20–100 (the partnerships lane) | Medium — commission genuinely motivates designers/bookkeepers | **Broken: 404 + fake stats — fix this week** |
| Give/get customer referral | ~1 day + Stripe config | 15–50 | Medium | Not built |
| Win pages /w/[id] + wins wall | In build | 10–20 base; the Moonshot swing factor | Low (unproven loop) | In build now |
| Badge | ~1 day | 0–15 | Low, compounds later | Not built |
