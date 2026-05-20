import { OrangePillButton } from "@/components/common/OrangePillButton"

export function AiShiftSection() {
  return (
    <section className="py-28 px-4 sm:px-6 border-y border-white/[0.06]">
      <div className="max-w-5xl mx-auto">

        {/* Label */}
        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          The shift happening right now
        </p>

        {/* Big statement */}
        <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-center mb-10 text-balance">
          For 20 years, customers Googled.
          <br />
          <span className="text-white/40">That era is ending.</span>
        </h2>

        {/* Two column truth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
            <p className="text-red-400 text-xs font-semibold tracking-widest uppercase mb-4">Then (Google era)</p>
            <ul className="space-y-3 text-white/60 text-base">
              <li className="flex gap-3"><span className="text-red-400 mt-0.5">✕</span> Customer types "best dentist Austin TX" into Google</li>
              <li className="flex gap-3"><span className="text-red-400 mt-0.5">✕</span> Clicks through 10 blue links</li>
              <li className="flex gap-3"><span className="text-red-400 mt-0.5">✕</span> SEO agencies charge $1,000/mo to game this</li>
              <li className="flex gap-3"><span className="text-red-400 mt-0.5">✕</span> Google Search traffic declining every quarter</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-8">
            <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-4">Now (AI era)</p>
            <ul className="space-y-3 text-white/80 text-base">
              <li className="flex gap-3"><span className="text-brand-orange mt-0.5">→</span> Customer asks ChatGPT "who's the best dentist in Austin?"</li>
              <li className="flex gap-3"><span className="text-brand-orange mt-0.5">→</span> AI gives one direct answer — or two</li>
              <li className="flex gap-3"><span className="text-brand-orange mt-0.5">→</span> If you're not in that answer, you don't exist</li>
              <li className="flex gap-3"><span className="text-brand-orange mt-0.5">→</span> AI search growing 300%+ year over year</li>
            </ul>
          </div>
        </div>

        {/* Big stat */}
        <div className="text-center mb-12">
          <p className="text-[64px] sm:text-[96px] font-semibold text-white leading-none tracking-tight">
            1 <span className="text-brand-orange">billion</span>
          </p>
          <p className="text-white/50 text-xl mt-3">AI searches happen every single day.</p>
          <p className="text-white/30 text-base mt-2">How many of them mention your business?</p>
        </div>

        <div className="text-center">
          <OrangePillButton href="/scan" size="lg">
            Find out if AI knows you exist →
          </OrangePillButton>
        </div>
      </div>
    </section>
  )
}
