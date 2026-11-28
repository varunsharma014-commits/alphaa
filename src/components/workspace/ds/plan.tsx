"use client"

import type { ReactNode } from "react"
import { Glyph } from "./glyphs"
import { Pill } from "./pill"

// A plan, pack or option card. Prices are passed in (from PLAN_PRICES etc.), never typed here.
// `selectable` makes the whole card a toggle button (pack pickers); otherwise put a CTA in `cta`.
export function PlanCard({ name, status, price, per, was, text, includes, features, cta, fine, recommended = false, current = false, selectable = false, selected = false, onSelect }: {
  name: ReactNode
  /** e.g. <Pill tone="info">Recommended</Pill> or "Your plan". */
  status?: ReactNode
  /** "$499" */
  price: ReactNode
  /** "/month", "billed yearly" */
  per?: ReactNode
  /** Small line under the price, e.g. "$5,090 billed yearly". */
  was?: ReactNode
  text?: ReactNode
  /** "Everything in Starter, plus:" */
  includes?: ReactNode
  features?: ReactNode[]
  cta?: ReactNode
  fine?: ReactNode
  recommended?: boolean
  current?: boolean
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const cls = `ax-card xd-plan${recommended ? " rec" : ""}${current ? " cur" : ""}`
  const body = (
    <>
      <div className="xd-plan__top">
        <span className="xd-plan__n">{name}</span>
        {status ?? (current ? <Pill tone="ok">Your plan</Pill> : recommended ? <Pill tone="info">Recommended</Pill> : null)}
      </div>
      <div className="xd-plan__price"><b>{price}</b>{per && <span>{per}</span>}</div>
      {was && <div className="xd-plan__was">{was}</div>}
      {text && <p className="xd-plan__d">{text}</p>}
      {(includes || (features && features.length > 0)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {includes && <div className="xd-plan__inc">{includes}</div>}
          {features && <ul>{features.map((f, i) => <li key={i}><Glyph name="check" size={14} stroke={2.4} /><span>{f}</span></li>)}</ul>}
        </div>
      )}
      {(cta || fine) && <div className="xd-plan__cta">{cta}{fine && <div className="xd-plan__fine">{fine}</div>}</div>}
    </>
  )
  if (selectable) return <button type="button" className={cls} aria-pressed={selected} onClick={onSelect}>{body}</button>
  return <section className={cls}>{body}</section>
}

/** Grid of PlanCards that stacks on phones. */
export function PlanGrid({ children }: { children: ReactNode }) {
  return <div className="xd-plans">{children}</div>
}
