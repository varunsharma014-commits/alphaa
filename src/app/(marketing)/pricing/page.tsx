"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { SectionLabel } from "@/components/common/SectionLabel"
import { GlassCard } from "@/components/common/GlassCard"
import { cn } from "@/lib/utils"
import { FaqSection } from "@/components/marketing/FaqSection"

const plans = [
  {
    name: "Starter",
    monthly: 99,
    annual: 79,
    description: "For a single business ready to stop being invisible.",
    highlight: false,
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
    priceId: { monthly: "starter_monthly", annual: "starter_annual" },
  },
  {
    name: "Pro",
    monthly: 199,
    annual: 159,
    description: "For businesses serious about dominating Google and AI search.",
    highlight: true,
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
    priceId: { monthly: "pro_monthly", annual: "pro_annual" },
  },
]

const billingFaqs = [
  { q: "Is there a free trial?", a: "Yes — 14 days free. You add a card to start but pay nothing until the trial ends, and you can cancel anytime in two clicks." },
  { q: "Can I cancel anytime?", a: "Yes. One click in your dashboard. No phone calls, no contracts." },
  { q: "What happens after the trial?", a: "Your subscription starts automatically on day 15 unless you cancel first. We email you before that happens — no surprises." },
  { q: "Can I switch plans?", a: "Yes. Upgrade or downgrade anytime from your billing settings." },
  { q: "Do you offer refunds?", a: "We offer a full refund within 7 days of your first charge if you're not satisfied. No questions asked." },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Launch banner */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-sm font-medium">
            🔥 Launch pricing: early customers lock in <span className="text-white">$79/month for life</span> with the annual plan
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <SectionLabel className="mb-3 block">Pricing</SectionLabel>
          <h1 className="text-[34px] sm:text-[48px] lg:text-[54px] font-semibold leading-[1.08] tracking-[-0.02em] text-white mb-4 text-balance">
            From $99/month.{" "}
            <span className="serif-italic text-brand-orange">No contracts.</span>
          </h1>
          <p className="text-muted text-lg">14-day free trial. $0 today. Cancel anytime before day 15 and pay nothing.</p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={cn("text-sm", !annual ? "text-white" : "text-muted")}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors duration-200",
              annual ? "bg-brand-orange" : "bg-white/10"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                annual ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-sm", annual ? "text-white" : "text-muted")}>
            Annual <span className="text-brand-orange font-medium">save 20%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "glass-card rounded-card p-8 relative flex flex-col",
                plan.highlight && "border-brand-orange/30 shadow-glow-sm"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-white font-semibold text-xl mb-1">{plan.name}</h2>
                <p className="text-muted text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="mono text-white text-4xl font-medium">
                    ${annual ? plan.annual : plan.monthly}
                  </span>
                  <span className="text-muted text-sm">/month</span>
                </div>
                {annual && (
                  <p className="text-muted/60 text-xs mt-1">Billed annually (${(annual ? plan.annual : plan.monthly) * 12}/yr)</p>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <OrangePillButton
                href={`/signup?plan=${plan.priceId[annual ? "annual" : "monthly"]}`}
                variant={plan.highlight ? "primary" : "ghost"}
                className="w-full justify-center"
                size="md"
              >
                {plan.cta} →
              </OrangePillButton>
            </div>
          ))}
        </div>

        {/* Billing FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-white font-semibold text-lg text-center mb-6">Billing questions</h3>
          <div className="space-y-2">
            {billingFaqs.map((faq) => (
              <GlassCard key={faq.q} className="py-4 px-5">
                <p className="text-white text-sm font-medium mb-1">{faq.q}</p>
                <p className="text-muted text-sm">{faq.a}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
