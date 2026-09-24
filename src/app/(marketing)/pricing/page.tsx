"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel, AgentNote, EngineChips, Phone } from "@/components/marketing/apple/Mockups"
import { AgencyToggle } from "@/components/marketing/apple/Sections"

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
    cta: "Start today",
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
    cta: "Start today",
    priceId: { monthly: "pro_monthly", annual: "pro_annual" },
  },
  {
    name: "Full Service",
    monthly: 299,
    annual: 299,
    monthlyOnly: true,
    description: "Everything in Pro — plus a real person does all the website work for you.",
    highlight: false,
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
    priceId: { monthly: "fullservice_monthly", annual: "fullservice_monthly" },
  },
]

const billingFaqs = [
  { q: "Is there a free trial?", a: "No — the free check at /start shows you exactly what the AIs say about you today, and that's the trial. Plans are month to month from day one." },
  { q: "Can I cancel anytime?", a: "Yes. Two clicks in Billing. No phone calls, no contracts, no exit fees." },
  { q: "Do I need technical skills?", a: "No. Your agent writes, fixes and publishes; you approve with one tap. If you'd rather not touch your website at all, Full Service has a human do it." },
  { q: "Can I switch plans?", a: "Yes. Upgrade or downgrade anytime from your billing settings." },
  { q: "Do you offer refunds?", a: "We offer a full refund within 7 days of your first charge if you're not satisfied. No questions asked." },
]

// Each plan gets its own "product shot" — what that plan looks like in use.
const ART: Record<string, { tone: "sky" | "lavender" | "sage"; art: React.ReactNode }> = {
  Starter: {
    tone: "sky",
    art: (
      <Phone>
        <AgentNote title="Posted to Google" body="“Now booking same-week cleanings — call or book online.” Your 2nd post this week." />
        <EngineChips items={[{ name: "ChatGPT", ok: true }, { name: "Gemini", ok: true }, { name: "Claude", ok: false }, { name: "Perplexity", ok: true }]} />
      </Phone>
    ),
  },
  Pro: {
    tone: "lavender",
    art: (
      <Phone>
        <AgentNote title="3 locations this week" body="Downtown named 4 of 4. Northside 3 of 4. Westlake 2 of 4 — Smile Studio got the other two. Here’s what they have that you don’t." />
      </Phone>
    ),
  },
  "Full Service": {
    tone: "sage",
    art: (
      <Phone>
        <AgentNote title="Published to your website" body="Your new FAQ page and structured facts are live. A person on our team did it — you didn’t touch a thing." />
      </Phone>
    ),
  },
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <section className="ap-sec" style={{ paddingTop: 120 }}>
        <p className="ap-center" style={{ fontSize: 15, color: "#6e6e73", margin: "0 auto 18px", padding: "0 22px" }}>
          An SEO agency charges ~$2,000 a month for Google alone. Your agent starts at <b style={{ color: "#1d1d1f" }}>$99</b>.
        </p>
        <h1 className="ap-h2 ap-center" style={{ fontSize: "clamp(44px, 7.7vw, 88px)", lineHeight: 1.05, letterSpacing: "-0.015em" }}>
          From $99/month.<br /><span className="ap-quiet">No contracts.</span>
        </h1>
        <p className="ap-lead ap-center">Month to month. Cancel in two clicks. No technical skills needed — your agent does the work.</p>

        <div className="ap-seg" role="tablist" aria-label="Billing period">
          <button role="tab" aria-selected={!annual} className={!annual ? "is-on" : ""} onClick={() => setAnnual(false)}>Monthly</button>
          <button role="tab" aria-selected={annual} className={annual ? "is-on" : ""} onClick={() => setAnnual(true)}>Annual · save 20%</button>
          <span className={cn("ap-seg__thumb", annual && "is-right")} aria-hidden="true" />
        </div>

        <div className="ap-plans">
          {plans.map((plan) => {
            const a = ART[plan.name]
            const price = annual ? plan.annual : plan.monthly
            const href = "href" in plan && plan.href ? plan.href : `/signup?plan=${plan.priceId[annual ? "annual" : "monthly"]}`
            return (
              <article key={plan.name} className={cn("ap-plan", plan.highlight && "ap-plan--hi")}>
                <Panel tone={a.tone}>{a.art}</Panel>
                <div className="ap-plan__body">
                  {"badge" in plan && plan.badge && <div className="ap-plan__badge">{plan.badge}</div>}
                  <h2>{plan.name}</h2>
                  <p className="ap-plan__desc">{plan.description}</p>
                  <div className="ap-plan__price"><b>${price}</b><span>/month</span></div>
                  <div className="ap-plan__note">
                    {"monthlyOnly" in plan && plan.monthlyOnly ? "Monthly only — human-fulfilled service" : annual ? `Billed annually ($${price * 12}/yr)` : "Month to month · cancel anytime"}
                  </div>
                  <Link href={href} className={cn("ap-plan__cta", plan.highlight && "is-primary")}>{plan.cta}</Link>
                  <ul className="ap-plan__list">
                    {plan.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <AgencyToggle />

      <section className="ap-sec ap-sec--grey">
        <h2 className="ap-h2 ap-center">Billing questions.</h2>
        <div className="ap-faq" style={{ marginTop: 24 }}>
          <div className="ap-faq__group">
            {billingFaqs.map((f, i) => (
              <div key={f.q} className={cn("ap-faq__item", open === i && "is-open")}>
                <button className="ap-faq__q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  <span>{f.q}</span>
                  <ChevronDown className="ap-faq__chev" aria-hidden="true" />
                </button>
                <div className="ap-faq__a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
