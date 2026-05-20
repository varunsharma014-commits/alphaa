import { OrangePillButton } from "@/components/common/OrangePillButton"

export function CtaBanner() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="glass-card rounded-card p-12 relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,26,0.14) 0%, transparent 70%)",
          }}
        >
          <div className="absolute inset-0 border border-brand-orange/20 rounded-card pointer-events-none" />

          {/* Urgency pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            1,247 businesses scanned this month
          </div>

          <h2 className="text-[32px] sm:text-[40px] font-semibold text-white leading-tight mb-4 text-balance">
            Your competitors are already on{" "}
            <span className="serif-italic text-brand-orange">ChatGPT.</span>{" "}
            Are you?
          </h2>
          <p className="text-muted text-lg mb-8">
            See your free visibility score in 60 seconds. No signup. No credit card. Just the truth about why customers can't find you.
          </p>
          <OrangePillButton href="/scan" size="lg">
            Get your free visibility score →
          </OrangePillButton>
          <p className="mt-4 text-muted/60 text-xs">
            Takes 60 seconds · No signup required · 14-day free trial if you want fixes
          </p>
        </div>
      </div>
    </section>
  )
}
