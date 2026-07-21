# Alphaa — working handoff

Context for anyone picking this repo up on a new machine (or a new Claude session).
`CLAUDE.md` is the codebase reference and is auto-loaded by Claude Code; this file is
the *current state of play* — what just shipped, what's pending, and what will bite you.

Last updated: 2026-07-21

---

## 1. Machine setup

```bash
git clone https://github.com/varunsharma014-commits/alphaa.git
cd alphaa
npm install                    # runs prisma generate via postinstall
npm i -g @railway/cli && railway login
railway link                   # project: alphaa.app → service: alphaa
```

**Secrets are NOT in the repo.** `.env.local` contains placeholders only (the
`ANTHROPIC_API_KEY` there is a dummy — anything calling Claude will 401 locally).
Real values live in Railway. Run anything that needs them through the CLI:

```bash
railway run --service alphaa npx tsx yourscript.mts
railway run --service alphaa npx next build
```

## 2. Hard rules

- **Never `npm run build`** — its prebuild step runs `prisma migrate deploy` against the
  **production** database. Use `railway run --service alphaa npx next build` instead.
- **Never `npx tsc` as your gate.** It misses ESLint-as-error and static-prerender
  failures that break Railway deploys. `next build` is the only real gate.
- **No Prisma schema changes** without explicit sign-off — prod DB is live and there are
  no auto-migrations on deploy. Features so far have used existing Json columns and the
  `MockActivity` ledger instead of new tables.
- **Push = deploy.** Railway auto-deploys `main`. Always gate on a passing `next build`.
- **Don't run `next build` while a dev server is running** — it overwrites `.next` and
  corrupts the dev bundler (`MODULE_NOT_FOUND` on webpack chunks). Stop the dev server,
  or `rm -rf .next` and restart afterwards.

## 3. Branching

Historically alphaa was solo, so direct-to-`main` was fine. **With more than one person
on the repo, switch to feature branches + review** (the same rule already used for
gigaboost.ai and growthturbine.com). Decide this before the second person pushes.

Note the repo is **public** — no secrets in commits, ever. `.env` is now gitignored
(it previously held only Prisma's `johndoe@localhost` scaffold placeholder).

## 4. What shipped recently

| Date | Change |
|---|---|
| Jul 20 | **Concierge / "Do it for me"** — $149 one-time setup + $299/mo Full Service. Intake at `/dashboard/concierge`, `/api/concierge`, Stripe wiring, entry points in Vault Step 2, content calendar, onboarding, pricing page. |
| Jul 20 | **Walkthrough fixes** — engine-evidence merge layer, PageSpeed helper, crawler protocol fix + auto-crawl, placeholder guards, schema honesty, background scan (35s→3s), scroll-trap fix, plus a batch of copy/date/rounding fixes. |
| Jul 18 | Hero headline scale-up across all marketing pages. |
| Jul 17 | Competitor-mention extraction fix (`max_tokens` 700→2000 — output was silently truncating). |

## 5. Open items

**Needs a human, not code:**
- `hi@alphaa.app` must be a real monitored inbox — the entire concierge fulfillment loop
  (intake email + "PAID" alert) routes through it.
- `PAGESPEED_API_KEY` is unset. Until it exists, the speed page shows its honest
  failure state rather than data. (Google Cloud → enable PageSpeed Insights API → API key.)
- Concierge payment flow has **not** been tested end-to-end. Book the $149 yourself with a
  real card, confirm both emails arrive, then refund in Stripe.
- **growthturbine.com is blocking GPTBot / ClaudeBot / Gemini in robots.txt** — alphaa's own
  crawler found it. Good dry-run for the concierge service.

**Known issues, not yet fixed:**
- The `claude` engine is labelled **"Google AI"** in scan results and weekly reports
  (legacy `google_ai` key). Misattribution — worth fixing.
- Several server-rendered dates still show UTC. `<LocalDate>` in
  `src/components/dashboard/LocalDate.tsx` is the fix; applied to the Vault only so far.
- **Fabricated social proof on the marketing site** — "1,000+ customers", "4.9/5",
  "1,200+ businesses", "$500/mo average savings", "2 weeks to first AI mention", and the
  entire case-studies page (named people with verification checkmarks). There are **zero
  paying customers**. This contradicts the product's own honesty positioning and is the
  single biggest credibility risk on the site.

**Next build decision (researched Jul 21):**
Customers can't publish anything to their own site today — alphaa generates blogs, FAQs,
schema and llms.txt, but the customer must paste it all manually. That gap is where trial
cancellations will come from. Researched how BabyLoveGrowth solves it. Recommended order:

1. **WordPress direct publish via Application Passwords** (built into WP since 2020 — the
   customer pastes one key, no plugin). Publishes to the *main domain*, so authority
   consolidates and llms.txt sits at the true root. ~40% of the market, ~1 day of work.
2. **Reverse-proxy subfolder** (`customer.com/blog`) for Cloudflare/Vercel/nginx customers.
3. **Hosted subdomain** (`blog.customer.com`, one CNAME) as the fallback for
   Shopify/Wix/Squarespace. Note: subdomains do **not** consolidate authority into the main
   domain, and **llms.txt is per-host** — a subdomain llms.txt describes the subdomain, not
   the business. Sell it honestly.

## 6. Verifying work

Browser verification beats assertions. `next build` passing is necessary, not sufficient —
several real bugs (theme cookie, invisible text, dead engines) only surfaced by loading the
page. There's a dev-server config at `.claude/launch.json` (`alphaa-dev`, port 3000).
