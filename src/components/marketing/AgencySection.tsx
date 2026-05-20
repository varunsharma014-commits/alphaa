export function AgencySection() {
  return (
    <section className="py-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <p className="text-red-400 text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          The agency problem
        </p>

        <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-center mb-6 text-balance">
          Your SEO agency is charging you{" "}
          <span className="serif-italic text-brand-orange">$1,000+/month</span>
          <br />
          for a strategy that's becoming obsolete.
        </h2>

        <p className="text-white/50 text-xl text-center mb-16 max-w-2xl mx-auto">
          Even if your agency was doing a good job at Google SEO — and let's be honest, most of them aren't — you still have zero presence on AI search. That's a whole new problem they have no idea how to solve.
        </p>

        {/* Agency crimes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            {
              number: "01",
              crime: "The PDF Report Scam",
              body: "Every month, they email you a PDF stuffed with graphs and jargon. You nod, file it away, and write the check. You have no idea if anything is actually working.",
            },
            {
              number: "02",
              crime: "The Retainer Trap",
              body: "6-month minimum. 12-month contracts. Early exit fees. They lock you in before they deliver a single result. The incentive is to keep you — not to get you found.",
            },
            {
              number: "03",
              crime: "They Don't Know AI",
              body: "Ask your SEO agency how they'll get you on ChatGPT, Gemini, and Claude. Watch them stumble. This is not what they were built for. They are Google-era people solving a Google-era problem.",
            },
          ].map((item) => (
            <div key={item.number} className="rounded-2xl border border-red-500/15 bg-red-500/5 p-8">
              <p className="text-red-400/60 text-5xl font-bold mb-4 leading-none">{item.number}</p>
              <h3 className="text-white font-semibold text-lg mb-3">{item.crime}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* The kicker */}
        <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/5 p-10 text-center">
          <p className="text-white text-2xl sm:text-3xl font-semibold leading-snug">
            The average small business spends{" "}
            <span className="text-brand-orange">$12,000/year</span> on SEO.
            <br />
            <span className="text-white/50">Most of it wasted. None of it on AI.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
