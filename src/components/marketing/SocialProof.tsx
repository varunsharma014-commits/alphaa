import { Star } from "lucide-react"
import { GlassCard } from "@/components/common/GlassCard"

const testimonials = [
  {
    quote: "Cancelled our $1,400/month SEO agency after 6 weeks. We show up on ChatGPT now. Patients actually mention it.",
    name: "Dr. Sarah Chen",
    role: "Family Dentist, Austin TX",
    initials: "SC",
  },
  {
    quote: "I used to pay $800 a month and get a PDF report I didn't understand. Alphaa just works.",
    name: "Marcus Rivera",
    role: "HVAC Contractor, Phoenix AZ",
    initials: "MR",
  },
  {
    quote: "Our Google Business Profile went from 2 posts a year to 8 posts a month. Rankings followed.",
    name: "Jennifer Park",
    role: "Med Spa Owner, Miami FL",
    initials: "JP",
  },
]

export function SocialProof() {
  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Review bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 text-center">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-brand-orange text-brand-orange" />
            ))}
          </div>
          <p className="text-muted text-sm">
            <span className="text-white font-medium">4.9/5</span> from 1,200+ local businesses who stopped paying $500–$2,000/month to SEO agencies they didn't trust
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <GlassCard key={t.name} className="flex flex-col gap-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-semibold">
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-xs font-medium">{t.name}</p>
                  <p className="text-muted text-xs">{t.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}
