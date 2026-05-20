import { OrangePillButton } from "@/components/common/OrangePillButton"

export function CtaBanner() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="glass-card rounded-card p-12 relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,26,0.12) 0%, transparent 70%)",
          }}
        >
          <div className="absolute inset-0 border border-brand-orange/20 rounded-card pointer-events-none" />
          <h2 className="text-[32px] sm:text-[40px] font-semibold text-white leading-tight mb-4 text-balance">
            Stop paying for SEO that{" "}
            <span className="serif-italic text-brand-orange">doesn't work.</span>
          </h2>
          <p className="text-muted text-lg mb-8">
            Start showing up on Google and ChatGPT today. 14-day free trial. No credit card required.
          </p>
          <OrangePillButton href="/scan" size="lg">
            Get your free visibility scan →
          </OrangePillButton>
          <p className="mt-4 text-muted/60 text-xs">
            Takes 60 seconds · No signup required to see your score
          </p>
        </div>
      </div>
    </section>
  )
}
