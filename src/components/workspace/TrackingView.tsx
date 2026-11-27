"use client"

import type { Conn, TrackingData } from "@/lib/workspace/tracking"
import { askAlphaa } from "@/lib/workspace/events"
import { ActButton, When, useInspector } from "./ui"

const TONE = { g: "#30d158", b: "#64d2ff", p: "#bf5af2", a: "#ff9f0a" } as const

export function TrackingView({ data }: { data: TrackingData }) {
  const { node, open } = useInspector()
  const needs = data.conns.filter((c) => c.state === "needs")
  const ok = data.conns.filter((c) => c.state === "ok")
  const optional = data.conns.filter((c) => c.state === "optional")
  const counted = needs.length + ok.length

  const row = (c: Conn) => (
    <div key={c.key} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
      <span style={{ width: 9, height: 9, borderRadius: 999, background: c.state === "ok" ? "#34c759" : c.state === "optional" ? "#c7c7cc" : "#ff9500", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 200 }}><b style={{ fontSize: 15 }}>{c.name}</b><div style={{ fontSize: 13, color: "var(--x-mut)", marginTop: 2 }}>{c.sum}</div></div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
        {c.state === "ok" ? <span className="ax-pill g">Working</span> : c.warn ? <span className="ax-pill a">{c.warn}</span> : c.state === "needs" ? <span className="ax-pill a">Not connected</span> : <span className="ax-pill n">Not used</span>}
        {c.state === "ok" && c.verified && <span className="ax-t11"><When at={c.verified.at} mode="ago" prefix={`${c.verified.verb} `} fallback={c.verified.verb} /></span>}
      </div>
      {c.act && <ActButton small act={{ ...c.act, primary: c.state === "needs" }} />}
      <button className="ax-lnk" type="button" onClick={() => open({ eb: "Tracking & setup", title: c.name, rows: [{ k: "Status", v: c.state === "ok" ? "Working." : c.state === "optional" ? "Optional. Only needed if you use it." : c.warn ?? "Not working yet." }, { k: "What it does", v: c.detail, box: true }, { k: "Right now", v: c.sum }, ...(c.key === "leads" && data.health.length ? [{ k: "Each check", v: data.health.map((h) => `${h.ok ? "✓" : "•"} ${h.name}: ${h.status}${h.detail ? ` (${h.detail})` : ""}`).join("\n") }] : [])], cta: c.act ? { ...c.act, primary: true } : null })}>Details</button>
    </div>
  )

  return (
    <>
      <div className="ax-hdr">
        <div><h1 className="ax-h1">Tracking & Setup</h1><p className="ax-sub">Every connection I rely on, checked from the real thing. I check lead tracking every morning and fix what I safely can.</p></div>
        <span className={`ax-pill ${needs.length ? "a" : "g"}`} style={{ marginTop: 12 }}>{ok.length} of {counted} working</span>
      </div>

      <section className="ax-console">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="ax-dot" />Signals that arrived</span>
          <span style={{ color: "#8e8e93", letterSpacing: 0, textTransform: "none", fontWeight: 500 }}>Newest first</span>
        </div>
        {data.turnOn && (
          <div className="ax-console-act">
            <div style={{ flex: 1, minWidth: 220 }}>
              <b style={{ fontSize: 14 }}>Lead tracking is off</b>
              <div style={{ fontSize: 12.5, color: "#a1a1a6", marginTop: 2 }}>{data.turnOn.auto ? "One click and I add it through your WordPress plugin. Phone taps, emails and form sends start showing here." : `${data.turnOn.platform} doesn’t let apps add site code with the access I have, so it takes one line pasted once. I’ll show you exactly where.`}</div>
            </div>
            <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ topic: "tracking", label: `Turn on lead tracking on ${data.turnOn!.platform}` })}>Turn on lead tracking on {data.turnOn.platform}</button>
          </div>
        )}
        <div className="rows">
          {data.signals.length ? data.signals.map((s, i) => (
            <div key={i} className="r">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: TONE[s.tone], flex: "none" }} />
              <span className="t" style={{ width: 70, flex: "none" }}>{s.src === "Website" ? s.t : <When at={s.at} mode="ago" fallback={s.t} />}</span>
              <span className="s" style={{ color: TONE[s.tone] }}>{s.src}</span>
              <span className="e">{s.ev}</span>
            </div>
          )) : (
            <div className="r"><span className="e">Nothing has arrived yet. {data.trackingOn ? "Leads from your website show up here as they happen." : data.growth ? "Once lead tracking is on, phone taps, emails and form sends show up here." : "Visits from AI assistants show up here once your website is connected."}</span></div>
          )}
        </div>
      </section>

      {needs.length > 0 && (
        <>
          <div className="ax-h2"><div><h2>Needs you ({needs.length})</h2><p>Each one has one thing to do.</p></div></div>
          <section className="ax-card ax-list" style={{ padding: "2px 22px", borderColor: "rgba(255,149,0,.35)" }}>{needs.map(row)}</section>
        </>
      )}
      <div className="ax-h2"><div><h2>Watching on my own ({ok.length})</h2><p>Working. I check these myself and fix what breaks.</p></div></div>
      {ok.length ? <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>{ok.map(row)}</section> : <p className="ax-note">Nothing connected yet. Start with the first item above.</p>}
      {optional.length > 0 && (
        <>
          <p className="ax-eb" style={{ margin: "22px 0 8px" }}>Optional</p>
          <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>{optional.map(row)}</section>
        </>
      )}

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
      {node}
    </>
  )
}
