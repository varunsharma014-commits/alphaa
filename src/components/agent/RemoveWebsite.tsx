"use client"

import { useEffect, useState } from "react"
import { Button, ConfirmSheet, SettingsSection } from "@/components/workspace/ui"

// Remove an extra website (lib/sites.ts). The owner's first website is the account itself,
// so it has no remove button; a website with a live plan must cancel it first.

type Site = { id: string; name: string; url: string | null; extra: boolean; billed: boolean }

export function RemoveWebsite() {
  const [site, setSite] = useState<Site | null>(null)
  const [asking, setAsking] = useState(false)
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
    setAsking(false)
  }

  return (
    <SettingsSection title="Remove this website" text={site.billed ? `${label} still has a plan. Cancel it first, then you can remove the website here.` : `I stop working on ${label} and delete what I’ve saved for it. Your other websites aren’t affected.`}>
      <div className="xs-row">
        {site.billed
          ? <Button href="/dashboard/settings/billing">Go to Plan &amp; billing</Button>
          : <Button variant="ghost" onClick={() => setAsking(true)}>Remove {label}</Button>}
      </div>
      {error && <p role="alert" className="xs-err">{error}</p>}
      <ConfirmSheet
        open={asking}
        onClose={() => setAsking(false)}
        busy={busy}
        danger
        title={`Remove ${label}?`}
        text="I delete everything I’ve checked, written and saved for it. Anything already published on the website stays there. Your other websites aren’t affected. This can’t be undone."
        confirmLabel="Remove it"
        onConfirm={() => void remove()}
      />
    </SettingsSection>
  )
}
