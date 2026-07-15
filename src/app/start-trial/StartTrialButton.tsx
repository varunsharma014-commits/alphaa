"use client"

import { useState } from "react"

export function StartTrialButton({ priceId, label }: { priceId: string; label: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed")
      window.location.href = data.url
    } catch {
      setError("Something went wrong starting your trial. Try again, or email us and we’ll set you up: hi@alphaa.app")
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={loading}
        className="btn-orange w-full py-3.5 text-base font-semibold disabled:opacity-60"
      >
        {loading ? "Opening secure checkout…" : label}
      </button>
      {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
    </div>
  )
}
