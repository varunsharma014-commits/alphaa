"use client"

import { Button, Pill, StatusDot } from "./ui"
import "./p3.css"

// Briefing: a speed metric that turned poor for real visitors, or a business fact the site's
// structured data now gets wrong (lib/seo/site-vitals.ts getSiteAlerts). Newest weekly check only.
// Links point at Tracking → Site health (the hash opens that tab).
export function SiteAlerts({ alerts }: { alerts: { text: string; href: string }[] }) {
  if (!alerts.length) return null
  const fix = (href: string) => (href.startsWith("/dashboard/tracking#") ? href.replace("/dashboard/tracking#", "/dashboard/tracking?tab=health#") : href)
  return (
    <section className="ax-card x3-pad x3-alerts" aria-label="Website alerts">
      <div className="x3-row"><b>Your website needs a look</b><Pill tone="warn" dot>{alerts.length === 1 ? "1 thing" : `${alerts.length} things`}</Pill></div>
      {alerts.map((a, i) => (
        <div key={i} className="x3-banner x3-flat">
          <StatusDot tone="warn" />
          <span>{a.text}</span>
          <Button size="sm" href={fix(a.href)}>See the fix</Button>
        </div>
      ))}
    </section>
  )
}
