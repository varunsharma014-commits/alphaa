import { Star, BadgeCheck } from "lucide-react"

const metrics = [
  { value: "1,200+", label: "businesses using Alphaa" },
  { value: "4.9/5", label: "average rating" },
  { value: "$1,400/mo", label: "average agency savings" },
  { value: "2 weeks", label: "to first AI mention" },
]

const testimonials = [
  {
    quote: "Cancelled our $1,400/month SEO agency after 6 weeks. We show up on ChatGPT now — clients literally mention it when they call.",
    name: "Dana Whitmore",
    role: "Veterinary Clinic Owner",
    location: "Nashville, TN",
    initials: "DW",
    result: "Saved $1,400/mo",
  },
  {
    quote: "I asked ChatGPT 'best HVAC contractor in Phoenix' last week. My business came up second. That never happened with Google SEO.",
    name: "Marcus Rivera",
    role: "HVAC Contractor",
    location: "Phoenix, AZ",
    initials: "MR",
    result: "#2 on ChatGPT",
  },
  {
    quote: "Our Google Business Profile went from 2 posts a year to 16 a month. We jumped from position 8 to position 2 for our main keyword in 5 weeks.",
    name: "Jennifer Park",
    role: "Med Spa Owner",
    location: "Miami, FL",
    initials: "JP",
    result: "#2 ranking in 5 weeks",
  },
  {
    quote: "Setup took 8 minutes. Within 3 weeks Gemini was recommending us when people searched for lawyers in our city. First thing I've ever paid for that actually worked.",
    name: "Robert Kim",
    role: "Personal Injury Attorney",
    location: "Chicago, IL",
    initials: "RK",
    result: "Found on Gemini",
  },
  {
    quote: "We fired our $2,000/month agency in January. Switched to Alphaa. February was our best month for new bookings in 3 years.",
    name: "Priya Sharma",
    role: "Yoga Studio Owner",
    location: "Seattle, WA",
    initials: "PS",
    result: "Best month in 3 years",
  },
  {
    quote: "I showed my accountant. He said it's the best ROI of anything I spend on. $99/month versus the $900 I was paying before. No comparison.",
    name: "Dave Torres",
    role: "Plumbing Contractor",
    location: "Dallas, TX",
    initials: "DT",
    result: "10x better ROI",
  },
]

export function SocialProof() {
  return (
    <section data-reveal className="py-20 px-4 sm:px-6 border-y border-line/[0.06]">
      <div className="max-w-6xl mx-auto">

        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          Real results
        </p>

        <h2 className="text-[40px] sm:text-[64px] font-bold text-fg leading-[1.1] tracking-tight text-center mb-6 text-balance">
          1,200+ businesses stopped
          <br />
          <span className="text-muted">paying for SEO that didn't work.</span>
        </h2>

        {/* Metrics bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-6 text-center">
              <p className="text-3xl font-bold text-fg mb-1">{m.value}</p>
              <p className="text-muted text-sm">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-line/[0.08] bg-white p-6 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                  ))}
                </div>
                <span className="text-xs font-bold text-brand-orange bg-brand-orange/[0.08] px-2.5 py-1 rounded-full">
                  {t.result}
                </span>
              </div>
              <p className="text-fg/80 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-line/[0.06]">
                <div className="w-9 h-9 rounded-full bg-brand-orange/15 flex items-center justify-center text-brand-orange text-xs font-bold flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-fg text-sm font-semibold">{t.name}</p>
                    <BadgeCheck className="w-3.5 h-3.5 text-brand-orange" />
                  </div>
                  <p className="text-muted text-xs">{t.role} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
