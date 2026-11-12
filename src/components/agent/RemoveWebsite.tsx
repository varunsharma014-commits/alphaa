"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { DsCard } from "@/components/dashboard/DsCard"

// Remove an extra website (lib/sites.ts). The owner's first website is the account itself,
// so it has no remove button; a website with a live plan must cancel it first.

type Site = { id: string; name: string; url: string | null; extra: boolean; billed: boolean }

export function RemoveWebsite() {
  const [site, setSite] = useState<Site | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((d: { sites?: Site[]; activeId?: string }) => setSite(d.sites?.find((s) => s.id === d.activeId) ?? null))
      .catch(() => null)
  }, [])

  if (!site?.extra) return null
  const label = site.url || site.name

  async function remove() {
    if (!site) return
    if (!confirm(`Remove ${label} from Alphaa?\n\nI’ll delete everything I’ve checked, written and saved for it. Anything already published on the website stays there. Your other websites aren’t affected.`)) return
    setBusy(true)
    setError(null)
    const r = await fetch(`/api/sites?id=${encodeURIComponent(site.id)}`, { method: "DELETE" }).catch(() => null)
    if (r?.ok) {
      window.location.href = "/dashboard"
      return
    }
    const d = await r?.json().catch(() => ({}))
    setError(d?.error ?? "That didn’t go through. Try again.")
    setBusy(false)
  }

  return (
    <DsCard style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Remove this website</h2>
      {site.billed ? (
        <p style={{ fontSize: 13, color: "var(--ds-text-mute)", lineHeight: 1.5, margin: 0 }}>
          {label} still has a plan. Cancel it in{" "}
          <Link href="/dashboard/settings/billing" style={{ color: "var(--ds-accent)" }}>Billing &amp; plan</Link>
          {" "}first, then you can remove the website here.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--ds-text-mute)", lineHeight: 1.5, margin: "0 0 12px" }}>
            I’ll stop working on {label} and delete what I’ve saved for it. Your other websites aren’t affected.
          </p>
          <button
            onClick={remove}
            disabled={busy}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", color: "var(--ds-bad)", border: "1px solid var(--ds-bad)", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {busy ? "Removing it…" : `Remove ${label}`}
          </button>
          {error && <p style={{ fontSize: 12, color: "var(--ds-bad)", margin: "8px 0 0" }}>{error}</p>}
        </>
      )}
    </DsCard>
  )
}
