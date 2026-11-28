"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Glyph } from "./glyphs"

// A list of rows. `card` wraps it in a soft card. Rows get hairline dividers automatically.
export function List({ children, card = false, label }: { children: ReactNode; card?: boolean; label?: string }) {
  return <div className={`xd-list${card ? " card" : ""}`} role="list" aria-label={label}>{children}</div>
}

// One row: lead (icon / ChannelBadge / thumb url), title, meta line, trailing actions.
// Whole-row click: pass `href` (a link) or `onClick`. Buttons in `end` still work on their own.
export function ListRow({ lead, thumb, title, meta, end, chevron, href, onClick, wrapEnd = false, label }: {
  lead?: ReactNode
  /** Image url shown as a 44px rounded thumbnail. */
  thumb?: string | null
  title: ReactNode
  meta?: ReactNode
  end?: ReactNode
  /** Show a chevron; defaults to on when the row is clickable. */
  chevron?: boolean
  href?: string
  onClick?: () => void
  /** On phones, put `end` on its own line under the text. */
  wrapEnd?: boolean
  /** Accessible name for the whole-row link/button (defaults to the title when it's text). */
  label?: string
}) {
  const click = !!(href || onClick)
  const name = label ?? (typeof title === "string" ? title : undefined)
  const showChev = chevron ?? click
  return (
    <div className={`xd-row${click ? " click" : ""}`} role="listitem">
      {href ? (
        /^https?:/.test(href) ? <a className="xd-row__a" href={href} target="_blank" rel="noopener noreferrer" aria-label={name} /> : <Link className="xd-row__a" href={href} aria-label={name} />
      ) : onClick ? (
        <button type="button" className="xd-row__a" onClick={onClick} aria-label={name} style={{ border: 0, background: "none", padding: 0 }} />
      ) : null}
      {thumb ? <span className="xd-row__lead"><img className="xd-row__thumb" src={thumb} alt="" loading="lazy" /></span> : lead ? <span className="xd-row__lead">{lead}</span> : null}
      <div className="xd-row__body">
        <div className="xd-row__t">{title}</div>
        {meta && <div className="xd-row__m">{meta}</div>}
      </div>
      {end && <div className={`xd-row__end${wrapEnd ? " wrap" : ""}`}>{end}</div>}
      {showChev && <span className="xd-row__chev" aria-hidden="true"><Glyph name="chevron" size={14} /></span>}
    </div>
  )
}

/** A soft square icon holder for ListRow `lead`. */
export function RowIcon({ children }: { children: ReactNode }) {
  return <span className="xd-row__ic">{children}</span>
}

// Activity history: date groups, an icon per entry, what changed, why, when, and Undo.
export type Activity = { id: string; icon?: ReactNode; title: ReactNode; why?: ReactNode; when?: ReactNode; end?: ReactNode }

export function Timeline({ groups }: { groups: { day: string; items: Activity[] }[] }) {
  return (
    <div className="xd-tl">
      {groups.map((g) => (
        <div key={g.day}>
          <div className="xd-tl__day">{g.day}</div>
          {g.items.map((a) => <ActivityRow key={a.id} {...a} />)}
        </div>
      ))}
    </div>
  )
}

export function ActivityRow({ icon, title, why, when, end }: Omit<Activity, "id">) {
  return (
    <div className="xd-act">
      <span className="xd-act__ic">{icon ?? <Glyph name="spark" size={14} />}</span>
      <div style={{ minWidth: 0 }}>
        <div className="xd-act__t">{title}</div>
        {why && <div className="xd-act__why">{why}</div>}
        {when && <div className="xd-act__when">{when}</div>}
      </div>
      {end ? <div className="xd-act__end">{end}</div> : <span />}
    </div>
  )
}
