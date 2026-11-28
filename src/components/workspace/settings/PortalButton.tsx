"use client"

import { useState, type ReactNode } from "react"
import { Button, type ButtonVariant } from "@/components/workspace/ui"

// Opens the secure Stripe billing page (api/stripe/portal). `flow` jumps straight to one task:
// "cancel" = Stripe's own cancel confirmation, "update" = switch plan, "card" = change the card.
// If Stripe can't start that task, the route falls back to the main billing page.
export type PortalFlow = "cancel" | "update" | "card"

export function PortalButton({ flow, children, variant = "secondary", size, fallbackHref }: {
  flow?: PortalFlow
  children: ReactNode
  variant?: ButtonVariant
  size?: "sm"
  /** Shopify-billed accounts: go here instead. */
  fallbackHref?: string | null
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (fallbackHref) return <Button variant={variant} size={size} href={fallbackHref}>{children}</Button>
  async function go() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(flow ? { flow } : {}) })
      const data = await res.json().catch(() => ({}))
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(res.status === 404 ? "I can’t find a paid plan to open yet. Email hi@alphaa.app and a real person will sort it out today." : "That didn’t open. Try again in a minute.")
    } catch {
      setError("That didn’t open. Try again in a minute.")
    }
    setBusy(false)
  }
  return (
    <span className="xs-portal">
      <Button variant={variant} size={size} loading={busy} onClick={go}>{children}</Button>
      {error && <span role="alert" className="xs-err">{error}</span>}
    </span>
  )
}
