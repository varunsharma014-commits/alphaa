import { MapPin } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import type { CaseStudy } from "@/app/(marketing)/case-studies/data"

export function FullCaseStudy({ cs }: { cs: CaseStudy }) {
  return (
    <article id={cs.id} className="scroll-mt-24">
      {/* Hero */}
      <div className={`rounded-3xl border border-line/[0.08] bg-white overflow-hidden mb-6`}>
        <div className="p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cs.badge}`}>
              {cs.industry}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-line/[0.08] text-muted">
              Illustrative example
            </span>
            <div className="flex items-center gap-1 text-fg/40 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {cs.location}
            </div>
          </div>

          <h2 className="text-[32px] sm:text-[44px] font-semibold text-fg leading-[1.1] tracking-tight mb-4 text-balance">
            {cs.business}
          </h2>
          <p className="text-muted text-lg sm:text-xl mb-8 max-w-2xl">{cs.headline}</p>

          {/* Hero metric */}
          <div className="inline-block rounded-2xl bg-brand-orange/10 border border-brand-orange/20 px-6 py-4">
            <p className="text-brand-orange text-4xl sm:text-5xl font-bold leading-none mb-1">{cs.keyResult}</p>
            <p className="text-fg/50 text-sm">{cs.keyResultSub}</p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line/[0.06] border-t border-line/[0.06]">
          {cs.metrics.map((m) => (
            <div key={m.label} className="bg-bg-primary p-5 sm:p-6">
              <m.icon className="w-4 h-4 text-brand-orange mb-3" />
              <p className="text-fg text-2xl font-bold leading-none mb-1">{m.value}</p>
              <p className="text-fg/70 text-sm font-medium">{m.label}</p>
              <p className="text-fg/35 text-xs mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Problem */}
        <div className="lg:col-span-1 rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-fg/30" />
            <p className="text-muted text-xs font-semibold tracking-[-0.01em]">The Problem</p>
          </div>
          <h3 className="text-fg font-semibold text-lg mb-3 leading-snug">{cs.problem.title}</h3>
          <p className="text-muted text-sm leading-relaxed mb-5">{cs.problem.body}</p>
          <div className="space-y-2">
            {cs.problem.tried.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-fg/25 mt-1.5 flex-shrink-0" />
                <p className="text-muted text-sm leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution + timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-orange" />
            <p className="text-brand-orange text-xs font-semibold tracking-[-0.01em]">The Solution</p>
          </div>
          <h3 className="text-fg font-semibold text-lg mb-3 leading-snug">{cs.solution.title}</h3>
          <p className="text-muted text-sm leading-relaxed mb-6">{cs.solution.body}</p>

          {/* Timeline */}
          <div className="space-y-4">
            {cs.solution.timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-orange text-[10px] font-bold">{i + 1}</span>
                  </div>
                  {i < cs.solution.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-line/[0.06] mt-2 mb-0" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand-orange text-xs font-semibold">{t.week}</span>
                    <span className="text-fg text-sm font-semibold">{t.title}</span>
                  </div>
                  <p className="text-muted text-sm leading-relaxed">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Example disclosure (replaces the old pull quote: these are examples, not customers) */}
      <div className="rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-6 sm:p-7 mb-6">
        <p className="text-muted text-xs font-semibold tracking-[-0.01em] mb-2">About this example</p>
        <p className="text-muted text-sm leading-relaxed">{cs.note}</p>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-fg font-semibold mb-1">See what AI says about your business</p>
          <p className="text-muted text-sm">Free check: what ChatGPT, Gemini, Claude and Perplexity say about you, in about 60 seconds.</p>
        </div>
        <OrangePillButton href="/start" size="md" className="flex-shrink-0">
          Run the free check →
        </OrangePillButton>
      </div>
    </article>
  )
}
