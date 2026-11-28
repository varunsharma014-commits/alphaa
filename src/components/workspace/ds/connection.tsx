"use client"

import type { ReactNode } from "react"
import { StatusDot } from "./pill"
import { Glyph } from "./glyphs"

export type ConnState = "ok" | "warn" | "bad" | "off"

// One connection (Google, website, Instagram…). The dot carries the state, so there's no
// duplicate status pill. One action. `subs` = small tiles per property (e.g. Search Console site).
// `preview` = a short value preview (ConnectCard use: what a connected page will show).
export function ConnectionCard({ logo, name, state, status, synced, action, onOpen, subs, preview, children }: {
  logo: ReactNode
  name: ReactNode
  state: ConnState
  /** One plain sentence: "Connected as Sample Dental", "Login expired". */
  status: ReactNode
  /** "Last synced 2h ago". Only from stored data. */
  synced?: ReactNode
  action?: ReactNode
  /** Opens the inspector (adds a chevron button). */
  onOpen?: () => void
  subs?: { label: string; value: ReactNode }[]
  preview?: ReactNode
  children?: ReactNode
}) {
  const tone = state === "off" ? "idle" : state
  return (
    <section className="ax-card xd-conn">
      <div className="xd-conn__top">
        <span className="xd-conn__logo">{logo}</span>
        <div className="xd-conn__b">
          <div className="xd-conn__n"><StatusDot tone={tone} label={state === "ok" ? "Connected" : state === "warn" ? "Needs attention" : state === "bad" ? "Not working" : "Not connected"} />{name}</div>
          <div className={`xd-conn__s${state === "warn" ? " warn" : state === "bad" ? " bad" : ""}`}>{status}</div>
          {synced && <div className="ax-t11" style={{ marginTop: 2, color: "var(--x-ter)" }}>{synced}</div>}
        </div>
        {(action || onOpen) && (
          <div className="xd-conn__end">
            {action}
            {onOpen && <button type="button" className="xd-dots" aria-label="Details" onClick={onOpen}><Glyph name="chevron" size={14} /></button>}
          </div>
        )}
      </div>
      {subs && subs.length > 0 && <div className="xd-conn__subs">{subs.map((s) => <div key={s.label} className="xd-conn__sub">{s.label}<b>{s.value}</b></div>)}</div>}
      {preview && <div className="xd-conn__val">{preview}</div>}
      {children}
    </section>
  )
}

/** The same thing as a compact row, for lists of connections inside one card. */
export function ConnectionRow({ logo, name, state, status, action }: { logo: ReactNode; name: ReactNode; state: ConnState; status: ReactNode; action?: ReactNode }) {
  return (
    <div className="xd-connrow">
      <span className="xd-conn__logo">{logo}</span>
      <div className="xd-conn__b">
        <div className="xd-conn__n"><StatusDot tone={state === "off" ? "idle" : state} />{name}</div>
        <div className={`xd-conn__s${state === "warn" ? " warn" : state === "bad" ? " bad" : ""}`}>{status}</div>
      </div>
      {action && <div className="xd-conn__end">{action}</div>}
    </div>
  )
}

/** ConnectionCard for a page whose data needs a connection first ("Connect your Google listing"). */
export const ConnectCard = ConnectionCard
