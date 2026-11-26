"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { openAutoApprove } from "@/components/agent/AutoApproveModal"
import { askAlphaa, toast } from "@/lib/workspace/events"
import type { Act } from "@/lib/workspace/briefing"
import { ago, whenAhead } from "@/lib/workspace/common"

// Small shared pieces for the workspace pages: buttons that do one real thing, tabs, the
// slide-over inspector and empty states.

export function ActButton({ act, className = "", small = false }: { act: Act; className?: string; small?: boolean }) {
  const cls = `ax-btn ${act.primary ? "p" : "s"}${small ? " sm" : ""} ${className}`.trim()
  if (act.href) {
    if (/^https?:/.test(act.href) || act.href.startsWith("/api/")) return <a className={cls} href={act.href}>{act.label}</a>
    return <Link className={cls} href={act.href}>{act.label}</Link>
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={() => {
        if (act.autopilot) return openAutoApprove()
        askAlphaa({ topic: act.topic, chip: act.chip, label: act.topic ? act.label : undefined })
      }}
    >
      {act.label}
    </button>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <div className="ax-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={value === t.key} className={value === t.key ? "on" : ""} onClick={() => onChange(t.key)}>{t.label}</button>
      ))}
    </div>
  )
}

export type InspRow = { k: string; v: string; box?: boolean; pct?: number; image?: string | null; href?: string }
export type Insp = { eb: string; title: string; rows: InspRow[]; cta?: Act | null }

export function useInspector() {
  const [insp, setInsp] = useState<Insp | null>(null)
  useEffect(() => {
    if (!insp) return
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setInsp(null) }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [insp])
  const node = insp ? (
    <>
      <div className="ax-bk" onClick={() => setInsp(null)} aria-hidden="true" />
      <aside className="ax-insp" role="dialog" aria-modal="true" aria-label={insp.title}>
        <header>
          <div style={{ minWidth: 0 }}><div className="ax-eb">{insp.eb}</div><h3>{insp.title}</h3></div>
          <button className="ax-x" type="button" aria-label="Close" onClick={() => setInsp(null)}>✕</button>
        </header>
        <div className="bd">
          {insp.rows.map((r, i) => (
            <div key={i} className={r.box ? "box" : ""}>
              <div className="ax-eb" style={{ marginBottom: 6 }}>{r.k}</div>
              {r.image && <img src={r.image} alt="" loading="lazy" />}
              {r.href ? <a className="ax-src v" href={r.href} target="_blank" rel="noopener noreferrer">{r.v} ↗</a> : r.v && <div className="v">{r.v}</div>}
              {r.pct != null && <div className="ax-bar" style={{ marginTop: 8 }}><i style={{ width: `${Math.max(0, Math.min(100, r.pct))}%` }} /></div>}
            </div>
          ))}
        </div>
        <footer>
          <button className="ax-btn s" type="button" onClick={() => setInsp(null)}>Close</button>
          {insp.cta && <span onClick={() => setInsp(null)}><ActButton act={{ ...insp.cta, primary: true }} /></span>}
        </footer>
      </aside>
    </>
  ) : null
  return { node, open: setInsp }
}

export function Empty({ title, text, act, acts }: { title: string; text?: string; act?: Act | null; acts?: Act[] }) {
  const list = acts ?? (act ? [act] : [])
  return (
    <section className="ax-card ax-empty">
      <div style={{ minWidth: 0, flex: 1 }}><b>{title}</b>{text && <p>{text}</p>}</div>
      {list.length > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{list.map((a, i) => <ActButton key={i} act={{ ...a, primary: a.primary ?? i === 0 }} />)}</div>}
    </section>
  )
}

export function CopyButton({ text }: { text: string }) {
  return (
    <button className="ax-btn s sm" type="button" onClick={() => { navigator.clipboard?.writeText(text).then(() => toast("Copied"), () => toast("Couldn’t copy")) }}>Copy</button>
  )
}

/** Plan gate: the workspace still shows what it does, with one honest way in. */
export function PlanGate({ plan, title, text }: { plan: "Pro" | "Growth"; title: string; text: string }) {
  return <Empty title={title} text={text} act={{ label: `See the ${plan} plan`, href: `/dashboard/upgrade?plan=${plan.toLowerCase()}`, primary: true }} />
}

/** A time in the owner's own time zone (the server renders in UTC, so this swaps in after load). */
export function When({ at, mode, prefix = "", fallback }: { at: string | null | undefined; mode: "ahead" | "ago"; prefix?: string; fallback: string }) {
  const [text, setText] = useState(fallback)
  useEffect(() => { if (at) setText(`${prefix}${mode === "ahead" ? whenAhead(at) : ago(at)}`) }, [at, mode, prefix])
  return <>{text}</>
}
