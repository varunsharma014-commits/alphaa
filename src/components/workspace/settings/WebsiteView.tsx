"use client"

import { useCallback, useEffect, useState } from "react"
import { Button, ChannelMark, ConnectionCard, Field, PageHeader, SectionHeader, Skeleton, TextInput, useConfirm } from "@/components/workspace/ui"
import { PlatformIcon } from "@/components/brand/PlatformIcon"
import { PLATFORMS, PLATFORM_NAME, NONE_AVAILABLE, type Availability } from "@/lib/connector/platforms"
import type { Platform } from "@/lib/connector/types"
import { SettingsTabs } from "./SettingsTabs"
import "./settings.css"

// Your website: which site I publish to, whether the connection still works (live ping), and
// Check again / Reconnect or switch / Disconnect. Same APIs as before (/api/connect/*).
type Status = {
  platform: Platform | "none"
  siteUrl: string | null
  label: string | null
  connectedAt: string | null
  health: "ok" | "error" | "unknown"
  healthError?: string
  available: Availability
}

const WHAT: Record<Platform, string> = {
  wordpress: "FAQ pages, blog posts, page titles, structured data, llms.txt and AI crawler rules",
  shopify: "blog posts, pages and their search titles and descriptions",
  webflow: "blog posts and page titles and descriptions",
  wix: "blog posts and page titles and descriptions",
}

/** Where each platform's connect flow starts. WordPress (plugin + key) starts in the chat. */
function startHref(p: Platform, shop?: string): string {
  if (p === "wordpress") return "/dashboard?ask=site&connect=wordpress"
  if (p === "shopify") return `/api/connect/shopify/start?shop=${encodeURIComponent(shop ?? "")}`
  return `/api/connect/${p}/start`
}

export function WebsiteView() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [picking, setPicking] = useState(false)
  const [shopFor, setShopFor] = useState(false)
  const [shop, setShop] = useState("")
  const { confirm, node } = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch("/api/connect/status")
      if (!r.ok) throw new Error()
      setStatus((await r.json()) as Status)
    } catch {
      setError("I couldn’t load your website connection. Try again in a minute.")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const connected = status && status.platform !== "none" ? status : null
  const available = status?.available ?? NONE_AVAILABLE

  async function disconnect() {
    if (!connected) return
    const name = PLATFORM_NAME[connected.platform as Platform]
    if (!(await confirm({ title: `Disconnect your ${name} site?`, text: "I stop publishing to it. Anything already published stays on your site.", confirmLabel: "Disconnect", danger: true }))) return
    setDisconnecting(true)
    setError(null)
    try {
      const r = await fetch("/api/connect/disconnect", { method: "POST" })
      if (!r.ok) throw new Error()
      await load()
      setPicking(false)
    } catch {
      setError("Disconnect didn’t go through. Try again.")
    } finally {
      setDisconnecting(false)
    }
  }

  const choose = (p: Platform) => {
    if (p === "shopify") return setShopFor(true)
    window.location.href = startHref(p)
  }

  const picker = (
    <div className="xs-stack flush">
      <div className="xs-pick">
        {PLATFORMS.map((p) => {
          const on = available[p]
          const current = connected?.platform === p
          return (
            <button key={p} type="button" disabled={!on} aria-current={current || undefined} onClick={() => choose(p)}>
              <PlatformIcon platform={p} size={30} />
              <b>{PLATFORM_NAME[p]}</b>
              <small>{!on ? "Coming soon" : current ? "Reconnect" : p === "wordpress" ? "Free plugin" : "One-click app"}</small>
            </button>
          )
        })}
      </div>
      {shopFor && (
        <form className="xs-invite" onSubmit={(e) => { e.preventDefault(); if (shop.trim()) window.location.href = startHref("shopify", shop.trim()) }}>
          <Field label="Your Shopify store address" hint="It ends in .myshopify.com. Find it in Shopify under Settings, then Domains.">
            <TextInput value={shop} onChange={(e) => setShop(e.target.value)} placeholder="yourstore.myshopify.com" autoFocus inputMode="url" />
          </Field>
          <span aria-hidden="true" />
          <Button type="submit" variant="primary" disabled={!shop.trim()}>Connect Shopify</Button>
        </form>
      )}
      <p className="xs-fine">Someone else runs your site? Skip this. On any fix, tap “Email it to my web person” and I send them the exact change.</p>
    </div>
  )

  const since = connected?.connectedAt ? new Date(connected.connectedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null
  return (
    <>
      <PageHeader title="Your website" sub="Connect your site once and I publish the fixes and posts you approve." tabs={<SettingsTabs />} />
      <div className="xs-stack">
        {error && <div className="xs-banner bad" role="alert">{error}</div>}
        {loading && !status ? (
          <section className="ax-card xs-card"><Skeleton kind="row" rows={1} /></section>
        ) : connected ? (
          <>
            <ConnectionCard
              logo={<PlatformIcon platform={connected.platform as Platform} size={26} />}
              name={PLATFORM_NAME[connected.platform as Platform]}
              state={connected.health === "ok" ? "ok" : connected.health === "error" ? "bad" : "warn"}
              status={connected.health === "ok" ? <>Connected to {connected.siteUrl ? <a href={connected.siteUrl} target="_blank" rel="noopener noreferrer">{connected.label ?? connected.siteUrl}</a> : connected.label}</> : connected.health === "error" ? `${connected.healthError ?? "Your site isn’t answering."} Reconnecting usually fixes it.` : "I couldn’t check the connection just now."}
              synced={since ? `Connected since ${since}` : undefined}
              action={<Button size="sm" loading={loading} onClick={() => void load()}>Check again</Button>}
              preview={`I publish ${WHAT[connected.platform as Platform]} here once you approve them, and every change has an Undo. Anything ${PLATFORM_NAME[connected.platform as Platform]} doesn’t let apps change, I email to your web person.`}
            >
              <div className="xs-row">
                <Button size="sm" onClick={() => setPicking((v) => !v)}>{picking ? "Hide the options" : "Reconnect or switch"}</Button>
                <Button size="sm" variant="ghost" loading={disconnecting} onClick={() => void disconnect()}>Disconnect</Button>
              </div>
            </ConnectionCard>
            {picking && (
              <>
                <SectionHeader title="Reconnect, or switch websites" sub="Connecting a new site replaces this one. I work with one website per account." />
                {picker}
              </>
            )}
          </>
        ) : (
          <>
            <ConnectionCard
              logo={<ChannelMark channel="web" size={28} />}
              name="Your website"
              state="off"
              status="Not connected yet. I can still write, and you copy it in."
              preview="Once connected, I publish the fixes you approve straight to your site: FAQ pages, blog posts, page titles and descriptions. Every change has an Undo."
            />
            <SectionHeader title="Where is your site built?" sub="Pick yours. It takes about a minute." />
            {picker}
          </>
        )}
      </div>
      {node}
    </>
  )
}
