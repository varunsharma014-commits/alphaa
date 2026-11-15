"use client"

import { OPEN_EVENT } from "@/components/common/ConsentBanner"

// Footer link that reopens the cookie banner so a visitor can change their choice.
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Cookie settings
    </button>
  )
}
