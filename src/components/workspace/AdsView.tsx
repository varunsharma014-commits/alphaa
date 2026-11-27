"use client"

import { useMemo, useState } from "react"
import type { AdsData } from "@/lib/workspace/ads"
import { testingPlan, LINKEDIN_MIN_MONTHLY } from "@/lib/ad-strategy/rules"
import { THRESHOLDS } from "@/lib/ad-strategy/playbook"
import { askAlphaa, toast } from "@/lib/workspace/events"
import { Empty, PlanGate, Tabs, useInspector } from "./ui"

// Ads: show the ads before asking for money. "Your first ads" (from the ad plan) is the default
// while nothing is live; the limit is a slider that re-splits with the real testingPlan() rules;
// results only from the accounts; guardrails are the rules the code applies. Meta and Google are
// the channels I run; LinkedIn appears only inside a B2B plan ("I prepare these, you run them").

type Tab = "f" | "r" | "a" | "t"
const STEPS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000]

// Rules the code enforces (and where): shown before any change exists.
const GUARDRAILS = [
  { rule: "Never above your monthly limit. Daily budgets are worked out from it, rounded down.", where: "Google: checkDaily · Meta: weekly tune keeps budgets inside the cap" },
  { rule: "New campaigns are built paused. Nothing spends until it’s turned on through your approval or Autopilot.", where: "Google: createFromPlan · Meta: build" },
  { rule: "On Meta, an ad that spent 2 days of its budget with no result is paused, but never every ad in a campaign.", where: "Meta weekly tune (PAUSE_AFTER_DAYS_OF_BUDGET)" },
  { rule: "On Meta, 20% of the daily budget moves from the weakest campaign to the best when the best gets results for a third less or better.", where: "Meta weekly tune" },
  { rule: "On Google, a search costing half a day’s budget (at least 5) with 3+ clicks and no conversion is blocked.", where: "Google weekly tune (decideTuning)" },
  { rule: "On Google, a keyword that cost 3 days’ budget (at least 30) with no conversion is paused, always leaving a few running.", where: "Google weekly tune (decideTuning)" },
  { rule: "Google cuts only happen when conversion tracking is on: without it, “0 conversions” means “not measured”.", where: "Google weekly tune" },
  { rule: "Every ad line passes my claims check: no superlatives, no guarantees, numbers only from your own facts, platform length limits.", where: "Ad plan + Meta/Google copy checks" },
]

export function AdsView({ data }: { data: AdsData | null }) {
  const { node, open } = useInspector()
  const [tab, setTab] = useState<Tab>(data && !data.live ? "f" : "r")
  const [limit, setLimit] = useState<number>(() => {
    const b = data?.budget ?? 500
    return STEPS.reduce((a, s) => (Math.abs(s - b) < Math.abs(a - b) ? s : a), STEPS[0])
  })
  const [saving, setSaving] = useState(false)
  const [undone, setUndone] = useState<Record<number, boolean>>({})
  const split = useMemo(() => (data ? testingPlan({ monthly: limit, currency: data.planInputs.currency, b2b: data.planInputs.b2b, local: data.planInputs.local }) : null), [data, limit])

  const head = (
    <div className="ax-hdr">
      <div><h1 className="ax-h1">Ads</h1><p className="ax-sub">I build, run and tune your ads on Facebook & Instagram and Google, inside the monthly limit you set.</p></div>
      <span className="ax-pill n" style={{ marginTop: 12 }}>Growth plan · early access</span>
    </div>
  )
  if (!data) return <>{head}<div style={{ marginTop: 26 }}><PlanGate plan="Growth" title="Ads come with the Growth plan" text="Growth is in early access while Google and Meta approve ads access. When ads open, I build your Google and Meta ads from what your competitors run, keep them inside your limit, and pause what stops working." /></div></>

  async function saveLimit() {
    setSaving(true)
    const res = await fetch("/api/agent/autopilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "budget", amount: String(limit) }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setSaving(false)
    if (!res?.ok) return toast(d?.error ?? "That didn’t save. Nothing changed.")
    toast("Limit saved. Next: I prepare the launch for your OK.")
    askAlphaa({ topic: "ads", label: "Prepare my launch" })
  }
  async function undo(i: number, body: Record<string, string>) {
    const res = await fetch("/api/agent/ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    if (!res?.ok) return toast(d?.error ?? "That didn’t undo. Nothing changed.")
    setUndone((u) => ({ ...u, [i]: true }))
    toast("Undone")
  }

  const running = split?.platforms.filter((p) => p.platform !== "LinkedIn") ?? []
  const linkedin = split?.platforms.find((p) => p.platform === "LinkedIn")
  const money = (n: number | null) => (n == null ? "—" : `$${n.toLocaleString("en-US")}`)

  const limitCard = (
    <section className="ax-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ax-eb" style={{ color: "#af52de", display: "flex", gap: 6, alignItems: "center" }}><span className="ax-orb" style={{ width: 12, height: 12 }} />Your monthly limit · Facebook & Instagram + Google</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--x-mut)" }}>{data.budget != null ? `Saved: $${data.budget.toLocaleString("en-US")}` : "Not set yet"}</span>
        <b style={{ fontSize: 30, letterSpacing: "-.03em" }}>${limit.toLocaleString("en-US")}<span style={{ fontSize: 14, color: "var(--x-mut)", fontWeight: 500 }}> /mo</span></b>
      </div>
      <input type="range" className="ax-range" min={0} max={STEPS.length - 1} step={1} value={STEPS.indexOf(limit)} onChange={(e) => setLimit(STEPS[Number(e.target.value)])} aria-label="Monthly ad limit" />
      <div className="ax-list">
        {running.map((p) => (
          <div key={p.platform} style={{ padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><b>{p.platform}</b><span>{money(p.monthly)}<span className="ax-t11"> · {p.daily != null ? `$${p.daily}/day` : ""}</span></span></div>
            <div className="ax-t11" style={{ marginTop: 3, fontSize: 12.5 }}>
              {p.platform === "Facebook & Instagram"
                ? `I judge each ad after $${THRESHOLDS.metaJudgeSpend} or ${THRESHOLDS.metaJudgeImpressions.toLocaleString("en-US")} impressions${p.judge != null ? `, so this tests ${p.judge} ad${p.judge === 1 ? "" : "s"} a month` : ""}. ${p.launch}.`
                : `${p.launch}. ${p.optimise}.`}
            </div>
          </div>
        ))}
        {data.planInputs.b2b && !data.planInputs.local && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><b>LinkedIn <span className="ax-pill n" style={{ marginLeft: 6 }}>In your plan · I prepare these, you run them</span></b><span>{linkedin ? money(linkedin.monthly) : "—"}</span></div>
            <div className="ax-t11" style={{ marginTop: 3, fontSize: 12.5 }}>{linkedin ? `I judge each ad after $${THRESHOLDS.linkedinJudgeSpend}.` : `LinkedIn needs at least $${LINKEDIN_MIN_MONTHLY}/mo of its share, so it’s dropped at this limit.`}</div>
          </div>
        )}
      </div>
      <button className="ax-btn grad" type="button" style={{ padding: 11 }} disabled={saving || data.budget === limit} onClick={() => void saveLimit()}>{saving ? "Saving…" : data.budget === limit ? "This is your limit" : "Save limit & prepare launch"}</button>
      <div style={{ fontSize: 12, color: "var(--x-mut)", textAlign: "center" }}>Saving the limit doesn’t start any ads. Launching still goes through your OK{" "}or Autopilot.</div>
    </section>
  )

  return (
    <>
      {head}
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[...(!data.live ? [{ key: "f" as Tab, label: "Your first ads" }] : []), { key: "r", label: "Results" }, { key: "a", label: "Ads running" }, { key: "t", label: "What I changed" }]} />

      {tab === "f" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 18, marginTop: 22 }} className="ax-adsgrid">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.planState === "running" && !data.firstAds.length ? (
              <section className="ax-card" style={{ padding: "22px 24px", display: "flex", gap: 10, alignItems: "center" }}><span className="ax-dot" /><span><b>I’m building your ad plan.</b> <span className="ax-p" style={{ display: "inline" }}>I read your competitors’ live ads, then write ads for you. Takes a few minutes.</span></span></section>
            ) : data.firstAds.length ? data.firstAds.map((a, i) => (
              <article key={i} className="ax-card ax-adprev">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 13 }}>{a.platform}</b>
                  {a.inPlanOnly ? <span className="ax-pill n">In your plan · I prepare these, you run them</span> : <span className="ax-pill g">Passed my claims check</span>}
                </div>
                {a.image && <img src={a.image} alt="" />}
                {a.platform === "Google search"
                  ? <div className="ax-gad"><div className="t">{a.headline}</div><div className="d">{a.primary}</div></div>
                  : <><p style={{ margin: 0, fontSize: 14 }}>{a.primary}</p><b style={{ fontSize: 15 }}>{a.headline}</b></>}
                <div className="ax-t11">Audience: {a.audience}</div>
              </article>
            )) : (
              <Empty title="No ad plan yet" text="I start from what your competitors run, then write your first ads." act={{ label: "Make my ad plan", primary: true, chip: { label: "Make my ad plan", action: { type: "agent-op", endpoint: "adplan", body: { op: "make" } } } }} />
            )}
            {data.plan && <a className="ax-btn s" href="/dashboard/ad-strategy" style={{ alignSelf: "flex-start" }}>See the full plan: hooks, scripts and budget →</a>}
          </div>
          {limitCard}
        </div>
      )}

      {tab === "r" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
          {data.fetchFailed && <p className="ax-note" style={{ marginTop: 0 }}>{data.fetchFailed}</p>}
          {data.results.map((r) => (
            <section key={r.platform} className="ax-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}><b style={{ fontSize: 15 }}>{r.platform} · last 30 days</b>{r.extra && <span className="ax-t11">{r.extra}</span>}</div>
              <div className="ax-g3" style={{ gap: 8 }}>
                <div className="ax-tile"><div className="k">Spent</div><b style={{ fontSize: 20 }}>{r.spend}</b></div>
                <div className="ax-tile"><div className="k">{r.platform === "Google Ads" ? "Conversions" : "Leads"}</div><b style={{ fontSize: 20, color: "var(--x-gink)" }}>{r.leads ?? "—"}</b></div>
                <div className="ax-tile"><div className="k">Per {r.platform === "Google Ads" ? "conversion" : "lead"}</div><b style={{ fontSize: 20 }}>{r.perLead ?? "—"}</b></div>
              </div>
              <div className="ax-t11" style={{ marginTop: 6 }}>{r.clicks} clicks</div>
            </section>
          ))}
          {!data.sevenDays && (
            <>
              <div className="ax-h2" style={{ marginTop: 6 }}><div><h2>Competitor ads I’m watching</h2><p>Live ads from your competitors, from the public Ad Library. Results fill in after a week of your own spend.</p></div></div>
              {data.watching.length ? (
                <div className="ax-g2" style={{ marginTop: 0 }}>
                  {data.watching.map((w, i) => (
                    <article key={i} className="ax-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ fontSize: 14.5 }}>{w.page}</b>{w.days != null && <span className="ax-proof">Running {w.days} days</span>}</div>
                      <p className="ax-p ax-clamp" style={{ color: "var(--x-ink)" }}>“{w.text}”</p>
                      {data.beatIt[i % Math.max(1, data.beatIt.length)] && <p className="ax-p"><b style={{ color: "var(--x-ink)", fontWeight: 600 }}>How I’d beat it: </b>{data.beatIt[i % data.beatIt.length]}</p>}
                      <a className="ax-src" href={w.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: "auto" }}>See it in the Ad Library ↗</a>
                    </article>
                  ))}
                </div>
              ) : <p className="ax-note" style={{ marginTop: 0 }}>None of your competitors has a live ad in the Ad Library right now{data.plan ? "" : ", or I haven’t looked yet (that happens when I build your ad plan)"}.</p>}
            </>
          )}
        </div>
      )}

      {tab === "a" && (
        data.campaigns.length ? (
          <div className="ax-g3" style={{ marginTop: 22 }}>
            {data.campaigns.map((a) => (
              <article key={a.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                <div className={`ax-art${a.image ? " img" : ""}`} style={{ height: 170, background: a.image ? `url("${a.image}") center/cover` : a.art }}>
                  <span className="ax-pill w" style={{ alignSelf: "flex-start" }}>{a.platform}</span>
                  {!a.image && <div><b style={{ fontSize: 20 }}>{a.head}</b></div>}
                </div>
                <div className="ax-cb">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><b style={{ fontSize: 14.5, minWidth: 0 }}>{a.name}</b><span className={`ax-pill ${a.pc}`}>{a.status}</span></div>
                  <p className="ax-p ax-clamp">{a.text}</p>
                  <div className="ax-ft"><span style={{ fontSize: 12.5, color: "var(--x-mut)" }}>{a.daily ?? ""}</span><button className="ax-lnk" type="button" onClick={() => open({ eb: a.platform, title: a.name, rows: [...(a.image ? [{ k: "Image", v: "", image: a.image }] : []), { k: "Status", v: a.status }, { k: "Ad text", v: a.text, box: true }, ...(a.daily ? [{ k: "Budget", v: a.daily }] : [])], cta: { label: "Open it in chat", topic: "ads" } })}>Details</button></div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 22 }}><Empty title="No campaigns yet" text="Your first ads are ready to look at. Once your limit is saved and you give the OK, I build them paused and turn them on." /><div style={{ marginTop: 10 }}><button className="ax-btn p sm" type="button" onClick={() => setTab("f")}>See your first ads</button></div></div>
        )
      )}

      {tab === "t" && (
        data.changes.length ? (
          <section className="ax-card ax-list" style={{ padding: "2px 22px", marginTop: 22 }}>
            {data.changes.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}><b style={{ fontSize: 14.5, textDecoration: undone[i] ? "line-through" : "none" }}>{c.text}</b><div className="ax-t11" style={{ fontSize: 12.5, marginTop: 3 }}>{c.by === "Me" ? "I did this" : "You did this"} · {c.when}</div></div>
                <span className="ax-pill n">{c.platform}</span>
                {c.undo && !undone[i] && <button className="ax-btn s sm" type="button" onClick={() => void undo(i, c.undo!)}>Undo</button>}
              </div>
            ))}
          </section>
        ) : (
          <>
            <div className="ax-h2"><div><h2>The rules I follow</h2><p>No changes yet. These are the guardrails my code applies to every account.</p></div></div>
            <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
              {GUARDRAILS.map((g, i) => (
                <div key={i} style={{ padding: "14px 0" }}>
                  <div style={{ fontSize: 14.5 }}>{g.rule}</div>
                  <div className="ax-t11" style={{ marginTop: 3 }}>{g.where}</div>
                </div>
              ))}
            </section>
          </>
        )
      )}
      {node}
    </>
  )
}
