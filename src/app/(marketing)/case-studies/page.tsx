"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { caseStudies } from "./data"

const filters = ["All", "Dental", "Legal", "HVAC"] as const
type Filter = (typeof filters)[number]

function CaseStudyCard({ cs }: { cs: (typeof caseStudies)[0] }) {
  return (
    <div className={`group rounded-2xl border border-line/[0.08] bg-white overflow-hidden flex flex-col`}>
      {/* Top */}
      <div className="p-6 pb-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cs.badge}`}>
            {cs.industry}
          </span>
          <span className="text-fg/40 text-xs font-medium">Illustrative example</span>
        </div>

        <h3 className="text-fg text-xl font-semibold leading-snug mb-1">{cs.business}</h3>
        <div className="flex items-center gap-1 text-fg/40 text-xs mb-4">
          <MapPin className="w-3 h-3" />
          {cs.location}
        </div>

        <p className="text-fg/70 text-sm leading-relaxed mb-5">{cs.headline}</p>

        {/* Key metric */}
        <div className="rounded-xl bg-fg/[0.04] border border-line/[0.06] p-4">
          <p className="text-brand-orange text-2xl font-bold leading-none mb-1">{cs.keyResult}</p>
          <p className="text-fg/40 text-xs">{cs.keyResultSub}</p>
        </div>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-2 gap-px bg-line/[0.06] border-t border-line/[0.06]">
        {cs.metrics.slice(0, 2).map((m) => (
          <div key={m.label} className="bg-bg-primary p-4">
            <p className="text-fg font-semibold text-base">{m.value}</p>
            <p className="text-fg/40 text-xs mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-line/[0.06]">
        <Link
          href={`/case-studies/${cs.slug}`}
          className="flex items-center justify-between w-full text-fg/60 hover:text-brand-orange text-sm font-medium transition-colors duration-200 group"
        >
          Read the example
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  )
}


export default function CaseStudiesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All")

  const filtered = activeFilter === "All"
    ? caseStudies
    : caseStudies.filter((cs) => cs.industry === activeFilter)

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: "transparent" }}
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-7 tracking-[-0.01em]">
            Examples
          </div>
          <h1 className="text-[41.8px] sm:text-[61.6px] lg:text-[70.4px] font-semibold leading-[1.05] tracking-[-0.02em] text-fg mb-5 text-balance">
            What your AI Agent does.{" "}
            <br />
            <span className="text-[#0071e3]">Industry by industry.</span>
          </h1>
          <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Illustrative examples, not customer stories: what Alphaa's AI Agent does, week by week, when ChatGPT, Gemini, Claude and Perplexity name a competitor instead of you.
          </p>

          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: "4 AIs", label: "checked every week" },
              { value: "$99/mo", label: "month to month" },
              { value: "90 days", label: "named by AI, or next month free" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-line/[0.07] bg-fg/[0.03] px-2 py-4 sm:p-5 text-center min-w-0">
                <p className="text-fg text-lg sm:text-2xl font-bold mb-1 whitespace-nowrap">{s.value}</p>
                <p className="text-fg/35 text-xs leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter + cards */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${
                  activeFilter === f
                    ? "bg-brand-orange text-white border-brand-orange"
                    : "text-fg/50 border-line/[0.08] hover:border-line/20 hover:text-fg/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
            {filtered.map((cs) => (
              <CaseStudyCard key={cs.id} cs={cs} />
            ))}
          </div>

          {/* The full write-ups used to be inlined here as anchors. They now
              live at /case-studies/<slug> so each one is its own indexable
              page, which is also where the cards above have always linked. */}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 pb-28">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-line/[0.08] bg-fg/[0.02] overflow-hidden p-10 sm:p-14 text-center">
            <p className="text-brand-orange text-xs font-semibold tracking-[-0.01em] mb-4">Ready to be next?</p>
            <h2 className="text-[32px] sm:text-[44px] font-semibold text-fg leading-[1.1] tracking-tight mb-4 text-balance">
              Find out if AI search
              <br />knows your business.
            </h2>
            <p className="text-muted text-base sm:text-lg mb-8 max-w-xl mx-auto">
              See what ChatGPT, Gemini, Claude and Perplexity say about your business, and who they name instead. Free, in about 60 seconds.
            </p>
            <OrangePillButton href="/start" size="lg">
              Run the free check →
            </OrangePillButton>
            <p className="text-muted text-xs mt-4">$99/mo · Month to month · Cancel in 2 clicks</p>
          </div>
        </div>
      </section>
    </>
  )
}
