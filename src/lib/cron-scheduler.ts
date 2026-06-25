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
    if (hour === 5) hit("/api/cron/seo-sync")

    // ── PAUSED: the crons below trigger Anthropic API calls. Disabled to stop all
    //    autonomous Claude spend (see src/lib/ai-paused.ts). To re-enable, set
    //    AI_PAUSED=false AND uncomment these lines. ───────────────────────────────
    // // Mon 13:00 UTC — weekly reports (Anthropic)
    // if (dow === 1 && hour === 13) hit("/api/cron/weekly")
    // // Mon & Thu 13:00 UTC — GBP posts (Anthropic)
    // if ((dow === 1 || dow === 4) && hour === 13) hit("/api/cron/gbp-posts")
    // // Sun 06:00 UTC — competitor discovery / refresh (Anthropic)
    // if (dow === 0 && hour === 6) hit("/api/cron/competitors")
    void dow // keep `dow` referenced now that the weekly/competitor crons are off
  }, 60_000)
}
