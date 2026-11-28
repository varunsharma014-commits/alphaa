import type { ReactNode } from "react"

// Top of every page: one title, one short line, then optional meta ("Checked 2h ago"), a pill
// (plan or "Admin only"), actions on the right and tabs underneath.
export function PageHeader({ title, sub, meta, pill, actions, tabs }: {
  title: ReactNode
  sub?: ReactNode
  meta?: ReactNode
  pill?: ReactNode
  actions?: ReactNode
  tabs?: ReactNode
}) {
  return (
    <header className="xd-phw">
      <div className="xd-ph">
        <div className="xd-ph__txt">
          <div className="xd-ph__top"><h1>{title}</h1>{pill}</div>
          {sub && <p className="xd-ph__sub">{sub}</p>}
          {meta && <div className="xd-ph__meta">{meta}</div>}
        </div>
        {actions && <div className="xd-ph__acts">{actions}</div>}
      </div>
      {tabs && <div className="xd-ph__tabs">{tabs}</div>}
    </header>
  )
}

// A section inside a page: h2, one line under it, and a link, pill or button on the right.
export function SectionHeader({ title, sub, end, first = false, id }: { title: ReactNode; sub?: ReactNode; end?: ReactNode; first?: boolean; id?: string }) {
  return (
    <div className={`xd-sh${first ? " first" : ""}`} id={id}>
      <div style={{ minWidth: 0 }}><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
      {end && <div className="xd-sh__end">{end}</div>}
    </div>
  )
}
