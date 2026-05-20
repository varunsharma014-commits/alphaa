import { SectionLabel } from "@/components/common/SectionLabel"
import { GlassCard } from "@/components/common/GlassCard"
import { Search, MapPin, FileText, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Search,
    headline: "AI Visibility Scan",
    body: "We analyze 47 factors that determine whether you show up on Google, ChatGPT, and Maps. You get a plain-English score and exactly what to fix.",
    num: "01",
  },
  {
    icon: MapPin,
    headline: "Auto-Posting to Google",
    body: "We post to your Google Business Profile 2–4 times per week with relevant content. Google rewards active profiles with higher rankings.",
    num: "02",
  },
  {
    icon: FileText,
    headline: "AI Content Engine",
    body: "We generate blog posts, FAQs, and service pages written specifically for your business and city — the content that gets you found.",
    num: "03",
  },
  {
    icon: BarChart3,
    headline: "AI Search Tracking",
    body: "We track whether your business appears when people ask ChatGPT, Perplexity, and Google AI for local services like yours.",
    num: "04",
  },
]

export function SolutionSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel className="mb-3 block">What Alphaa does</SectionLabel>
          <h2 className="text-section-mobile md:text-section font-semibold text-white text-balance">
            We do the work{" "}
            <span className="serif-italic text-brand-orange">for you</span>
          </h2>
          <p className="text-muted text-lg mt-4 max-w-xl mx-auto">
            Connect your business in 2 minutes. We handle everything else, every week, automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <GlassCard key={f.headline} hover className="flex gap-4">
              <div className="flex-shrink-0">
                <span className="mono text-brand-orange text-sm font-medium">{f.num}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                    <f.icon className="w-4 h-4 text-brand-orange" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{f.headline}</h3>
                </div>
                <p className="text-muted text-sm leading-relaxed">{f.body}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}
