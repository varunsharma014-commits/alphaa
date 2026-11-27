"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { V3Page, Frame, Section, ServicePills, FinalCta, type SvcKey } from "@/components/marketing/v3"
import { ExBox, Note, Engines } from "@/components/marketing/v3/pages/Examples"
import { plans, billingFaqs, planHref, ANNUAL_LABEL } from "./pricing-data"
import { GUARANTEE_LINE, RENEWAL_LINE } from "@/lib/offer-copy"
import { BRAND } from "@/lib/brand"

const A = BRAND.agentName

// Each plan gets its own example "product shot": what that plan looks like in use.
const ART: Record<string, { tone: SvcKey; art: React.ReactNode }> = {
  Starter: {
    tone: "se",
    art: (
      <>
        <Note title="A wrong fact, fixed" body="Gemini said you close at 5pm on Saturdays. You confirmed 2pm, and I published the correction." />
        <Engines items={[{ name: "ChatGPT", ok: true }, { name: "Gemini", ok: true }, { name: "Claude", ok: false }, { name: "Perplexity", ok: true }]} />
      </>
    ),
  },
  Pro: {
    tone: "ad",
    art: (
      <>
        <Note title="This week’s social posts are ready" body="3 posts with images in your brand colours, for Facebook, Instagram and LinkedIn. Tap once to approve." />
        <Note title="This month’s email is ready" body="A short note to past customers who said yes to hearing from you. Tap once to send." />
      </>
    ),
  },
  Growth: {
    tone: "mk",
    art: (
      <>
        <Note title="When ads open: your first ads" body="2 Facebook & Instagram ads and 1 Google search ad, built from what people search for. Nothing spends until you approve." />
      </>
    ),
  },
}

// Agency vs agent: same rows and numbers as before (apple/Sections AgencyToggle).
const ROWS: [string, string, string][] = [
  ["The report", "A monthly PDF full of jargon and vanity metrics. You have no idea if it worked.", "One line: what I did today, what changed, what I need from you."],
  ["The contract", "6-month minimums, 12-month contracts, exit fees. Locked in before they deliver.", "Month to month. Cancel online in a minute. I only stay if I keep earning it."],
  ["The scope", "Usually one channel per retainer. Ask about ChatGPT or Claude and many stumble.", "AI search on every plan. Social media, Google listing, reviews, email and lead tracking on Pro. Google and Meta ads on Growth (early access)."],
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <V3Page>
      <Frame top>
        <Section center>
          <ServicePills />
          <p className="v3-muted" style={{ fontSize: 15, margin: "0 auto 18px" }}>
            Search marketing agencies often charge $1,000+ a month. Your marketing agent starts at <b style={{ color: "var(--v-fg)" }}>$99</b>.
          </p>
          <h1 className="v3-h1">
            All your marketing.<br /><span className="v3-blue">Run by an AI Agent. From $99/month.</span>
          </h1>
          <p className="v3-lede">Starter gets you named by ChatGPT, Gemini, Claude and Perplexity. Pro is everything except ads: social media, Google listing posts, review replies, email and lead tracking. Growth adds Google and Meta ads (early access). Month to month, or 15% off billed yearly. No contracts, no technical skills needed.</p>
          <p style={{ fontSize: 15, margin: "14px auto 0", maxWidth: "60ch" }}><b>90-day AI Visibility Guarantee:</b> {GUARANTEE_LINE}</p>

          <div className="v3-chips" role="tablist" aria-label="Billing period">
            <button type="button" role="tab" className="v3-chip" aria-selected={!annual} onClick={() => setAnnual(false)}>Monthly</button>
            <button type="button" role="tab" className="v3-chip" aria-selected={annual} onClick={() => setAnnual(true)}>{ANNUAL_LABEL}</button>
          </div>

          <div className="pg-plans">
            {plans.map((plan) => {
              const a = ART[plan.name]
              const price = annual ? plan.annual : plan.monthly
              const href = planHref(plan, annual)
              return (
                <article key={plan.name} className={cn("pg-plan", `v3-c-${a.tone}`, plan.highlight && "pg-plan--hi")}>
                  <ExBox tone={a.tone}>{a.art}</ExBox>
                  <div className="pg-plan__body">
                    {plan.badge && <div className="pg-plan__badge">{plan.badge}</div>}
                    <h2>{plan.name}</h2>
                    <p className="pg-plan__desc">{plan.description}</p>
                    <div className="pg-plan__price"><b>${price}</b><span>/month</span></div>
                    <div className="pg-plan__note">
                      {annual ? `Billed yearly: $${plan.annualTotal.toLocaleString("en-US")}/yr` : "Month to month · cancel anytime"}
                      {plan.extra && <><br /><b style={{ color: "var(--v-fg)" }}>{annual ? plan.extra.annual : plan.extra.monthly}</b></>}
                      {plan.href && <><br />Early access: nobody is charged until ads open.</>}
                    </div>
                    {href.startsWith("mailto:") ? <a href={href} className={cn("v3-btn", !plan.highlight && "v3-btn--ghost")}>{plan.cta}</a> : <Link href={href} className={cn("v3-btn", !plan.highlight && "v3-btn--ghost")}>{plan.cta}</Link>}
                    <p className="pg-plan__fine">{GUARANTEE_LINE} {RENEWAL_LINE}</p>
                    <ul>
                      {plan.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                </article>
              )
            })}
          </div>
        </Section>

        <Section center>
          <h2 className="v3-h2">Agencies often charge $1,000+ a month<br /><span className="v3-blue">for marketing an AI Agent now runs for you.</span></h2>
          <p className="v3-lede">Keep the money, get your time back, and show up where customers search and ask today.</p>
          <div className="pg-vs">
            <div className="pg-vs__col">
              <div className="pg-vs__name">Marketing agency (example)</div>
              <div className="pg-vs__price"><b>$1,000+</b><span>/mo</span></div>
              <div className="pg-vs__year">for example, $12,000+ a year</div>
              {ROWS.map(([k, them]) => <div key={k}><h3>{k}</h3><p>{them}</p></div>)}
            </div>
            <div className="pg-vs__col pg-vs__col--us">
              <div className="pg-vs__name">{A}</div>
              <div className="pg-vs__price"><b>$99</b><span>/mo</span></div>
              <div className="pg-vs__year">$1,188 a year</div>
              {ROWS.map(([k, , us]) => <div key={k}><h3>{k}</h3><p>{us}</p></div>)}
            </div>
            <div className="pg-vs__save">
              <span>For example, against a $1,000 a month agency, save</span>
              <b>$10,812 a year</b>
              <em>…and your marketing still gets done every week.</em>
            </div>
          </div>
        </Section>

        <Section center>
          <h2 className="v3-h2">Billing questions.</h2>
          <div className="v3-faq">
            {billingFaqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </Section>

        <FinalCta title={<>Running a business is hard.<br /><span>Alphaa can help!</span></>} sub="Month to month. Cancel online in a minute." />
      </Frame>
    </V3Page>
  )
}
