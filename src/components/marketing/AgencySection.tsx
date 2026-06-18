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
    <section className="py-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <p className="text-red-400 text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          The agency problem
        </p>

        <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-center mb-6 text-balance">
          Your SEO agency is charging you{" "}
          <span className="serif-italic text-brand-orange">$1,000–$2,000/month</span>
          <br />
          for a strategy that's becoming obsolete.
        </h2>

        <p className="text-white/50 text-xl text-center mb-16 max-w-2xl mx-auto">
          Even if your agency was doing a good job at Google SEO — and let's be honest, most of them aren't — you still have zero presence on AI search. That's a whole new problem they have no idea how to solve.
        </p>

        {/* Agency crimes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {crimes.map(({ number, Icon, crime, body }) => (
            <div key={number} className="rounded-2xl border border-red-500/15 bg-red-500/5 p-8">
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-red-400/40 text-4xl font-bold leading-none">{number}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{crime}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* The kicker — do the math */}
        <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.06] p-8 sm:p-10">
          <p className="text-center text-white/40 text-xs uppercase tracking-widest font-semibold mb-8">
            Do the math
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-red-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your SEO agency</p>
              <p className="text-white/40 text-4xl sm:text-5xl font-bold leading-none line-through decoration-red-500/50 decoration-2">
                $24,000<span className="text-xl">/yr</span>
              </p>
              <p className="text-white/30 text-xs mt-3">~$2,000/mo · and still invisible on AI</p>
            </div>
            <div className="flex items-center justify-center text-brand-orange/60 text-3xl rotate-90 sm:rotate-0">→</div>
            <div className="text-center">
              <p className="text-brand-orange text-xs font-semibold uppercase tracking-widest mb-3">Alphaa</p>
              <p className="text-white text-4xl sm:text-5xl font-bold leading-none">
                $1,188<span className="text-xl text-white/50">/yr</span>
              </p>
              <p className="text-white/30 text-xs mt-3">$99/mo · found on every AI engine</p>
            </div>
          </div>
          <div className="text-center mt-9 pt-9 border-t border-white/[0.08]">
            <p className="text-white text-[28px] sm:text-[40px] font-semibold leading-tight">
              Save up to <span className="text-brand-orange">$22,800/year</span>
            </p>
            <p className="text-white/50 text-base sm:text-lg mt-2">
              …and actually show up where your customers now search.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
