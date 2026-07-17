'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AutopilotBar } from '@/components/dashboard/AutopilotBar'
import { DsCard } from '@/components/dashboard/DsCard'
import { StatusPill } from '@/components/dashboard/StatusPill'
import { SectionDivider } from '@/components/dashboard/SectionDivider'
import {
  CheckCircle2,
  RefreshCw,
  Unlink,
  ChevronDown,
  AlertCircle,
  Globe,
  Loader2,
  Zap,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectionState =
  | 'loading'
  | 'not_connected'
  | 'selecting_properties'
  | 'connected'

interface IntegrationStatus {
  connected: boolean
  gaPropertyId: string | null
  gaPropertyName: string | null
  gscSiteUrl: string | null
  gmbLocationName: string | null
  lastSyncedAt: string | null
}

interface Properties {
  gaProperties: { id: string; name: string }[]
  gscSites: string[]
  gmbLocations: {
    accountId: string
    locationId: string
    locationName: string
    address: string
  }[]
}

interface CrawlIssue {
  type: string
  severity: 'critical' | 'warning' | 'improvement'
  url: string
  description: string
  fix: string
}

interface CrawlSummary {
  pagesScanned: number
  issues: CrawlIssue[]
  crawledAt: string
}

// ─── Google SVG Logo ──────────────────────────────────────────────────────────

function GoogleLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: CrawlIssue['severity'] }) {
  if (severity === 'critical') {
    return <StatusPill variant="error">Critical</StatusPill>
  }
  if (severity === 'warning') {
    return <StatusPill variant="warning">Warning</StatusPill>
  }
  return <StatusPill variant="info">Improve</StatusPill>
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const searchParams = useSearchParams()

  // Google integration state
  const [state, setState] = useState<ConnectionState>('loading')
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justConnected, setJustConnected] = useState(false)

  // Property selection state
  const [properties, setProperties] = useState<Properties | null>(null)
  const [propsLoading, setPropsLoading] = useState(false)
  const [selectedGa, setSelectedGa] = useState('')
  const [selectedGsc, setSelectedGsc] = useState('')
  const [selectedGmbLocation, setSelectedGmbLocation] = useState('')
  const [saving, setSaving] = useState(false)

  // Crawl state
  const [crawlData, setCrawlData] = useState<CrawlSummary | null>(null)
  const [crawling, setCrawling] = useState(false)
  const [crawlError, setCrawlError] = useState<string | null>(null)
  const [crawlLoading, setCrawlLoading] = useState(true)

  // ── Fetch integration status on mount ──────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/google/status')
      if (!res.ok) throw new Error('Failed to fetch status')
      const data: IntegrationStatus = await res.json()
      setStatus(data)

      if (!data.connected) {
        setState('not_connected')
      } else if (!data.gaPropertyId && !data.gscSiteUrl) {
        setState('selecting_properties')
      } else {
        setState('connected')
      }
    } catch {
      setState('not_connected')
      setError('We could not check your Google connection just now. Your data is safe — try refreshing in a moment.')
    }
  }, [])

  // ── Fetch latest crawl result ──────────────────────────────────────────────
  const fetchCrawl = useCallback(async () => {
    try {
      const res = await fetch('/api/crawl/latest')
      if (res.ok) {
        const { result } = (await res.json()) as { result: CrawlSummary | null }
        if (result?.crawledAt) setCrawlData(result)
      }
    } catch {
      // no crawl data yet — silent
    } finally {
      setCrawlLoading(false)
    }
  }, [])

  const fetchProperties = useCallback(async () => {
    setPropsLoading(true)
    try {
      const res = await fetch('/api/integrations/google/properties')
      if (!res.ok) throw new Error('Failed to fetch properties')
      const data: Properties = await res.json()
      setProperties(data)
    } catch {
      setError('We could not load your Google properties. Try reconnecting and we will take it from there.')
    } finally {
      setPropsLoading(false)
    }
  }, [])

  useEffect(() => {
    const connected = searchParams.get('connected')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      setError('Google connection did not finish. No problem — just click Connect to try again.')
      setState('not_connected')
      setCrawlLoading(false)
      fetchCrawl()
      return
    }

    if (connected === 'true') {
      // Just returned from OAuth — go straight to property selection
      setJustConnected(true)
      setState('selecting_properties')
      setCrawlLoading(false)
      fetchProperties()
      fetchCrawl()
      return
    }

    fetchStatus()
    fetchCrawl()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When entering selecting_properties fetch available options if not yet loaded
  useEffect(() => {
    if (state === 'selecting_properties' && !properties && !propsLoading) {
      fetchProperties()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/google/connect')
      if (!res.ok) throw new Error('Failed to get auth URL')
      const { authUrl } = (await res.json()) as { authUrl: string }
      window.location.href = authUrl
    } catch {
      setError('We could not open the Google connection screen. Please try again in a moment.')
      setConnecting(false)
    }
  }

  const handleSaveProperties = async () => {
    setSaving(true)
    setError(null)
    try {
      const selectedGmb = properties?.gmbLocations.find(
        (l) => l.locationId === selectedGmbLocation,
      )
      const res = await fetch('/api/integrations/google/save-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gaPropertyId: selectedGa || null,
          gscSiteUrl: selectedGsc || null,
          gmbAccountId: selectedGmb?.accountId ?? null,
          gmbLocationId: selectedGmb?.locationId ?? null,
          gmbLocationName: selectedGmb?.locationName ?? null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save properties')
      await fetchStatus()
    } catch {
      setError('We could not save your choices just now. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      await fetchStatus()
    } catch {
      setError('The sync did not finish. We will keep trying automatically — or click Sync now to retry.')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (
      !confirm(
        'Disconnect Google? This will remove your tokens and property selections.',
      )
    )
      return
    setDisconnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/google/disconnect', {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Disconnect failed')
      setStatus(null)
      setProperties(null)
      setSelectedGa('')
      setSelectedGsc('')
      setSelectedGmbLocation('')
      setState('not_connected')
    } catch {
      setError('We could not disconnect just now. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleCrawl = async () => {
    setCrawling(true)
    setCrawlError(null)
    try {
      const res = await fetch('/api/crawl', { method: 'POST' })
      if (!res.ok) throw new Error('Crawl failed')
      const { result } = (await res.json()) as { result: CrawlSummary }
      setCrawlData(result)
    } catch {
      setCrawlError(
        'We could not scan your website this time. Check that your website address is saved under Settings → Business details, then try again.',
      )
    } finally {
      setCrawling(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    color: '#444',
  }
  const selectClass =
    'w-full appearance-none rounded-lg px-3 py-2.5 text-[13px] pr-9 focus:outline-none transition-colors'
  const selectStyle: React.CSSProperties = {
    backgroundColor: 'var(--ds-surface)',
    border: '.5px solid #222',
    color: '#fff',
  }
  const primaryBtnStyle: React.CSSProperties = {
    backgroundColor: 'var(--ds-accent)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
  }
  const secondaryBtnStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px solid #333',
    color: '#888',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
  }

  // ── Google section renderer ────────────────────────────────────────────────

  const renderGoogleSection = () => {
    if (state === 'loading') {
      return (
        <DsCard>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: 'var(--ds-surface)' }} />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 rounded" style={{ backgroundColor: 'var(--ds-surface)' }} />
              <div className="h-3 w-72 rounded" style={{ backgroundColor: 'var(--ds-surface)' }} />
            </div>
          </div>
        </DsCard>
      )
    }

    if (state === 'not_connected') {
      return (
        <DsCard>
          <div className="flex flex-col items-center text-center py-4 gap-5">
            {/* Google logo tile */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid #222' }}
            >
              <GoogleLogo size={30} />
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-[15px] font-medium" style={{ color: '#fff' }}>
                Connect Google so alphaa can work for you
              </h2>
              <p className="text-[13px]" style={{ color: '#888', lineHeight: 1.6 }}>
                Link your Google Business Profile, Search Console, and Analytics
                once. After that, alphaa pulls your data, posts on your behalf,
                and watches your rankings automatically — you never log in again.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ ...primaryBtnStyle, padding: '8px 18px' }}
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleLogo size={18} />
              )}
              {connecting ? 'Opening Google…' : 'Connect Google'}
            </button>

            {/* What gets connected chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Business Profile', 'Search Console', 'Analytics'].map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                  style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid #222', color: '#888' }}
                >
                  <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--ds-ok)' }} />
                  <span>{chip}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] max-w-sm" style={{ color: '#555' }}>
              alphaa only requests the access it needs. Your data stays private
              and is never shared.
            </p>
          </div>
        </DsCard>
      )
    }

    if (state === 'selecting_properties') {
      return (
        <DsCard>
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--ds-ok-bg)', border: '1px solid var(--ds-ok-border)' }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--ds-ok)' }} />
            </div>
            <div>
              <h2 className="text-[14px] font-medium" style={{ color: '#fff' }}>
                Google is connected — pick what alphaa should manage
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#888' }}>
                Choose your accounts below. You can leave any on “Set up later”
                and alphaa will remind you when it needs them.
              </p>
            </div>
          </div>

          {propsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-11 rounded-lg animate-pulse"
                  style={{ backgroundColor: 'var(--ds-surface)' }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* GMB Location — most important, first */}
              <div className="space-y-1.5">
                <label style={labelStyle}>Business Profile Location</label>
                <div className="relative">
                  <select
                    value={selectedGmbLocation}
                    onChange={(e) => setSelectedGmbLocation(e.target.value)}
                    className={selectClass}
                    style={selectStyle}
                  >
                    <option value="">— Set up later —</option>
                    {properties?.gmbLocations.map((l) => (
                      <option key={l.locationId} value={l.locationId}>
                        {l.locationName} — {l.address}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#555' }} />
                </div>
              </div>

              {/* GSC Site */}
              <div className="space-y-1.5">
                <label style={labelStyle}>Search Console Site</label>
                <div className="relative">
                  <select
                    value={selectedGsc}
                    onChange={(e) => setSelectedGsc(e.target.value)}
                    className={selectClass}
                    style={selectStyle}
                  >
                    <option value="">— Set up later —</option>
                    {properties?.gscSites.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#555' }} />
                </div>
              </div>

              {/* GA Property */}
              <div className="space-y-1.5">
                <label style={labelStyle}>Google Analytics Property</label>
                <div className="relative">
                  <select
                    value={selectedGa}
                    onChange={(e) => setSelectedGa(e.target.value)}
                    className={selectClass}
                    style={selectStyle}
                  >
                    <option value="">— Set up later —</option>
                    {properties?.gaProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#555' }} />
                </div>
              </div>

              <button
                onClick={handleSaveProperties}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ ...primaryBtnStyle, padding: '10px 18px' }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {saving ? 'Saving…' : 'Save & let alphaa take over'}
              </button>

              {!selectedGa && !selectedGsc && !selectedGmbLocation && (
                <p className="text-[11px] text-center" style={{ color: '#555' }}>
                  You can set everything up later — alphaa will guide you when
                  it needs each one.
                </p>
              )}
            </div>
          )}
        </DsCard>
      )
    }

    // connected state
    return (
      <DsCard>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid #222' }}
            >
              <GoogleLogo size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[14px] font-medium" style={{ color: '#fff' }}>Google</h2>
                <StatusPill variant="found">Connected</StatusPill>
              </div>
              {status?.lastSyncedAt && (
                <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: '#555' }}>
                  <Clock className="w-3 h-3" /> alphaa last synced your data{' '}
                  {formatTime(status.lastSyncedAt)}
                </p>
              )}
              {!status?.lastSyncedAt && (
                <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>
                  alphaa is preparing your first sync — nothing for you to do.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3.5 py-2 transition-colors disabled:opacity-50"
              style={{ ...secondaryBtnStyle, fontSize: '11px' }}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
              />
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-3.5 py-2 transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'transparent', border: '1px solid var(--ds-bad-border)', color: 'var(--ds-bad)', borderRadius: '8px', fontSize: '11px', fontWeight: 500 }}
            >
              <Unlink className="w-3.5 h-3.5" />
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        </div>

        {/* Property details */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Business Profile',
              value: status?.gmbLocationName ?? null,
            },
            {
              label: 'Search Console',
              value: status?.gscSiteUrl ?? null,
            },
            {
              label: 'Google Analytics',
              value: status?.gaPropertyName ?? status?.gaPropertyId ?? null,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg p-3 space-y-1.5"
              style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid #222' }}
            >
              <p style={labelStyle}>{item.label}</p>
              {item.value ? (
                <p className="text-[12px] font-medium truncate" style={{ color: '#fff' }}>
                  {item.value}
                </p>
              ) : (
                <button
                  onClick={() => setState('selecting_properties')}
                  className="text-[12px] hover:underline"
                  style={{ color: 'var(--ds-accent)' }}
                >
                  Set up →
                </button>
              )}
            </div>
          ))}
        </div>
      </DsCard>
    )
  }

  // ── Crawl helpers ─────────────────────────────────────────────────────────

  const issues = Array.isArray(crawlData?.issues) ? crawlData.issues : []

  const criticalIssues = issues
    .filter((i) => i.severity === 'critical')
    .slice(0, 5)

  const issueCounts = crawlData
    ? {
        critical: issues.filter((i) => i.severity === 'critical').length,
        warning: issues.filter((i) => i.severity === 'warning').length,
        improvement: issues.filter((i) => i.severity === 'improvement').length,
      }
    : null

  // Show the loud action-needed banner only once we know Google is not connected
  const showConnectBanner =
    state === 'not_connected' && !justConnected

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6" style={{ fontFamily: 'system-ui' }}>
      <AutopilotBar message="alphaa runs your Google presence on autopilot. Connect your accounts once and we handle the rest — no daily logins needed." />

      {/* Header */}
      <div>
        <h1 className="font-medium" style={{ fontSize: '20px', color: '#fff' }}>
          Integrations
        </h1>
        <p className="text-[13px] mt-1" style={{ color: '#888', lineHeight: 1.6 }}>
          Connect your tools once. From there, alphaa pulls your data and works
          for you automatically.
        </p>
      </div>

      {/* Success banner after OAuth return */}
      {justConnected && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px]"
          style={{ backgroundColor: 'var(--ds-ok-bg)', border: '1px solid var(--ds-ok-border)', color: 'var(--ds-ok)' }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Google connected successfully! alphaa is now syncing your data —
            just pick what to manage below.
          </span>
        </div>
      )}

      {/* LOUD action-needed banner when Google is not connected */}
      {showConnectBanner && (
        <div
          className="rounded-lg p-4 sm:p-5"
          style={{ backgroundColor: 'var(--ds-bad-bg)', border: '1px solid var(--ds-bad-border)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--ds-bad-bg)', border: '1px solid var(--ds-bad-border)' }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--ds-bad)' }} />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-[14px] font-medium" style={{ color: '#fff' }}>
                Action needed: Connect your Google Business Profile
              </h2>
              <p className="text-[13px]" style={{ color: '#888', lineHeight: 1.6 }}>
                This is the most important step. Without it, alphaa cannot post
                to your Google listing, monitor your reviews, or track your
                search rankings.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ ...primaryBtnStyle, padding: '10px 20px', fontSize: '13px' }}
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleLogo size={16} />
                )}
                {connecting ? 'Opening Google…' : 'Connect now — takes 2 minutes →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px]"
          style={{ backgroundColor: 'var(--ds-warn-bg)', border: '1px solid var(--ds-warn-border)', color: 'var(--ds-warn)' }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[11px] ml-2 hover:underline"
            style={{ color: 'var(--ds-warn)' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Google ─────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionDivider>Google</SectionDivider>
        {renderGoogleSection()}
      </section>

      {/* ── Website Scanner ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionDivider>Website Scanner</SectionDivider>

        <DsCard>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid #222' }}
              >
                <Globe className="w-4 h-4" style={{ color: '#888' }} />
              </div>
              <div>
                <h3 className="text-[14px] font-medium" style={{ color: '#fff' }}>
                  Website health check
                </h3>
                {crawlLoading ? (
                  <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>Loading…</p>
                ) : crawlData ? (
                  <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: '#555' }}>
                    <Clock className="w-3 h-3" />
                    Last checked {formatTime(crawlData.crawledAt)} ·{' '}
                    {crawlData.pagesScanned} pages
                  </p>
                ) : (
                  <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>
                    alphaa will check your site for issues that hurt your ranking.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleCrawl}
              disabled={crawling}
              className="flex items-center gap-1.5 px-3.5 py-2 transition-colors disabled:opacity-50 flex-shrink-0"
              style={{ ...secondaryBtnStyle, fontSize: '11px' }}
            >
              {crawling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {crawling ? 'Checking…' : 'Check my website'}
            </button>
          </div>

          {/* Scanning in progress */}
          {crawling && (
            <div
              className="mt-5 flex flex-col items-center gap-3 py-8"
              style={{ borderTop: '.5px solid #222' }}
            >
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--ds-accent)' }} />
              <p className="text-[13px]" style={{ color: '#888' }}>
                alphaa is checking your website — this takes 15–60 seconds.
              </p>
            </div>
          )}

          {/* Crawl error — friendly fallback */}
          {!crawling && crawlError && (
            <div
              className="mt-4 flex items-center gap-2 p-3 rounded-lg text-[12px]"
              style={{ backgroundColor: 'var(--ds-warn-bg)', border: '1px solid var(--ds-warn-border)', color: 'var(--ds-warn)' }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {crawlError}
            </div>
          )}

          {/* Crawl results */}
          {!crawling && crawlData && issueCounts && (
            <div className="mt-5 pt-5 space-y-4" style={{ borderTop: '.5px solid #222' }}>
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                  style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid #222', color: '#fff' }}
                >
                  <Globe className="w-3 h-3" style={{ color: '#888' }} />
                  {crawlData.pagesScanned} pages checked
                </div>
                {issueCounts.critical > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                    style={{ backgroundColor: 'var(--ds-bad-bg)', border: '1px solid var(--ds-bad-border)', color: 'var(--ds-bad)' }}
                  >
                    <XCircle className="w-3 h-3" />
                    {issueCounts.critical} critical
                  </div>
                )}
                {issueCounts.warning > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                    style={{ backgroundColor: 'var(--ds-warn-bg)', border: '1px solid var(--ds-warn-border)', color: 'var(--ds-warn)' }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {issueCounts.warning} warnings
                  </div>
                )}
                {issueCounts.improvement > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                    style={{ backgroundColor: 'var(--ds-info-bg)', border: '1px solid var(--ds-info-border)', color: 'var(--ds-info)' }}
                  >
                    <Zap className="w-3 h-3" />
                    {issueCounts.improvement} improvements
                  </div>
                )}
              </div>

              {/* Top critical issues */}
              {criticalIssues.length > 0 && (
                <div className="space-y-2">
                  <p style={labelStyle}>What needs attention</p>
                  {criticalIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-3 space-y-2"
                      style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid #222' }}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="text-[12px] font-medium" style={{ color: '#fff' }}>
                          {issue.description}
                        </p>
                        <SeverityBadge severity={issue.severity} />
                      </div>
                      <p className="text-[12px]" style={{ color: '#888', lineHeight: 1.6 }}>
                        <span className="font-medium" style={{ color: 'var(--ds-info)' }}>How alphaa fixes it: </span>
                        {issue.fix}
                      </p>
                      {issue.url && issue.url !== 'site-wide' && (
                        <p className="text-[11px] truncate" style={{ color: '#444' }}>
                          {issue.url}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {issues.length === 0 && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-[13px]"
                  style={{ backgroundColor: 'var(--ds-ok-bg)', border: '1px solid var(--ds-ok-border)', color: 'var(--ds-ok)' }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Great news — alphaa found no issues on your site.
                </div>
              )}
            </div>
          )}
        </DsCard>
      </section>

    </div>
  )
}
