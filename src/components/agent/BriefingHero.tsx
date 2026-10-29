"use client"

import { useEffect, useState } from "react"
import type { Hero } from "@/lib/agent/hero"
import type { Recap } from "@/lib/agent/recap"

// The number the owner opens the app for (people AI sent them in the last
// 30 days), what one customer is worth (my estimate, theirs to change), and
// in the first week of a month, last month's recap. Loaded after paint.

type HeroData = Hero & { recap: Recap | null }

const money = (n: number) => `$${n.toLocaleString("en-US")}`
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// The last 30 days of visits from AI, one point a day: a quiet area line, the
// latest day marked, a hover label for each day. Shape only, no axes to read.
function TrendLine({ series }: { series: number[] }) {
  const W = 300, H = 56, pad = 4
  const max = Math.max(1, ...series)
  const x = (i: number) => (i / (series.length - 1)) * W
  const y = (n: number) => H - pad - (n / max) * (H - pad * 2)
  const pts = series.map((n, i) => `${x(i).toFixed(1)},${y(n).toFixed(1)}`)
  const day = (i: number) => new Date(Date.now() - (series.length - i) * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const last = series.length - 1
  return (
    <figure className="ag-trend" aria-label={`Visits from AI per day over the last 30 days, from ${series[0]} to ${series[last]}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
        <path d={`M0,${H} L${pts.join(" L")} L${W},${H} Z`} className="ag-trend__area" />
        <polyline points={pts.join(" ")} className="ag-trend__line" vectorEffect="non-scaling-stroke" />
        {series.map((n, i) => (
          <rect key={i} x={x(i) - W / series.length / 2} y={0} width={W / series.length} height={H} fill="transparent">
            <title>{`${day(i)}: ${n} ${n === 1 ? "visit" : "visits"} from AI`}</title>
          </rect>
        ))}
      </svg>
      <span className="ag-trend__dot" style={{ left: "100%", top: `${(y(series[last]) / H) * 100}%` }} aria-hidden="true" />
      <figcaption><span>30 days ago</span><span>Yesterday</span></figcaption>
    </figure>
  )
}

export function BriefingHero() {
  const [hero, setHero] = useState<HeroData | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/agent/hero")
      .then((r) => (r.ok ? r.json() : null))
      .then((h: HeroData | null) => {
        setHero(h)
        setState(h ? "ready" : "failed")
      })
      .catch(() => setState("failed"))
  }, [])

  async function saveValue() {
    const amount = Math.round(Number(draft.replace(/[^0-9.]/g, "")))
    if (!amount || amount < 1) return
    setSaving(true)
    const res = await fetch("/api/agent/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerValue: amount }) }).catch(() => null)
    setSaving(false)
    if (!res?.ok || !hero) return
    setHero({ ...hero, value: { amount, source: "owner", at: new Date().toISOString() }, paysFor: Math.floor(amount / hero.price) })
    setEditing(false)
  }

  if (state === "loading") return <div className="ag-win ag-win--loading"><p>Counting the people AI sent you…</p></div>
  if (state === "failed" || !hero) return null

  const v = hero.visitors
  const diff = v && v.prev !== null ? v.total - v.prev : null
  const sources = v ? Object.entries(v.bySource).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]) : []

  return (
    <>
      <section className="ag-win">
        {v && v.total > 0 ? (
          <>
            <div className="ag-win__num">{v.total}</div>
            <p className="ag-win__what">{v.total === 1 ? "person found you through AI" : "people found you through AI"} in the last 30 days</p>
            {v.series && v.series.some((n) => n > 0) && <TrendLine series={v.series} />}
            {diff !== null && diff !== 0 && <p className={`ag-win__trend ${diff > 0 ? "up" : ""}`}>{diff > 0 ? `▲ Up ${diff} from the month before` : `${Math.abs(diff)} fewer than the month before. I’m on it.`}</p>}
            {sources.length > 0 && (
              <div className="ag-win__src">
                {sources.map(([name, n]) => <span key={name}>{name} <b>{n}</b></span>)}
              </div>
            )}
          </>
        ) : hero.named && hero.named.named > 0 ? (
          <>
            <div className="ag-win__num">{hero.named.named}<small> of {hero.named.answers}</small></div>
            <p className="ag-win__what">times the AIs named you when I asked your customers’ {hero.named.questions} questions this week</p>
            {v && <p className="ag-win__trend">No visitors from AI yet this month. Getting named is the step before they come.</p>}
          </>
        ) : (
          <>
            <p className="ag-win__what ag-win__what--big">I’m building your AI visibility. The first visitors from ChatGPT and the others will show up here.</p>
          </>
        )}

        {hero.value && (
          <div className="ag-win__value">
            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); void saveValue() }} className="ag-win__edit">
                <label htmlFor="cv">What’s a new customer worth to you?</label>
                <div>
                  <span>$</span>
                  <input id="cv" inputMode="numeric" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={String(hero.value.amount)} />
                  <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                </div>
              </form>
            ) : (
              <p>
                One new customer is worth about <b>{money(hero.value.amount)}</b> to you
                {hero.paysFor !== null && hero.paysFor >= 1 && (hero.paysFor > 24 ? <>. Just one of them pays for Alphaa <b>for years</b></> : <>. Just one of them pays for <b>{hero.paysFor === 1 ? "a month" : `${hero.paysFor} months`}</b> of Alphaa</>)}.{" "}
                <span className="ag-win__est">
                  {hero.value.source === "estimate" ? `My estimate${hero.value.basis ? `: ${hero.value.basis}` : ""}.` : "Your number."}{" "}
                  <button type="button" onClick={() => { setDraft(String(hero.value!.amount)); setEditing(true) }}>Change it</button>
                </span>
              </p>
            )}
          </div>
        )}
      </section>

      {hero.recap && (
        <section className="ag-recap">
          <p className="ag-recap__title">Your {hero.recap.month} with Alphaa</p>
          <div className="ag-recap__stats">
            {hero.recap.visitors !== null && <div><b>{hero.recap.visitors}</b><span>found you through AI</span></div>}
            <div><b>{hero.recap.jobs}</b><span>jobs I did for you</span></div>
            <div><b>{hero.recap.recommending.length} of 4</b><span>AIs recommend you</span></div>
          </div>
          {hero.recap.firsts.map((f) => <p key={f} className="ag-recap__first">★ {f} in {hero.recap!.month}.</p>)}
          {hero.recap.firsts.length === 0 && hero.recap.highlights[0] && <p className="ag-recap__first">{plural(hero.recap.jobs, "job", "jobs")}, including: {hero.recap.highlights[0].charAt(0).toLowerCase() + hero.recap.highlights[0].slice(1)}.</p>}
        </section>
      )}
    </>
  )
}
