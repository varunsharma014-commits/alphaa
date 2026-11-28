"use client"

// "Buy more" wherever a plan limit is hit. Mounted once in WorkspaceShell:
//  - watches every dashboard API answer: a 429 with { quota: true } (lib/quotas.ts quotaBody, and
//    the routes that pass the flag) or any 429 from /api/agent/* shows the owner-facing sentence in
//    a toast with a "Buy more" button;
//  - "Buy more" (or openCredits() from anywhere, e.g. the "This month" card) opens this sheet: the
//    balance, the 3 packs (one-time Stripe Checkout via POST /api/stripe/credits) and the
//    "Use credits when I run out" switch. Shopify-billed merchants see "Upgrade your plan in
//    Shopify" instead (App Store billing rules); comped accounts never need credits.
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button, Pill, PlanCard, Sheet, Skeleton, StatTile } from "./ds"

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
const COSTS: [keyof Info["costs"], string][] = [["blog", "Blog post"], ["social", "Social post"], ["gbp", "Google post"], ["email", "Customer email"], ["week", "Weekly plan"]]
const NO_LIMIT = "Your account has no monthly limit, so there’s nothing to buy."

export function CreditsSheet() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [info, setInfo] = useState<Info | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const known = useRef<Info | null>(null)

  const load = useCallback(async (): Promise<Info | null> => {
    try {
      const r = await fetch("/api/credits")
      if (!r.ok) throw new Error("load")
      const j = (await r.json()) as Info
      known.current = j
      setInfo(j)
      return j
    } catch {
      setError("I couldn’t load your credits. Try again in a minute.")
      return null
    }
  }, [])
  useEffect(() => {
    watchQuota()
    const on = async (e: Event) => {
      const why = (e as CustomEvent<string | undefined>).detail ?? null
      // Comped accounts never run out: no sheet, just say so.
      if (known.current?.comped) return void toast(NO_LIMIT)
      setReason(why)
      setError(null)
      setInfo(null)
      setOpen(true)
      const j = await load()
      if (j?.comped) { setOpen(false); toast(NO_LIMIT) }
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
      setError(j.error ?? "That didn’t go through. Try again in a minute.")
    } catch {
      setError("That didn’t go through. Try again in a minute.")
    }
    setBusy(null)
  }
  async function toggle(on: boolean) {
    setInfo((i) => (i ? { ...i, autoUse: on } : i))
    const res = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autoUse: on }) }).catch(() => null)
    if (!res?.ok) { setError("That didn’t save. Try again."); void load() }
  }

  const expiry = info?.nextExpiry ? `${fmt(info.nextExpiry.credits)} last until ${new Date(info.nextExpiry.at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "Credits last 12 months"
  const per = (p: { credits: number; usd: number }) => p.usd / p.credits
  const best = info && info.packs.length > 1 ? Math.min(...info.packs.map(per)) : null
  return (
    <Sheet open={open && !info?.comped} onClose={() => setOpen(false)} title="Get more done this month" sub={reason ?? "I only use credits after your plan’s included work runs out."}>
      {!info ? (
        error ? <p className="ax-cr__err" role="alert">{error}</p> : (
          <div className="ax-cr" aria-busy="true">
            <Skeleton kind="tile" />
            <Skeleton kind="line" lines={2} />
            <Skeleton kind="card" />
          </div>
        )
      ) : info.shopifyUrl ? (
        <div className="ax-cr">
          <p className="ax-cr__p">Your plan is billed through Shopify. For more each month, move up a plan there.</p>
          <div><Button variant="primary" href={info.shopifyUrl} external>Upgrade your plan in Shopify</Button></div>
        </div>
      ) : (
        <div className="ax-cr">
          <StatTile label="Your credits" value={fmt(info.balance)} hint={expiry} soft />
          <div>
            <p className="ax-cr__h">What one piece of work costs</p>
            <div className="ax-cr__chips">
              {COSTS.filter(([k]) => info.costs[k] != null).map(([k, label]) => (
                <span key={k} className="ax-cr__chip">{label} <b>{fmt(info.costs[k] as number)}</b></span>
              ))}
            </div>
          </div>
          <div className="ax-cr__packs">
            {info.packs.map((p) => {
              const top = best != null && per(p) === best
              return (
                <PlanCard key={p.credits} name={`${p.credits} credits`} price={`$${p.usd}`} per="once"
                  recommended={top} status={top ? <Pill tone="info">Best value</Pill> : null}
                  was={`$${per(p).toFixed(2)} a credit`}
                  cta={<Button variant={top ? "primary" : "secondary"} loading={busy === p.credits} disabled={busy !== null && busy !== p.credits} onClick={() => void buy(p.credits)}>Buy</Button>} />
              )
            })}
          </div>
          <div className="ax-cr__auto">
            <div><b>Use credits when I run out</b><small>I keep working past your plan’s limits on things you ask for.</small></div>
            <button type="button" role="switch" aria-checked={info.autoUse} aria-label="Use credits when I run out" className={`ax-sw${info.autoUse ? " on" : ""}`} onClick={() => void toggle(!info.autoUse)}><i /></button>
          </div>
          {error && <p className="ax-cr__err" role="alert">{error}</p>}
          <p className="ax-cr__fine">One-time payment, no subscription. Credits are non-refundable and have no cash value. Business customers only. See the <a href="/terms">Terms</a>.</p>
        </div>
      )}
    </Sheet>
  )
}
