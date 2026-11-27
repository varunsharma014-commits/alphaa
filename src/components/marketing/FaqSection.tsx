"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { faqs, FAQ_GROUPS } from "./faq-data"

// Apple-style FAQ: category pills filter a grouped list of hairline-divided questions.
// Each question's topic is its `group` in faq-data.ts (indexes point into faqs).
const GROUPS: { name: string; items: number[] }[] = FAQ_GROUPS.map((name) => ({
  name,
  items: faqs.flatMap((f, i) => (f.group === name ? [i] : [])),
}))

export function FaqSection() {
  const [filter, setFilter] = useState<string>("All")
  const [open, setOpen] = useState<number | null>(null)
  const shown = filter === "All" ? GROUPS : GROUPS.filter((g) => g.name === filter)

  return (
    <section className="v3-sec v3-center" id="faq">
      <h2 className="v3-h2">Before you hire me.</h2>
      <div className="v3-chips" role="tablist" aria-label="Question topics">
        {["All", ...GROUPS.map((g) => g.name)].map((name) => (
          <button key={name} type="button" role="tab" aria-selected={filter === name} className="v3-chip" onClick={() => setFilter(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="v3-faq">
        {shown.map((g) => (
          <div key={g.name}>
            <h3>{g.name}</h3>
            {g.items.map((i) => (
              <div key={i} className={cn("v3-faq__item", open === i && "is-open")}>
                <button type="button" className="v3-faq__q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-controls={`faq-a-${i}`}>
                  <span>{faqs[i].q}</span>
                </button>
                <div className="v3-faq__a" id={`faq-a-${i}`} hidden={open !== i}><p>{faqs[i].a}</p></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
