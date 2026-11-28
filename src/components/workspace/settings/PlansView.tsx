"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Button, Glyph, PageHeader, Pill, PlanCard, PlanGrid, SectionHeader, Segmented } from "@/components/workspace/ui"
import { UpgradeButton } from "@/app/(dashboard)/dashboard/upgrade/UpgradeButton"
import { PortalButton } from "./PortalButton"
import "./settings.css"

// The Plans page (/dashboard/upgrade): the same three plans as the marketing pricing page,
// Growth → Pro (Recommended) → Starter, with a Monthly / Yearly switch. Prices and features are
// passed in from PLAN_PRICES / plan-features (never typed here). The button on each card depends
// on where the owner is now: their plan = Manage billing; a plan up = switch now (prorated on the
// same subscription); a plan down = through billing, so nobody ends up with two subscriptions.
export type PlanKey = "starter" | "pro" | "growth"
export type PlanInfo = {
  key: PlanKey
  name: string
  tagline: string
  monthly: number
  annual: number
  annualTotal: number
  /** "Everything in Pro" style first line, shown as the "plus" header. */
  includes: string | null
  features: string[]
}
export type CompareRow = { label: string; sub?: string; values: Record<PlanKey, string | boolean> }
export type PlansData = {
  plans: PlanInfo[]
  /** The plan they pay for now (null for comped accounts). */
  current: PlanKey | null
  comped: boolean
  /** Their Stripe subscription is billed yearly (null = not billed by Stripe / unknown). */
  billedYearly: boolean | null
  /** Shopify-billed: plan changes happen on this Shopify page. */
  shopifyUrl: string | null
  growthOnSale: boolean
  growthHref: string
  growthCta: string
  extraAd: { monthly: number; annual: number }
  extraAdsNow: number
  discount: number
  asked: PlanKey | null
  compare: CompareRow[]
}

const RANK: Record<PlanKey, number> = { starter: 0, pro: 1, growth: 2 }
const usd = (n: number) => `$${n.toLocaleString("en-US")}`

export function PlansView({ data }: { data: PlansData }) {
  const [yearly, setYearly] = useState(data.billedYearly === true)
  const { current, comped, shopifyUrl } = data

  useEffect(() => {
    if (!data.asked) return
    const el = document.getElementById(`plan-${data.asked}`)
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })
  }, [data.asked])

  const currentName = current ? data.plans.find((p) => p.key === current)?.name : null
  const sub = comped
    ? "Your account has every feature at no charge, so there’s nothing to change here."
    : currentName
      ? `You’re on ${currentName}${data.billedYearly ? ", billed yearly" : data.billedYearly === false ? ", billed monthly" : ""}. Switch whenever you like.`
      : "Pick the plan that fits. Switch or cancel any time."

  function cta(p: PlanInfo): { node: ReactNode; fine?: ReactNode } {
    if (comped) return { node: <Button disabled>Included with your account</Button> }
    if (current === p.key) return { node: <Button href={shopifyUrl ?? "/dashboard/settings/billing"}>{shopifyUrl ? "Manage in Shopify" : "Manage billing"}</Button> }
    const up = current === null || RANK[p.key] > RANK[current]
    if (!up) {
      return {
        node: <PortalButton flow="update" fallbackHref={shopifyUrl}>Switch to {p.name}</PortalButton>,
        fine: shopifyUrl ? "Plan changes happen in Shopify." : "Opens your secure billing page, where you confirm the change.",
      }
    }
    if (p.key === "growth" && shopifyUrl) return { node: <Button disabled>Not on Shopify yet</Button>, fine: "Growth isn’t available for Shopify stores yet." }
    if (shopifyUrl) return { node: <Button variant="primary" href={shopifyUrl}>Switch in Shopify</Button>, fine: "Plan changes happen in Shopify." }
    if (p.key === "growth" && !data.growthOnSale) {
      return { node: <Button href={data.growthHref}>{data.growthCta}</Button>, fine: "Ads open as Google and Meta approve access. Nobody is charged until then." }
    }
    const price = yearly ? p.annual : p.monthly
    const stayYearly = data.billedYearly === true && !yearly
    return {
      node: (
        <UpgradeButton
          plan={p.key as "pro" | "growth"}
          value={price}
          annual={yearly || data.billedYearly === true}
          addon={p.key === "growth" ? { monthly: yearly ? data.extraAd.annual : data.extraAd.monthly } : undefined}
          initialExtra={p.key === "growth" ? data.extraAdsNow : 0}
          variant="primary"
          label={`Switch to ${p.name}`}
        />
      ),
      fine: stayYearly
        ? "You’re billed yearly, so this switches at the yearly price. You pay only the difference for the rest of this year."
        : "Your plan switches today. You pay only the difference for the rest of this billing period.",
    }
  }

  return (
    <div className="xs-page wide">
      <PageHeader
        title="Plans"
        sub={sub}
        pill={comped ? <Pill tone="ok">Full access</Pill> : undefined}
      />

      <div className="xs-bill">
        <Segmented
          label="Billing period"
          value={yearly ? "y" : "m"}
          onChange={(v) => setYearly(v === "y")}
          options={[
            { value: "m", label: "Monthly" },
            { value: "y", label: <>Yearly<span className="xs-save">Save {data.discount}%</span></> },
          ]}
        />
      </div>

      <div className="xs-plans">
        <PlanGrid>
          {data.plans.map((p) => {
            const { node, fine } = cta(p)
            const isCur = !comped && current === p.key
            const rec = p.key === "pro"
            const early = p.key === "growth" && !data.growthOnSale
            const extra = p.key === "growth" ? `+${usd(yearly ? data.extraAd.annual : data.extraAd.monthly)} a month for each extra ad account` : null
            return (
              <PlanCard
                key={p.key}
                id={`plan-${p.key}`}
                highlight={data.asked === p.key}
                name={p.name}
                current={isCur}
                recommended={rec && !isCur}
                status={isCur ? <Pill tone="ok">Your plan</Pill> : early ? <Pill tone="warn">Early access</Pill> : rec ? <Pill tone="info">Recommended</Pill> : undefined}
                price={usd(yearly ? p.annual : p.monthly)}
                per="/month"
                was={<>{yearly ? `${usd(p.annualTotal)} billed once a year` : "Billed monthly, cancel any time"}{extra && <div className="xs-extra">{extra}</div>}</>}
                text={<span className="xs-tag">{p.tagline}</span>}
                includes={p.includes ? `${p.includes}, plus:` : "What you get:"}
                features={p.features}
                cta={node}
                fine={fine}
              />
            )
          })}
        </PlanGrid>
      </div>

      <SectionHeader title="Compare plans" sub="What each plan includes, side by side." />
      <section className="ax-card xs-card">
        <table className="xs-cmp">
          <caption className="sr-only">Plan comparison</caption>
          <colgroup><col className="f" /><col /><col /><col /></colgroup>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Feature</span></th>
              {data.plans.map((p) => <th key={p.key} scope="col" className={p.key === "pro" ? "rec" : undefined}>{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.compare.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}{r.sub && <span className="sub">{r.sub}</span>}</th>
                {data.plans.map((p) => {
                  const v = r.values[p.key]
                  return (
                    <td key={p.key} className={p.key === "pro" ? "rec" : undefined}>
                      {v === true ? <span className="yes" aria-label="Included"><Glyph name="check" size={16} stroke={2.4} /></span>
                        : v === false ? <span className="no" aria-label="Not included"><Glyph name="x" size={14} stroke={2} /></span>
                          : <span className="v">{v}</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="xs-foot">
        Prices in US dollars. Month to month, or {data.discount}% off billed yearly. Cancel online any time. Questions? Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a> and a real person replies.
      </p>
    </div>
  )
}
