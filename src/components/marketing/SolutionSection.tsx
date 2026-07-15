import { OrangePillButton } from "@/components/common/OrangePillButton"

const outcomes = [
  {
    title: "New customers find you on ChatGPT",
    body: "When someone asks 'best plumber in Austin' on ChatGPT, your business comes up. Not your competitor.",
    icon: "💬",
  },
  {
    title: "Google shows you first, not third",
    body: "We post to your Google Business Profile 4x/week. Active profiles rank higher. Your competitors post twice a year. You win.",
    icon: "📍",
  },
  {
    title: "You stop paying $1,000/month for confusion",
    body: "Cancel the agency retainer. $99/month. No contracts. No PDF reports. Just results you can actually see.",
    icon: "💸",
  },
  {
    title: "Your website actually ranks",
    body: "We generate AI-written blogs, FAQs, and service pages for your business and city every month. The content Google and AI both reward.",
    icon: "📄",
  },
]

export function SolutionSection() {
  return (
    <section className="py-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          What this means for you
        </p>

        <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-center mb-6 text-balance">
          Connect in 2 minutes.
          <br />
          <span className="text-white/40">We handle everything else, every week.</span>
        </h2>

        <p className="text-white/50 text-xl text-center mb-16 max-w-2xl mx-auto">
          No developer. No agency. No learning curve. Tell us about your business and Alphaa goes to work — posting, optimizing, tracking — across every AI engine, on autopilot.
        </p>

        {/* Outcome cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {outcomes.map((o) => (
            <div key={o.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-brand-orange/20 hover:bg-brand-orange/[0.03] transition-all duration-200 p-8">
              <p className="text-4xl mb-4">{o.icon}</p>
              <h3 className="text-white font-semibold text-lg mb-3">{o.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{o.body}</p>
            </div>
          ))}
        </div>

        {/* The promise */}
        <div
          className="rounded-2xl border border-brand-orange/20 p-10 text-center"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,26,0.08) 0%, transparent 70%)" }}
        >
          <p className="text-white text-2xl sm:text-3xl font-semibold leading-snug mb-2">
            Most customers see their first AI mention
            <br />
            within <span className="text-brand-orange">2 weeks</span> of joining.
          </p>
          <p className="text-white/40 text-base mt-4 mb-8">14-day free trial. $0 today. Cancel anytime if it doesn't work.</p>
          <OrangePillButton href="/signup" size="lg">
            Start your free trial →
          </OrangePillButton>
        </div>
      </div>
    </section>
  )
}
