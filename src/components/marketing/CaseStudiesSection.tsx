import Link from "next/link"
import { Star, BadgeCheck, ArrowRight, MapPin } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"

const previews = [
  {
    industry: "Dental",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    glow: "from-blue-500/8",
    business: "Bright Smile Dental",
    location: "Austin, TX",
    initials: "SC",
    name: "Dr. Sarah Chen",
    role: "Owner & Lead Dentist",
    headline: "From invisible to top 3 on ChatGPT — in 6 weeks.",
    quote: "Three patients last month told me they found me on 'the AI thing.' The $99 a month pays for itself with one new patient.",
    result: "23 new patients / 60 days",
    resultSub: "$8,400 new revenue",
    href: "/case-studies#bright-smile-dental",
  },
  {
    industry: "Legal",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/20",
    glow: "from-purple-500/8",
    business: "Torres Family Law",
    location: "Miami, FL",
    initials: "MT",
    name: "Marco Torres",
    role: "Founding Attorney",
    headline: "Cancelled the $1,800/mo agency. Top result on Claude in 5 weeks.",
    quote: "My agency had three years to figure out AI search. They never did. I switched to Alphaa on a Thursday and had my first Perplexity mention eleven days later.",
    result: "14 qualified leads/mo",
    resultSub: "$2,100/mo saved",
    href: "/case-studies#torres-family-law",
  },
  {
    industry: "HVAC",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    glow: "from-cyan-500/8",
    business: "CoolAir Pro",
    location: "Phoenix, AZ",
    initials: "JW",
    name: "James Whitfield",
    role: "Owner",
    headline: "340% AI visibility jump. Best off-season in 6 years.",
    quote: "For eleven years I thought off-season was just dead. Then I get on Alphaa and eight weeks later I'm getting 31 calls in a month I normally get eight.",
    result: "340% AI visibility",
    resultSub: "Best off-season in 6 yrs",
    href: "/case-studies#coolair-pro",
  },
]

export function CaseStudiesSection() {
  return (
    <section className="py-28 px-4 sm:px-6 border-y border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-4">
              Customer stories
            </p>
            <h2 className="text-[32px] sm:text-[46px] font-semibold text-white leading-[1.1] tracking-tight text-balance">
              Real businesses,{" "}
              <span className="text-white/40">real AI visibility.</span>
            </h2>
          </div>
          <Link
            href="/case-studies"
            className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-brand-orange transition-colors duration-200 flex-shrink-0 group"
          >
            View all case studies
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {previews.map((p) => (
            <div
              key={p.business}
              className={`group rounded-2xl border border-white/[0.08] bg-gradient-to-b ${p.glow} to-transparent flex flex-col overflow-hidden`}
            >
              <div className="p-6 flex-1 flex flex-col">
                {/* Top row */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${p.badge}`}>
                    {p.industry}
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-brand-orange text-brand-orange" />
                    ))}
                  </div>
                </div>

                {/* Business */}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg leading-snug">{p.business}</h3>
                  <div className="flex items-center gap-1 text-white/35 text-xs mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {p.location}
                  </div>
                </div>

                {/* Result pill */}
                <div className="rounded-xl bg-brand-orange/8 border border-brand-orange/15 px-4 py-3 mb-4">
                  <p className="text-brand-orange font-bold text-lg leading-none mb-0.5">{p.result}</p>
                  <p className="text-white/40 text-xs">{p.resultSub}</p>
                </div>

                {/* Headline */}
                <p className="text-white/70 text-sm leading-relaxed mb-4 flex-1">{p.headline}</p>

                {/* Quote */}
                <p className="text-white/45 text-xs leading-relaxed italic border-l-2 border-brand-orange/30 pl-3 mb-5">
                  "{p.quote}"
                </p>

                {/* Attribution */}
                <div className="flex items-center gap-2.5 mb-0 pt-3 border-t border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-bold flex-shrink-0">
                    {p.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-white text-xs font-semibold">{p.name}</p>
                      <BadgeCheck className="w-3 h-3 text-brand-orange" />
                    </div>
                    <p className="text-white/35 text-[11px]">{p.role} · {p.location}</p>
                  </div>
                </div>
              </div>

              {/* Read more */}
              <Link
                href={p.href}
                className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] text-white/40 hover:text-brand-orange text-xs font-semibold transition-colors duration-200 group/link"
              >
                Read full case study
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <OrangePillButton href="/scan" size="lg">
            See if AI knows your business →
          </OrangePillButton>
          <p className="text-white/25 text-xs mt-3">Free scan · No signup · 2 minutes</p>
        </div>
      </div>
    </section>
  )
}
