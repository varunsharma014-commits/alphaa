import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ChatGPTLogo, ClaudeLogo, GeminiLogo, PerplexityLogo, GoogleAILogo, CopilotLogo } from "./AiEngineLogos"

const engines = [
  { name: "ChatGPT",     Logo: ChatGPTLogo,    desc: "200M+ daily users",           color: "text-[#0f8a6e]", border: "border-[#74aa9c]/30", bg: "bg-[#74aa9c]/[0.06]" },
  { name: "Claude",      Logo: ClaudeLogo,     desc: "Anthropic — fast growing",     color: "text-[#b06a3e]", border: "border-[#d4a27f]/30", bg: "bg-[#d4a27f]/[0.06]" },
  { name: "Gemini",      Logo: GeminiLogo,     desc: "Google's AI search",           color: "text-[#3367d6]", border: "border-[#8ab4f8]/30", bg: "bg-[#8ab4f8]/[0.06]" },
  { name: "Perplexity",  Logo: PerplexityLogo, desc: "AI-native search engine",      color: "text-[#6d4fd6]", border: "border-[#a78bfa]/30", bg: "bg-[#a78bfa]/[0.06]" },
  { name: "Google AI",   Logo: GoogleAILogo,   desc: "AI Overviews on every search", color: "text-[#1e7e39]", border: "border-[#34a853]/30", bg: "bg-[#34a853]/[0.06]" },
  { name: "Copilot",     Logo: CopilotLogo,    desc: "Microsoft AI in Bing & Edge",  color: "text-[#0078d4]", border: "border-[#0078d4]/30", bg: "bg-[#0078d4]/[0.06]" },
]

export function AllEnginesSection() {
  return (
    <section className="py-28 px-4 sm:px-6 bg-white text-[#1d1d1f]">
      <div className="max-w-5xl mx-auto">

        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          All of them. Not just one.
        </p>

        <h2 className="text-[36px] sm:text-[52px] font-semibold text-[#1d1d1f] leading-[1.1] tracking-tight text-center mb-6 text-balance">
          We get your business found
          <br />
          on <span className="serif-italic text-brand-orange">every</span> AI search engine.
        </h2>

        <p className="text-[#6e6e73] text-xl text-center mb-16 max-w-2xl mx-auto">
          Most tools optimize for one AI. We optimize for all six — because your customers use all of them, and they're switching between them daily.
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

        {/* How we do it */}
        <div className="rounded-2xl border border-black/[0.08] bg-[#f5f5f7] p-10 mb-12">
          <h3 className="text-[#1d1d1f] text-2xl font-semibold mb-8 text-center">How we get you into AI answers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Build your AI profile", body: "We create the structured data, citations, and content that AI engines pull from when answering questions about businesses like yours." },
              { step: "02", title: "Keep it fresh, every week", body: "AI engines rank businesses that are active. We post, update, and publish content to every relevant source — automatically, weekly." },
              { step: "03", title: "Track every AI mention", body: "We query each AI engine about businesses like yours, every week, and report exactly where you appear — and where you don't yet." },
            ].map((item) => (
              <div key={item.step}>
                <p className="text-brand-orange text-4xl font-bold mb-3 leading-none">{item.step}</p>
                <h4 className="text-[#1d1d1f] font-semibold mb-2">{item.title}</h4>
                <p className="text-[#6e6e73] text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <OrangePillButton href="/scan" size="lg">
            See which AI engines know your business →
          </OrangePillButton>
        </div>
      </div>
    </section>
  )
}
