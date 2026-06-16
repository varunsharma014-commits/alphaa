'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/common/GlassCard'
import {
  CheckCircle2,
  RefreshCw,
  Unlink,
  ChevronDown,
  AlertTriangle,
  Globe,
  Loader2,
  Zap,
  Clock,
  XCircle,
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
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3" /> Critical
      </span>
    )
  }
  if (severity === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
        <AlertTriangle className="w-3 h-3" /> Warning
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
      <Zap className="w-3 h-3" /> Improve
    </span>
  )
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
      setError('Could not load integration status.')
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
      setError('Could not load Google properties. Try reconnecting.')
    } finally {
      setPropsLoading(false)
    }
  }, [])

  useEffect(() => {
    const connected = searchParams.get('connected')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      setError(`Google connection failed: ${oauthError.replace(/_/g, ' ')}`)
      setState('not_connected')
      setCrawlLoading(false)
      fetchCrawl()
      return
    }

    if (connected === 'true') {
      // Just returned from OAuth — go straight to property selection
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
      setError('Could not start Google connection. Try again.')
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
      setError('Could not save properties. Try again.')
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
      setError('Sync failed. Try again in a moment.')
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
      setError('Could not disconnect. Try again.')
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
        'Scan failed. Make sure your website URL is set in Account settings.',
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

  // ── Google section renderer ────────────────────────────────────────────────

  const renderGoogleSection = () => {
    if (state === 'loading') {
      return (
        <GlassCard>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-white/5" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 rounded bg-white/5" />
              <div className="h-3 w-72 rounded bg-white/5" />
            </div>
          </div>
        </GlassCard>
      )
    }

    if (state === 'not_connected') {
      return (
        <GlassCard>
          <div className="flex flex-col items-center text-center py-6 gap-6">
            {/* Google logo with ambient glow */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl scale-[2]" />
              <div className="relative w-16 h-16 rounded-2xl bg-bg-tertiary border border-white/10 flex items-center justify-center">
                <GoogleLogo size={32} />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-white font-semibold text-xl">
                Connect Google in one click
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                Link your Google Analytics, Search Console, and Business Profile
                — we pull data automatically so you never have to log in
                separately.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleLogo size={18} />
              )}
              {connecting ? 'Redirecting to Google…' : 'Connect Google'}
            </button>

            {/* What gets connected chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { icon: '📊', label: 'Google Analytics' },
                { icon: '🔍', label: 'Search Console' },
                { icon: '🗺️', label: 'Business Profile' },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary border border-white/10 text-white/70 text-xs"
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </div>
              ))}
            </div>

            <p className="text-muted text-xs max-w-sm">
              We request read-only access. Your data stays private and is never
              shared.
            </p>
          </div>
        </GlassCard>
      )
    }

    if (state === 'selecting_properties') {
      return (
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">
                Google connected — choose your properties
              </h2>
              <p className="text-muted text-xs mt-0.5">
                Select which accounts to pull data from. You can skip any for
                now.
              </p>
            </div>
          </div>

          {propsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-bg-tertiary animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* GA Property */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  📊 Google Analytics Property
                </label>
                <div className="relative">
                  <select
                    value={selectedGa}
                    onChange={(e) => setSelectedGa(e.target.value)}
                    className="w-full appearance-none bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white text-sm pr-10 focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="">— Skip for now —</option>
                    {properties?.gaProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>

              {/* GSC Site */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  🔍 Search Console Site
                </label>
                <div className="relative">
                  <select
                    value={selectedGsc}
                    onChange={(e) => setSelectedGsc(e.target.value)}
                    className="w-full appearance-none bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white text-sm pr-10 focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="">— Skip for now —</option>
                    {properties?.gscSites.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>

              {/* GMB Location */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  🗺️ Business Profile Location
                </label>
                <div className="relative">
                  <select
                    value={selectedGmbLocation}
                    onChange={(e) => setSelectedGmbLocation(e.target.value)}
                    className="w-full appearance-none bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white text-sm pr-10 focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="">— Skip for now —</option>
                    {properties?.gmbLocations.map((l) => (
                      <option key={l.locationId} value={l.locationId}>
                        {l.locationName} — {l.address}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>

              <button
                onClick={handleSaveProperties}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {saving ? 'Saving…' : 'Save & Start Syncing'}
              </button>

              {!selectedGa && !selectedGsc && !selectedGmbLocation && (
                <p className="text-muted text-xs text-center">
                  You can skip all and come back to configure later.
                </p>
              )}
            </div>
          )}
        </GlassCard>
      )
    }

    // connected state
    return (
      <GlassCard>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-white/10 flex items-center justify-center flex-shrink-0">
              <GoogleLogo size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-semibold text-base">Google</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              </div>
              {status?.lastSyncedAt && (
                <p className="text-muted text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Last synced{' '}
                  {formatTime(status.lastSyncedAt)}
                </p>
              )}
              {!status?.lastSyncedAt && (
                <p className="text-muted text-xs mt-0.5">
                  Never synced — click Sync Now to pull your data.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:text-white hover:border-white/30 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
              />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors disabled:opacity-50"
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
              icon: '📊',
              label: 'Google Analytics',
              value: status?.gaPropertyName ?? status?.gaPropertyId ?? null,
            },
            {
              icon: '🔍',
              label: 'Search Console',
              value: status?.gscSiteUrl ?? null,
            },
            {
              icon: '🗺️',
              label: 'Business Profile',
              value: status?.gmbLocationName ?? null,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-bg-tertiary rounded-xl p-3 space-y-1"
            >
              <p className="text-muted text-xs">
                {item.icon} {item.label}
              </p>
              {item.value ? (
                <p className="text-white text-xs font-medium truncate">
                  {item.value}
                </p>
              ) : (
                <button
                  onClick={() => setState('selecting_properties')}
                  className="text-brand-orange text-xs hover:underline"
                >
                  Not set — configure
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white font-semibold text-2xl">Integrations</h1>
        <p className="text-muted text-sm mt-1">
          Connect your tools so Alphaa can pull data automatically.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400/60 hover:text-red-400 text-xs ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Google ─────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
          Google
        </h2>
        {renderGoogleSection()}
      </section>

      {/* ── Website Scanner ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
          Website Scanner
        </h2>

        <GlassCard>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-bg-tertiary border border-white/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-muted" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">
                  Website Crawl
                </h3>
                {crawlLoading ? (
                  <p className="text-muted text-xs mt-0.5">Loading…</p>
                ) : crawlData ? (
                  <p className="text-muted text-xs mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last scanned {formatTime(crawlData.crawledAt)} ·{' '}
                    <span className="font-mono">{crawlData.pagesScanned}</span>{' '}
                    pages
                  </p>
                ) : (
                  <p className="text-muted text-xs mt-0.5">
                    No scan yet — run one to find issues.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleCrawl}
              disabled={crawling}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:text-white hover:border-white/30 text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {crawling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {crawling ? 'Scanning…' : 'Scan My Website'}
            </button>
          </div>

          {/* Scanning in progress */}
          {crawling && (
            <div className="mt-5 flex flex-col items-center gap-3 py-8 border-t border-white/[0.06]">
              <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
              <p className="text-muted text-sm">
                Crawling your website — this takes 15–60 seconds…
              </p>
            </div>
          )}

          {/* Crawl error */}
          {!crawling && crawlError && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {crawlError}
            </div>
          )}

          {/* Crawl results */}
          {!crawling && crawlData && issueCounts && (
            <div className="mt-5 border-t border-white/[0.06] pt-5 space-y-4">
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary border border-white/10 text-white text-xs">
                  <Globe className="w-3 h-3 text-muted" />
                  <span className="font-mono">{crawlData.pagesScanned}</span>{' '}
                  pages scanned
                </div>
                {issueCounts.critical > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <XCircle className="w-3 h-3" />
                    <span className="font-mono">{issueCounts.critical}</span>{' '}
                    critical
                  </div>
                )}
                {issueCounts.warning > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-mono">{issueCounts.warning}</span>{' '}
                    warnings
                  </div>
                )}
                {issueCounts.improvement > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
                    <Zap className="w-3 h-3" />
                    <span className="font-mono">
                      {issueCounts.improvement}
                    </span>{' '}
                    improvements
                  </div>
                )}
              </div>

              {/* Top critical issues */}
              {criticalIssues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                    Top Issues
                  </p>
                  {criticalIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-bg-tertiary rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="text-white text-xs font-medium">
                          {issue.description}
                        </p>
                        <SeverityBadge severity={issue.severity} />
                      </div>
                      <p className="text-muted text-xs leading-relaxed">
                        <span className="text-blue-400 font-medium">Fix: </span>
                        {issue.fix}
                      </p>
                      {issue.url && issue.url !== 'site-wide' && (
                        <p className="text-white/30 text-xs font-mono truncate">
                          {issue.url}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {issues.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  No issues found — your site looks great!
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </section>

    </div>
  )
}
