// In-process scheduler. Railway runs a persistent `next start` server, so the
// app schedules its own recurring jobs — no external pinger, no GitHub Actions.
// It pings the existing /api/cron/* endpoints on localhost with the CRON_SECRET
// (so the same routes also stay usable by an external pinger if ever needed).
//
// Times are UTC. Assumes a single replica (alphaa runs 1) — multiple replicas
// would each fire, which we'd revisit if we scale out.

let started = false

export function startCron(): void {
  if (started) return
  started = true

  const base = `http://127.0.0.1:${process.env.PORT || 3000}`
  const secret = process.env.CRON_SECRET || ""

  const hit = (path: string) => {
    fetch(`${base}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    }).catch(() => {
      // best-effort; the endpoint logs its own errors
    })
  }

  // Every 10 minutes: publish social posts that are due (lib/social).
  setInterval(() => hit("/api/cron/social-publish"), 10 * 60_000)
  // Every 10 minutes: website posts the owner scheduled from Research (lib/workspace/site-posts).
  setInterval(() => hit("/api/cron/site-posts"), 10 * 60_000)
  // Every 10 minutes: content-calendar times for Google listing posts and customer emails (lib/calendar/due).
  setInterval(() => hit("/api/cron/due"), 10 * 60_000)

  // Run once per hour-boundary we care about; dedupe so we never fire twice
  // within the same matched hour.
  let lastFired = ""

  setInterval(() => {
    const now = new Date()
    if (now.getUTCMinutes() !== 0) return

    const dow = now.getUTCDay() // 0 = Sun
    const hour = now.getUTCHours()
    const key = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${hour}`
    if (key === lastFired) return
    lastFired = key

    // Daily 05:00 UTC — pull GSC keywords + GA snapshot for every connected account.
    // (Google APIs only — no Anthropic spend — so left running.)
    // Daily 04:00 UTC: LinkedIn company Page post stats.
    if (hour === 4) hit("/api/cron/social-stats")
    // Daily 03:00 UTC: delete Webflow tokens that were revoked/uninstalled in Webflow (one read each, no AI).
    if (hour === 3) hit("/api/cron/webflow-tokens")
    if (hour === 5) hit("/api/cron/seo-sync")
    // Daily 06:00 UTC — write replies to new Google reviews so approving is one tap (Anthropic)
    if (hour === 6) hit("/api/cron/review-drafts")
    // Daily 07:00 UTC — recheck Growth sites' tracking, self-fix, note regressions (fetch only, no AI)
    if (hour === 7) hit("/api/cron/tracking-health")

    // Daily 14:00 UTC — lifecycle emails (connect nudges + week-one recap; Resend only)
    if (hour === 14) hit("/api/cron/lifecycle")

    // Mon 13:00 UTC (+ hourly catch-up until Tuesday ends) — weekly report + briefing email
    // (Anthropic + Resend). The route skips a brand with a report from the last 5 days and refuses
    // to overlap, so a re-hit only finishes brands a deploy cut off and never emails twice.
    if ((dow === 1 && hour >= 13) || dow === 2) hit("/api/cron/weekly")
    // Mon, Tue, Thu, Fri 13:00 UTC — GBP post drafts (Anthropic). The route
    // picks who is due: Starter Mon/Thu (2 a week), Pro / Growth all four.
    if ((dow === 1 || dow === 2 || dow === 4 || dow === 5) && hour === 13) hit("/api/cron/gbp-posts")
    // Sun 06:00 UTC — competitor discovery / refresh (Anthropic)
    if (dow === 0 && hour === 6) hit("/api/cron/competitors")
    // Sun 08:00 UTC — "What's working in your niche" for Growth brands (DataForSEO YouTube + Instagram via Meta)
    if (dow === 0 && hour === 8) hit("/api/cron/niche-posts")
    // Weekly AI jobs get a catch-up window: a deploy restarts this process, which kills a running
    // loop or misses the exact hour (2026-11-25: deploys at 10:55/11:05/11:08 UTC, no question scan
    // that week). Both routes skip a brand scanned in the last 5 days and refuse to overlap, so
    // hitting them every hour until Thursday ends just resumes the unfinished brands.
    // Wed 09:00 UTC (+ catch-up) — weekly AI visibility re-scan (Anthropic + engine APIs)
    if ((dow === 3 && hour >= 9) || dow === 4) hit("/api/cron/visibility-scan")
    // Wed 11:00 UTC (+ catch-up) — every tracked customer question × 4 AIs + fact check (engine APIs)
    if ((dow === 3 && hour >= 11) || dow === 4) hit("/api/cron/questions")
    // Tue 09:00 UTC (+ catch-up until Wednesday ends) — security, profiles, directory details,
    // outside ratings, Bing stats, the AI read of the site. Dedupe per brand AND per check kind (5 days).
    if ((dow === 2 && hour >= 9) || dow === 3) hit("/api/cron/checks")
    // Sun 09:00 UTC (+ catch-up until Monday 12:00, before the 13:00 briefing email) — weekly site
    // check: broken links, dead outbound links, redirect chains (fetch only, no AI; 5-day dedupe per brand).
    if ((dow === 0 && hour >= 9) || (dow === 1 && hour < 13)) hit("/api/cron/site-check")
    // Thu 06:00 UTC (+ hourly catch-up through Friday) — Core Web Vitals + structured data per brand
    // (PageSpeed Insights + own-site reads, no AI). Skips brands checked in the last 6 days.
    if ((dow === 4 && hour >= 6) || dow === 5) hit("/api/cron/site-vitals")
    // Daily 10:00 UTC — blog post drafts on each plan's schedule (Anthropic)
    if (hour === 10) hit("/api/cron/content")
    // Daily 15:00 UTC — 90-day AI Visibility Guarantee credits (Stripe)
    if (hour === 15) hit("/api/cron/guarantee")
    // Email outreach: resume interrupted sends, write the monthly customer email (lib/email-campaigns).
    if (hour === 15) hit("/api/cron/email-campaigns")
    // Daily 16:00 UTC (noon ET) — scan-lead nurture emails (Resend only; sends
    // nothing unless COMPANY_MAILING_ADDRESS is set)
    if (hour === 16) hit("/api/cron/nurture")
    // Daily 17:00 UTC — personal conversion emails to onboarded accounts with no
    // paid plan (Anthropic + Resend; sends nothing without COMPANY_MAILING_ADDRESS).
    // After lifecycle (14:00) so its 20h-per-account guard sees the day's nudge.
    if (hour === 17) hit("/api/cron/convert")
    // 1st of the month 18:00 UTC — "Your month with Alphaa" recap email (Resend + GA)
    if (now.getUTCDate() === 1 && hour === 18) hit("/api/cron/monthly-recap")
    // Mon 12:00 UTC — Google Ads weekly tune-up for Growth brands with a campaign (Google Ads API only)
    if (dow === 1 && hour === 12) hit("/api/cron/ads-tune")
    // Hourly — founder alert when a brand or the platform passes 80% of its AI ceiling (once a day max)
    hit("/api/cron/usage-alert")
    // Hourly — new leads from Facebook & Instagram lead forms (Meta API only, lib/metaads)
    hit("/api/cron/meta-ads?job=leads")
    // Mon 11:00 UTC — Facebook & Instagram weekly tune-up (Meta API only)
    if (dow === 1 && hour === 11) hit("/api/cron/meta-ads?job=tune")
    // Daily 09:00 UTC (+ hourly catch-up to 12:00) — the owner's own ad rules (lib/ad-rules; ad APIs
    // only). The route skips a brand checked in the last 20h, so re-hits only finish unfinished brands.
    if (hour >= 9 && hour <= 12) hit("/api/cron/ad-rules")
    // 1st of the month 15:00 UTC (+ catch-up to 20:00) — last month's ad report link to owners who
    // asked for it (lib/ad-report; once per brand per month via settings adReportMail.lastSent).
    if (now.getUTCDate() === 1 && hour >= 15 && hour <= 20) hit("/api/cron/ad-report")
    // 1st of the month 10:00 UTC (+ hourly catch-up until the 3rd ends): who links to each brand vs
    // its competitors + keyword numbers (DataForSEO + Keyword Planner). One snapshot per brand per month.
    if ((now.getUTCDate() === 1 && hour >= 10) || now.getUTCDate() === 2 || now.getUTCDate() === 3) hit("/api/cron/backlinks")
  }, 60_000)
}
