import { Bot, User } from "lucide-react"

// "Show, don't tell" — a mock AI answer that names a business, so visitors
// instantly grasp the outcome alphaa is working toward. Illustrative mockup.
export function AiAnswerMockup() {
  return (
    <section className="px-4 sm:px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-3">
            What your customers see
          </p>
          <h2 className="text-white text-2xl sm:text-[32px] font-semibold leading-tight">
            When someone asks AI for a business like yours
          </h2>
        </div>

        {/* Chat window mockup */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="ml-3 inline-flex items-center gap-1.5 text-white/40 text-xs">
              <Bot className="w-3.5 h-3.5 text-brand-orange" /> AI search
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* User question */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white/50" />
              </div>
              <p className="text-white/85 text-sm leading-relaxed pt-1">
                Who&apos;s the best emergency plumber near me?
              </p>
            </div>

            {/* AI answer */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-orange/15 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-brand-orange" />
              </div>
              <div className="text-sm leading-relaxed text-white/70 space-y-3 pt-1 min-w-0">
                <p>Here are a few highly-rated options in your area:</p>

                <div className="rounded-xl border border-brand-orange/40 bg-brand-orange/[0.07] p-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-semibold">Summit Plumbing Co.</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-orange text-white">
                      Your business
                    </span>
                  </div>
                  <p className="text-white/60">
                    Known for fast 24/7 response and upfront, honest pricing — a top pick for
                    emergency repairs.
                  </p>
                </div>

                <p className="text-white/50">
                  A couple of others come up too, though their response times and reviews vary.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {["summitplumbing.com", "Google reviews", "Local listings"].map((s) => (
                    <span
                      key={s}
                      className="text-[11px] text-white/40 border border-white/10 rounded-full px-2.5 py-1"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-6 max-w-lg mx-auto">
          Alphaa works to get your business named in answers like this — across ChatGPT, Claude,
          Gemini, Perplexity, and Google AI.
        </p>
      </div>
    </section>
  )
}
