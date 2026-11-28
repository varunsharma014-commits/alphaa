"use client"

import { useState } from "react"
import { track } from "@/lib/gtag"
import { Button } from "@/components/workspace/ui"

/**
 * Switches the plan on the current subscription (api/stripe/checkout). With `addon` (Growth, only
 * while Growth is on sale) it shows a stepper for extra ad accounts ($200/mo each) and sends
 * `extraAdAccounts`. `initialExtra` = what the subscription has now (billing page). `annual` asks
 * for the yearly price (a subscription already billed yearly stays yearly either way).
 */
export function UpgradeButton({ plan, value, addon, initialExtra = 0, label, annual = false, variant = "primary" }: {
  plan: "pro" | "growth"
  value: number
  addon?: { monthly: number; max?: number }
  initialExtra?: number
  label?: string
  annual?: boolean
  variant?: "primary" | "secondary"
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extra, setExtra] = useState(initialExtra)
  const max = addon?.max ?? 20

  async function go() {
    if (busy) return
    setBusy(true)
    setError(null)
    const total = value + (addon ? extra * addon.monthly : 0)
    track("begin_checkout", { value: total, currency: "USD", plan })
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchase: plan, annual, ...(addon ? { extraAdAccounts: extra } : {}) }) })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? "That didn’t go through. Try again in a minute.")
    } catch {
      setError("That didn’t go through. Try again in a minute.")
    }
    setBusy(false)
  }

  return (
    <div className="xs-up">
      {addon ? (
        <div className="xs-step">
          <span className="xs-step__l">Extra ad accounts<small>1 is included{extra ? ` · +$${(extra * addon.monthly).toLocaleString("en-US")} a month` : ""}</small></span>
          <div className="xs-step__c">
            <button type="button" aria-label="One fewer extra ad account" disabled={extra <= 0 || busy} onClick={() => setExtra((n) => Math.max(0, n - 1))}>−</button>
            <span aria-live="polite">{extra}</span>
            <button type="button" aria-label="One more extra ad account" disabled={extra >= max || busy} onClick={() => setExtra((n) => Math.min(max, n + 1))}>+</button>
          </div>
        </div>
      ) : null}
      <Button variant={variant} loading={busy} onClick={go}>
        {label ?? (plan === "pro" ? "Switch to Pro" : "Switch to Growth")}
      </Button>
      {error ? <p role="alert" className="xs-err">{error}</p> : null}
    </div>
  )
}
