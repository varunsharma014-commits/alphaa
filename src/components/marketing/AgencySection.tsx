import { FileText, Lock, Bot } from "lucide-react"

const crimes = [
  {
    number: "01",
    Icon: FileText,
    crime: "The PDF Report Scam",
    body: "Every month, they email you a PDF stuffed with graphs and jargon. You nod, file it away, and write the check. You have no idea if anything is actually working.",
  },
  {
    number: "02",
    Icon: Lock,
    crime: "The Retainer Trap",
    body: "6-month minimum. 12-month contracts. Early exit fees. They lock you in before they deliver a single result. The incentive is to keep you — not to get you found.",
  },
  {
    number: "03",
    Icon: Bot,
    crime: "They Don't Know AI",
    body: "Ask your SEO agency how they'll get you on ChatGPT, Gemini, and Claude. Watch them stumble. This is not what they were built for. They are Google-era people solving a Google-era problem.",
  },
]

export function AgencySection() {
  return (
    <section data-reveal className="py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <p className="text-muted text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          The agency problem
        </p>

        <h2 className="text-[40px] sm:text-[64px] font-bold text-fg leading-[1.1] tracking-tight text-center mb-6 text-balance">
          Your SEO agency is charging you{" "}
          <span className="serif-italic text-brand-orange">$2,000/month</span>
          <br />
          for a strategy that's becoming obsolete.
        </h2>

        <p className="text-muted text-xl text-center mb-16 max-w-xl mx-auto">
          Even a good Google agency leaves you invisible on AI search.
        </p>

        {/* Agency crimes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {crimes.map(({ number, Icon, crime, body }) => (
            <div key={number} className="rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-8">
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl border border-line/10 bg-fg/[0.04] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted" />
                </div>
                <span className="text-fg/10 text-4xl font-bold leading-none">{number}</span>
              </div>
              <h3 className="text-fg font-semibold text-lg mb-3">{crime}</h3>
              <p className="text-muted text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* The kicker — do the math */}
        <div className="rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-8 sm:p-10">
          <p className="text-center text-muted text-xs uppercase tracking-widest font-semibold mb-8">
            Do the math
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">Your SEO agency</p>
              <p className="text-muted text-4xl sm:text-5xl font-bold leading-none line-through decoration-fg/25 decoration-2">
                $24,000<span className="text-xl">/yr</span>
              </p>
              <p className="text-muted text-xs mt-3">~$2,000/mo · and still invisible on AI</p>
            </div>
            <div className="flex items-center justify-center text-brand-orange text-3xl rotate-90 sm:rotate-0">→</div>
            <div className="text-center">
              <p className="text-brand-orange text-xs font-semibold uppercase tracking-widest mb-3">Alphaa</p>
              <p className="text-fg text-4xl sm:text-5xl font-bold leading-none">
                $1,188<span className="text-xl text-muted">/yr</span>
              </p>
              <p className="text-muted text-xs mt-3">$99/mo · found on every AI engine</p>
            </div>
          </div>
          <div className="text-center mt-9 pt-9 border-t border-line/[0.08]">
            <p className="text-fg text-[28px] sm:text-[40px] font-semibold leading-tight">
              Save up to <span className="text-brand-orange">$22,800/year</span>
            </p>
            <p className="text-muted text-base sm:text-lg mt-2">
              …and actually show up where your customers now search.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
