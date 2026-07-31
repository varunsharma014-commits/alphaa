import { OrangePillButton } from "@/components/common/OrangePillButton"

export function CtaBanner() {
  return (
    <section data-reveal className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-line/[0.08] bg-fg/[0.02] p-12 sm:p-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/20 bg-brand-orange/[0.06] text-brand-orange text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            1,247 businesses scanned this month
          </div>

          <h2 className="text-[40px] sm:text-[64px] font-bold text-fg leading-[1.1] tracking-tight mb-6 text-balance">
            Every day you wait,
            <br />
            your competitors get{" "}
            <span className="serif-italic text-brand-orange">found instead.</span>
          </h2>

          {/* One supporting line, not three. The sub-CTA line below already
              carries the trial terms, and the risk-free panel repeated them a
              third time at the exact moment the reader is deciding. */}
          <p className="text-muted text-xl mb-10 max-w-xl mx-auto">
            Free scan. The fixes are{" "}
            <span className="text-fg font-medium">$99/month</span> — no agency, no contracts.
          </p>

          <OrangePillButton href="/scan" size="lg">
            See if AI knows your business →
          </OrangePillButton>

          <p className="mt-6 text-muted text-sm">
            Takes 2 minutes · No credit card · 14-day free trial if you want fixes
          </p>

        </div>
      </div>
    </section>
  )
}
