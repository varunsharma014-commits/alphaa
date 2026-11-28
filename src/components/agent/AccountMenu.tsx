"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import { Pill, Popover } from "@/components/workspace/ui"
import { Icon, type IconName } from "@/components/workspace/icons"

// Our own account menu (instead of Clerk's UserButton): the whole "Account & billing" row in the
// sidebar footer opens it. Who's signed in + the plan, then Account (with connections), Plan &
// billing, and Sign out. A floating panel anchored to the row, so it never pushes or clips the sidebar.

type Who = { name: string | null; email: string; image: string | null }
type Item = { label: string; href?: string; onClick?: () => void; icon: IconName; danger?: boolean }

const GROUPS = (security: () => void, signOut: () => void): { title: string; items: Item[] }[] => [
  { title: "Account", items: [
    { label: "Your account", href: "/dashboard/settings/account", icon: "user" },
    { label: "Connections", href: "/dashboard/settings/integrations", icon: "plug" },
    { label: "Login & security", onClick: security, icon: "shield" },
  ] },
  { title: "Plan & billing", items: [
    { label: "Plans", href: "/dashboard/upgrade", icon: "spark" },
    { label: "Billing", href: "/dashboard/settings/billing", icon: "card" },
  ] },
  { title: "", items: [{ label: "Sign out", onClick: signOut, icon: "out", danger: true }] },
]

function Avatar({ who, size = 30 }: { who: Who; size?: number }) {
  const initial = (who.name?.[0] ?? who.email[0] ?? "?").toUpperCase()
  return (
    <span className="ax-av" style={{ width: size, height: size }} aria-hidden="true">
      {who.image ? <img src={who.image} alt="" /> : initial}
    </span>
  )
}

/** The menu itself, without Clerk (the dev preview renders it with sample details). */
export function AccountMenuView({ who, plan, onSecurity, onSignOut }: { who: Who; plan: string | null; onSecurity: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const close = () => setOpen(false)
  return (
    <>
      <button ref={btn} type="button" className="ax-acctbtn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Avatar who={who} />
        <span className="t"><b>Account &amp; billing</b><small>{who.name ?? who.email}</small></span>
        <span className="ax-acctbtn__chev"><Icon name="updown" size={16} /></span>
      </button>
      <Popover open={open} onClose={close} anchor={btn} width={272} label="Account">
        <div className="ax-am" role="menu" aria-label="Account">
          <div className="ax-am__who">
            <Avatar who={who} size={38} />
            <span className="t">
              {who.name && <b>{who.name}</b>}
              <small>{who.email}</small>
            </span>
            {plan && <Pill tone="info">{plan}</Pill>}
          </div>
          {GROUPS(onSecurity, onSignOut).map((g, i) => (
            <div key={i} className="ax-am__g">
              {g.title ? <p className="ax-am__h">{g.title}</p> : <div className="xd-msep" role="separator" />}
              {g.items.map((it) => it.href ? (
                <Link key={it.label} href={it.href} role="menuitem" className="xd-mi" onClick={close}><Icon name={it.icon} size={17} /><span>{it.label}</span></Link>
              ) : (
                <button key={it.label} type="button" role="menuitem" className={`xd-mi${it.danger ? " danger" : ""}`} onClick={() => { close(); it.onClick?.() }}><Icon name={it.icon} size={17} /><span>{it.label}</span></button>
              ))}
            </div>
          ))}
        </div>
      </Popover>
    </>
  )
}

export function AccountMenu({ plan }: { plan?: string | null }) {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const email = user?.primaryEmailAddress?.emailAddress ?? ""
  const name = user?.fullName?.trim() || user?.firstName || null
  return (
    <AccountMenuView
      who={{ name, email, image: user?.hasImage ? user.imageUrl : null }}
      plan={plan ?? null}
      onSecurity={() => openUserProfile()}
      onSignOut={() => void signOut({ redirectUrl: "/" })}
    />
  )
}
