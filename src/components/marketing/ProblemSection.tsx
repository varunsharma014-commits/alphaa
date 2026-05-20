import { GlassCard } from "@/components/common/GlassCard"
import { SectionLabel } from "@/components/common/SectionLabel"
import { AlertCircle, Eye, Clock } from "lucide-react"

const problems = [
  {
    icon: AlertCircle,
    headline: "Paying $500+/month to an agency you don't trust?",
    body: "They send reports full of graphs you can't read, terms you don't understand, and results you can't verify. Meanwhile, your check clears every month.",
  },
  {
    icon: Eye,
    headline: "Customers finding your competitors on ChatGPT instead of you?",
    body: "More and more people search on ChatGPT, Perplexity, and Google AI. If your business isn't showing up there, you're invisible to a growing chunk of customers.",
  },
  {
    icon: Clock,
    headline: "No time to post on Google or update your website?",
    body: "You're running a business. You can't spend 10 hours a week on marketing. But if you don't post consistently, Google stops showing you to new customers.",
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
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                <p.icon className="w-5 h-5 text-brand-orange" />
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
