# Mac report, 2026-11-24 (iMac run, 13:30 ET)

**The run started but stopped at the fingerprint gate. No forms were filled or submitted.**

## Why it stopped
- The host gate printed `RUN host=imac fingerprint=10 cores 2560x1440`.
- The Chrome on this iMac ("Browser 2") reports **10 cores 2240x1260**. The iMac's display is set to "looks like 2240x1260" (system_profiler: 4480x2520 panel), so this is the right machine, but `~/growth-ops/hosts.json` holds the wrong resolution. Under the gate rule (and the test-run stop rule), the run stopped.
- The other connected browsers: Browser 1 = 12 cores 1728x1117 (m3 laptop), Browser 3 = 4 cores 1440x900 (papa). Neither was used for any site.
- **Fix (Varun):** set the imac fingerprint in `~/growth-ops/hosts.json` to `10 cores 2240x1260`, or change the iMac display back to 2560x1440. Tomorrow's run should go through after that.

## Jobs
1. Startup Stash: blocked (gate). One thing seen on load: /add-listing/ now redirects to https://startupstash.com/get-listed/ ("Build my page", then "choose a plan"). The old free Typeform path may be gone. **Cloud: please check whether a free tier still exists.**
2. Launching Next: not started (gate).
3. DMZ Oh Canada: not started (gate).
4. Founded in Canada: not started (gate). Still needs Varun's answers (founded year, founder citizen/PR, 60% team in Canada).
5. SaaSworthy: not started (gate). Still needs Varun's phone number and funds-received answer.
- If-time, check-only, and login-check jobs: not started (gate).

## Gmail
- The Gmail connector on this Mac is signed in to **vsharma@growthturbine.com** (GrowthTurbine work inbox), not the Alphaa brand inbox (hi@alphaa.app → growthturbine@gmail.com). I made **0 drafts**, because Alphaa pitches should not sit in or go from the GT work account.
- No journalist-request digests (Qwoted/Featured/Connectively/SourceBottle/HAB2BW) arrived in that inbox in the last 24h.
- Pitch note for the cloud: localogy (and maybe others) opens with "Your recent pieces on AI visibility... caught my eye". Please confirm a real article backs that line or drop it before the draft is made (legal-safety §2).
- Copy note: copy/en.md "Pricing" still lists Starter $99 / Pro $199 / Full Service $299. Plans changed on 2026-11-18 (Starter $99, Pro $399, Growth $499; Full Service retired). Please update the copy before any pricing field gets filled.

## Questions for the cloud
- Is there still a free path on Startup Stash?
- Which inbox should the Mac make pitch drafts in? It needs to be the Alphaa one, reached through Chrome webmail or a connector.
