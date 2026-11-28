"use client"

import { useState } from "react"

export function AcceptButton({ token, email }: { token: string; email: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setBusy(true)
    setError(null)
    const res = await fetch("/api/team/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; next?: string } | null
    if (!res?.ok) {
      setBusy(false)
      setError(d?.error ?? "That didn’t work. Try again in a moment.")
      return
    }
    window.location.href = d?.next ?? "/dashboard"
  }

  return (
    <>
      <button onClick={go} disabled={busy} className="w-full rounded-full bg-black text-white py-3.5 text-base font-semibold disabled:opacity-60">
        {busy ? "Joining…" : "Accept and open Alphaa"}
      </button>
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      <p className="mt-4 text-sm text-neutral-500">The invite is for {email}.</p>
    </>
  )
}
