"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { V3Page, Frame, Section, ServicePills, FinalCta, type SvcKey } from "@/components/marketing/v3"
import { ExBox, Note, Engines } from "@/components/marketing/v3/pages/Examples"
import { plans, billingFaqs } from "./pricing-data"
import { GUARANTEE_LINE, RENEWAL_LINE } from "@/lib/offer-copy"
import { BRAND } from "@/lib/brand"

const A = BRAND.agentName

// Each plan gets its own example "product shot": what that plan looks like in use.
const ART: Record<string, { tone: SvcKey; art: React.ReactNode }> = {
  Starter: {
    tone: "se",
    art: (
      <>
        <Note title="Posted to Google" body="“Now booking same-week cleanings — call or book online.” Your 2nd post this week." />
        <Engines items={[{ name: "ChatGPT", ok: true }, { name: "Gemini", ok: true }, { name: "Claude", ok: false }, { name: "Perplexity", ok: true }]} />
      </>
    ),
  },
  Pro: {
    tone: "ad",
    art: <Note title="3 locations this week" body="Downtown named 4 of 4. Northside 3 of 4. Westlake 2 of 4 — Smile Studio got the other two. Here’s what they have that you don’t." />,
  },
  Growth: {
    tone: "mk",
    art: (
      <>
        <Note title="This week’s marketing is ready" body="A blog post, 2 Google updates and 3 social posts, all in your voice. Tap once to approve." />
        <Note title="Your Google ads are built" body="Aimed at people near you searching for what you sell. Paused until you approve the budget." />
      </>
    ),
  },
  "Full Service": {
    tone: "em",
    art: <Note title="Published to your website" body="Your new FAQ page and structured facts are live. A person on our team did it — you didn’t touch a thing." />,
  },
}

// Agency vs agent: same rows and numbers as before (apple/Sections AgencyToggle).
const ROWS: [string, string, string][] = [
  ["The report", "A monthly PDF full of jargon and vanity metrics. You have no idea if it worked.", "One line: what I did today, what changed, what I need from you."],
  ["The contract", "6-month minimums, 12-month contracts, exit fees. Locked in before they deliver.", "Month to month. Cancel online in a minute. I only stay if I keep earning it."],
  ["The scope", "Usually one channel per retainer. Ask about ChatGPT or Claude and many stumble.", "SEO and AI search, content and reviews on every plan. Social, ads and email on Growth (early access)."],
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
            Your whole marketing.<br /><span className="v3-blue">Run by an AI Agent. From $99/month.</span>
          </h1>
          <p className="v3-lede">SEO and AI search, blog and Google posts, and review replies on every plan. Social, ads and email on Growth (early access). Month to month, no contracts, no technical skills needed.</p>
          <p style={{ fontSize: 15, margin: "14px auto 0", maxWidth: "60ch" }}><b>90-day AI Visibility Guarantee:</b> {GUARANTEE_LINE}</p>

          <div className="v3-chips" role="tablist" aria-label="Billing period">
            <button type="button" role="tab" className="v3-chip" aria-selected={!annual} onClick={() => setAnnual(false)}>Monthly</button>
            <button type="button" role="tab" className="v3-chip" aria-selected={annual} onClick={() => setAnnual(true)}>Annual · save 20%</button>
          </div>

          <div className="pg-plans">
            {plans.map((plan) => {
              const a = ART[plan.name]
              const price = annual ? plan.annual : plan.monthly
              const href = "href" in plan && plan.href ? plan.href : `/signup?plan=${plan.priceId[annual ? "annual" : "monthly"]}`
              return (
                <article key={plan.name} className={cn("pg-plan", `v3-c-${a.tone}`, plan.highlight && "pg-plan--hi")}>
                  <ExBox tone={a.tone}>{a.art}</ExBox>
                  <div className="pg-plan__body">
                    {"badge" in plan && plan.badge && <div className="pg-plan__badge">{plan.badge}</div>}
                    <h2>{plan.name}</h2>
                    <p className="pg-plan__desc">{plan.description}</p>
                    <div className="pg-plan__price"><b>${price}</b><span>/month</span></div>
                    <div className="pg-plan__note">
                      {"monthlyOnly" in plan && plan.monthlyOnly ? (plan.name === "Growth" ? "Monthly only · ad spend paid to Google and Meta" : "Monthly only — human-fulfilled service") : annual ? `Billed annually ($${price * 12}/yr)` : "Month to month · cancel anytime"}
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

        <FinalCta title={<>Run the business.<br /><span>I’ll run the marketing.</span></>} sub="Month to month. Cancel online in a minute." />
      </Frame>
    </V3Page>
  )
}
