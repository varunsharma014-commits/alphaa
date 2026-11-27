"use client"

// "Buy more" wherever a plan limit is hit. Mounted once in WorkspaceShell:
//  - watches every dashboard API answer: a 429 with { quota: true } (lib/quotas.ts quotaBody, and
//    the routes that pass the flag) or any 429 from /api/agent/* shows the owner-facing sentence in
//    a toast with a "Buy more" button;
//  - "Buy more" (or openCredits() from anywhere, e.g. the "This month" card) opens this sheet: the
//    balance, the 3 packs (one-time Stripe Checkout via POST /api/stripe/credits) and the
//    "Use credits when I run out" switch. Shopify-billed merchants see "Upgrade your plan in
//    Shopify" instead (App Store billing rules); comped accounts never need credits.
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export const CREDITS_EVENT = "alphaa:credits"
export function openCredits(reason?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(CREDITS_EVENT, { detail: reason }))
}

type Info = { balance: number; autoUse: boolean; bought: boolean; nextExpiry: { credits: number; at: string } | null; packs: { credits: number; usd: number }[]; costs: Record<"blog" | "social" | "gbp" | "email" | "week", number | null>; comped: boolean; shopifyUrl: string | null }

let patched = false
function watchQuota() {
  if (patched || typeof window === "undefined") return
  patched = true
  const orig = window.fetch.bind(window)
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const res = await orig(...args)
    if (res.status === 429) {
      try {
        const raw = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].href : (args[0] as Request).url
        const url = new URL(raw, window.location.href)
        if (url.origin === window.location.origin && url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/scan")) {
          void res.clone().json().then((j: { error?: string; quota?: boolean }) => {
            if (j?.error && (j.quota || url.pathname.startsWith("/api/agent/"))) {
              toast(j.error, { id: "quota", duration: 12000, action: { label: "Buy more", onClick: () => openCredits(j.error) } })
            }
          }).catch(() => undefined)
        }
      } catch {
        // never break the request over the notice
      }
    }
    return res
  }
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US")

export function CreditsSheet() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [info, setInfo] = useState<Info | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch("/api/credits").then((r) => (r.ok ? r.json() : Promise.reject(new Error("load")))).then(setInfo).catch(() => setError("I couldn't load your credits. Try again in a minute."))
  }, [])
  useEffect(() => {
    watchQuota()
    const on = (e: Event) => {
      setReason((e as CustomEvent<string | undefined>).detail ?? null)
      setError(null)
      setOpen(true)
      load()
    }
    window.addEventListener(CREDITS_EVENT, on)
    return () => window.removeEventListener(CREDITS_EVENT, on)
  }, [load])

  async function buy(credits: number) {
    setBusy(credits)
    setError(null)
    try {
      const res = await fetch("/api/stripe/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pack: credits }) })
      const j = await res.json()
      if (res.ok && j.url) { window.location.href = j.url; return }
      setError(j.error ?? "That didn't go through. Try again in a minute.")
    } catch {
      setError("That didn't go through. Try again in a minute.")
    }
    setBusy(null)
  }
  async function toggle(on: boolean) {
    setInfo((i) => (i ? { ...i, autoUse: on } : i))
    const res = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autoUse: on }) }).catch(() => null)
    if (!res?.ok) { setError("That didn't save. Try again."); load() }
  }

  if (!open) return null
  const card = { border: "1px solid #d2d2d7", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fff" } as const
  const btn = { padding: "8px 14px", borderRadius: 999, background: "#000", color: "#fff", fontSize: 13, border: 0, cursor: "pointer" } as const
  return (
    <div role="dialog" aria-modal="true" aria-label="Buy credits" onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#f5f5f7", color: "#1d1d1f", borderRadius: 20, maxWidth: 440, width: "100%", padding: 20, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>More work this month</h2>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ border: 0, background: "transparent", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {reason ? <p style={{ fontSize: 13, color: "#6e6e73", margin: "6px 0 0" }}>{reason}</p> : null}
        {!info ? (
          <p style={{ fontSize: 13, color: "#6e6e73", marginTop: 14 }}>{error ?? "Loading…"}</p>
        ) : info.comped ? (
          <p style={{ fontSize: 13, marginTop: 14 }}>Your account never runs out, so there&apos;s nothing to buy.</p>
        ) : info.shopifyUrl ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, marginBottom: 12 }}>Your plan is billed through Shopify. For more each month, move up a plan there.</p>
            <a href={info.shopifyUrl} style={{ ...btn, display: "inline-block", textDecoration: "none" }}>Upgrade your plan in Shopify</a>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, marginTop: 12 }}>
              You have <b>{fmt(info.balance)}</b> credits.{info.nextExpiry ? ` ${fmt(info.nextExpiry.credits)} of them last until ${new Date(info.nextExpiry.at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.` : ""}
            </p>
            <p style={{ fontSize: 12, color: "#6e6e73", margin: "4px 0 12px" }}>I only use credits after your plan&apos;s included work runs out. A blog post is {info.costs.blog ?? "–"}, a social post {info.costs.social ?? "–"}, a Google post {info.costs.gbp ?? "–"}, a customer email {info.costs.email ?? "–"}, a weekly plan {info.costs.week ?? "–"}. Credits last 12 months.</p>
            <div style={{ display: "grid", gap: 8 }}>
              {info.packs.map((p) => (
                <div key={p.credits} style={card}>
                  <span style={{ fontSize: 14 }}><b>{p.credits} credits</b> <span style={{ color: "#6e6e73" }}>${p.usd}</span></span>
                  <button type="button" style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy !== null} onClick={() => buy(p.credits)}>{busy === p.credits ? "Opening…" : "Buy"}</button>
                </div>
              ))}
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 14 }}>
              <input type="checkbox" checked={info.autoUse} onChange={(e) => toggle(e.target.checked)} />
              Use credits when I run out
            </label>
            {error ? <p role="alert" style={{ fontSize: 13, color: "#b42318", marginTop: 8 }}>{error}</p> : null}
            <p style={{ fontSize: 11, color: "#6e6e73", marginTop: 10 }}>One-time payment, no subscription. Business customers only.</p>
          </>
        )}
      </div>
    </div>
  )
}
