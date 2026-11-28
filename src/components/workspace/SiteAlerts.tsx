"use client"

import Link from "next/link"

// Briefing: a speed metric that turned poor for real visitors, or a business fact the site's
// structured data now gets wrong (lib/seo/site-vitals.ts getSiteAlerts). Newest weekly check only.
export function SiteAlerts({ alerts }: { alerts: { text: string; href: string }[] }) {
  if (!alerts.length) return null
  return (
    <section className="ax-card" style={{ padding: "14px 22px", marginBottom: 22, borderColor: "rgba(255,149,0,.4)" }} aria-label="Website alerts">
      <div className="ax-eb" style={{ color: "var(--x-amber)" }}>Your website · needs a look</div>
      {alerts.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ flex: 1, minWidth: 220, fontSize: 14, lineHeight: 1.45 }}>{a.text}</span>
          <Link className="ax-btn s sm" href={a.href}>See the fix</Link>
        </div>
      ))}
    </section>
  )
}
