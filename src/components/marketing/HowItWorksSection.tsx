import { SectionLabel } from "@/components/common/SectionLabel"

const steps = [
  {
    num: "01",
    headline: "Tell us about your business",
    body: "Business name, location, and what you do. Takes 2 minutes. No developer, no setup calls, no lengthy onboarding.",
  },
  {
    num: "02",
    headline: "We build your AI presence",
    body: "We create your structured data, citations, and AI-optimized content — and start posting to Google weekly. All automatic.",
  },
  {
    num: "03",
    headline: "Customers find you on every AI engine",
    body: "ChatGPT, Gemini, Claude, Perplexity — your business starts showing up. We report exactly where and how often, every week.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-28 px-4 sm:px-6 border-y border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel className="mb-3 block">How it works</SectionLabel>
          <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-balance">
            Simple enough that a dentist
            <br />
            <span className="text-white/40">can set it up in their lunch break.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-brand-orange/30 to-transparent" />

          {steps.map((step) => (
            <div key={step.num} className="relative flex flex-col items-center text-center px-6 pb-10">
              <div className="relative z-10 w-16 h-16 rounded-full border border-brand-orange/30 bg-bg-secondary flex items-center justify-center mb-6">
                <span className="mono text-brand-orange text-xl font-medium">{step.num}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{step.headline}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
