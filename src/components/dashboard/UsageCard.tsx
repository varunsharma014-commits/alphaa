"use client"

import { useEffect, useState } from "react"
import { openCredits } from "@/components/workspace/CreditsSheet"
import { Button, Skeleton } from "@/components/workspace/ui"

// "This month" on Plan & billing: what the plan includes and what I've used, from the usage ledger
// (GET /api/usage → lib/quotas.ts ownerUsage). Real counts only; a skeleton until it loads, and
// nothing at all if it can't load. Credits only for accounts that can buy them (never comped).
type Line = { label: string; used: number; included: number | null; per: string }
type Credits = { balance: number; autoUse: boolean; comped: boolean; shopifyUrl: string | null }

export function UsageCard() {
  const [data, setData] = useState<{ lines: Line[]; since: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [credits, setCredits] = useState<Credits | null>(null)
  useEffect(() => {
    let off = false
    fetch("/api/credits").then((r) => (r.ok ? r.json() : null)).then((c) => { if (!off && c) setCredits(c) }).catch(() => undefined)
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => { if (!off) setData(d) })
      .catch(() => { if (!off) setFailed(true) })
    return () => { off = true }
  }, [])
  if (failed) return null
  const started = data && new Date().toISOString().slice(0, 7) === data.since.slice(0, 7)
  const since = data ? new Date(data.since).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }) : null
  return (
    <section className="ax-card xs-card" aria-busy={!data}>
      <h2>This month</h2>
      <p className="xs-mute">What your plan includes and what I’ve used so far.{started && since ? ` I started counting on ${since}.` : ""}</p>
      {!data ? (
        <div className="xs-meters"><Skeleton kind="line" width="90%" /><Skeleton kind="line" width="80%" /><Skeleton kind="line" width="85%" /><Skeleton kind="line" width="70%" /></div>
      ) : (
        <div className="xs-meters">
          {data.lines.map((l) => {
            const pct = l.included ? Math.min(1, l.used / l.included) : 0
            return (
              <div key={l.label}>
                <div className="xs-meter__t">
                  <span>{l.label}<small>{l.per}</small></span>
                  <span>{l.used.toLocaleString("en-US")}{l.included !== null ? ` of ${l.included.toLocaleString("en-US")}` : ""}</span>
                </div>
                {l.included ? (
                  <div className="xs-meter__b" role="progressbar" aria-label={l.label} aria-valuemin={0} aria-valuemax={l.included} aria-valuenow={Math.min(l.used, l.included)}>
                    <i className={pct >= 0.8 ? "hot" : undefined} style={{ width: `${pct * 100}%` }} />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      {credits && !credits.comped ? (
        <div className="xs-row xs-credits">
          <p className="xs-mute">
            Credits: <b>{(Math.round(credits.balance * 10) / 10).toLocaleString("en-US")}</b>
            {credits.balance > 0 ? (credits.autoUse ? ". I use them when your plan’s work runs out." : ". Not used until you turn them on.") : ". For when your plan’s work runs out."}
          </p>
          {credits.shopifyUrl ? (
            <Button size="sm" href={credits.shopifyUrl}>Upgrade your plan in Shopify</Button>
          ) : (
            <Button size="sm" onClick={() => openCredits()}>Buy credits</Button>
          )}
        </div>
      ) : null}
    </section>
  )
}
