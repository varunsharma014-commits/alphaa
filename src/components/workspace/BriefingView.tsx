"use client"

import { useEffect, useMemo, useState } from "react"
import type { BriefingData, GoingItem } from "@/lib/workspace/briefing"
import { askAlphaa, toast } from "@/lib/workspace/events"
import type { Message } from "@/lib/agent/types"
import { FirstAnswer } from "@/components/agent/FirstAnswer"
import { ActButton, Empty, When, useInspector } from "./ui"

type Slide = { eb: string; big: string; small: string; bg: string }

const SKIP_KEY = "alphaa.ws.skipQ"

export function BriefingView({ data, notice }: { data: BriefingData; notice?: Message | null }) {
  const { node, open } = useInspector()
  const [stopped, setStopped] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [skipped, setSkipped] = useState<string | null>(null)
  const [recap, setRecap] = useState<number | null>(null)

  // Back from connecting a website (?connected= …): say how it went, in the chat.
  useEffect(() => { if (notice) askAlphaa({ push: [notice] }) }, [notice])
  useEffect(() => { try { setSkipped(sessionStorage.getItem(SKIP_KEY)) } catch {} }, [])

  const q = data.question && data.question.id !== skipped ? data.question : null
  const h = data.headline

  async function hold(g: GoingItem) {
    const st = !!stopped[g.id]
    setBusy(g.id)
    const res = await fetch("/api/workspace/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: g.kind, id: g.id, op: st ? "undo" : "stop" }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(null)
    if (!res?.ok) return toast(d?.error ?? "That didn’t save. Try again.")
    setStopped((s) => ({ ...s, [g.id]: !st }))
    toast(st ? "Back on the schedule" : "Stopped. It won’t go out.")
  }

  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = []
    if (h.total != null) out.push({ eb: "Last 30 days", big: `${h.total} calls and leads`, small: h.prev != null ? `${h.prev} in the 30 days before.` : h.parts.map((p) => `${p.label}: ${p.value}`).join(" · "), bg: "linear-gradient(135deg,#0071e3,#af52de)" })
    for (const t of data.tiles) if (t.value) out.push({ eb: t.label, big: t.value, small: t.delta ?? "", bg: out.length % 2 ? "linear-gradient(135deg,#0f766e,#0071e3)" : "linear-gradient(135deg,#db2777,#7c3aed)" })
    if (data.done.length) out.push({ eb: "This week", big: `${data.done.length} thing${data.done.length === 1 ? "" : "s"} done`, small: data.done.slice(0, 2).map((d) => d.text).join(". "), bg: "linear-gradient(135deg,#1e3a8a,#0071e3)" })
    out.push({ eb: "Next", big: data.going.length ? `${data.going.length} going out soon` : "Nothing scheduled yet", small: data.going.length ? "Stop any of them before it goes out." : "Ask me to run your marketing for the week.", bg: "linear-gradient(135deg,#1d1d1f,#3a3a3c)" })
    return out
  }, [h, data.tiles, data.done, data.going])
  const slide = recap != null ? slides[recap] : null

  return (
    <>
      <FirstAnswer />
      <section className="ax-card ax-hero">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div className="ax-eb" style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="ax-dot" />{data.firstName ? `${data.firstName}, your briefing` : "Your briefing"} · last 30 days</div>
            {h.total != null ? (
              <>
                <div style={{ display: "flex", gap: 14, alignItems: "baseline", marginTop: 12, flexWrap: "wrap" }}>
                  <span className="ax-big">{h.total.toLocaleString("en-US")}</span>
                  {h.prev != null && <span className={`ax-pill ${h.total >= h.prev ? "g" : "n"}`}>{h.total >= h.prev ? "+" : "−"}{Math.abs(h.total - h.prev)} vs the 30 days before</span>}
                </div>
                <p className="ax-sub" style={{ marginTop: 6 }}>{h.parts.map((p) => `${p.value.toLocaleString("en-US")} ${p.label.charAt(0).toLowerCase()}${p.label.slice(1)}`).join(" · ")}.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.03em", marginTop: 12 }}>Calls and leads show up here</div>
                <p className="ax-sub" style={{ marginTop: 6 }}>{h.missing[0] ?? "Once a source is connected, I count every call and lead."}</p>
              </>
            )}
          </div>
          <button className="ax-btn grad" type="button" onClick={() => setRecap(0)}>▶ Play the recap</button>
        </div>
        {h.total != null && h.missing.length > 0 && <p className="ax-note" style={{ marginTop: 8 }}>{h.missing.join(" ")}</p>}
        <div className="ax-g3" style={{ marginTop: 22 }}>
          {data.tiles.map((t) => (
            <div className="ax-tile" key={t.key}>
              <div className="k">{t.label}</div>
              {t.value ? (
                <div className="v"><b>{t.value}</b>{t.delta && <span className={t.delta.startsWith("-") ? "ax-down" : "ax-up"}>{t.delta}</span>}</div>
              ) : (
                <div className="e">{t.href ? <a className="ax-src" href={t.href}>{t.empty}</a> : t.empty}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {q ? (
        <>
          <div className="ax-h2"><div><h2>One question for you</h2><p>Only money, a new fact or a first-time connection comes here, one at a time.</p></div></div>
          <section className="ax-card ax-q">
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ax-eb">{q.eyebrow}</span>
              <p className="t">{q.title}</p>
              <p className="s">{q.text} <b style={{ color: "var(--x-ink)", fontWeight: 600 }}>{q.fallback}</b></p>
            </div>
            <div className="acts">
              <button className="ax-btn s" type="button" onClick={() => { setSkipped(q.id); try { sessionStorage.setItem(SKIP_KEY, q.id) } catch {}; toast("Okay. I’ll keep going without it.") }}>Not now</button>
              {q.acts.slice().reverse().map((a, i) => <ActButton key={i} act={a} />)}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="ax-h2"><div><h2>Nothing needs you</h2></div></div>
          <section className="ax-card" style={{ padding: "18px 22px", display: "flex", gap: 10, alignItems: "center" }}><span className="ax-dot" />I’m on it. If something needs your say, it shows up here.</section>
        </>
      )}

      <div className="ax-h2">
        <div><h2>Going out soon</h2><p>{data.autopilot ? "These go out on their own. Stop anything before it goes out." : "Scheduled to go out. Stop anything before it goes out."}</p></div>
        <span className="ax-pill b">{data.going.filter((g) => !stopped[g.id]).length} scheduled</span>
      </div>
      {data.going.length ? (
        <div className="ax-g3 ax-going">
          {data.going.map((g) => {
            const st = !!stopped[g.id]
            return (
              <article key={g.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                <div className={`ax-art${g.image ? " img" : ""}`} style={{ background: g.image ? `url("${g.image}") center/cover` : g.art }}>
                  <span className="ax-pill w" style={{ alignSelf: "flex-start" }}>{g.lane}</span>
                  {!g.image && <div><b>{g.big}</b>{g.small && <small>{g.small}</small>}</div>}
                </div>
                <div className="ax-cb">
                  <p className={`ax-ttl${st ? " st" : ""}`}>{g.title}</p>
                  <p className="ax-p ax-clamp">{g.text}</p>
                  <div className="ax-ft">
                    <span style={{ fontSize: 12.5, color: "var(--x-mut)" }}>{st ? "Stopped · won’t go out" : <When at={g.at} mode="ahead" prefix="Goes out " fallback={`Goes out ${g.when}`} />}</span>
                    <span style={{ display: "flex", gap: 4 }}>
                      <button className="ax-btn s sm" type="button" onClick={() => open({ eb: g.lane, title: g.title, rows: [{ k: "Goes out", v: st ? "Stopped. It won’t go out." : g.when }, ...(g.image ? [{ k: "Image", v: "", image: g.image }] : []), { k: "Text", v: g.text, box: true }], cta: { label: "Open it in chat", topic: g.kind === "social" ? "social" : "content" } })}>Preview</button>
                      <button className={`ax-btn d sm${st ? " undo" : ""}`} type="button" disabled={busy === g.id} onClick={() => void hold(g)}>{st ? "Undo" : "Stop"}</button>
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <Empty
          title="Nothing scheduled right now"
          text={data.waiting ? `${data.waiting} finished piece${data.waiting === 1 ? " is" : "s are"} waiting for your OK${data.autopilot ? "" : " because autopilot is off"}.` : "Ask me to run your marketing for the week and I’ll plan, write and schedule it."}
        />
      )}
      {!data.going.length && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</button>
          {data.waiting > 0 && <button className="ax-btn s sm" type="button" onClick={() => askAlphaa({ topic: data.waitingTopic, label: "What’s waiting?" })}>See what’s waiting</button>}
        </div>
      )}

      <div className="ax-h2"><div><h2>Done on my own</h2><p>Last 7 days</p></div></div>
      {data.done.length ? (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
          {data.done.map((d, i) => (
            <div key={i} className="ax-done">
              <span className="ax-dot still" />
              <span className="ax-pill n ch">{d.ch}</span>
              <span className="tx">{d.text}</span>
              <span className="wh"><When at={d.at || null} mode="ago" fallback={d.when} /></span>
              {d.href ? <a className="ax-lnk" href={d.href} target="_blank" rel="noopener noreferrer">See it ↗</a> : <button className="ax-lnk" type="button" onClick={() => askAlphaa({ topic: "work", label: "What have you done?" })}>Details</button>}
            </div>
          ))}
        </section>
      ) : (
        <Empty title="Nothing logged this week yet" text="Every post, reply, fix and check I do shows up here with a link to see it." />
      )}

      {slide && (
        <>
          <div className="ax-bk" onClick={() => setRecap(null)} aria-hidden="true" />
          <div className="ax-recap" role="dialog" aria-modal="true" aria-label="Recap" style={{ background: slide.bg }}>
            <div style={{ display: "flex", gap: 6 }} aria-hidden="true">{slides.map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= (recap ?? 0) ? "#fff" : "rgba(255,255,255,.35)" }} />)}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.8 }}>{slide.eb}</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.05, marginTop: 8 }}>{slide.big}</div>
              {slide.small && <div style={{ fontSize: 17, opacity: 0.9, marginTop: 10 }}>{slide.small}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="ax-btn" type="button" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }} onClick={() => setRecap(null)}>Close</button>
              <button className="ax-btn" type="button" style={{ background: "#fff", color: "#1d1d1f" }} onClick={() => setRecap((r) => (r == null || r >= slides.length - 1 ? null : r + 1))}>{(recap ?? 0) >= slides.length - 1 ? "Done" : "Next"}</button>
            </div>
          </div>
        </>
      )}
      {node}
    </>
  )
}
