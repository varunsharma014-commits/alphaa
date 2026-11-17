"use client"

import { useState } from "react"
import { track } from "@/lib/gtag"

export function UpgradeButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    if (busy) return
    setBusy(true)
    setError(null)
    track("begin_checkout", { value: 499, currency: "USD", plan: "growth" })
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchase: "growth" }) })
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
    <div>
      <button type="button" onClick={go} disabled={busy} style={{ padding: "10px 18px", borderRadius: 999, background: "#000", color: "#fff", fontSize: 14, border: 0, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "Switching…" : "Switch to Growth"}
      </button>
      {error ? <p role="alert" style={{ fontSize: 13, color: "#b42318", marginTop: 8 }}>{error}</p> : null}
    </div>
  )
}
