"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Check, ChevronDown, Globe } from "lucide-react"
import { MARKET_COOKIE } from "@/content/markets/prices"

// Footer market picker (replaces the 7-link "Markets" column). The links are always in the
// DOM (only hidden), so crawlers still find every market page.
// Popover (2026-11-26): anchored to the button with an 8px gap, opens upward when there isn't
// room below, aligns to the button's right edge unless that would run off-screen, and becomes a
// bottom sheet under 600px. Keyboard: Enter/Space/↓ opens and focuses the current market,
// ↑/↓/Home/End move, Escape or Tab closes, focus returns to the button. Styles: v3.css `.ms-*`.

const MARKETS = [
  { href: "/", key: "us", code: "US", label: "United States & Canada", lang: "en" },
  { href: "/uk", key: "uk", code: "UK", label: "United Kingdom", lang: "en-GB" },
  { href: "/de", key: "de", code: "DE", label: "Deutschland", lang: "de" },
  { href: "/fr", key: "fr", code: "FR", label: "France", lang: "fr" },
  { href: "/it", key: "it", code: "IT", label: "Italia", lang: "it" },
  { href: "/ae", key: "ae", code: "AE", label: "UAE (English)", lang: "en-AE" },
  { href: "/ae/ar", key: "ar", code: "AE", label: "الإمارات (العربية)", lang: "ar", dir: "rtl" as const },
] as const

function currentKey(path: string): string {
  if (path === "/ae/ar" || path.startsWith("/ae/ar/")) return "ar"
  const seg = path.split("/")[1]
  return ["uk", "de", "fr", "it", "ae"].includes(seg) ? seg : "us"
}

export function MarketSwitcher() {
  const path = usePathname() ?? "/"
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState<{ up: boolean; end: boolean }>({ up: true, end: true })
  const root = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLUListElement>(null)
  const items = useRef<(HTMLAnchorElement | null)[]>([])
  const active = MARKETS.find((m) => m.key === currentKey(path)) ?? MARKETS[0]
  const activeIndex = MARKETS.indexOf(active)

  const close = useCallback((focusButton: boolean) => {
    setOpen(false)
    if (focusButton) btn.current?.focus()
  }, [])

  // Place it before paint: up if there's no room below, right-aligned unless that runs off-screen.
  useLayoutEffect(() => {
    if (!open || !btn.current || !pop.current) return
    const b = btn.current.getBoundingClientRect()
    const h = pop.current.offsetHeight
    const w = pop.current.offsetWidth
    const below = window.innerHeight - b.bottom
    setPlace({ up: below < h + 16 && b.top > below, end: b.right - w >= 8 })
  }, [open])

  useEffect(() => {
    if (!open) return
    items.current[activeIndex]?.focus()
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(false) }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open, activeIndex, close])

  const move = (to: number) => {
    const n = MARKETS.length
    items.current[(to + n) % n]?.focus()
  }

  const onListKey = (e: React.KeyboardEvent) => {
    const i = items.current.findIndex((el) => el === document.activeElement)
    if (e.key === "ArrowDown") { e.preventDefault(); move(i + 1) }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(i - 1) }
    else if (e.key === "Home") { e.preventDefault(); move(0) }
    else if (e.key === "End") { e.preventDefault(); move(MARKETS.length - 1) }
    else if (e.key === "Escape") { e.preventDefault(); close(true) }
    else if (e.key === "Tab") close(false)
  }

  const onButtonKey = (e: React.KeyboardEvent) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) { e.preventDefault(); setOpen(true) }
    else if (e.key === "Escape" && open) { e.preventDefault(); close(true) }
  }

  return (
    <div className={`ms${open ? " ms--open" : ""}`} ref={root}>
      <button
        ref={btn}
        type="button"
        className="ms__btn"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKey}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="ms-list"
        aria-label={`Market: ${active.label}. Change market`}
      >
        <Globe aria-hidden="true" />
        <span>{active.label}</span>
        <ChevronDown className="ms__chev" aria-hidden="true" />
      </button>
      {open && <div className="ms__scrim" aria-hidden="true" onClick={() => close(false)} />}
      <ul
        ref={pop}
        id="ms-list"
        hidden={!open}
        aria-label="Choose your market"
        onKeyDown={onListKey}
        className={`ms__pop${place.up ? " ms__pop--up" : ""}${place.end ? " ms__pop--end" : ""}`}
      >
        {MARKETS.map((m, i) => (
          <li key={m.key} dir={"dir" in m ? m.dir : undefined}>
            <a
              ref={(el) => { items.current[i] = el }}
              href={m.href}
              hrefLang={m.lang}
              lang={m.lang}
              tabIndex={open ? 0 : -1}
              aria-current={m.key === active.key ? "true" : undefined}
              className="ms__item"
              onClick={() => {
                // US & Canada: forget a previously chosen market so prices show in USD again
                // (market pages set the cookie themselves in middleware).
                if (m.key === "us") document.cookie = `${MARKET_COOKIE}=; path=/; max-age=0; samesite=lax`
              }}
            >
              <span className="ms__code" aria-hidden="true">{m.code}</span>
              <span className="ms__label">{m.label}</span>
              {m.key === active.key ? <Check className="ms__check" aria-hidden="true" /> : <span className="ms__check" aria-hidden="true" />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
