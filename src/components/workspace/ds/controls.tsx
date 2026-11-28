"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect

/** Fade the cut edge of a sideways-scrolling row and keep the active item in view. */
function useScrollFade(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const l = el.scrollLeft > 2
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    const v = l && r ? "lr" : l ? "l" : r ? "r" : ""
    if (v) el.dataset.fade = v
    else delete el.dataset.fade
  }, [])
  useIso(() => {
    const el = ref.current
    if (!el) return
    const on = el.querySelector<HTMLElement>(".on,[aria-selected='true'],[aria-current='page']")
    if (on && el.scrollWidth > el.clientWidth) {
      const left = on.offsetLeft - el.offsetLeft
      if (left < el.scrollLeft || left + on.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollLeft = Math.max(0, left - 24)
    }
    update()
  }, [dep, update])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener("scroll", update, { passive: true })
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null
    ro?.observe(el)
    return () => { el.removeEventListener("scroll", update); ro?.disconnect() }
  }, [update])
  return ref
}

export type TabItem<T extends string> = { key: T; label: ReactNode; count?: number }

// Pill tabs (local state). Scrolls sideways on phones with a fade, keeps the active tab in view,
// and moves with the arrow keys. Keep it to about 5 tabs. Pair with useTabParam for ?tab= links.
export function Tabs<T extends string>({ tabs, value, onChange, label = "Sections", className = "" }: { tabs: TabItem<T>[]; value: T; onChange: (k: T) => void; label?: string; className?: string }) {
  const ref = useScrollFade(value)
  const move = (dir: 1 | -1) => {
    const i = tabs.findIndex((t) => t.key === value)
    const next = tabs[(i + dir + tabs.length) % tabs.length]
    if (next) {
      onChange(next.key)
      requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-k="${next.key}"]`)?.focus())
    }
  }
  return (
    <div ref={ref} className={`ax-tabs ${className}`.trim()} role="tablist" aria-label={label} onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); move(1) } else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1) } }}>
      {tabs.map((t) => (
        <button key={t.key} data-k={t.key} type="button" role="tab" tabIndex={value === t.key ? 0 : -1} aria-selected={value === t.key} className={value === t.key ? "on" : ""} onClick={() => onChange(t.key)}>
          {t.label}{t.count != null && <span className="xd-tabn">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/**
 * Tab state that lives in the URL (?tab=x), so back, refresh and shared links keep it.
 * `keys` = allowed values; anything else falls back. Uses replaceState (no navigation, no re-render of the server page).
 */
export function useTabParam<T extends string>(keys: readonly T[], fallback: T, param = "tab"): [T, (k: T) => void] {
  const [v, setV] = useState<T>(fallback)
  useEffect(() => {
    const read = () => {
      const q = new URLSearchParams(window.location.search).get(param)
      setV(q && (keys as readonly string[]).includes(q) ? (q as T) : fallback)
    }
    read()
    window.addEventListener("popstate", read)
    return () => window.removeEventListener("popstate", read)
    // keys is usually a literal; join keeps the dep stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param, fallback, keys.join("|")])
  const set = useCallback((k: T) => {
    setV(k)
    const url = new URL(window.location.href)
    if (k === fallback) url.searchParams.delete(param)
    else url.searchParams.set(param, k)
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
  }, [param, fallback])
  return [v, set]
}

// Route tabs: each tab is its own URL. Active = exact pathname match (or `active` to override).
export function LinkTabs({ tabs, active, label = "Sections" }: { tabs: { href: string; label: ReactNode; match?: string }[]; active?: string; label?: string }) {
  const pathname = usePathname() ?? ""
  const on = (t: { href: string; match?: string }) => (active ? t.href === active : pathname === (t.match ?? t.href.split("?")[0]))
  const ref = useScrollFade(pathname + (active ?? ""))
  return (
    <nav ref={ref} className="ax-tabs" aria-label={label}>
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={on(t) ? "on" : ""} aria-current={on(t) ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

// Segmented control: 2-4 choices of one setting (Monthly / Yearly, 7 / 30 days, Week / Month).
export function Segmented<T extends string>({ options, value, onChange, label, full = false, size }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string; full?: boolean; size?: "sm" }) {
  return (
    <div className={`ax-seg xd-seg${full ? " full" : ""}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)} style={size === "sm" ? { padding: "4px 10px", fontSize: 12 } : undefined}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Filter pills: pick one filter (e.g. All / Instagram / LinkedIn). `scroll` = one sideways row on phones.
export function FilterPills<T extends string>({ options, value, onChange, label, scroll = false }: { options: { value: T; label: ReactNode; count?: number; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; label: string; scroll?: boolean }) {
  return (
    <div className={`xd-fp${scroll ? " scroll" : ""}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon}{o.label}{o.count != null && <span className="n">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
