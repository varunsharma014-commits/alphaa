"use client"

import { useState } from "react"

// Shown while an extra website (lib/sites.ts) is being set up: the owner can drop it and go
// back to their other websites. Removing only works while the website has no plan.
export function NewSiteBar({ siteId }: { siteId: string }) {
  const [busy, setBusy] = useState(false)
  async function cancel() {
    setBusy(true)
    await fetch(`/api/sites?id=${encodeURIComponent(siteId)}`, { method: "DELETE" }).catch(() => null)
    window.location.href = "/dashboard"
  }
  return (
    <div role="status" style={{ maxWidth: 640, margin: "16px auto 0", padding: "10px 14px", border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, fontSize: 14, background: "#fff", color: "#111", display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
      <span>You’re adding a new website. It gets its own plan and its own results.</span>
      <button type="button" onClick={cancel} disabled={busy} style={{ font: "inherit", fontSize: 14, background: "none", border: 0, padding: 0, textDecoration: "underline", cursor: "pointer", color: "inherit", whiteSpace: "nowrap" }}>
        {busy ? "Going back…" : "Cancel, go back"}
      </button>
    </div>
  )
}
