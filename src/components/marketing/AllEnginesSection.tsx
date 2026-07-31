import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ChatGPTLogo, ClaudeLogo, GeminiLogo, PerplexityLogo } from "./AiEngineLogos"

const engines = [
  { name: "ChatGPT",     Logo: ChatGPTLogo,    desc: "200M+ daily users",           color: "text-[#0f8a6e]", border: "border-[#74aa9c]/30", bg: "bg-[#74aa9c]/[0.06]" },
  { name: "Claude",      Logo: ClaudeLogo,     desc: "Anthropic — fast growing",     color: "text-[#b06a3e]", border: "border-[#d4a27f]/30", bg: "bg-[#d4a27f]/[0.06]" },
  { name: "Gemini",      Logo: GeminiLogo,     desc: "Google's AI search",           color: "text-[#3367d6]", border: "border-[#8ab4f8]/30", bg: "bg-[#8ab4f8]/[0.06]" },
  { name: "Perplexity",  Logo: PerplexityLogo, desc: "AI-native search engine",      color: "text-[#6d4fd6]", border: "border-[#a78bfa]/30", bg: "bg-[#a78bfa]/[0.06]" },
]

export function AllEnginesSection() {
  return (
    <section data-reveal className="py-20 px-4 sm:px-6 bg-white text-[#1d1d1f]">
      <div className="max-w-5xl mx-auto">

        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          All of them. Not just one.
        </p>

        <h2 className="text-[40px] sm:text-[64px] font-bold text-[#1d1d1f] leading-[1.1] tracking-tight text-center mb-6 text-balance">
          We get your business found
          <br />
          on <span className="serif-italic text-brand-orange">every</span> AI search engine.
        </h2>

        <p className="text-[#6e6e73] text-xl text-center mb-16 max-w-2xl mx-auto">
          Most tools optimize for one AI. We optimize for all four — because your customers use all of them, and they're switching between them daily.
        </p>

        {/* Engine logo grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          {engines.map((e) => (
            <div key={e.name} className={`rounded-2xl border ${e.border} ${e.bg} p-6 flex items-center gap-4`}>
              <div className={`${e.color} flex-shrink-0`}>
                <e.Logo className="w-10 h-10" />
              </div>
              <div>
                <p className={`text-lg font-bold ${e.color}`}>{e.name}</p>
                <p className="text-[#86868b] text-xs mt-0.5">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The three-step "how we do it" block that used to sit here duplicated
            HowItWorksSection almost verbatim, two screens apart. Steps now live
            in HowItWorksSection only; this section is purely engine coverage. */}

        <div className="text-center">
          <OrangePillButton href="/scan" size="lg">
            See which AI engines know your business →
          </OrangePillButton>
        </div>
      </div>
    </section>
  )
}
