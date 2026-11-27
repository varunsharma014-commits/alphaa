"use client"

import { PRIVACY_EVENT } from "@/components/common/ConsentBanner"

// Footer link (CCPA/CPRA "Your Privacy Choices"): opens the ad-cookie opt-out panel.
export function PrivacyChoicesLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(PRIVACY_EVENT))}>
      Your privacy choices
    </button>
  )
}
