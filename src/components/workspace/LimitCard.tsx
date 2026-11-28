"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { testingPlan, LINKEDIN_MIN_MONTHLY } from "@/lib/ad-strategy/rules"
import { THRESHOLDS } from "@/lib/ad-strategy/playbook"
import { toast } from "@/lib/workspace/events"
import { Button, Pill, StatTile } from "./ui"
import "./p3.css"

// The one monthly ad limit (Ads and the ad plan both use this card). Nothing reads as "set" until
// the owner saves a limit: before that it says "Pick a limit" and the slider only suggests. The
// suggestion is the smallest step where Facebook & Instagram can judge 3 ads a month (the plan's
// own testing rule), never a made-up number. The split is testingPlan(), the same rule the build uses.

export const LIMIT_STEPS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000]
export type PlanInputs = { b2b: boolean; local: boolean; currency: string }

const nearest = (b: number) => LIMIT_STEPS.reduce((a, s) => (Math.abs(s - b) < Math.abs(a - b) ? s : a), LIMIT_STEPS[0])

/** Smallest step whose Facebook & Instagram share can judge 3 ads a month. */
export function suggestedLimit(p: PlanInputs): number {
  return LIMIT_STEPS.find((s) => (testingPlan({ monthly: s, ...p }).platforms.find((x) => x.platform === "Facebook & Instagram")?.judge ?? 0) >= 3) ?? LIMIT_STEPS[1]
}

export function LimitCard({ budget, inputs, sticky = true }: { budget: number | null; inputs: PlanInputs; sticky?: boolean }) {
  const router = useRouter()
  const [saved, setSaved] = useState<number | null>(budget)
  const [picked, setPicked] = useState<number | null>(budget)
  const [saving, setSaving] = useState(false)
  const suggested = useMemo(() => suggestedLimit(inputs), [inputs])
  const value = picked ?? suggested
  const split = useMemo(() => (picked != null ? testingPlan({ monthly: picked, ...inputs }) : null), [picked, inputs])
  const cur = inputs.currency === "USD" ? "$" : inputs.currency === "CAD" ? "CA$" : `${inputs.currency} `
  const money = (n: number | null) => (n == null ? null : `${cur}${n.toLocaleString("en-US")}`)
  const running = split?.platforms.filter((p) => p.platform !== "LinkedIn") ?? []
  const linkedin = split?.platforms.find((p) => p.platform === "LinkedIn")
  const b2bOnline = inputs.b2b && !inputs.local
  const dirty = picked != null && picked !== saved

  async function save() {
    if (picked == null) return
    setSaving(true)
    const res = await fetch("/api/agent/autopilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "budget", amount: String(picked) }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setSaving(false)
    if (!res?.ok) return toast(d?.error ?? "That didn’t save. Nothing changed.")
    setSaved(picked)
    toast(`Limit saved: ${money(picked)} a month. Nothing spends until you say go.`)
    router.refresh()
  }

  return (
    <section className={`ax-card x3-limit${sticky ? " sticky" : ""}`} aria-label="Your monthly ad limit">
      <div className="x3-limit__top">
        <div>
          <div className="x3-limit__k">Your monthly limit</div>
          <div className="x3-limit__v" aria-live="polite">
            {picked == null ? <span className="none">Pick a limit</span> : <>{money(picked)}<small> a month</small></>}
          </div>
        </div>
        {saved != null && !dirty ? <Pill tone="ok" dot>Saved</Pill> : saved != null && dirty ? <Pill tone="warn">Not saved</Pill> : <Pill tone="idle">Not set</Pill>}
      </div>

      <div className="x3-range">
        <input type="range" className="ax-range" min={0} max={LIMIT_STEPS.length - 1} step={1} value={LIMIT_STEPS.indexOf(nearest(value))} onChange={(e) => setPicked(LIMIT_STEPS[Number(e.target.value)])} aria-label="Monthly ad limit" aria-valuetext={picked == null ? "Not picked yet" : `${money(picked)} a month`} />
        <div className="x3-range__ends" aria-hidden="true"><span>{money(LIMIT_STEPS[0])}</span><span>{money(LIMIT_STEPS[LIMIT_STEPS.length - 1])}</span></div>
      </div>
      {picked == null ? (
        <p className="x3-limit__hint">
          Suggested start: <button type="button" className="ax-lnk" onClick={() => setPicked(suggested)}>{money(suggested)} a month</button>. It’s the smallest limit where Facebook & Instagram can judge 3 ads a month.
        </p>
      ) : (
        <>
          <div className="x3-split">
            {running.map((p) => (
              <StatTile key={p.platform} soft label={p.platform === "Facebook & Instagram" ? "Facebook & Instagram" : "Google"} value={money(p.monthly)} hint={p.daily != null ? `${cur}${p.daily} a day` : undefined} />
            ))}
          </div>
          {b2bOnline && (
            <div className="x3-limit__li">
              <span>LinkedIn {linkedin ? <b>{money(linkedin.monthly)}</b> : null}</span>
              <span className="ax-t11">{linkedin ? "I prepare these, you run them." : `Needs at least ${cur}${LINKEDIN_MIN_MONTHLY} a month of its share, so it’s left out at this limit.`}</span>
            </div>
          )}
          <details className="x3-fold">
            <summary>How I spend it</summary>
            <ul>
              {running.map((p) => (
                <li key={p.platform}>
                  <b>{p.platform === "Facebook & Instagram" ? "Facebook & Instagram" : "Google"}.</b>{" "}
                  {p.platform === "Facebook & Instagram"
                    ? `I judge each ad after ${cur}${THRESHOLDS.metaJudgeSpend} or ${THRESHOLDS.metaJudgeImpressions.toLocaleString("en-US")} people seeing it${p.judge != null ? `, so this tests ${p.judge} ad${p.judge === 1 ? "" : "s"} a month` : ""}. ${p.launch}.`
                    : `${p.launch}. ${p.optimise}.`}
                </li>
              ))}
              <li>Daily budgets are worked out from this limit and rounded down. I never go over it.</li>
            </ul>
          </details>
        </>
      )}

      <Button variant="primary" loading={saving} disabled={picked == null || !dirty} onClick={() => void save()}>
        {picked == null ? "Pick a limit first" : dirty ? (saved == null ? "Save my limit" : "Save new limit") : "This is your limit"}
      </Button>
      <p className="x3-limit__fine">Saving a limit doesn’t start any ads. Launching still needs your OK or Autopilot.</p>
    </section>
  )
}
