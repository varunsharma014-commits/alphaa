import { ShieldCheck } from "lucide-react"
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

          <p className="text-muted text-xl mb-6 max-w-xl mx-auto">
            See your free AI visibility score in 2 minutes. No credit card. Just the truth about where you stand.
          </p>

          <p className="text-muted text-base mb-10 max-w-xl mx-auto">
            The scan is free. The fixes are{" "}
            <span className="text-fg font-medium">$99/month</span> — no agency, no contracts, cancel anytime.
          </p>

          <OrangePillButton href="/scan" size="lg">
            See if AI knows your business →
          </OrangePillButton>

          <p className="mt-6 text-muted text-sm">
            Takes 2 minutes · No credit card · 14-day free trial if you want fixes
          </p>

          <div className="mt-10 max-w-xl mx-auto flex items-start gap-3.5 rounded-2xl border border-brand-orange/15 bg-brand-orange/[0.04] px-5 py-4 text-left">
            <ShieldCheck className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
            <p className="text-muted text-sm leading-relaxed">
              <span className="text-fg font-medium">Try alphaa risk-free for 14 days.</span>{" "}
              $0 today — cancel anytime before day 14 and you never pay a cent.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
