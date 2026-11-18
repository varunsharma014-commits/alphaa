"use client"

// Marketing nav (v3): frosted bar inside the framed column, coloured service pills in the
// mobile drawer. Tokens from marketing/v3/v3.css (dark only on pages with a .v3-page root).
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Sparkles } from "lucide-react"
import "@/components/marketing/v3/v3.css"
import { SVC, SVC_ORDER } from "@/components/marketing/v3/services-v3"

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it Works" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/pricing", label: "Pricing" },
]

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setMobileOpen(false), [pathname])
  useEffect(() => {
    if (!mobileOpen) return
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false) }
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [mobileOpen])

  // Marketing pages don't load Clerk's SDK, so read its non-httpOnly
  // __client_uat cookie (sign-in timestamp, "0" when signed out) to swap
  // Login for Dashboard. Otherwise a signed-in user looks signed out here.
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    const uat = document.cookie.match(/(?:^|; )__client_uat=(\d+)/)?.[1]
    setSignedIn(!!uat && uat !== "0")
  }, [])
  const account = signedIn ? { href: "/dashboard", label: "Your briefing" } : { href: "/login", label: "Login" }

  return (
    <div className="v3">
      <header className="v3-nav">
        <div className="v3-nav__in">
          <Link href="/" className="v3-logo" aria-label="Alphaa home">
            <Sparkles aria-hidden="true" />
            alphaa
          </Link>
          <nav className="v3-nav__links" aria-label="Main">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="v3-nav__right">
            <Link href={account.href} className="v3-nav__acct">{account.label}</Link>
            <Link href="/start" className="v3-btn v3-btn--sm">Get started</Link>
          </div>
          <button
            type="button"
            className="v3-nav__burger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="v3-drawer"
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="v3-drawer" id="v3-drawer">
          <ul className="v3-pills">
            {SVC_ORDER.map((slug) => (
              <li key={slug} className={`v3-c-${SVC[slug].key}`}><Link className="v3-pill" href={`/services/${slug}`}>{SVC[slug].pill}</Link></li>
            ))}
          </ul>
          {navLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          <Link href={account.href}>{account.label}</Link>
          <Link href="/start" className="v3-btn">Get started →</Link>
        </div>
      )}
    </div>
  )
}
