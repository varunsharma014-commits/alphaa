import { OrangePillButton } from "@/components/common/OrangePillButton"
import { MonoNumber } from "@/components/common/MonoNumber"

const stats = [
  { value: "1B+", label: "daily AI searches" },
  { value: "6", label: "AI engines we optimize for" },
  { value: "2 min", label: "to get started" },
]

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(255,107,26,0.20) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Your customers stopped Googling. They're asking AI.
        </div>

        {/* Headline */}
        <h1 className="text-[42px] sm:text-[60px] font-semibold leading-[1.05] tracking-[-0.02em] text-white mb-8 text-balance">
          If you're not found on{" "}
          <span className="serif-italic text-brand-orange">AI search,</span>
          <br />
          you're losing customers right now.
        </h1>

        {/* Sub-headline */}
        <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto mb-4">
          ChatGPT, Claude, Gemini, Perplexity — billions of people now ask AI instead of Googling. Alphaa gets your business into every AI answer, automatically, for $99/month.
        </p>

        {/* AI engines row */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {["ChatGPT", "Claude", "Gemini", "Perplexity", "Google AI", "Copilot"].map((p) => (
            <span
              key={p}
              className="inline-flex items-center px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold"
            >
              {p}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <OrangePillButton href="/scan" size="lg">
            See if AI knows your business →
          </OrangePillButton>
          <a
            href="/pricing"
            className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-full"
          >
            View pricing →
          </a>
        </div>

        <p className="text-white/30 text-xs">
          Free scan — no signup required · 14-day trial · Cancel anytime
        </p>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <MonoNumber className="text-3xl font-medium text-white block">{s.value}</MonoNumber>
              <span className="text-white/40 text-xs mt-1 block">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
