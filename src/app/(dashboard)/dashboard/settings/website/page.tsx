'use client'

import { useCallback, useEffect, useState } from 'react'
import { DsCard } from '@/components/dashboard/DsCard'
import { StatusPill } from '@/components/dashboard/StatusPill'
import { SectionDivider } from '@/components/dashboard/SectionDivider'
import { PlatformIcon } from '@/components/brand/PlatformIcon'
import { PLATFORMS, PLATFORM_NAME, NONE_AVAILABLE, type Availability } from '@/lib/connector/platforms'
import type { Platform } from '@/lib/connector/types'
import { AlertCircle, ExternalLink, Loader2, RefreshCw, Repeat, Unlink } from 'lucide-react'

// Settings → Website connection: which site the agent publishes to, whether the
// connection still works (live ping), and Disconnect / Reconnect / Switch.

type Status = {
  platform: Platform | 'none'
  siteUrl: string | null
  label: string | null
  connectedAt: string | null
  health: 'ok' | 'error' | 'unknown'
  healthError?: string
  available: Availability
}

const primaryBtnStyle: React.CSSProperties = { backgroundColor: 'var(--ds-accent)', color: 'var(--ds-on-accent)', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }
const secondaryBtnStyle: React.CSSProperties = { backgroundColor: 'transparent', border: '1px solid var(--ds-border-3)', color: 'var(--ds-text-mute)', borderRadius: '8px', fontSize: '11px', fontWeight: 500 }
const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ds-text-ghost)' }

const WHAT: Record<Platform, string> = {
  wordpress: 'FAQ pages, blog posts, page titles, structured data, llms.txt and AI-crawler rules',
  shopify: 'blog posts, pages and their search titles and descriptions',
  webflow: 'blog posts (CMS items) and page titles and descriptions',
  wix: 'blog posts and page titles and descriptions',
}

/** Where each platform's connect flow starts. WordPress (plugin + key) and Shopify (store address) start in the agent chat. */
function startHref(p: Platform, shop?: string): string {
  if (p === 'wordpress') return '/dashboard/t/site?connect=wordpress'
  if (p === 'shopify') return `/api/connect/shopify/start?shop=${encodeURIComponent(shop ?? '')}`
  return `/api/connect/${p}/start`
}

export default function WebsiteConnectionPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [picking, setPicking] = useState(false)
  const [shopFor, setShopFor] = useState(false)
  const [shop, setShop] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/connect/status')
      if (!r.ok) throw new Error()
      setStatus((await r.json()) as Status)
    } catch {
      setError('Couldn’t load your website connection. Try again in a minute.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const disconnect = async () => {
    if (!status || status.platform === 'none') return
    if (!confirm(`Disconnect your ${PLATFORM_NAME[status.platform]} site? Alphaa will stop publishing to it. Anything already published stays on your site.`)) return
    setDisconnecting(true)
    setError(null)
    try {
      const r = await fetch('/api/connect/disconnect', { method: 'POST' })
      if (!r.ok) throw new Error()
      await load()
      setPicking(false)
    } catch {
      setError('Disconnect didn’t go through. Try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  const choose = (p: Platform) => {
    if (p === 'shopify') return setShopFor(true)
    window.location.href = startHref(p)
  }

  const available = status?.available ?? NONE_AVAILABLE
  const connected = status && status.platform !== 'none' ? status : null

  const picker = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PLATFORMS.map((p) => {
          const on = available[p]
          const current = connected?.platform === p
          return (
            <button
              key={p}
              type="button"
              disabled={!on}
              onClick={() => choose(p)}
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3.5 transition-colors disabled:cursor-default"
              style={{ backgroundColor: 'var(--ds-surface)', border: `1px solid ${current ? 'var(--ds-accent)' : 'var(--ds-border)'}`, color: 'var(--ds-text)' }}
            >
              <span style={{ opacity: on ? 1 : 0.45 }}>
                <PlatformIcon platform={p} size={30} />
              </span>
              <span className="text-[13px] font-medium" style={{ opacity: on ? 1 : 0.55 }}>{PLATFORM_NAME[p]}</span>
              <span className="text-[11px]" style={{ color: 'var(--ds-text-faint)' }}>
                {!on ? 'Coming soon' : current ? 'Reconnect' : p === 'wordpress' ? 'Free plugin' : 'One-click app'}
              </span>
            </button>
          )
        })}
      </div>
      {shopFor && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (shop.trim()) window.location.href = startHref('shopify', shop.trim())
          }}
        >
          <input
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="yourstore.myshopify.com"
            aria-label="Your Shopify store address"
            className="flex-1 min-w-[220px] rounded-lg px-3 py-2 text-[13px] focus:outline-none"
            style={{ backgroundColor: 'var(--ds-surface)', border: '1px solid var(--ds-border-2)', color: 'var(--ds-text)' }}
            autoFocus
          />
          <button type="submit" className="px-4 py-2" style={primaryBtnStyle}>Connect Shopify</button>
          <p className="w-full text-[11px]" style={{ color: 'var(--ds-text-faint)' }}>
            It ends in .myshopify.com. Find it in Shopify under Settings → Domains.
          </p>
        </form>
      )}
      <p className="text-[11px]" style={{ color: 'var(--ds-text-faint)' }}>
        Someone else runs your site? Skip this. On any fix, tap “Email it to my web person” and Alphaa sends them the exact change.
      </p>
    </div>
  )

  return (
    <div>
      <SectionDivider>Website connection</SectionDivider>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] mb-3" style={{ backgroundColor: 'var(--ds-bad-bg)', border: '1px solid var(--ds-bad-border)', color: 'var(--ds-bad)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && !status ? (
        <DsCard>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: 'var(--ds-surface)' }} />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 rounded" style={{ backgroundColor: 'var(--ds-surface)' }} />
              <div className="h-3 w-72 rounded" style={{ backgroundColor: 'var(--ds-surface)' }} />
            </div>
          </div>
        </DsCard>
      ) : connected ? (
        <DsCard>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid var(--ds-border)', color: 'var(--ds-text)' }}>
                <PlatformIcon platform={connected.platform as Platform} size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[14px] font-medium" style={{ color: 'var(--ds-text)' }}>{PLATFORM_NAME[connected.platform as Platform]}</h2>
                  {connected.health === 'ok' ? (
                    <StatusPill variant="found">Connected</StatusPill>
                  ) : (
                    <StatusPill variant="error">Not responding</StatusPill>
                  )}
                </div>
                {connected.siteUrl && (
                  <a href={connected.siteUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] mt-0.5 inline-flex items-center gap-1 hover:underline truncate" style={{ color: 'var(--ds-text-mute)' }}>
                    {connected.label} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => void load()} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 transition-colors disabled:opacity-50" style={secondaryBtnStyle}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Check again
              </button>
              <button onClick={() => setPicking((v) => !v)} className="flex items-center gap-1.5 px-3.5 py-2 transition-colors" style={secondaryBtnStyle}>
                <Repeat className="w-3.5 h-3.5" /> Reconnect or switch
              </button>
              <button
                onClick={disconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 px-3.5 py-2 transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'transparent', border: '1px solid var(--ds-bad-border)', color: 'var(--ds-bad)', borderRadius: '8px', fontSize: '11px', fontWeight: 500 }}
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>

          {connected.health === 'error' && connected.healthError && (
            <p className="text-[12px] mt-4 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--ds-warn-bg)', border: '1px solid var(--ds-warn-border)', color: 'var(--ds-warn)' }}>
              {connected.healthError} Reconnecting usually fixes it.
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Platform', value: PLATFORM_NAME[connected.platform as Platform] },
              { label: 'Site', value: connected.label },
              { label: 'Connected', value: connected.connectedAt ? new Date(connected.connectedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null },
            ].map((item) => (
              <div key={item.label} className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: 'var(--ds-surface)', border: '.5px solid var(--ds-border)' }}>
                <p style={labelStyle}>{item.label}</p>
                <p className="text-[12px] font-medium truncate" style={{ color: item.value ? 'var(--ds-text)' : 'var(--ds-text-faint)' }}>{item.value ?? '—'}</p>
              </div>
            ))}
          </div>

          <p className="text-[12px] mt-4" style={{ color: 'var(--ds-text-mute)', lineHeight: 1.6 }}>
            Alphaa publishes {WHAT[connected.platform as Platform]} here once you approve them, and every change has an Undo.
            Anything {PLATFORM_NAME[connected.platform as Platform]} doesn’t let apps change, Alphaa emails to your web person.
          </p>

          {picking && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--ds-border)' }}>
              <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--ds-text)' }}>Reconnect, or switch to a different website</p>
              {picker}
              <p className="text-[11px] mt-2" style={{ color: 'var(--ds-text-faint)' }}>Connecting a new site replaces this one. Alphaa works with one website per account.</p>
            </div>
          )}
        </DsCard>
      ) : (
        <DsCard>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-[15px] font-medium" style={{ color: 'var(--ds-text)' }}>Connect your website</h2>
              <p className="text-[13px]" style={{ color: 'var(--ds-text-mute)', lineHeight: 1.6 }}>
                Once connected, Alphaa publishes the fixes you approve straight to your site: FAQ pages, blog posts, page titles and descriptions. Every change has an Undo.
              </p>
            </div>
            {picker}
          </div>
        </DsCard>
      )}
    </div>
  )
}
