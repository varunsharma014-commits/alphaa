"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button, ChannelMark, ConnectionCard, EmptyState, Glyph, List, ListRow, PageHeader, RowIcon, SectionHeader, Skeleton, sinceText, useConfirm } from "@/components/workspace/ui"
import { useCan } from "@/components/workspace/role"
import { SettingsTabs } from "./SettingsTabs"
import "./settings.css"

// Google: one connection for the Business Profile, Search Console and Analytics. Properties are
// picked automatically after sign-in (lib/google-autoselect.ts). The old website scanner that
// lived here is gone: website health has its own page under Tracking & Setup.
type Status = { connected: boolean; gaPropertyId: string | null; gaPropertyName: string | null; gscSiteUrl: string | null; gmbLocationName: string | null; lastSyncedAt: string | null }

/** "sc-domain:example.com" → "example.com"; "https://example.com/" → "example.com". */
const siteOf = (s: string) => s.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "")

export function GoogleView() {
  const params = useSearchParams()
  const [status, setStatus] = useState<Status | null | undefined>(undefined)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(params.get("error") ? "The Google sign-in didn’t finish. No problem, tap Connect Google to try again." : null)
  const [synced, setSynced] = useState(false)
  const justConnected = params.get("connected") === "true"
  const canConnect = useCan("connect")
  const { confirm, node } = useConfirm()

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/google/status")
      if (!res.ok) throw new Error()
      setStatus((await res.json()) as Status)
    } catch {
      setStatus(null)
      setError("I couldn’t check your Google connection just now. Your data is safe. Refresh in a moment.")
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function connect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch("/api/integrations/google/connect?analytics=1")
      if (!res.ok) throw new Error()
      const { authUrl } = (await res.json()) as { authUrl: string }
      window.location.href = authUrl
    } catch {
      setError("I couldn’t open the Google sign-in. Try again in a moment.")
      setConnecting(false)
    }
  }

  async function sync() {
    setSyncing(true)
    setError(null)
    setSynced(false)
    try {
      const res = await fetch("/api/integrations/sync", { method: "POST" })
      if (!res.ok) throw new Error()
      await load()
      setSynced(true)
    } catch {
      setError("That check didn’t finish. I keep trying on my own every day, or tap Check Google now again.")
    } finally {
      setSyncing(false)
    }
  }

  async function disconnect() {
    if (!(await confirm({ title: "Disconnect Google?", text: "I stop reading your Search Console, Analytics and Business Profile, and stop posting to your listing. Anything already posted stays.", confirmLabel: "Disconnect", danger: true }))) return
    setDisconnecting(true)
    setError(null)
    try {
      const res = await fetch("/api/integrations/google/disconnect", { method: "DELETE" })
      if (!res.ok) throw new Error()
      setStatus({ connected: false, gaPropertyId: null, gaPropertyName: null, gscSiteUrl: null, gmbLocationName: null, lastSyncedAt: null })
    } catch {
      setError("I couldn’t disconnect just now. Try again.")
    } finally {
      setDisconnecting(false)
    }
  }

  const missing = <span className="xs-missing">Not in this Google account</span>
  const s = status
  return (
    <>
      <PageHeader title="Google" sub="Connect Google once. I read your numbers, post to your listing and tell you what I did." tabs={<SettingsTabs />} />
      <div className="xs-stack">
        {error && <div className="xs-banner bad" role="alert">{error}</div>}
        {justConnected && s?.connected && (
          <div className="xs-banner" role="status">
            <Glyph name="check" size={18} stroke={2.4} />
            <span>
              I’m connected to Google.{" "}
              {s.gscSiteUrl ? `I found ${siteOf(s.gscSiteUrl)} in Search Console` : "This Google account has no Search Console property for your website"}
              {s.gmbLocationName ? ` and your Business Profile “${s.gmbLocationName}”.` : "."} I’m pulling your data now.
            </span>
          </div>
        )}

        {s === undefined ? (
          <section className="ax-card xs-card"><Skeleton kind="row" rows={1} /></section>
        ) : s?.connected ? (
          <ConnectionCard
            logo={<ChannelMark channel="google" size={28} />}
            name="Google"
            state={s.gscSiteUrl || s.gmbLocationName || s.gaPropertyId ? "ok" : "warn"}
            status={s.gscSiteUrl || s.gmbLocationName || s.gaPropertyId ? "Connected. I check your numbers every day." : "Connected, but this Google account has nothing for your business yet."}
            synced={synced ? "Checked just now" : s.lastSyncedAt ? `Last checked ${sinceText(s.lastSyncedAt)}` : "Getting your first numbers now. Nothing for you to do."}
            action={<Button size="sm" loading={syncing} onClick={() => void sync()}>Check Google now</Button>}
            subs={[
              { label: "Business Profile", value: s.gmbLocationName ?? missing },
              { label: "Search Console", value: s.gscSiteUrl ? siteOf(s.gscSiteUrl) : missing },
              { label: "Analytics", value: s.gaPropertyName ?? (s.gaPropertyId ? "Connected" : missing) },
            ]}
          >
            {canConnect && (
              <div className="xs-row">
                {!(s.gscSiteUrl && s.gmbLocationName && s.gaPropertyId) && <Button size="sm" loading={connecting} onClick={() => void connect()}>Use a different Google account</Button>}
                <Button size="sm" variant="ghost" loading={disconnecting} onClick={() => void disconnect()}>Disconnect</Button>
              </div>
            )}
          </ConnectionCard>
        ) : (
          <EmptyState
            icon={<ChannelMark channel="google" size={30} />}
            title="Connect me to Google"
            text="One sign-in covers your Business Profile, Search Console and Analytics. You never have to log in to them again."
            bullets={["Your Google listing posts and review replies, ready for your OK", "Which searches bring people to your site, every week", "Visits and leads from Google, in your briefing"]}
            actions={canConnect ? <Button variant="primary" loading={connecting} onClick={() => void connect()}>Connect Google</Button> : <span className="xs-fine">The owner or an admin connects Google.</span>}
          />
        )}

        <p className="xs-fine">I only ask Google for the access I need. Your data stays private and is never shared.</p>

        <SectionHeader title="Website health" sub="Broken links, speed and what AI can read on your site." />
        <List card label="Website health">
          <ListRow lead={<RowIcon><Glyph name="globe" size={18} /></RowIcon>} title="See your website health" meta="I check your site every week and fix what I can." href="/dashboard/audit" chevron />
        </List>
      </div>
      {node}
    </>
  )
}
