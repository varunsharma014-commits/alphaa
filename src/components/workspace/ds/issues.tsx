"use client"

import { useState, type ReactNode } from "react"
import { Glyph } from "./glyphs"
import { StatusDot } from "./pill"

export type IssueGroup = {
  key: string
  title: ReactNode
  /** One line on why it matters. */
  why?: ReactNode
  severity?: "bad" | "warn" | "idle"
  /** Affected pages; the count comes from this list. */
  urls: string[]
  /** What I do / what to do, in one line. */
  fix?: ReactNode
  /** One action for the whole group. */
  action?: ReactNode
}

// Repeated problems grouped once with a count; open a group to see every page and the one action.
export function IssueList({ groups, max = 8, empty }: { groups: IssueGroup[]; max?: number; empty?: ReactNode }) {
  const [open, setOpen] = useState<string | null>(null)
  if (!groups.length) return <>{empty ?? null}</>
  return (
    <div className="xd-iss">
      {groups.map((g) => {
        const on = open === g.key
        return (
          <div key={g.key} className={`xd-iss__g${on ? " open" : ""}`}>
            <button type="button" className="xd-iss__h" aria-expanded={on} onClick={() => setOpen(on ? null : g.key)}>
              <span className="xd-iss__chev" aria-hidden="true"><Glyph name="chevron" size={14} /></span>
              <StatusDot tone={g.severity ?? "warn"} />
              <span className="xd-iss__t">{g.title}{g.why && <small>{g.why}</small>}</span>
              <span className="xd-iss__c">{g.urls.length} {g.urls.length === 1 ? "page" : "pages"}</span>
            </button>
            {on && (
              <div className="xd-iss__b">
                <ul className="xd-iss__urls">
                  {g.urls.slice(0, max).map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{u.replace(/^https?:\/\/(www\.)?/, "")}</a></li>)}
                  {g.urls.length > max && <li className="ax-t11">and {g.urls.length - max} more</li>}
                </ul>
                {g.fix && <div className="xd-iss__fix">{g.fix}</div>}
                {g.action && <div>{g.action}</div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
