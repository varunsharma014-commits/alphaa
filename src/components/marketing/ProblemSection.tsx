import { GlassCard } from "@/components/common/GlassCard"
import { SectionLabel } from "@/components/common/SectionLabel"
import { AlertCircle, Eye, Clock } from "lucide-react"

const problems = [
  {
    icon: AlertCircle,
    stat: "$6,000/year",
    headline: "Paying $500+/month to an agency you don't trust?",
    body: "They send reports full of graphs you can't read and results you can't verify. Meanwhile, your check clears every month — no questions asked.",
  },
  {
    icon: Eye,
    stat: "1 in 3 searches",
    headline: "Customers finding your competitors on ChatGPT instead of you?",
    body: "1 in 3 local searches now happens on AI tools. If your business isn't in the answer, you're invisible to a fast-growing chunk of buyers.",
  },
  {
    icon: Clock,
    stat: "10 hrs/week",
    headline: "No time to post on Google or update your website?",
    body: "Google rewards businesses that post consistently. But you're running a business — you can't spend 10 hours a week on content nobody reads.",
  },
]

export function ProblemSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel className="mb-3 block">The problem</SectionLabel>
          <h2 className="text-section-mobile md:text-section font-semibold text-white text-balance">
            Local marketing is{" "}
            <span className="serif-italic text-brand-orange">broken</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {problems.map((p) => (
            <GlassCard key={p.headline} hover className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-brand-orange" />
                </div>
                <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full whitespace-nowrap">
                  {p.stat}
                </span>
              </div>
              <h3 className="text-white font-semibold text-base leading-snug">{p.headline}</h3>
              <p className="text-muted text-sm leading-relaxed">{p.body}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}
