"use client"

import { useState } from "react"
import { GlassCard } from "@/components/common/GlassCard"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ExternalLink, CreditCard } from "lucide-react"

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error()
    } catch {
      setError(
        "We couldn't open your billing page — this usually means your trial hasn't been converted to a paid plan yet. Email hi@alphaa.app and we'll sort it out right away."
      )
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-fg font-semibold text-2xl">Billing</h1>

      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <h2 className="text-fg font-medium">Subscription</h2>
            <p className="text-muted text-sm">Manage your plan, payment method, and invoices.</p>
          </div>
        </div>
        <OrangePillButton onClick={openPortal} loading={loading} variant="ghost" size="sm">
          <ExternalLink className="w-3.5 h-3.5" />
          Manage my plan
        </OrangePillButton>
        <p className="text-muted/70 text-xs mt-3">
          Opens a secure Stripe page where you can change your card, download invoices, or
          switch plans.
        </p>
        {error && (
          <p className="text-amber-400 text-xs mt-3 leading-relaxed">{error}</p>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="text-fg font-medium mb-2">Cancel subscription</h2>
        <p className="text-muted text-sm leading-relaxed mb-4">
          You can cancel anytime — your plan stays active until the end of the billing period,
          and your data is kept safe if you come back. Questions before you go? Email{" "}
          <a href="mailto:hi@alphaa.app" className="text-brand-orange hover:underline">
            hi@alphaa.app
          </a>{" "}
          — we read every message.
        </p>
        <button onClick={openPortal} className="text-muted text-sm hover:text-fg transition-colors">
          Cancel my subscription →
        </button>
      </GlassCard>
    </div>
  )
}
