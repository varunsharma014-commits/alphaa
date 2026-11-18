// Small example visuals for pricing / how-it-works (replace the old apple phone mockups).
// Every box is labelled "Example". Server-safe, no JS.
import type { ReactNode } from "react"
import type { SvcKey } from "../services-v3"
import "./pages.css"

export function ExBox({ tone, children, label = "Example" }: { tone?: SvcKey; children: ReactNode; label?: string | null }) {
  return (
    <div className={`pg-ex${tone ? ` v3-c-${tone}` : ""}`} aria-hidden="true">
      {label && <div className="pg-ex__note"><span className="v3-example">{label}</span></div>}
      <div style={{ height: 18 }} />
      {children}
    </div>
  )
}

export function Note({ title, body, actions, head = "Alphaa · now" }: { title: ReactNode; body?: ReactNode; actions?: string[]; head?: string | null }) {
  return (
    <div className="pg-note">
      {head && <div className="pg-note__head"><i>✦</i>{head}</div>}
      <b>{title}</b>
      {body && <span>{body}</span>}
      {actions && <div className="pg-note__acts">{actions.map((a) => <span key={a}>{a}</span>)}</div>}
    </div>
  )
}

export function Engines({ items }: { items: { name: string; ok: boolean }[] }) {
  return (
    <div className="pg-engines">
      {items.map((e) => <span key={e.name} className={e.ok ? "ok" : ""}>{e.name}<em>{e.ok ? "Named you" : "Not yet"}</em></span>)}
    </div>
  )
}

export function Checks({ rows }: { rows: string[] }) {
  return <div className="pg-note" style={{ display: "flex", flexDirection: "column", gap: 8 }}>{rows.map((r) => <div key={r} className="pg-check"><span>✓</span>{r}</div>)}</div>
}
