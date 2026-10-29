"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"

// Our own avatar menu (instead of Clerk's UserButton): readable items, no
// third-party branding, and only the places an owner actually goes.

const ITEMS = [
  { label: "Connections", href: "/dashboard/settings/integrations" },
  { label: "Agent preferences", href: "/dashboard/settings/business" },
  { label: "Billing", href: "/dashboard/settings/billing" },
  { label: "Your account", href: "/dashboard/settings/account" },
  { label: "Weekly briefings", href: "/dashboard/reports" },
  { label: "Have a human do it", href: "/dashboard/concierge" },
]

export function AccountMenu() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  const email = user?.primaryEmailAddress?.emailAddress ?? ""
  const initial = (user?.firstName?.[0] ?? email[0] ?? "?").toUpperCase()

  return (
    <div className="ag-acct" ref={ref}>
      <button className="ag-acct__btn" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Account">
        {user?.hasImage ? <img src={user.imageUrl} alt="" /> : initial}
      </button>
      {open && (
        <div className="ag-acct__menu" role="menu">
          <div className="ag-acct__who">{email}</div>
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem" onClick={() => setOpen(false)}>{i.label}</Link>
          ))}
          <hr />
          <button role="menuitem" onClick={() => { setOpen(false); openUserProfile() }}>Login &amp; security</button>
          <button role="menuitem" onClick={() => signOut({ redirectUrl: "/" })}>Sign out</button>
        </div>
      )}
    </div>
  )
}
