"use client"

// Research → "Who links to you vs competitors" (lib/backlinks ← /api/workspace/backlinks): sites
// linking in, new and lost last month, the top competitors side by side, and the link gap as
// suggested actions. "Help me ask" opens the chat with the facts; I never email anyone.
import { useEffect, useState } from "react"
import type { BacklinksView } from "@/lib/backlinks/view"
import { askAlphaa, toast } from "@/lib/workspace/events"
import { Empty, When } from "./ui"
import "./keywords.css"

const n = (x: number | null | undefined) => (x == null ? "?" : x.toLocaleString("en-US"))
const monthName = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo - 1, 15)).toLocaleString("en-US", { month: "long", timeZone: "UTC" }) }

export function BacklinksPanel() {
  const [v, setV] = useState<BacklinksView | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/workspace/backlinks").catch(() => null)
      const d = (await r?.json().catch(() => null)) as { view?: BacklinksView } | null
      if (!r?.ok || !d?.view) return setFailed(true)
      setV(d.view)
    })()
  }, [])

  async function refresh() {
    setBusy(true)
    const r = await fetch("/api/workspace/backlinks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "refresh" }) }).catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: BacklinksView; error?: string } | null
    setBusy(false)
    if (d?.view) setV(d.view)
    if (!r?.ok) return toast(d?.error ?? "That didn’t work. Try again later.")
    toast("Checked. Here’s who links to you now.")
  }

  if (failed) return <div style={{ marginTop: 22 }}><Empty title="I couldn’t load your link data" text="Try again in a minute." /></div>
  if (!v) return <p className="ax-note" style={{ marginTop: 22 }}>Loading who links to you…</p>
  if (!v.scope) return <div style={{ marginTop: 22 }}><Empty title="Link checks come with a paid plan" text="Every month I check which sites link to you, what you gained and lost, and which sites link to your competitors but not to you." act={{ label: "See plans", href: "/dashboard/settings/billing", primary: true }} /></div>

  const s = v.snapshot
  if (!s?.summary) {
    return (
      <div style={{ marginTop: 22 }}>
        <section className="ax-card ax-empty">
          <div style={{ minWidth: 0, flex: 1 }}>
            <b>I haven’t checked your links yet</b>
            <p>{s?.notes[0] ?? "I count the sites that link to yours, what changed last month and, on Pro, which sites link to your competitors but not to you. I check once a month."}</p>
          </div>
          <button className="ax-btn p" type="button" disabled={busy || !v.canRefresh} onClick={() => void refresh()}>{busy ? "Checking… (about 20 seconds)" : "Check my links now"}</button>
        </section>
      </div>
    )
  }
  const sum = s.summary
  const mom = s.mom
  const all = [{ host: s.host, name: "You", me: true, sum }, ...s.competitors.map((c) => ({ host: c.host, name: c.name ?? c.host, me: false, sum: c.summary }))]
  const maxRd = Math.max(1, ...all.map((x) => x.sum?.referringDomains ?? 0))

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <p className="ax-sub" style={{ margin: 0, flex: 1, minWidth: 220 }}>Checked <When at={s.at} mode="ago" fallback="recently" /> · I look again every month</p>
        <button className="ax-btn s sm" type="button" disabled={busy || !v.canRefresh} onClick={() => void refresh()}>{busy ? "Checking…" : v.canRefresh ? "Check again" : "Checked today"}</button>
      </div>
      <div className="ax-bl-tiles">
        <div className="ax-card ax-bl-tile"><b>{n(sum.referringDomains)}</b><span>sites link to you</span></div>
        <div className="ax-card ax-bl-tile"><b>{n(sum.backlinks)}</b><span>links in total</span></div>
        {mom && mom.newDomains !== null && <div className="ax-card ax-bl-tile"><b>+{n(mom.newDomains)}</b><span>new sites in {monthName(mom.month)}</span></div>}
        {mom && mom.lostDomains !== null && <div className="ax-card ax-bl-tile"><b>−{n(mom.lostDomains)}</b><span>sites lost in {monthName(mom.month)}</span></div>}
        <div className="ax-card ax-bl-tile"><b>{n(sum.rank)}</b><span>link strength, 0 to 100</span></div>
      </div>

      {s.scope === "full" && s.competitors.length > 0 && (
        <>
          <div className="ax-h2"><div><h2>You vs your competitors</h2><p>Sites linking to each of you. More sites linking in usually means more trust from Google and AI.</p></div></div>
          <section className="ax-card ax-bl-cmp" style={{ padding: "2px 22px" }}>
            {all.map((x) => (
              <div key={x.host}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  <b style={{ fontSize: 15, flex: 1, minWidth: 160, overflowWrap: "anywhere" }}>{x.me ? `You (${x.host})` : x.name}</b>
                  <span className="ax-kw-score">{x.sum ? `${n(x.sum.referringDomains)} sites · strength ${n(x.sum.rank)}` : "couldn’t read"}</span>
                </div>
                <div className={`ax-bl-bar${x.me ? " me" : ""}`}><i style={{ width: `${Math.round(((x.sum?.referringDomains ?? 0) / maxRd) * 100)}%` }} /></div>
              </div>
            ))}
          </section>
        </>
      )}

      {s.scope === "full" && (
        <>
          <div className="ax-h2"><div><h2>Sites that link to them, not you</h2><p>Each links to at least 2 of your competitors. I left out spam, platforms and social sites. I never contact anyone for you.</p></div></div>
          {v.actions.length ? (
            <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
              {v.actions.map((a) => (
                <div key={a.domain} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <a className="ax-src" style={{ fontSize: 15.5, fontWeight: 600 }} href={`https://${a.domain}`} target="_blank" rel="noopener noreferrer">{a.domain} ↗</a>
                      <span className="ax-pill n">{a.kindLabel}</span>
                    </div>
                    <div className="ax-p" style={{ marginTop: 3 }}>{a.text}</div>
                  </div>
                  <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ say: a.ask })}>Help me ask</button>
                </div>
              ))}
            </section>
          ) : <p className="ax-note">{s.notes.find((x) => /competitor/i.test(x)) ?? "I didn’t find a site that links to 2 of your competitors and not to you this month."}</p>}
          {s.gap.length > v.actions.length && <p className="ax-note">{s.gap.length - v.actions.length} more on my list. I show the strongest first.</p>}
        </>
      )}

      {s.top.length > 0 && (
        <>
          <div className="ax-h2"><div><h2>Strongest sites linking to you</h2><p>From the link data, strongest first.</p></div></div>
          <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
            {s.top.slice(0, 10).map((t) => (
              <div key={t.domain} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", flexWrap: "wrap" }}>
                <a className="ax-src" style={{ flex: 1, minWidth: 180, fontWeight: 600 }} href={`https://${t.domain}`} target="_blank" rel="noopener noreferrer">{t.domain} ↗</a>
                <span className="ax-kw-score">{n(t.backlinks)} link{t.backlinks === 1 ? "" : "s"} · strength {n(t.rank)}</span>
              </div>
            ))}
          </section>
        </>
      )}
      {s.scope === "own" && <p className="ax-note">On Pro I also compare your links with your top 3 competitors and list the sites that link to them and not to you.</p>}
      {s.notes.filter((x) => !/competitor/i.test(x)).map((x, i) => <p key={i} className="ax-note">{x}</p>)}
    </div>
  )
}
