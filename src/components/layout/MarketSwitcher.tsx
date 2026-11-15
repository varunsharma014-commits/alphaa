"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Check, ChevronDown, Globe } from "lucide-react"
import { MARKET_COOKIE } from "@/content/markets/prices"

// Footer market picker (replaces the 7-link "Markets" column). The links are always in the
// DOM (only hidden), so crawlers still find every market page.

const MARKETS = [
  { href: "/", key: "us", label: "United States & Canada", lang: "en" },
  { href: "/uk", key: "uk", label: "United Kingdom", lang: "en-GB" },
  { href: "/de", key: "de", label: "Deutschland", lang: "de" },
  { href: "/fr", key: "fr", label: "France", lang: "fr" },
  { href: "/it", key: "it", label: "Italia", lang: "it" },
  { href: "/ae", key: "ae", label: "UAE (English)", lang: "en-AE" },
  { href: "/ae/ar", key: "ar", label: "الإمارات (العربية)", lang: "ar" },
] as const

function currentKey(path: string): string {
  if (path === "/ae/ar" || path.startsWith("/ae/ar/")) return "ar"
  const seg = path.split("/")[1]
  return ["uk", "de", "fr", "it", "ae"].includes(seg) ? seg : "us"
}

export function MarketSwitcher() {
  const path = usePathname() ?? "/"
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = MARKETS.find((m) => m.key === currentKey(path)) ?? MARKETS[0]

  useEffect(() => {
    if (!open) return
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Market: ${active.label}. Change market`}
        className="inline-flex items-center gap-1.5 text-[12px] text-[#424245] hover:text-[#1d1d1f]"
      >
        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{active.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <ul
        className={`${open ? "block" : "hidden"} absolute bottom-full mb-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 z-50 min-w-[230px] rounded-xl border border-[#d2d2d7] bg-white py-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)]`}
      >
        {MARKETS.map((m) => (
          <li key={m.key}>
            <a
              href={m.href}
              hrefLang={m.lang}
              lang={m.lang}
              aria-current={m.key === active.key ? "true" : undefined}
              onClick={() => {
                // US & Canada: forget a previously chosen market so prices show in USD again
                // (market pages set the cookie themselves in middleware).
                if (m.key === "us") document.cookie = `${MARKET_COOKIE}=; path=/; max-age=0; samesite=lax`
              }}
              className="flex items-center justify-between gap-4 px-3.5 py-2 text-[13px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
            >
              <span>{m.label}</span>
              {m.key === active.key && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
