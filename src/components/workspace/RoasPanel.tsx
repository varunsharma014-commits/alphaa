"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { RoasView } from "@/lib/workspace/ads-roas"
import { toast } from "@/lib/workspace/events"

// Return on ad spend on the Ads page (lib/workspace/ads-roas.ts). Tracked ROAS (real sales) is the
// headline; the estimate from the owner's customer value only shows when nothing is tracked, and is
// labelled. No source = "—" and one sentence on how to turn it on. Leads can be marked won here.

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/workspace/roas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
  const d = (await res?.json().catch(() => null)) as { error?: string; note?: string | null } | null
  return { ok: !!res?.ok, error: d?.error ?? null, note: d?.note ?? null }
}

/** The KPI row: ROAS, revenue, cost per sale, with where the revenue comes from. */
export function RoasKpis({ roas, win }: { roas: RoasView; win: 7 | 30 }) {
  const w = roas.windows[win]
  const tracked = w.roas !== "—"
  return (
    <section className="ax-card" style={{ padding: "20px 22px" }} aria-label="Return on ad spend">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <b style={{ fontSize: 15 }}>Return on ad spend · last {win} days</b>
        <span className={`ax-pill ${tracked ? "g" : "n"}`}>{tracked ? "Tracked ROAS, from real sales" : w.estimate ? "Estimated ROAS, from your customer value" : "Not tracked yet"}</span>
      </div>
      <div className="ax-g3" style={{ gap: 8 }}>
        <div className="ax-tile"><div className="k">ROAS</div><b style={{ fontSize: 24, color: tracked ? "var(--x-gink)" : undefined }}>{tracked ? w.roas : w.estimate ? `≈ ${w.estimate.roas}` : "—"}</b></div>
        <div className="ax-tile"><div className="k">Sales from ads</div><b style={{ fontSize: 20 }}>{w.revenue ?? "—"}</b></div>
        <div className="ax-tile"><div className="k">Cost per {tracked ? w.saleWord : "sale"}</div><b style={{ fontSize: 20 }}>{w.perSale ?? "—"}</b></div>
      </div>
      <div className="ax-t11" style={{ marginTop: 8, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 3 }}>
        {tracked && w.label && <span>{w.label}</span>}
        {tracked && w.gap && <span>{w.gap}</span>}
        {!tracked && w.estimate && <span><b style={{ fontWeight: 600 }}>This is an estimate, not sales.</b> {w.estimate.text}</span>}
        {!tracked && roas.next && <span>{roas.next}</span>}
        {w.platforms.flatMap((p) => p.others.map((o) => `${p.platform}: ${o}`)).slice(0, 3).map((o, i) => <span key={i}>Also seen, not added: {o}</span>)}
      </div>
    </section>
  )
}

/** Per campaign: spend, leads, sales and ROAS from the same source as the platform total. */
export function RoasCampaigns({ roas, win }: { roas: RoasView; win: 7 | 30 }) {
  const rows = roas.windows[win].campaigns
  if (!rows.length) return null
  return (
    <section className="ax-card" style={{ padding: "18px 22px" }}>
      <b style={{ fontSize: 15 }}>By campaign · last {win} days</b>
      <div className="ax-tblwrap">
        <table className="ax-tbl">
          <thead><tr><th>Campaign</th><th>Spent</th><th>Leads</th><th>Sales</th><th>ROAS</th></tr></thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}><td><b>{c.name}</b><div className="ax-t11">{c.platform}</div></td><td>{c.spend}</td><td>{c.leads}</td><td>{c.revenue}</td><td><b>{c.roas}</b></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Leads from ads: mark the ones that became customers, with the amount. Optional: tell Google / Meta. */
export function RoasLeads({ roas }: { roas: RoasView }) {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)

  async function won(ref: string) {
    const a = Number(amount.replace(/[^0-9.]/g, ""))
    if (!(a > 0)) return toast("Type the amount of the sale.")
    setBusy(true)
    const r = await post({ op: "won", ref, amount: a })
    setBusy(false)
    if (!r.ok) return toast(r.error ?? "That didn’t save. Nothing changed.")
    setOpen(null)
    toast("Marked as won. I’ve counted the sale.")
    router.refresh()
  }
  async function unwon(ref: string) {
    const r = await post({ op: "unwon", ref })
    if (!r.ok) return toast(r.error ?? "That didn’t undo. Nothing changed.")
    toast(r.note ?? "Undone")
    router.refresh()
  }
  async function uploads(k: "google" | "meta", on: boolean) {
    const r = await post({ op: "uploads", [k]: on })
    if (!r.ok) return toast(r.error ?? "That didn’t save. Nothing changed.")
    if (r.note) toast(r.note)
    router.refresh()
  }

  const u = roas.uploads
  return (
    <section className="ax-card" style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div><b style={{ fontSize: 15 }}>Leads from your ads</b><p className="ax-p" style={{ marginTop: 2 }}>When one becomes a customer, mark it won with the amount. I count it as a real sale.</p></div>
      {roas.leads.length ? (
        <div className="ax-list">
          {roas.leads.map((l) => (
            <div key={l.ref} style={{ padding: "12px 0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <b style={{ fontSize: 14 }}>{l.title}</b>
                <div className="ax-t11" style={{ marginTop: 2 }}>{l.when} · {l.detail}</div>
                {l.won?.sent && <div className="ax-t11" style={{ marginTop: 2 }}>{l.won.sent}</div>}
              </div>
              {l.won ? (
                <>
                  <span className="ax-pill g">Won · {l.won.amount}{l.won.atValue ? " (your usual value)" : ""}</span>
                  <button className="ax-btn s sm" type="button" onClick={() => void unwon(l.ref)}>Undo</button>
                </>
              ) : open === l.ref ? (
                <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <input className="ax-input" style={{ width: 120 }} inputMode="decimal" aria-label={`Sale amount in ${roas.currency}`} placeholder={roas.currency} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
                  <button className="ax-btn p sm" type="button" disabled={busy} onClick={() => void won(l.ref)}>{busy ? "Saving…" : "Save"}</button>
                  <button className="ax-btn s sm" type="button" onClick={() => setOpen(null)}>Cancel</button>
                </span>
              ) : (
                <button className="ax-btn s sm" type="button" onClick={() => { setOpen(l.ref); setAmount(roas.defaultValue ? String(roas.defaultValue) : "") }}>Mark won</button>
              )}
            </div>
          ))}
        </div>
      ) : <p className="ax-note" style={{ marginTop: 0 }}>No leads from your ads in the last 30 days yet. Form leads from Facebook & Instagram and website leads from an ad click show up here.</p>}
      <div style={{ borderTop: "1px solid var(--x-line)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <b style={{ fontSize: 13.5 }}>Tell Google and Meta about won sales</b>
        <span className="ax-t11" style={{ fontSize: 12.5 }}>So their ads learn which clicks became customers. Only for leads that came from their ad, and never for visitors who asked not to be tracked.{u.test ? " Test mode for now: nothing is recorded in Google or Meta yet." : ""}</span>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
          <input type="checkbox" checked={u.google} disabled={!u.canGoogle && !u.google} onChange={(e) => void uploads("google", e.target.checked)} />
          Google Ads{u.google && u.googleAction ? ` · into “${u.googleAction}”` : !u.canGoogle ? " · connect Google Ads first" : ""}
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
          <input type="checkbox" checked={u.meta} disabled={!u.canMeta && !u.meta} onChange={(e) => void uploads("meta", e.target.checked)} />
          Meta{!u.canMeta && !u.meta ? " · add your Conversions API token in Lead tracking first" : ""}
        </label>
      </div>
    </section>
  )
}
