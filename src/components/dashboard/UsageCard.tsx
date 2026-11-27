"use client"

import { useEffect, useState } from "react"
import { DsCard } from "@/components/dashboard/DsCard"

// "This month" in Your rules: what the plan includes and what I've used, from the usage ledger
// (GET /api/usage → lib/quotas.ts ownerUsage). Real counts only; nothing shown until it loads.
type Line = { label: string; used: number; included: number | null; per: string }

export function UsageCard() {
  const [data, setData] = useState<{ lines: Line[]; since: string } | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let off = false
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => { if (!off) setData(d) })
      .catch(() => { if (!off) setFailed(true) })
    return () => { off = true }
  }, [])
  if (failed) return null
  const started = data && new Date().toISOString().slice(0, 7) === data.since.slice(0, 7)
  return (
    <DsCard style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-text-strong)", marginBottom: 4 }}>This month</h2>
      <p style={{ fontSize: 12, color: "var(--ds-text-mute)", marginBottom: 12 }}>
        What your plan includes and what I&apos;ve used so far.{started ? " I started counting on November 27." : ""}
      </p>
      {!data ? (
        <p style={{ fontSize: 13, color: "var(--ds-text-mute)" }}>Loading…</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {data.lines.map((l) => {
            const pct = l.included ? Math.min(1, l.used / l.included) : 0
            return (
              <div key={l.label}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, color: "var(--ds-text)" }}>
                  <span>{l.label} <span style={{ color: "var(--ds-text-mute)" }}>{l.per}</span></span>
                  <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {l.used.toLocaleString("en-US")}{l.included !== null ? ` of ${l.included.toLocaleString("en-US")}` : ""}
                  </span>
                </div>
                {l.included ? (
                  <div style={{ height: 4, borderRadius: 2, background: "var(--ds-border)", marginTop: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct * 100}%`, height: "100%", background: pct >= 0.8 ? "#d97706" : "var(--ds-accent, #000)" }} />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </DsCard>
  )
}
