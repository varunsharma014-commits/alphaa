import { OrangePillButton } from "@/components/common/OrangePillButton"
import { MonoNumber } from "@/components/common/MonoNumber"

const stats = [
  { value: "1,200+", label: "businesses using Alphaa" },
  { value: "$500", label: "avg monthly savings" },
  { value: "2 weeks", label: "to first results" },
]

const platforms = ["Google", "ChatGPT", "Perplexity", "Maps"]

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
          Replaces your $500/month SEO agency
        </div>

        {/* Headline */}
        <h1 className="text-[42px] sm:text-[56px] font-semibold leading-[1.07] tracking-[-0.02em] text-white mb-6 text-balance">
          Get your business found on Google{" "}
          <span className="serif-italic text-brand-orange">and</span>{" "}
          ChatGPT — automatically.
        </h1>

        {/* Sub-headline — one punchy line */}
        <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-xl mx-auto mb-3">
          We handle everything — posting, content, and AI search — so customers searching for what you do actually find{" "}
          <span className="text-white font-medium">you</span>, not your competitors.
        </p>

        {/* Platform trust badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {platforms.map((p) => (
            <span
              key={p}
              className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/60 text-xs font-medium"
            >
              {p}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <OrangePillButton href="/scan" size="lg">
            Get your free visibility score →
          </OrangePillButton>
          <a
            href="/how-it-works"
            className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-full"
          >
            See how it works ↓
          </a>
        </div>

        {/* Trust line */}
        <p className="mt-5 text-muted/60 text-xs">
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
