"use client"
// Homepage plan cards with the Monthly / Annual switch (plans set 2026-11-26). Order left → right:
// Growth (price anchor, early access) → Pro (recommended) → Starter. Same data as /pricing.
import { useState, type ReactNode } from "react"
import Link from "next/link"
import { plans, planHref, ANNUAL_LABEL } from "@/app/(marketing)/pricing/pricing-data"

/** `growthMark`: footnote marker for the early-access note (the note is in the page's Notes block). */
export function HomePlans({ growthMark }: { growthMark?: ReactNode }) {
  const [annual, setAnnual] = useState(false)
  return (
    <>
      <div className="v3-chips" role="tablist" aria-label="Billing period">
        <button type="button" role="tab" className="v3-chip" aria-selected={!annual} onClick={() => setAnnual(false)}>Monthly</button>
        <button type="button" role="tab" className="v3-chip" aria-selected={annual} onClick={() => setAnnual(true)}>{ANNUAL_LABEL}</button>
      </div>
      <div className="hv-plans">
        {plans.map((p) => {
          const href = planHref(p, annual)
          const cls = `hv-pill ${p.highlight ? "hv-pill--blue" : "hv-pill--ghost"}`
          return (
            <div key={p.key} className={`hv-plan${p.highlight ? " hv-plan--hi" : ""}`}>
              <div className="hv-plan__badge">{p.badge ?? ""}{p.href && growthMark}</div>
              <h3>{p.name}</h3>
              <p className="hv-plan__for">{p.tagline}</p>
              <div className="hv-plan__price">${annual ? p.annual : p.monthly}<small>/month</small></div>
              <p className="hv-plan__bill">
                {annual ? `Billed yearly: $${p.annualTotal.toLocaleString("en-US")}/yr` : "Month to month"}
                {p.extra && <><br /><b>{annual ? p.extra.annual : p.extra.monthly}</b></>}
              </p>
              <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {href.startsWith("mailto:") ? <a className={cls} href={href}>{p.cta}</a> : <Link className={cls} href={href}>{p.cta}</Link>}
              {p.href && !growthMark && <p className="hv-plan__fine">Early access: nobody is charged until ads open.</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}
