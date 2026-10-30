# Off-site links: cloud + Mac handoff

Two agents share this work every day and talk to each other only through this repo.

| Agent | Where | When (Toronto) | Does |
|---|---|---|---|
| **Cloud** (routine "Alphaa off-site links (cloud)") | Anthropic cloud, no browser logins | ~9am and ~5pm daily | Finds targets, writes listing copy (per language), drafts pitches, checks what went live, adds live profiles to schema sameAs, IndexNow, daily report |
| **Mac** (scheduled task `alphaa-offpage-daily`) | Intel Mac (papa-mac), Varun's signed-in Chrome + Gmail | ~11:24am daily | Fills and submits free listing forms, checks which sites are logged in, makes Gmail drafts, closes its tabs |

Daily loop: cloud 9am writes `for-mac.md` → Mac 11:24am does the jobs and writes `for-cloud.md` → cloud 5pm reads it, verifies, updates schema, writes the report → next morning repeats.

## Files
- `for-mac.md`: **written by cloud** (overwritten each morning). Today's jobs for the Mac, in order, each with the site, URL, which copy file to use, and what "done" looks like.
- `for-cloud.md`: **written by the Mac** (overwritten each run). What it did per job, what blocked it (CAPTCHA, payment, phone/ID check), sites now logged in, journalist requests seen in Gmail, questions.
- `log.md`: **both append** one line per run: `YYYY-MM-DD HH:MM ET | cloud-am / mac / cloud-pm | summary`. Never rewrite old lines.
- `../tracker.csv`: shared status list (`site,url,status,date,notes`).
- `../copy/<market>.md`: listing copy per language (en, uk, de, fr, it, ae, ar), written by cloud from `../submission-kit.md`.
- `../pitches/`: press/journalist pitch drafts written by cloud; the Mac turns approved-to-draft ones into Gmail drafts (never sends).
- `../daily/YYYY-MM-DD.md`: the daily report for Varun (cloud-pm writes it; the Mac adds its section).

## Who moves which status (avoids conflicts)
- Cloud: adds `todo` rows; `submitted` → `live`; `live` → notes "sameAs added"; `skipped` for dead/paid-only sites.
- Mac: `todo`/`needs_account` → `account_ready` (session found) → `prefilled` → `submitted`.
- Varun: creates accounts, does CAPTCHAs / phone checks / payments, sends emails.

## Git rules (both agents)
- `git pull --rebase origin main` before editing and again before pushing. Push straight to main (solo repo).
- Only touch `marketing/backlinks/**`; cloud may also edit the `sameAs` array in `src/app/layout.tsx`.
- On a tracker.csv conflict: take the remote file, re-apply only your own row changes, continue the rebase. Never force push.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
