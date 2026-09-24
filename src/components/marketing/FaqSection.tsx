"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { faqs } from "./faq-data"


// Apple-style "More questions? More answers.": category pills filter a
// grouped list of hairline-divided questions. Indexes point into faqs above.
const GROUPS: { name: string; items: number[] }[] = [
  { name: "Getting started", items: [0, 2, 3, 7] },
  { name: "Results", items: [4, 10] },
  { name: "Agencies and other tools", items: [1, 5, 11] },
  { name: "Pricing and cancelling", items: [6] },
  { name: "Access and safety", items: [8, 9] },
]

export function FaqSection() {
  const [filter, setFilter] = useState<string>("All")
  const [open, setOpen] = useState<number | null>(null)
  const shown = filter === "All" ? GROUPS : GROUPS.filter((g) => g.name === filter)

  return (
    <section className="ap-sec">
      <h2 className="ap-h2 ap-center">More questions? More answers.</h2>
      <div className="ap-pills" role="tablist">
        {["All", ...GROUPS.map((g) => g.name)].map((name) => (
          <button key={name} role="tab" aria-selected={filter === name} className={filter === name ? "is-on" : ""} onClick={() => setFilter(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="ap-faq">
        {shown.map((g) => (
          <div key={g.name} className="ap-faq__group">
            <h3>{g.name}</h3>
            {g.items.map((i) => (
              <div key={i} className={cn("ap-faq__item", open === i && "is-open")}>
                <button className="ap-faq__q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  <span>{faqs[i].q}</span>
                  <ChevronDown className="ap-faq__chev" aria-hidden="true" />
                </button>
                <div className="ap-faq__a"><p>{faqs[i].a}</p></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
