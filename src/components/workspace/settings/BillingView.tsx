"use client"

import { useState } from "react"
import { Button, ConfirmSheet, PageHeader, Pill, SettingsSection, type Tone } from "@/components/workspace/ui"
import { UsageCard } from "@/components/dashboard/UsageCard"
import { UpgradeButton } from "@/app/(dashboard)/dashboard/upgrade/UpgradeButton"
import { PortalButton } from "./PortalButton"
import { SettingsTabs } from "./SettingsTabs"
import type { BillingSummary } from "@/lib/billing-summary"
import "./settings.css"

// Plan & billing: which plan, what it costs, when the next charge is and which card pays, then
// this month's usage, the Growth ad-account stepper (only while Growth is on sale) and a quiet
// cancel row that opens Stripe's own cancel confirmation (not the general billing page).
export type BillingData = {
  summary: BillingSummary
  planName: string | null
  shopifyUrl: string | null
  adAccounts: { extra: number; monthly: number; annual: number; plan: number } | null
}

const DATE: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", DATE)
const money = (n: number, cur: string | null) => (cur && cur !== "USD" ? `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${cur}` : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`)
const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", jcb: "JCB", unionpay: "UnionPay", diners: "Diners Club" }

function statusPill(s: BillingSummary): { tone: Tone; text: string } | null {
  if (s.source === "comped") return { tone: "ok", text: "Full access" }
  if (s.source === "none") return { tone: "idle", text: "No plan yet" }
  if (s.endsAt) return { tone: "warn", text: `Ends ${day(s.endsAt)}` }
  if (s.status === "past_due" || s.status === "unpaid") return { tone: "bad", text: "Payment failed" }
  if (s.status === "active" || s.status === "trialing") return { tone: "ok", text: "Active" }
  return { tone: "idle", text: s.status }
}

export function BillingView({ data }: { data: BillingData }) {
  const { summary: s, shopifyUrl, adAccounts } = data
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pill = statusPill(s)
  const stripe = s.source === "stripe"

  async function cancel() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flow: "cancel" }) })
      const d = await res.json().catch(() => ({}))
      if (d.url) {
        window.location.href = d.url
        return
      }
      setError("That didn’t open. Try again in a minute, or email hi@alphaa.app.")
    } catch {
      setError("That didn’t open. Try again in a minute, or email hi@alphaa.app.")
    }
    setBusy(false)
    setAsking(false)
  }

  const price = stripe && s.amount ? `${money(s.amount, s.currency)} a ${s.interval === "year" ? "year" : "month"}` : null

  return (
    <>
      <PageHeader title="Plan & billing" sub="Your plan, what it costs and when you pay next." tabs={<SettingsTabs />} />
      <div className="xs-stack">
        <section className="ax-card xs-hero">
          <div className="xs-hero__top">
            <div>
              <div className="xs-hero__k">Your plan</div>
              <div className="xs-hero__n">
                <b>{s.source === "comped" ? "Every feature" : data.planName ?? "No plan yet"}</b>
                {pill && <Pill tone={pill.tone} dot>{pill.text}</Pill>}
              </div>
              {s.source === "comped" && <p className="xs-hero__p">Your account has every plan’s features at no charge.</p>}
              {s.source === "shopify" && <p className="xs-hero__p">Billed through Shopify. Change or cancel it in Shopify.</p>}
              {s.source === "none" && <p className="xs-hero__p">Pick a plan and I start on your marketing the same day.</p>}
              {price && <p className="xs-hero__p"><b>{price}</b>{s.discounted ? " before your discount" : ""}{s.extraAdAccounts ? `, including ${s.extraAdAccounts} extra ad account${s.extraAdAccounts === 1 ? "" : "s"}` : ""}</p>}
              {stripe && (s.nextChargeAt || s.endsAt) && (
                <p className="xs-hero__p">{s.endsAt ? <>Your plan stays on until <b>{day(s.endsAt)}</b>. No more charges after that.</> : <>Next charge on <b>{day(s.nextChargeAt!)}</b>{s.card ? <> to your {BRAND[s.card.brand] ?? s.card.brand} ending <b>{s.card.last4}</b></> : null}.</>}</p>
              )}
            </div>
            <div className="xs-row">
              {s.source !== "comped" && <Button variant="primary" href={s.source === "shopify" && shopifyUrl ? shopifyUrl : "/dashboard/upgrade"}>{s.source === "none" ? "See the plans" : "Change plan"}</Button>}
              {s.source === "comped" && <Button href="/dashboard/upgrade">See the plans</Button>}
            </div>
          </div>
        </section>

        {stripe && (
          <SettingsSection title="Payment and invoices" text="Change the card you pay with, update your billing details or download past invoices.">
            <div className="xs-row">
              <PortalButton flow="card">{s.card ? "Change card" : "Add a card"}</PortalButton>
              <PortalButton>Invoices and billing details</PortalButton>
            </div>
            <p className="xs-fine">Opens a secure Stripe page, then brings you back here.</p>
          </SettingsSection>
        )}

        {adAccounts && (
          <SettingsSection title="Ad accounts" text={`Growth includes 1 ad account in total, Google or Meta. Running both takes 1 more. Each extra one is $${adAccounts.monthly} a month ($${adAccounts.annual} a month billed yearly).`}>
            <UpgradeButton plan="growth" value={adAccounts.plan} addon={{ monthly: adAccounts.monthly }} initialExtra={adAccounts.extra} label="Update ad accounts" />
            <p className="xs-fine">You pay only the difference for the rest of this billing period.</p>
          </SettingsSection>
        )}

        <UsageCard />

        {(stripe || s.source === "shopify") && (
          <SettingsSection title="Cancel your plan" text="Your plan stays on until the end of the period you paid for, and I keep your data in case you come back.">
            <div className="xs-row">
              {s.source === "shopify" && shopifyUrl ? (
                <Button variant="ghost" href={shopifyUrl}>Cancel in Shopify</Button>
              ) : s.endsAt ? (
                <PortalButton>Keep my plan</PortalButton>
              ) : (
                <Button variant="ghost" onClick={() => setAsking(true)}>Cancel my plan</Button>
              )}
            </div>
            {error && <p role="alert" className="xs-err">{error}</p>}
            <p className="xs-fine">Something not working for you? Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a> first. A real person reads every message.</p>
          </SettingsSection>
        )}
      </div>

      <ConfirmSheet
        open={asking}
        onClose={() => setAsking(false)}
        busy={busy}
        danger
        title="Cancel your plan?"
        text={`I stop new work at the end of this billing period${s.nextChargeAt ? `, on ${day(s.nextChargeAt)}` : ""}. Nothing is charged after that, and anything already published stays live. Next, Stripe asks you to confirm.`}
        confirmLabel="Continue to cancel"
        cancelLabel="Keep my plan"
        onConfirm={() => void cancel()}
      />
    </>
  )
}
