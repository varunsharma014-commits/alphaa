"use client"

import type { ReactNode } from "react"
import { Glyph } from "./glyphs"

// An honest empty state: what this is, one line on what happens next, 2-3 "what you'll see"
// bullets, and the actions inside the card. `hero` = centred, for a whole empty page.
export function EmptyState({ icon, title, text, bullets, actions, chips, hero = false, plain = false }: {
  icon?: ReactNode
  title: ReactNode
  text?: ReactNode
  /** What the owner will see here once there's data (2-3 short lines). */
  bullets?: ReactNode[]
  /** Buttons (first one primary). */
  actions?: ReactNode
  /** Preset chips, e.g. starter rules. */
  chips?: ReactNode
  hero?: boolean
  /** No card around it (when it sits inside another card). */
  plain?: boolean
}) {
  return (
    <section className={`${plain ? "" : "ax-card "}xd-empty${hero ? " hero" : ""}`}>
      <span className="xd-empty__ic" aria-hidden="true">{icon ?? <Glyph name="inbox" size={hero ? 26 : 22} />}</span>
      <div className="xd-empty__b">
        <h3>{title}</h3>
        {text && <p className="xd-empty__p">{text}</p>}
        {bullets && bullets.length > 0 && <ul>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
        {actions && <div className="xd-empty__acts">{actions}</div>}
        {chips && <div className="xd-empty__chips">{chips}</div>}
      </div>
    </section>
  )
}
