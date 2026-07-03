import Link from "next/link"
import { CheckCircle2, AlertCircle, Circle, Sparkles } from "lucide-react"
import { StatusPill, type PillVariant } from "./StatusPill"
import { DsCard } from "./DsCard"
import { SectionDivider } from "./SectionDivider"

// SetupHealth — answers "is everything connected so alphaa can actually work?"
// in one glance. Presentational only: the dashboard page (a server component)
// does the DB reads and passes plain props down.
//
// When everything important (Google + business profile + search data) is green
// and the sync is fresh, the whole thing collapses to a single slim green line
// so healthy users are never nagged.

export interface SetupHealthProps {
  /** Google account connected (Integration row exists) */
  connected: boolean
  /** Google Business Profile location picked (gmbLocationId set) */
  hasBusinessProfile: boolean
  /** Search data source picked (gscSiteUrl set) */
  hasSearchData: boolean
  /** Visitor analytics picked (gaPropertyId set) — optional tier */
  hasAnalytics: boolean
  /** Last successful Google data sync, if any */
  lastSyncedAt: Date | null
}

const SETTINGS_HREF = "/dashboard/settings/integrations"
const STALE_MS = 48 * 60 * 60 * 1000

type Tone = "good" | "bad" | "warn" | "neutral" | "muted"

const TONE_ICON_COLOR: Record<Tone, string> = {
  good: "#22c55e",
  bad: "#dc2626",
  warn: "#f59e0b",
  neutral: "#666666",
  muted: "#555555",
}

function Row({
  tone,
  title,
  pill,
  pillVariant,
  href,
  last,
}: {
  tone: Tone
  title: React.ReactNode
  pill: string
  pillVariant: PillVariant
  href?: string
  last?: boolean
}) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "bad" || tone === "warn" ? AlertCircle : Circle
  const body = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 1.25rem",
        borderBottom: last ? "none" : "0.5px solid #222222",
      }}
    >
      <Icon size={15} color={TONE_ICON_COLOR[tone]} style={{ flexShrink: 0 }} />
      <span
        style={{
          fontSize: "13px",
          color: tone === "muted" ? "#666666" : "#cccccc",
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        {title}
      </span>
      <StatusPill variant={pillVariant}>{pill}</StatusPill>
    </div>
  )
  if (href) {
    return (
      <Link href={href} style={{ display: "block", textDecoration: "none" }}>
        {body}
      </Link>
    )
  }
  return body
}

export function SetupHealth({
  connected,
  hasBusinessProfile,
  hasSearchData,
  hasAnalytics,
  lastSyncedAt,
}: SetupHealthProps) {
  const syncStale =
    connected && lastSyncedAt !== null && Date.now() - lastSyncedAt.getTime() > STALE_MS

  const coreHealthy = connected && hasBusinessProfile && hasSearchData && !syncStale

  // ── Healthy: collapse to a single slim green line ──
  if (coreHealthy) {
    return (
      <div
        style={{
          background: "#0d2218",
          border: "1px solid #14532d",
          borderRadius: "8px",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 500, flex: 1 }}>
          Everything connected — alphaa is running on autopilot
        </span>
        {connected && lastSyncedAt === null && (
          <span style={{ fontSize: "11px", color: "#555555" }}>First sync scheduled</span>
        )}
      </div>
    )
  }

  // ── Something is missing: prominent card with ONE primary CTA ──
  const cta = !connected
    ? { label: "Connect Google →", href: SETTINGS_HREF }
    : !hasBusinessProfile
      ? { label: "Pick your business location →", href: SETTINGS_HREF }
      : !hasSearchData
        ? { label: "Turn on search data →", href: SETTINGS_HREF }
        : { label: "Reconnect Google →", href: SETTINGS_HREF }

  return (
    <>
      <SectionDivider>SETUP — WHAT ALPHAA NEEDS TO WORK FOR YOU</SectionDivider>
      <DsCard accent={!connected ? "#dc2626" : "#f59e0b"} style={{ padding: 0, marginBottom: "16px" }}>
        {/* Header with the single primary CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 1.25rem",
            borderBottom: "0.5px solid #222222",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
              {!connected
                ? "Connect Google so alphaa can work for you"
                : "One more step to finish your setup"}
            </p>
            <p style={{ fontSize: "12px", color: "#888888", marginTop: "2px", lineHeight: 1.5 }}>
              {!connected
                ? "One click — this lets alphaa post updates and track your results."
                : "alphaa is connected to Google but needs a little more to run fully."}
            </p>
          </div>
          <Link
            href={cta.href}
            style={{
              background: "#e05a2b",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            {cta.label}
          </Link>
        </div>

        {/* Row 1 — Google connection */}
        <Row
          tone={connected ? "good" : "bad"}
          title={connected ? "Google connected" : "Connect Google so alphaa can post for you"}
          pill={connected ? "Connected" : "Not connected"}
          pillVariant={connected ? "found" : "error"}
          href={connected ? undefined : SETTINGS_HREF}
        />

        {/* Row 2 — Business profile */}
        <Row
          tone={!connected ? "neutral" : hasBusinessProfile ? "good" : "warn"}
          title={
            !connected
              ? "Your business profile — waiting for Google"
              : hasBusinessProfile
                ? "Your business profile is linked"
                : "Pick your business location so alphaa can post updates"
          }
          pill={!connected ? "Waiting" : hasBusinessProfile ? "Ready" : "Pick location"}
          pillVariant={!connected ? "neutral" : hasBusinessProfile ? "found" : "warning"}
          href={connected && !hasBusinessProfile ? SETTINGS_HREF : undefined}
        />

        {/* Row 3 — Search data */}
        <Row
          tone={!connected ? "neutral" : hasSearchData ? "good" : "warn"}
          title={
            !connected
              ? "Search data — waiting for Google"
              : hasSearchData
                ? "Search data is flowing — alphaa can see how people find you"
                : "Pick your website so alphaa can track your searches"
          }
          pill={!connected ? "Waiting" : hasSearchData ? "Ready" : "Pick website"}
          pillVariant={!connected ? "neutral" : hasSearchData ? "found" : "warning"}
          href={connected && !hasSearchData ? SETTINGS_HREF : undefined}
        />

        {/* Row 4 — Analytics (optional tier) */}
        <Row
          tone={!connected ? "neutral" : hasAnalytics ? "good" : "neutral"}
          title={
            !connected
              ? "Visitor tracking — waiting for Google"
              : hasAnalytics
                ? "Visitor tracking is on"
                : "Optional: turn on visitor tracking to see who visits your site"
          }
          pill={!connected ? "Waiting" : hasAnalytics ? "Ready" : "Optional"}
          pillVariant={!connected ? "neutral" : hasAnalytics ? "found" : "neutral"}
          href={connected && !hasAnalytics ? SETTINGS_HREF : undefined}
        />

        {/* Row 5 — Sync freshness (only meaningful once connected) */}
        {connected && (
          <Row
            tone={syncStale ? "warn" : lastSyncedAt ? "good" : "neutral"}
            title={
              syncStale
                ? "Google connection may need attention — Reconnect"
                : lastSyncedAt
                  ? "Your Google data is up to date"
                  : "First sync scheduled — your data appears here soon"
            }
            pill={syncStale ? "Needs attention" : lastSyncedAt ? "Up to date" : "Scheduled"}
            pillVariant={syncStale ? "warning" : lastSyncedAt ? "found" : "neutral"}
            href={syncStale ? SETTINGS_HREF : undefined}
          />
        )}

        {/* Row 6 — Website booster (optional, muted, never red) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 1.25rem",
          }}
        >
          <Sparkles size={15} color="#555555" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "#666666", flex: 1, lineHeight: 1.5 }}>
            Optional booster:{" "}
            <Link href="/dashboard/audit" style={{ color: "#888888", textDecoration: "underline" }}>
              add the alphaa snippet
            </Link>{" "}
            for automatic website fixes
          </span>
          <StatusPill variant="neutral">Optional</StatusPill>
        </div>
      </DsCard>
    </>
  )
}
