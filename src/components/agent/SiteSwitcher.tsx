"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Plus } from "lucide-react"
import { ROLE_LABEL, type Role } from "@/lib/team/permissions"

// The website I'm working on, and the owner's other websites (lib/sites.ts).
// Each website has its own plan, results and connections; switching reloads
// the page so everything shown belongs to the chosen one. Brands this login works on as a team
// member (lib/team) are listed after its own, with the role.

type Site = { id: string; name: string; url: string | null; paid: boolean; ready: boolean; role?: Role }

export function SiteSwitcher({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  const [sites, setSites] = useState<Site[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    fetch("/api/sites").then((r) => r.json()).then((d) => { setSites(d.sites ?? []); setActiveId(d.activeId ?? null) }).catch(() => setSites([]))
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", close)
    }
  }, [open])

  async function go(path: string, init: RequestInit) {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || "That didn’t work. Try again.")
      window.location.href = d.next ?? "/dashboard"
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn’t work. Try again.")
      setBusy(false)
    }
  }

  const status = (s: Site) => {
    if (s.role && s.role !== "owner") return `${ROLE_LABEL[s.role]}${s.url ? ` · ${s.url}` : ""}`
    return !s.ready ? "Setup not finished" : s.paid ? s.url ?? "" : `${s.url ?? ""}${s.url ? " · " : ""}No plan yet`
  }
  const row = (s: Site) => (
    <button key={s.id} role="menuitemradio" aria-checked={s.id === activeId} disabled={busy} onClick={() => (s.id === activeId ? setOpen(false) : go("/api/sites/switch", { method: "POST", body: JSON.stringify({ id: s.id }) }))}>
      <span className="ag-site__name">{s.name}</span>
      <span className="ag-site__sub">{status(s)}</span>
      {s.id === activeId && <Check size={15} className="ag-site__check" aria-hidden="true" />}
    </button>
  )
  const mine = (sites ?? []).filter((s) => !s.role || s.role === "owner")
  const shared = (sites ?? []).filter((s) => s.role && s.role !== "owner")

  return (
    <div className="ag-site" ref={ref}>
      <button type="button" className="ag-site__btn" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} title="Switch website">
        <span>{name}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="ag-site__menu" role="menu">
          <p className="ag-site__label">Your websites</p>
          {sites === null ? (
            <p className="ag-site__note">Getting your websites…</p>
          ) : (
            <>
              {mine.map(row)}
              {shared.length > 0 && <p className="ag-site__label">Brands you work on</p>}
              {shared.map(row)}
            </>
          )}
          <hr />
          <button role="menuitem" disabled={busy} onClick={() => go("/api/sites", { method: "POST" })}>
            <span className="ag-site__name"><Plus size={14} aria-hidden="true" /> Add a brand</span>
            <span className="ag-site__sub">Its own results, at 50% off once your first brand is on a plan.</span>
          </button>
          {error && <p className="ag-site__note ag-site__note--err">{error}</p>}
        </div>
      )}
    </div>
  )
}
