"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "What does Alphaa actually do?",
    a: "We make sure your business shows up when people search for what you do — on Google, Google Maps, ChatGPT, Perplexity, and other AI tools. We do the work automatically: posting to your Google Business Profile, optimizing your website, creating content, and tracking where you appear.",
  },
  {
    q: "How is this different from an SEO agency?",
    a: "Agencies charge thousands of dollars for manual labor, long contracts, and confusing reports. Alphaa automates the entire process for a fraction of the cost, focuses specifically on the new wave of AI search engines, and explains everything it does in plain English.",
  },
  {
    q: "Do I need to know anything about marketing or SEO?",
    a: "Not at all. Alphaa is designed for business owners, not marketers. If you can tap \"Approve\" on a text message, you can use Alphaa.",
  },
  {
    q: "What's this 'AI search' thing?",
    a: "Instead of typing keywords into Google and scrolling through links, millions of consumers are now asking ChatGPT, Perplexity, and Gemini questions like, \"Who is the best plumber near me?\" If your business isn't optimized for AI, these bots will recommend your competitors.",
  },
  {
    q: "Will I see results in the first month?",
    a: "Usually yes for Google Business Profile changes — these show up in days. Website and AI search improvements take 30–60 days to fully kick in.",
  },
  {
    q: "What if I already have an SEO agency?",
    a: "Many customers run Alphaa alongside their agency for the first month, see the difference, then cancel the agency. We never lock you in either way.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. One click in your dashboard. No phone calls, no retention specialists, no contracts.",
  },
  {
    q: "What kinds of businesses is this for?",
    a: "Any business that wants to be found — local or online. Dentists, lawyers, contractors, salons, and restaurants serving a city, plus ecommerce brands, SaaS and B2B companies, agencies, and online services selling regionally, nationally, or worldwide.",
  },
  {
    q: "Do I need to give you my website login or hosting passwords?",
    a: "No. You connect Google with one secure OAuth click — you approve the access, and you can revoke it anytime — and optionally paste one small read-only snippet on your site. Alphaa never needs your website or hosting passwords.",
  },
  {
    q: "How do you post to my Google Business Profile automatically?",
    a: "Through Google's official Business Profile API, after you connect with OAuth. You authorize it once; Alphaa then publishes posts on your schedule (Mon + Thu). You can review drafts first or let it run on autopilot.",
  },
  {
    q: "Are AI search rankings guaranteed?",
    a: "No — and be wary of anyone who promises that. AI engines like ChatGPT and Gemini control their own results. Alphaa does the proven work consistently — content, structured data, Google Business Profile, llms.txt — and tracks your visibility so you can see real progress.",
  },
  {
    q: "How is this different from tools like Yext?",
    a: "Yext syncs your business listing across directories. Alphaa optimizes you to be found and recommended by AI answer engines like ChatGPT, Claude, Gemini, and Perplexity, plus Google — generating content, schema, and posts automatically. Different job, built for AI search.",
  },
]

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
