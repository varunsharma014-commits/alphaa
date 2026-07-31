import Link from "next/link"
import { Check } from "lucide-react"

const PLANS = [
  {
    name: "Starter",
    price: "99",
    description: "For a single business ready to stop being invisible.",
    featured: false,
    features: [
      "1 business location",
      "2 Google Business Profile posts per week",
      "2 AI-optimized blog posts per month",
      "AI visibility tracking (Google, ChatGPT, Perplexity, Gemini)",
      "Weekly performance email",
      "Review monitoring",
      "Email support",
    ],
    cta: "Start free trial",
    href: "/signup?plan=starter_monthly",
  },
  {
    name: "Pro",
    price: "199",
    description: "For businesses serious about dominating Google and AI search.",
    featured: true,
    badge: "Most popular",
    features: [
      "Up to 3 business locations",
      "4 Google Business Profile posts per week",
      "4 AI-optimized blog posts per month",
      "Everything in Starter",
      "Competitor benchmarking",
      "Auto-approval rules for posts",
      "Monthly executive report",
      "Priority chat support",
      "Free setup ($49 value)",
    ],
    cta: "Start free trial",
    href: "/signup?plan=pro_monthly",
  },
  {
    name: "Full Service",
    price: "299",
    description: "Everything in Pro — plus a real person does all the website work for you.",
    featured: false,
    badge: "Done for you",
    features: [
      "Everything in Pro",
      "White-glove setup included — we install all code on your site",
      "A human publishes your monthly blogs & FAQs to your website",
      "Schema & llms.txt maintained for you",
      "Invite-based access — never your passwords",
      "Human turnaround within 2 business days",
    ],
    cta: "Get Full Service",
    href: "/dashboard/concierge",
  },
]

export function HomePricingSection() {
  return (
    <section data-reveal className="py-20 px-4 sm:px-6 bg-white text-[#1d1d1f]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6">Pricing</p>
          <h2 className="text-[40px] sm:text-[64px] font-bold leading-[1.1] tracking-tight mb-4">
            Simple pricing. 14-day free trial.
          </h2>
          <p className="text-[#6e6e73] text-lg">
            $0 today. Cancel anytime before day 14 and pay nothing.{" "}
            <Link href="/pricing" className="text-brand-orange hover:underline underline-offset-4 font-medium">
              See annual pricing →
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[24px] p-8 flex flex-col bg-[#f5f5f7] ${
                plan.featured ? "ring-2 ring-brand-orange shadow-[0_20px_60px_rgb(var(--orange-rgb) / 0.15)] bg-white" : "border border-black/[0.08]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={
                      plan.featured
                        ? "px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-semibold"
                        : "px-3 py-1 rounded-full border border-brand-orange/40 bg-white text-brand-orange text-xs font-semibold"
                    }
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3 className="text-[20px] font-semibold text-[#1d1d1f]">{plan.name}</h3>
              <p className="text-[14px] text-[#6e6e73] mt-2 min-h-[40px]">{plan.description}</p>
              <p className="mt-6 text-[44px] font-semibold text-[#1d1d1f] tracking-tight leading-none">
                ${plan.price}
                <span className="text-[16px] text-[#86868b] font-normal">/mo</span>
              </p>

              <Link
                href={plan.href}
                className={`mt-7 block text-center text-[15px] font-medium px-6 py-3 rounded-full transition-colors ${
                  plan.featured ? "bg-brand-orange hover:bg-brand-orange-light text-white" : "bg-white hover:bg-[#ececee] text-[#1d1d1f] border border-black/[0.08]"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 space-y-3 flex-1">
                {plan.features.map((ft) => (
                  <li key={ft} className="flex items-start gap-2.5 text-[14px] text-[#1d1d1f]">
                    <Check className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
                    {ft}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
