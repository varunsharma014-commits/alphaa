"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { RoasView } from "@/lib/workspace/ads-roas"
import { toast } from "@/lib/workspace/events"
import { Button, DataTable, List, ListRow, Pill, SectionHeader, StatRow, StatTile, TextInput } from "./ui"
import "./p3.css"

// Return on ad spend on the Ads page (lib/workspace/ads-roas.ts). Tracked ROAS (real sales) is the
// headline; the estimate from the owner's customer value only shows when nothing is tracked, and is
// labelled. No source = "not tracked yet" and one sentence on how to turn it on. Leads can be marked won here.

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
    <section className="ax-card x3-pad" aria-label="Return on ad spend">
      <SectionHeader first title="Return on ad spend" sub={`Last ${win} days`} end={<Pill tone={tracked ? "ok" : "idle"}>{tracked ? "From real sales" : w.estimate ? "Estimate, from your customer value" : "Not tracked yet"}</Pill>} />
      <StatRow>
        <StatTile soft label="Return on ad spend" value={tracked ? w.roas : w.estimate ? `About ${w.estimate.roas}` : null} empty="Not tracked yet" />
        <StatTile soft label="Sales from ads" value={w.revenue ?? null} empty="Not tracked yet" />
        <StatTile soft label={`Cost per ${tracked ? w.saleWord : "sale"}`} value={w.perSale ?? null} empty="Not tracked yet" />
      </StatRow>
      <div className="x3-notes">
        {tracked && w.label && <span>{w.label}</span>}
        {tracked && w.gap && <span>{w.gap}</span>}
        {!tracked && w.estimate && <span><b>This is an estimate, not sales.</b> {w.estimate.text}</span>}
        {!tracked && roas.next && <span>{roas.next}</span>}
        {w.platforms.flatMap((p) => p.others.map((o) => `${p.platform}: ${o}`)).slice(0, 3).map((o, i) => <span key={i}>Also seen, not added: {o}</span>)}
      </div>
    </section>
  )
}

type Camp = RoasView["windows"][7]["campaigns"][number]

/** Per campaign: spend, leads, sales and ROAS from the same source as the platform total. */
export function RoasCampaigns({ roas, win }: { roas: RoasView; win: 7 | 30 }) {
  const rows = roas.windows[win].campaigns
  if (!rows.length) return null
  return (
    <section>
      <SectionHeader title="By campaign" sub={`Last ${win} days`} />
      <DataTable<Camp>
        label="Campaign results"
        rows={rows}
        rowKey={(c) => `${c.platform}|${c.name}`}
        columns={[
          { key: "name", label: "Campaign", render: (c) => <span><b>{c.name}</b><span className="ax-t11 x3-block">{c.platform}</span></span>, value: (c) => c.name, sortable: true },
          { key: "spend", label: "Spent", num: true, value: (c) => c.spend },
          { key: "leads", label: "Leads", num: true, value: (c) => c.leads },
          { key: "revenue", label: "Sales", num: true, value: (c) => c.revenue },
          { key: "roas", label: "Return", num: true, render: (c) => <b>{c.roas}</b>, value: (c) => c.roas },
        ]}
      />
    </section>
  )
}

/** Leads from ads: mark the ones that became customers, with the amount. Optional: tell Google / Meta. */
export function RoasLeads({ roas }: { roas: RoasView }) {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  async function won(ref: string) {
    const a = Number(amount.replace(/[^0-9.]/g, ""))
    if (!(a > 0)) return toast("Type the amount of the sale.")
    setBusy(ref)
    const r = await post({ op: "won", ref, amount: a })
    setBusy(null)
    if (!r.ok) return toast(r.error ?? "That didn’t save. Nothing changed.")
    setOpen(null)
    toast("Marked as won. I’ve counted the sale.")
    router.refresh()
  }
  async function unwon(ref: string) {
    setBusy(ref)
    const r = await post({ op: "unwon", ref })
    setBusy(null)
    if (!r.ok) return toast(r.error ?? "That didn’t undo. Nothing changed.")
    toast(r.note ?? "Undone")
    router.refresh()
  }
  async function uploads(k: "google" | "meta", on: boolean) {
    setBusy(k)
    const r = await post({ op: "uploads", [k]: on })
    setBusy(null)
    if (!r.ok) return toast(r.error ?? "That didn’t save. Nothing changed.")
    if (r.note) toast(r.note)
    router.refresh()
  }

  const u = roas.uploads
  return (
    <section>
      <SectionHeader title="Leads from your ads" sub="When one becomes a customer, mark it won with the amount. I count it as a real sale." />
      {roas.leads.length ? (
        <List card label="Leads from your ads">
          {roas.leads.map((l) => (
            <ListRow
              key={l.ref}
              title={l.title}
              meta={<>{l.when} · {l.detail}{l.won?.sent ? <span className="x3-block">{l.won.sent}</span> : null}</>}
              wrapEnd
              end={l.won ? (
                <>
                  <Pill tone="ok">Won · {l.won.amount}{l.won.atValue ? " (your usual value)" : ""}</Pill>
                  <Button size="sm" variant="undo" loading={busy === l.ref} onClick={() => void unwon(l.ref)}>Undo</Button>
                </>
              ) : open === l.ref ? (
                <form className="x3-inline" onSubmit={(e) => { e.preventDefault(); void won(l.ref) }}>
                  <TextInput prefix={roas.currency === "USD" ? "$" : undefined} inputMode="decimal" aria-label={`Sale amount in ${roas.currency}`} placeholder={roas.currency} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus className="x3-amt" />
                  <Button size="sm" variant="primary" type="submit" loading={busy === l.ref}>Save</Button>
                  <Button size="sm" onClick={() => setOpen(null)}>Cancel</Button>
                </form>
              ) : (
                <Button size="sm" onClick={() => { setOpen(l.ref); setAmount(roas.defaultValue ? String(roas.defaultValue) : "") }}>Mark won</Button>
              )}
            />
          ))}
        </List>
      ) : <p className="ax-note x3-flat">No leads from your ads in the last 30 days. Form leads from Facebook & Instagram and website leads from an ad click show up here.</p>}
      <details className="ax-card x3-guard">
        <summary>Tell Google and Meta about won sales</summary>
        <p className="ax-p">So their ads learn which clicks became customers. Only for leads that came from their ad, never for visitors who asked not to be tracked.</p>
        <div className="x3-switches">
          <SwitchRow label="Google Ads" on={u.google} busy={busy === "google"} disabled={!u.canGoogle && !u.google} hint={u.google && u.googleAction ? `Into “${u.googleAction}”` : !u.canGoogle ? "Connect Google Ads first" : undefined} onChange={(v) => void uploads("google", v)} />
          <SwitchRow label="Facebook & Instagram" on={u.meta} busy={busy === "meta"} disabled={!u.canMeta && !u.meta} hint={!u.canMeta && !u.meta ? <>Turn on lead tracking for Meta first, in <a className="ax-lnk" href="/dashboard/tracking">Tracking & Setup</a></> : undefined} onChange={(v) => void uploads("meta", v)} />
        </div>
      </details>
    </section>
  )
}

function SwitchRow({ label, on, disabled, busy, hint, onChange }: { label: string; on: boolean; disabled?: boolean; busy?: boolean; hint?: ReactNode; onChange: (v: boolean) => void }) {
  return (
    <div className="x3-sw">
      <button className={`ax-sw${on ? " on" : ""}`} type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled || busy} onClick={() => onChange(!on)}><i /></button>
      <div><b>{label}</b>{hint && <div className="ax-t11">{hint}</div>}</div>
    </div>
  )
}
