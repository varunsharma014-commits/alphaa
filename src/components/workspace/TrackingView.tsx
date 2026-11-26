"use client"

import type { TrackingData } from "@/lib/workspace/tracking"
import { askAlphaa } from "@/lib/workspace/events"
import { ActButton, useInspector } from "./ui"

const TONE = { g: "#30d158", b: "#64d2ff", p: "#bf5af2", a: "#ff9f0a" } as const

export function TrackingView({ data }: { data: TrackingData }) {
  const { node, open } = useInspector()
  const counted = data.conns.filter((c) => !c.soft)
  const ok = counted.filter((c) => c.ok).length

  return (
    <>
      <div className="ax-hdr">
        <div><h1 className="ax-h1">Tracking & Setup</h1><p className="ax-sub">Every connection I rely on, checked from the real thing. I check lead tracking every morning and fix what I safely can.</p></div>
        <span className={`ax-pill ${ok === counted.length ? "g" : "a"}`} style={{ marginTop: 12 }}>{ok} of {counted.length} working</span>
      </div>

      <section className="ax-console">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="ax-dot" />Signals that arrived</span>
          <span style={{ color: "#8e8e93", letterSpacing: 0, textTransform: "none", fontWeight: 500 }}>Last 7 to 14 days</span>
        </div>
        <div className="rows">
          {data.signals.length ? data.signals.map((s, i) => (
            <div key={i} className="r">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: TONE[s.tone], flex: "none" }} />
              <span className="s" style={{ color: TONE[s.tone] }}>{s.src}</span>
              <span className="e">{s.ev}</span>
              <span className="t">{s.t}</span>
            </div>
          )) : (
            <div className="r"><span className="e">Nothing has arrived yet. {data.trackingOn ? "Leads from your website show up here as they happen." : data.growth ? "Turn on lead tracking and phone taps, emails and form sends show up here." : "Visits from AI assistants show up here once your website is connected."}</span></div>
          )}
        </div>
      </section>

      {data.setup && data.setup.done < data.setup.total && (
        <section className="ax-card" style={{ padding: "18px 22px", marginTop: 22, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <b style={{ fontSize: 15 }}>Setup · {data.setup.done} of {data.setup.total} done</b>
            <div className="ax-bar" style={{ marginTop: 8 }}><i style={{ width: `${Math.round((data.setup.done / data.setup.total) * 100)}%` }} /></div>
            {data.setup.next && <div className="ax-t11" style={{ fontSize: 12.5, marginTop: 6 }}>Next: {data.setup.next}</div>}
          </div>
          <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ topic: "setup", label: "Finish setting up" })}>Continue setup</button>
        </section>
      )}

      <section className="ax-card ax-list" style={{ padding: "2px 22px", marginTop: 22 }}>
        {data.conns.map((c) => (
          <div key={c.key} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: c.ok ? "#34c759" : c.soft ? "#86868b" : "#ff9500", flex: "none" }} />
            <div style={{ flex: 1, minWidth: 200 }}><b style={{ fontSize: 15 }}>{c.name}</b><div style={{ fontSize: 13, color: "var(--x-mut)", marginTop: 2 }}>{c.sum}</div></div>
            {c.ok ? <span className="ax-pill g">Working</span> : !c.act && <span className="ax-pill n">Not connected</span>}
            {c.act && <ActButton small act={{ ...c.act, primary: !c.ok }} />}
            <button className="ax-lnk" type="button" onClick={() => open({ eb: "Tracking & setup", title: c.name, rows: [{ k: "Status", v: c.ok ? "Working." : c.soft ? "Optional, not connected." : "Not working yet." }, { k: "What it does", v: c.detail, box: true }, { k: "Right now", v: c.sum }, ...(c.key === "leads" && data.health.length ? [{ k: "Each check", v: data.health.map((h) => `${h.ok ? "✓" : "•"} ${h.name}: ${h.status}${h.detail ? ` (${h.detail})` : ""}`).join("\n") }] : [])], cta: c.act ? { ...c.act, primary: true } : null })}>Details</button>
          </div>
        ))}
      </section>

      {data.health.length > 0 && (
        <>
          <div className="ax-h2"><div><h2>Lead tracking checks</h2><p>From my last look at your live site.</p></div><button className="ax-btn s sm" type="button" onClick={() => askAlphaa({ topic: "tracking", label: "Check my tracking now" })}>Check now</button></div>
          <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
            {data.health.map((h) => (
              <div key={h.key} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", flexWrap: "wrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: h.ok ? "#34c759" : h.soft ? "#86868b" : "#ff9500", flex: "none" }} />
                <div style={{ flex: 1, minWidth: 200 }}><b style={{ fontSize: 14.5 }}>{h.name}</b>{h.detail && <div style={{ fontSize: 12.5, color: "var(--x-mut)", marginTop: 2 }}>{h.detail}</div>}</div>
                <span className={`ax-pill ${h.ok ? "g" : h.soft ? "n" : "a"}`}>{h.status}</span>
              </div>
            ))}
          </section>
        </>
      )}
      <p className="ax-note">Connecting something for the first time is one of the few things I ask before doing. After that I keep it working on my own.</p>
      {node}
    </>
  )
}
