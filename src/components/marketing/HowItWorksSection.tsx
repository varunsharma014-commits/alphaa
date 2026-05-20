import { SectionLabel } from "@/components/common/SectionLabel"

const steps = [
  {
    num: "01",
    headline: "Connect your business in 2 minutes",
    body: "Add your Google Business Profile and paste one snippet on your website. That's it. No developer needed.",
  },
  {
    num: "02",
    headline: "We do the work every week",
    body: "Alphaa posts to Google, generates content, tracks citations, and monitors reviews — all on autopilot.",
  },
  {
    num: "03",
    headline: "Watch yourself show up on Google and ChatGPT",
    body: "Most customers see Google Business Profile improvements in days. AI search and website rankings follow in 30–60 days.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <SectionLabel className="mb-3 block">How it works</SectionLabel>
          <h2 className="text-section-mobile md:text-section font-semibold text-white text-balance">
            Three steps to showing{" "}
            <span className="serif-italic text-brand-orange">up</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-brand-orange/30 to-transparent" />

          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center px-6 pb-10">
              {/* Step number */}
              <div className="relative z-10 w-16 h-16 rounded-full border border-brand-orange/30 bg-bg-secondary flex items-center justify-center mb-6">
                <span className="mono text-brand-orange text-xl font-medium">{step.num}</span>
              </div>
              <h3 className="text-white font-semibold text-base mb-3">{step.headline}</h3>
              <p className="text-muted text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
