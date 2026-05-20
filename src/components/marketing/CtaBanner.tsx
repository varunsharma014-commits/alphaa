import { OrangePillButton } from "@/components/common/OrangePillButton"

export function CtaBanner() {
  return (
    <section className="py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-3xl border border-brand-orange/20 p-12 sm:p-20 text-center relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 120%, rgba(255,107,26,0.18) 0%, transparent 65%)",
          }}
        >
          <div className="absolute inset-0 border border-brand-orange/10 rounded-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            1,247 businesses scanned this month
          </div>

          <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight mb-6 text-balance">
            Every day you wait,
            <br />
            your competitors get{" "}
            <span className="serif-italic text-brand-orange">found instead.</span>
          </h2>

          <p className="text-white/50 text-xl mb-10 max-w-xl mx-auto">
            See your free AI visibility score in 60 seconds. No signup. No credit card. Just the truth about where you stand.
          </p>

          <OrangePillButton href="/scan" size="lg">
            See if AI knows your business →
          </OrangePillButton>

          <p className="mt-6 text-white/25 text-sm">
            Takes 60 seconds · No signup · 14-day free trial if you want fixes
          </p>
        </div>
      </div>
    </section>
  )
}
