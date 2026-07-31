"use client"

import { useState } from "react"
import Link from "next/link"
import { Star, ArrowRight, MapPin } from "lucide-react"
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
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-brand-orange text-brand-orange" />
            ))}
          </div>
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
          Read full case study
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
          style={{ background: "radial-gradient(ellipse at center bottom, rgb(var(--orange-rgb) / 0.15) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-7 tracking-wide uppercase">
            Case Studies
          </div>
          <h1 className="text-[38px] sm:text-[56px] lg:text-[64px] font-semibold leading-[1.05] tracking-[-0.02em] text-fg mb-5 text-balance">
            Real businesses.{" "}
            <span className="text-brand-orange">Real AI visibility.</span>
            <br />
            Real results.
          </h1>
          <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Every case study below is a real customer. Real numbers. Real timelines. See how businesses — local and online — went from invisible on AI search to booked out.
          </p>

          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: "2 weeks", label: "avg. time to first AI mention" },
              { value: "$1,400/mo", label: "avg. agency savings" },
              { value: "1,200+", label: "businesses on Alphaa" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-line/[0.07] bg-fg/[0.03] p-5 text-center">
                <p className="text-fg text-2xl font-bold mb-1">{s.value}</p>
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
            <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-4">Ready to be next?</p>
            <h2 className="text-[32px] sm:text-[44px] font-semibold text-fg leading-[1.1] tracking-tight mb-4 text-balance">
              Find out if AI search
              <br />knows your business.
            </h2>
            <p className="text-muted text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Run a free scan in 2 minutes. No credit card required. See your AI visibility score and exactly where you're missing.
            </p>
            <OrangePillButton href="/scan" size="lg">
              See where I rank on AI →
            </OrangePillButton>
            <p className="text-muted text-xs mt-4">$99/mo · No setup fee · Cancel anytime</p>
          </div>
        </div>
      </section>
    </>
  )
}
