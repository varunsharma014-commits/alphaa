"use client"

import { useEffect, useRef, useState } from "react"
import { ROLE_LABEL, type Role } from "@/lib/team/permissions"
import { Popover, Skeleton } from "@/components/workspace/ui"
import { Icon } from "@/components/workspace/icons"

// The website I'm working on, and the owner's other websites (lib/sites.ts).
// Each website has its own plan, results and connections; switching reloads
// the page so everything shown belongs to the chosen one. Brands this login works on as a team
// member (lib/team) are listed after its own, with the role. A floating panel: it never pushes
// the sidebar down. Test and dev-store brands stay out of the way behind "Show test brands".

export type Site = { id: string; name: string; url: string | null; paid: boolean; ready: boolean; role?: Role }

const host = (url: string | null) => (url ?? "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
/** A brand made for testing (e.g. "alphaa-test", a "-dev" store), by its name or address. */
export const isTestSite = (s: Pick<Site, "name" | "url">) => /(^|[\s._-])(test|testing|staging|sandbox|demo|dev)([\s._-]|$)/i.test(`${s.name} ${host(s.url).replace(/\.myshopify\.com$/, "")}`)

export function SiteSwitcher({ name, sample }: { name: string; /** Dev preview: these sites instead of /api/sites. */ sample?: { sites: Site[]; activeId: string } }) {
  const [open, setOpen] = useState(false)
  const [sites, setSites] = useState<Site[] | null>(sample?.sites ?? null)
  const [activeId, setActiveId] = useState<string | null>(sample?.activeId ?? null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTest, setShowTest] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open || sample) return
    fetch("/api/sites").then((r) => r.json()).then((d) => { setSites(d.sites ?? []); setActiveId(d.activeId ?? null) }).catch(() => setSites([]))
  }, [open, sample])

  async function go(key: string, path: string, init: RequestInit) {
    if (sample) return
    setBusy(key)
    setError(null)
    try {
      const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || "That didn’t work. Try again.")
      window.location.href = d.next ?? "/dashboard"
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn’t work. Try again.")
      setBusy(null)
    }
  }

  const status = (s: Site) => {
    const h = host(s.url)
    if (s.role && s.role !== "owner") return `${ROLE_LABEL[s.role]}${h ? ` · ${h}` : ""}`
    return !s.ready ? "Setup not finished" : s.paid ? h : `${h}${h ? " · " : ""}No plan yet`
  }
  const row = (s: Site) => {
    const on = s.id === activeId
    return (
      <button key={s.id} type="button" role="menuitemradio" aria-checked={on} className="xd-mi ax-ss__row" disabled={!!busy}
        onClick={() => (on ? setOpen(false) : go(s.id, "/api/sites/switch", { method: "POST", body: JSON.stringify({ id: s.id }) }))}>
        <span className="ax-ss__fav" aria-hidden="true">{(s.name.trim()[0] ?? "?").toUpperCase()}</span>
        <span className="ax-ss__t"><b>{s.name}</b><small>{busy === s.id ? "Opening…" : status(s)}</small></span>
        {on && <span className="ax-ss__on"><Icon name="check" size={16} /></span>}
      </button>
    )
  }
  const all = sites ?? []
  const shown = (s: Site) => showTest || s.id === activeId || !isTestSite(s)
  const hidden = all.filter((s) => !shown(s)).length
  const mine = all.filter((s) => (!s.role || s.role === "owner") && shown(s))
  const shared = all.filter((s) => s.role && s.role !== "owner" && shown(s))

  return (
    <>
      <button ref={btn} type="button" className="ax-ssbtn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} title="Switch website">
        <span className="ax-ss__fav" aria-hidden="true">{(name.trim()[0] ?? "?").toUpperCase()}</span>
        <span className="n">{name}</span>
        <Icon name="updown" size={16} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} width={280} label="Your websites">
        <div role="menu" aria-label="Your websites" className="ax-ss">
          <p className="ax-am__h">Your websites</p>
          {sites === null ? (
            <div className="ax-ss__load"><Skeleton kind="row" rows={2} /></div>
          ) : (
            <>
              {mine.map(row)}
              {shared.length > 0 && <p className="ax-am__h">Brands you work on</p>}
              {shared.map(row)}
              {hidden > 0 && <button type="button" className="ax-ss__more" onClick={() => setShowTest(true)}>Show {hidden} test brand{hidden === 1 ? "" : "s"}</button>}
            </>
          )}
          <button type="button" role="menuitem" className="ax-ss__add" disabled={!!busy} onClick={() => go("add", "/api/sites", { method: "POST" })}>
            <span className="ax-ss__plus" aria-hidden="true"><Icon name="plus" size={16} /></span>
            <span className="ax-ss__t"><b>{busy === "add" ? "Adding…" : "Add a brand"}</b><small>50% off each extra brand</small></span>
          </button>
          {error && <p className="ax-ss__err" role="alert">{error}</p>}
        </div>
      </Popover>
    </>
  )
}
