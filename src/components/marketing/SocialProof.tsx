import { Star, BadgeCheck } from "lucide-react"

const metrics = [
  { value: "1,200+", label: "businesses using Alphaa" },
  { value: "4.9/5", label: "average rating" },
  { value: "$500/mo", label: "average savings" },
  { value: "2 weeks", label: "to first AI mention" },
]

const testimonials = [
  {
    quote: "Cancelled our $1,400/month SEO agency after 6 weeks. We show up on ChatGPT now — patients literally mention it when they call.",
    name: "Dr. Sarah Chen",
    role: "Family Dentist",
    location: "Austin, TX",
    initials: "SC",
    result: "Saved $1,400/mo",
    bg: "from-orange-500/10",
  },
  {
    quote: "I asked ChatGPT 'best HVAC contractor in Phoenix' last week. My business came up second. That never happened with Google SEO.",
    name: "Marcus Rivera",
    role: "HVAC Contractor",
    location: "Phoenix, AZ",
    initials: "MR",
    result: "#2 on ChatGPT",
    bg: "from-blue-500/10",
  },
  {
    quote: "Our Google Business Profile went from 2 posts a year to 16 a month. We jumped from position 8 to position 2 for our main keyword in 5 weeks.",
    name: "Jennifer Park",
    role: "Med Spa Owner",
    location: "Miami, FL",
    initials: "JP",
    result: "#2 ranking in 5 weeks",
    bg: "from-purple-500/10",
  },
  {
    quote: "Setup took 8 minutes. Within 3 weeks Gemini was recommending us when people searched for lawyers in our city. First thing I've ever paid for that actually worked.",
    name: "Robert Kim",
    role: "Personal Injury Attorney",
    location: "Chicago, IL",
    initials: "RK",
    result: "Found on Gemini",
    bg: "from-green-500/10",
  },
  {
    quote: "We fired our $2,000/month agency in January. Switched to Alphaa. February was our best month for new bookings in 3 years.",
    name: "Priya Sharma",
    role: "Yoga Studio Owner",
    location: "Seattle, WA",
    initials: "PS",
    result: "Best month in 3 years",
    bg: "from-pink-500/10",
  },
  {
    quote: "I showed my accountant. He said it's the best ROI of anything I spend on. $99/month versus the $900 I was paying before. No comparison.",
    name: "Dave Torres",
    role: "Plumbing Contractor",
    location: "Dallas, TX",
    initials: "DT",
    result: "10x better ROI",
    bg: "from-cyan-500/10",
  },
]

export function SocialProof() {
  return (
    <section className="py-28 px-4 sm:px-6 border-y border-white/[0.06]">
      <div className="max-w-6xl mx-auto">

        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          Real results
        </p>

        <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-center mb-6 text-balance">
          1,200+ businesses stopped
          <br />
          <span className="text-white/40">paying for SEO that didn't work.</span>
        </h2>

        {/* Metrics bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center">
              <p className="text-3xl font-bold text-white mb-1">{m.value}</p>
              <p className="text-white/40 text-sm">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b ${t.bg} to-transparent p-6 flex flex-col gap-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                  ))}
                </div>
                <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full">
                  {t.result}
                </span>
              </div>
              <p className="text-white/75 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                <div className="w-9 h-9 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-bold flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <BadgeCheck className="w-3.5 h-3.5 text-brand-orange" />
                  </div>
                  <p className="text-white/40 text-xs">{t.role} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
