import { OrangePillButton } from "@/components/common/OrangePillButton"
import { MonoNumber } from "@/components/common/MonoNumber"

const stats = [
  { value: "1,200+", label: "local businesses" },
  { value: "$500", label: "avg monthly savings" },
  { value: "30 days", label: "to first results" },
]

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
      {/* Orange hero glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(255,107,26,0.18) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
          No SEO agency required
        </div>

        {/* Headline */}
        <h1 className="text-[42px] sm:text-[56px] font-semibold leading-[1.07] tracking-[-0.02em] text-white mb-6 text-balance">
          Get your business found on Google{" "}
          <span className="serif-italic text-brand-orange">and</span>{" "}
          ChatGPT — automatically.
        </h1>

        {/* Sub-headline */}
        <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
          Alphaa replaces your $500/month SEO agency. We automatically optimize your Google Business Profile, website, and content so people searching for what you do — on Google, ChatGPT, Perplexity, or Maps — actually find you.{" "}
          <span className="text-white font-medium">$99/month. No contracts.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <OrangePillButton href="/scan" size="lg">
            Get your free visibility scan →
          </OrangePillButton>
          <a
            href="/how-it-works"
            className="text-sm font-medium text-muted hover:text-white transition-colors duration-200"
          >
            See how it works ↓
          </a>
        </div>

        {/* Trust line */}
        <p className="mt-6 text-muted/60 text-xs">
          14-day free trial · No credit card required · Cancel anytime
        </p>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <MonoNumber className="text-2xl font-medium text-white block">{s.value}</MonoNumber>
              <span className="text-muted text-xs mt-1 block">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
