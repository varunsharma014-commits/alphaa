"use client"

import { useState } from "react"
import { GlassCard } from "@/components/common/GlassCard"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ExternalLink, CreditCard } from "lucide-react"

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
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
          Open billing portal
        </OrangePillButton>
      </GlassCard>

      <GlassCard>
        <h2 className="text-fg font-medium mb-2">Cancel subscription</h2>
        <p className="text-muted text-sm leading-relaxed mb-4">
          Before you go — would you like to pause your account for one month at no charge? Your data stays safe and you can reactivate anytime.
        </p>
        <div className="flex items-center gap-3">
          <OrangePillButton href="/pricing" size="sm">Keep my plan</OrangePillButton>
          <button onClick={openPortal} className="text-muted text-sm hover:text-fg transition-colors">
            Cancel anyway →
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
