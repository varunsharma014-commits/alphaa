import { FileText, CheckCircle2 } from "lucide-react"

const ENGINES: { name: string; status: string; tone: "green" | "amber" | "muted" }[] = [
  { name: "ChatGPT", status: "Recommending you", tone: "green" },
  { name: "Claude", status: "Recommending you", tone: "green" },
  { name: "Perplexity", status: "Sometimes", tone: "amber" },
  { name: "Gemini", status: "Working on it", tone: "muted" },
]

const TONE: Record<"green" | "amber" | "muted", string> = {
  green: "text-[#1d8a4e] bg-[#e8f5ee]",
  amber: "text-[#9a6a00] bg-[#fdf3e0]",
  muted: "text-[#86868b] bg-[#f0f0f2]",
}

const FEATURES = [
  {
    kicker: "Visibility",
    title: "See what AI says about you.",
    body: "Track exactly how ChatGPT, Claude, Gemini and Perplexity answer when your customers ask. No more guessing.",
    visual: "engines" as const,
  },
  {
    kicker: "Content",
    title: "Publishing on autopilot.",
    body: "We write and publish optimized articles and Google Business posts every week — in your voice, with zero work from you.",
    visual: "content" as const,
  },
  {
    kicker: "Proof",
    title: "A score that climbs.",
    body: "One presence score, updated weekly, that shows your visibility going up — and every action we took to get it there.",
    visual: "trend" as const,
  },
]

function FeatureVisual({ kind }: { kind: "engines" | "content" | "trend" }) {
  if (kind === "engines") {
    return (
      <div className="rounded-2xl bg-[#f5f5f7] p-5 space-y-3">
        {ENGINES.map((e) => (
          <div key={e.name} className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
            <span className="text-[14px] font-medium text-[#1d1d1f]">{e.name}</span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TONE[e.tone]}`}>{e.status}</span>
          </div>
        ))}
      </div>
    )
  }
  if (kind === "content") {
    const items = [
      { icon: FileText, t: "Published: “Best HVAC tips for winter”" },
      { icon: FileText, t: "Google post: Seasonal tune-up offer" },
      { icon: CheckCircle2, t: "Schema markup added to 12 pages" },
    ]
    return (
      <div className="rounded-2xl bg-[#f5f5f7] p-5 space-y-3">
        {items.map((it) => (
          <div key={it.t} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5">
            <it.icon className="w-4 h-4 text-[#1d8a4e] flex-shrink-0" />
            <span className="text-[13px] text-[#1d1d1f]">{it.t}</span>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="rounded-2xl bg-[#f5f5f7] p-5 flex flex-col items-center justify-center text-center gap-2">
      <p className="text-[48px] font-semibold text-brand-orange leading-none">82</p>
      <p className="text-[#1d8a4e] text-[13px] font-medium">↑ +9 this month</p>
      <p className="text-[#86868b] text-[12px]">Presence score</p>
    </div>
  )
}

export function WholeSeoTeamSection() {
  return (
    <section data-reveal className="px-4 sm:px-6 bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="max-w-5xl mx-auto py-20 text-center">
        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6">Features</p>
        <h2 className="text-[40px] sm:text-[64px] font-bold leading-[1.1] tracking-tight">
          A whole SEO team, running itself.
        </h2>
      </div>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        {FEATURES.map((f, i) => (
          <div key={f.title} className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-[28px] p-8 sm:p-12">
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <p className="text-[14px] font-semibold text-brand-orange mb-3">{f.kicker}</p>
              <h3 className="text-[28px] sm:text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-[#1d1d1f]">{f.title}</h3>
              <p className="text-[17px] leading-relaxed text-[#6e6e73] mt-4">{f.body}</p>
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <FeatureVisual kind={f.visual} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
