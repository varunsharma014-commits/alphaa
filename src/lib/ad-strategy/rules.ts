// Pure rules for the ad plan (no I/O): the budget and testing plan, and the copy checks.
// Unit-tested in scripts/test-ad-strategy.ts.
import { copyProblem } from "@/lib/gads/rules"
import { THRESHOLDS } from "./playbook"
import type { PlatformPlan, Script, TestingPlan } from "./types"

const DAYS = 30.4
/** LinkedIn's own floor is $10 a day per campaign. */
export const LINKEDIN_MIN_MONTHLY = Math.ceil(10 * DAYS)

const round = (n: number) => Math.floor(n)
const daily = (m: number) => Math.round((m / DAYS) * 100) / 100

/** Which platforms, how the budget splits, and how many creatives each can judge in a month. */
export function testingPlan(o: { monthly: number | null; currency: string; b2b: boolean; local: boolean }): TestingPlan {
  let weights: [PlatformPlan["platform"], number][] = o.b2b && !o.local
    ? [["Facebook & Instagram", 0.4], ["LinkedIn", 0.35], ["Google", 0.25]]
    : [["Facebook & Instagram", 0.6], ["Google", 0.4]]
  if (o.monthly !== null && weights.some(([p, w]) => p === "LinkedIn" && o.monthly! * w < LINKEDIN_MIN_MONTHLY)) {
    weights = [["Facebook & Instagram", 0.6], ["Google", 0.4]]
  }
  const platforms: PlatformPlan[] = weights.map(([platform, w]) => {
    const m = o.monthly !== null ? round(o.monthly * w) : null
    if (platform === "Facebook & Instagram") {
      const judge = m !== null ? Math.floor(m / THRESHOLDS.metaJudgeSpend) : null
      return {
        platform, monthly: m, daily: m !== null ? daily(m) : null, judge,
        launch: judge === null ? "3–4 different concepts in one ad set, one broad audience" : judge < 2 ? "1 concept at a time (the budget can judge fewer than 2 a month)" : `${Math.min(4, judge)} different concepts in one ad set, one broad audience`,
        optimise: o.local ? "Leads (instant form) or calls; if fewer than 7 a week, landing-page views" : "Your key action on the website if it fires 7+ times a week; otherwise landing-page views",
      }
    }
    if (platform === "LinkedIn") {
      const judge = m !== null ? Math.floor(m / THRESHOLDS.linkedinJudgeSpend) : null
      return { platform, monthly: m, daily: m !== null ? daily(m) : null, judge, launch: "2 concepts in 4:5, one Website Visits campaign, audience of 50,000+", optimise: "Landing-page clicks (not total clicks)" }
    }
    return {
      platform, monthly: m, daily: m !== null ? daily(m) : null, judge: null,
      launch: o.local ? "A Search campaign on the searches that already find you (text ads run longest in most categories)" : "Search on your category terms, plus a Demand Gen video (9:16 and 16:9) once you have 2 videos",
      optimise: "Maximise clicks for 2 weeks, then maximise conversions once tracking records them",
    }
  })
  const notes = [
    `Each Facebook & Instagram creative needs about ${THRESHOLDS.metaJudgeImpressions.toLocaleString("en-US")} impressions, roughly $${THRESHOLDS.metaJudgeSpend} of spend, before you judge it.`,
    ...(platforms.some((p) => p.platform === "LinkedIn") ? [`Each LinkedIn ad needs about $${THRESHOLDS.linkedinJudgeSpend} before you judge it.`] : []),
    ...(o.monthly === null ? ["Set your monthly ad budget and I’ll size this for you: how much goes where, and how many ads it can test."] : []),
  ]
  return { monthly: o.monthly, currency: o.currency, platforms, notes }
}

/** Every number a line may use: the ones in the business's own facts. */
export const allowedNumbers = (facts: string) => new Set((facts.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, "").replace(/,/g, "")))

/** Why a line can't run, or null. Same claims policy as the Google and Meta ads. */
export function lineProblem(text: string, max: number, allowed: Set<string>, brand: string | null, headline = false): string | null {
  return copyProblem(text, max, allowed, headline, brand)
}

/** Keep the lines that pass; count the rest. */
export function keepLines<T>(items: T[], lines: (t: T) => { text: string; max: number; headline?: boolean }[], allowed: Set<string>, brand: string | null): { ok: T[]; dropped: number } {
  const ok: T[] = []
  let dropped = 0
  const seen = new Set<string>()
  for (const it of items) {
    const ls = lines(it)
    const key = ls.map((l) => l.text.trim().toLowerCase()).join("|")
    if (seen.has(key) || ls.some((l) => l.text.trim() && lineProblem(l.text.trim(), l.max, allowed, brand, l.headline))) { dropped++; continue }
    seen.add(key)
    ok.push(it)
  }
  return { ok, dropped }
}

/** The lines of a script my checks read: on-screen text, voice-over and the hook swaps. Visual notes are directions, not copy. */
export const scriptLines = (s: Script) => [
  ...s.scenes.flatMap((x) => [{ text: x.onScreen, max: 120 }, { text: x.vo, max: 240 }]),
  ...s.hookSwaps.map((h) => ({ text: h, max: 120 })),
]
