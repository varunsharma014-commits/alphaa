import { OrangePillButton } from "@/components/common/OrangePillButton"

const engines = [
  { name: "ChatGPT", desc: "200M+ users ask it daily", color: "text-green-400", border: "border-green-400/20", bg: "bg-green-400/5" },
  { name: "Claude", desc: "Anthropic's AI — fast growing", color: "text-orange-300", border: "border-orange-300/20", bg: "bg-orange-300/5" },
  { name: "Gemini", desc: "Google's AI search engine", color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/5" },
  { name: "Perplexity", desc: "The AI-native search engine", color: "text-purple-400", border: "border-purple-400/20", bg: "bg-purple-400/5" },
  { name: "Google AI", desc: "AI Overviews on every search", color: "text-yellow-400", border: "border-yellow-400/20", bg: "bg-yellow-400/5" },
  { name: "Copilot", desc: "Microsoft's AI in Bing & Edge", color: "text-cyan-400", border: "border-cyan-400/20", bg: "bg-cyan-400/5" },
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
          Most tools optimize for one AI. We optimize for all six — because your customers use all of them.
        </p>

        {/* Engine grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          {engines.map((e) => (
            <div key={e.name} className={`rounded-2xl border ${e.border} ${e.bg} p-6`}>
              <p className={`text-2xl font-bold mb-2 ${e.color}`}>{e.name}</p>
              <p className="text-white/40 text-sm">{e.desc}</p>
            </div>
          ))}
        </div>

        {/* How we do it */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 mb-12">
          <h3 className="text-white text-2xl font-semibold mb-8 text-center">How we get you into AI answers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Build your AI profile", body: "We create the structured data, citations, and content that AI engines pull from when answering questions about local businesses." },
              { step: "02", title: "Keep it fresh, every week", body: "AI engines rank businesses that are active. We post, update, and publish content to every relevant source — automatically, weekly." },
              { step: "03", title: "Track every AI mention", body: "We ask each AI engine about businesses like yours, every week, and show you exactly where you appear — and where you don't yet." },
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
