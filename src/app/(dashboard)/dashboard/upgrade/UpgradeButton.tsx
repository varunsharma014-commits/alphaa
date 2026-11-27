"use client"

import { useState } from "react"
import { track } from "@/lib/gtag"

/**
 * Switches the plan on the current subscription (api/stripe/checkout). With `addon` (Growth, only
 * while Growth is on sale) it shows a quantity stepper for extra ad accounts ($200/mo each) and
 * sends `extraAdAccounts`. `initialExtra` = what the subscription has now (billing page).
 */
export function UpgradeButton({ plan, value, addon, initialExtra = 0, label }: { plan: "pro" | "growth"; value: number; addon?: { monthly: number; max?: number }; initialExtra?: number; label?: string }) {
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
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchase: plan, ...(addon ? { extraAdAccounts: extra } : {}) }) })
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

  const step = { width: 32, height: 32, borderRadius: 999, border: "1px solid var(--ds-line, #d2d2d7)", background: "transparent", fontSize: 16, cursor: "pointer" } as const
  return (
    <div>
      {addon ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "var(--ds-text)" }}>Extra ad accounts</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" aria-label="One fewer extra ad account" style={step} disabled={extra <= 0 || busy} onClick={() => setExtra((n) => Math.max(0, n - 1))}>−</button>
            <span aria-live="polite" style={{ minWidth: 24, textAlign: "center", fontVariantNumeric: "tabular-nums", fontSize: 15 }}>{extra}</span>
            <button type="button" aria-label="One more extra ad account" style={step} disabled={extra >= max || busy} onClick={() => setExtra((n) => Math.min(max, n + 1))}>+</button>
          </div>
          <span style={{ fontSize: 13, color: "var(--ds-text-mute)" }}>
            1 included{extra ? ` · +$${(extra * addon.monthly).toLocaleString("en-US")} a month` : ""}
          </span>
        </div>
      ) : null}
      <button type="button" onClick={go} disabled={busy} style={{ padding: "10px 18px", borderRadius: 999, background: "#000", color: "#fff", fontSize: 14, border: 0, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "Switching…" : label ?? (plan === "pro" ? "Switch to Pro" : "Switch to Growth")}
      </button>
      {error ? <p role="alert" style={{ fontSize: 13, color: "#b42318", marginTop: 8 }}>{error}</p> : null}
    </div>
  )
}
