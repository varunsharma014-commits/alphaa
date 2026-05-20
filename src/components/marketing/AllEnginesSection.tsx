import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ChatGPTLogo, ClaudeLogo, GeminiLogo, PerplexityLogo, GoogleAILogo, CopilotLogo } from "./AiEngineLogos"

const engines = [
  { name: "ChatGPT",     Logo: ChatGPTLogo,    desc: "200M+ daily users",           color: "text-[#74aa9c]", border: "border-[#74aa9c]/25", bg: "bg-[#74aa9c]/5" },
  { name: "Claude",      Logo: ClaudeLogo,     desc: "Anthropic — fast growing",     color: "text-[#d4a27f]", border: "border-[#d4a27f]/25", bg: "bg-[#d4a27f]/5" },
  { name: "Gemini",      Logo: GeminiLogo,     desc: "Google's AI search",           color: "text-[#8ab4f8]", border: "border-[#8ab4f8]/25", bg: "bg-[#8ab4f8]/5" },
  { name: "Perplexity",  Logo: PerplexityLogo, desc: "AI-native search engine",      color: "text-[#a78bfa]", border: "border-[#a78bfa]/25", bg: "bg-[#a78bfa]/5" },
  { name: "Google AI",   Logo: GoogleAILogo,   desc: "AI Overviews on every search", color: "text-[#34a853]", border: "border-[#34a853]/25", bg: "bg-[#34a853]/5" },
  { name: "Copilot",     Logo: CopilotLogo,    desc: "Microsoft AI in Bing & Edge",  color: "text-[#0078d4]", border: "border-[#0078d4]/25", bg: "bg-[#0078d4]/5" },
]

export function AllEnginesSection() {
  return (
    <section className="py-28 px-4 sm:px-6 border-y border-white/[0.06]">
      <div className="max-w-5xl mx-auto">

        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          All of them. Not just one.
        </p>

        <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-center mb-6 text-balance">
          We get your business found
          <br />
          on <span className="serif-italic text-brand-orange">every</span> AI search engine.
        </h2>

        <p className="text-white/50 text-xl text-center mb-16 max-w-2xl mx-auto">
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
                <p className="text-white/40 text-xs mt-0.5">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How we do it */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 mb-12">
          <h3 className="text-white text-2xl font-semibold mb-8 text-center">How we get you into AI answers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Build your AI profile", body: "We create the structured data, citations, and content that AI engines pull from when answering questions about local businesses." },
              { step: "02", title: "Keep it fresh, every week", body: "AI engines rank businesses that are active. We post, update, and publish content to every relevant source — automatically, weekly." },
              { step: "03", title: "Track every AI mention", body: "We query each AI engine about businesses like yours, every week, and report exactly where you appear — and where you don't yet." },
            ].map((item) => (
              <div key={item.step}>
                <p className="text-brand-orange text-4xl font-bold mb-3 leading-none">{item.step}</p>
                <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
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
