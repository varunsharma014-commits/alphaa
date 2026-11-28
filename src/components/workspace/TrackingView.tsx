"use client"

import { useEffect, useState, type ReactNode } from "react"
import type { Conn, SiteHealth, TrackingData } from "@/lib/workspace/tracking"
import type { Upkeep } from "@/lib/seo/upkeep"
import type { SiteVitals as VitalsData } from "@/lib/seo/site-vitals"
import { askAlphaa, toast } from "@/lib/workspace/events"
import { ActButton, Button, ChannelMark, ConnectionRow, EmptyState, Glyph, IssueList, List, ListRow, PageHeader, Pill, SectionHeader, StaleBadge, StatRow, StatTile, StatusDot, Tabs, When, useInspector, type ConnState } from "./ui"
import { SiteUpkeep } from "./SiteUpkeep"
import { SiteVitals } from "./SiteVitals"
import "./p3.css"

// Tracking & Setup, two tabs. Connections: every connection I rely on, read from the real thing,
// one status per row (the dot + one sentence), live activity only once something has arrived.
// Site health: the weekly website check (problems grouped once with their pages), links to fix,
// pages losing Google traffic, speed for real visitors and structured data. /dashboard/audit and
// /dashboard/speed redirect here (?tab=health).

type Tab = "conn" | "health"
const HEALTH_HASHES = ["#health", "#vitals", "#structured-data", "#links", "#refresh"]

function logoFor(key: string): ReactNode {
  if (key === "gbp" || key === "gsc" || key === "gads") return <ChannelMark channel="google" size={18} />
  if (key === "meta" || key === "social") return <ChannelMark channel="facebook" size={18} />
  if (key === "site") return <span className="x3-connlogo"><Glyph name="globe" size={18} /></span>
  if (key === "leads") return <span className="x3-connlogo"><Glyph name="link" size={18} /></span>
  if (key === "ga") return <span className="x3-connlogo"><Glyph name="spark" size={18} /></span>
  return <span className="x3-connlogo"><Glyph name="check" size={18} /></span>
}

export function TrackingView({ data, health, upkeep, vitals, initialTab }: { data: TrackingData; health?: SiteHealth | null; upkeep?: Upkeep | null; vitals?: VitalsData | null; initialTab?: string | null }) {
  const { node, open } = useInspector()
  const [tab, setTabState] = useState<Tab>(initialTab === "health" ? "health" : "conn")
  const [checking, setChecking] = useState(false)
  const setTab = (k: Tab) => {
    setTabState(k)
    try {
      const url = new URL(window.location.href)
      if (k === "conn") url.searchParams.delete("tab")
      else url.searchParams.set("tab", "health")
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    } catch { /* URL sync is a convenience */ }
  }
  // Old links (#vitals, #links…) open Site health and scroll to the section.
  useEffect(() => {
    const h = window.location.hash
    if (!HEALTH_HASHES.includes(h)) return
    setTabState("health")
    window.setTimeout(() => document.querySelector(h)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120)
  }, [])

  const needs = data.conns.filter((c) => c.state === "needs")
  const ok = data.conns.filter((c) => c.state === "ok")
  const optional = data.conns.filter((c) => c.state === "optional")
  const counted = needs.length + ok.length

  async function checkSite() {
    setChecking(true)
    const res = await fetch("/api/crawl", { method: "POST" }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setChecking(false)
    if (!res?.ok) return toast(d?.error ?? "The site check didn’t finish. Try again in a minute.")
    toast("Site checked")
    window.location.reload()
  }

  const details = (c: Conn) => open({ eb: "Tracking & Setup", title: c.name, rows: [{ k: "Status", v: c.state === "ok" ? "Working." : c.state === "optional" ? "Optional. Only needed if you use it." : c.warn ?? "Not working yet." }, { k: "What it does", v: c.detail, box: true }, { k: "Right now", v: c.sum }, ...(c.key === "leads" && data.health.length ? [{ k: "Each check", v: data.health.map((h) => `${h.ok ? "✓" : "•"} ${h.name}: ${h.status}${h.detail ? ` (${h.detail})` : ""}`).join("\n") }] : [])], cta: c.act ? { ...c.act, primary: true } : null })

  const row = (c: Conn) => {
    const state: ConnState = c.state === "ok" ? "ok" : c.state === "optional" ? "off" : "warn"
    return (
      <ConnectionRow
        key={c.key}
        logo={logoFor(c.key)}
        name={c.name}
        state={state}
        status={<>
          {c.warn ? `${c.warn}. ` : ""}{c.sum}
          {c.state === "ok" && c.verified && <span className="x3-ev"><When at={c.verified.at} mode="ago" prefix={`${c.verified.verb} `} fallback={c.verified.verb} /></span>}
        </>}
        action={<>
          {c.act && <ActButton small act={{ ...c.act, primary: c.state === "needs" }} />}
          <Button size="sm" variant="undo" onClick={() => details(c)} ariaLabel={`Details about ${c.name}`}>Details</Button>
        </>}
      />
    )
  }

  const healthStats = health && health.at ? (
    <StatRow>
      <StatTile label="Pages checked" value={health.pages != null ? String(health.pages) : null} />
      <StatTile label="Serious problems" value={String(health.serious)} hint={health.serious ? "Fix these first" : "None found"} />
      <StatTile label="Smaller problems" value={String(health.smaller)} />
      <StatTile label="Speed on phones" value={vitals?.cwv ? speedWord(vitals) : null} hint={vitals?.cwv ? "Real visitors, homepage" : undefined} empty={vitals?.keyMissing ? "Not checked" : "Not measured yet"} onClick={() => document.getElementById("vitals")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
    </StatRow>
  ) : null

  return (
    <>
      <PageHeader
        title="Tracking & Setup"
        sub="Every connection I rely on, checked from the real thing, and how healthy your website is."
        pill={<Pill tone={needs.length ? "warn" : "ok"} dot>{ok.length} of {counted} working</Pill>}
        tabs={<Tabs<Tab> label="Tracking sections" value={tab} onChange={setTab} tabs={[{ key: "conn", label: "Connections", count: needs.length || undefined }, { key: "health", label: "Site health" }]} />}
      />

      {tab === "conn" && (
        <div className="x3-col x3-top">
          {data.turnOn && (
            <section className="ax-card x3-banner">
              <Glyph name="link" size={18} />
              <span><b>Lead tracking is off.</b> {data.turnOn.auto ? "One tap and I add it through your WordPress plugin. Phone taps, emails and form sends start showing here." : `${data.turnOn.platform} doesn’t let apps add site code with the access I have, so it takes one line pasted once. I’ll show you exactly where.`}</span>
              <Button size="sm" variant="primary" onClick={() => askAlphaa({ topic: "tracking", label: `Turn on lead tracking on ${data.turnOn!.platform}` })}>Turn it on</Button>
            </section>
          )}

          {data.signals.length > 0 && (
            <section>
              <SectionHeader first title={<span className="x3-ttl"><StatusDot tone="ok" />Live activity</span>} sub="Newest first. Leads from your site, visits from AI assistants and leads from your ads." />
              <div className="ax-card x3-feed" role="list" aria-label="Live activity">
                {data.signals.map((s, i) => (
                  <div key={i} className="x3-feedrow" role="listitem">
                    <span className={`x3-feedrow__src t-${s.tone}`}>{s.src}</span>
                    <span className="x3-feedrow__ev">{s.ev}</span>
                    <span className="x3-feedrow__t">{s.src === "Website" ? s.t : <When at={s.at} mode="ago" fallback={s.t} />}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {needs.length > 0 && (
            <section>
              <SectionHeader first={!data.signals.length} title={`Needs you (${needs.length})`} sub="Each one has one thing to do." />
              <div className="ax-card x3-conns">{needs.map(row)}</div>
            </section>
          )}
          <section>
            <SectionHeader first={!data.signals.length && !needs.length} title={`Working (${ok.length})`} sub="I check these myself and fix what breaks." />
            {ok.length ? <div className="ax-card x3-conns">{ok.map(row)}</div> : <EmptyState title="Nothing connected yet" text="Start with the first one under Needs you. Each takes about a minute." />}
          </section>
          {optional.length > 0 && (
            <section>
              <SectionHeader title="Optional" sub="Only needed if you use them." />
              <div className="ax-card x3-conns">{optional.map(row)}</div>
            </section>
          )}

          {data.health.length > 0 && (
            <section>
              <SectionHeader title="Lead tracking checks" sub="From my last look at your live site." end={<Button size="sm" onClick={() => askAlphaa({ topic: "tracking", label: "Check my tracking now" })}>Check now</Button>} />
              <List card label="Lead tracking checks">
                {data.health.map((h) => (
                  <ListRow key={h.key} lead={<StatusDot tone={h.ok ? "ok" : h.soft ? "idle" : "warn"} />} title={h.name} meta={h.detail ? `${h.status}. ${h.detail}` : h.status} />
                ))}
              </List>
            </section>
          )}
          {!data.signals.length && <p className="ax-note x3-flat">{data.trackingOn ? "Leads from your website show up here as they happen." : data.growth ? "Once lead tracking is on, phone taps, emails and form sends show up here as they happen." : "Visits from AI assistants show up here once your website is connected."}</p>}
        </div>
      )}

      {tab === "health" && (
        <div className="x3-health" id="health">
          {!health?.site ? (
            <EmptyState hero icon={<Glyph name="globe" size={26} />} title="Tell me your website first" text="Then I check it every week: problems that hurt you on Google and AI, broken links, speed and the facts it states in code." actions={<Button variant="primary" href="/dashboard/settings/website">Add my website</Button>} />
          ) : !health.at ? (
            <EmptyState
              hero
              icon={<Glyph name="globe" size={26} />}
              title="I haven’t checked your site yet"
              text="It takes about a minute. After that I check it every week on my own."
              bullets={["Problems that hurt you on Google and AI, grouped with their pages", "Broken links and links that bounce through redirects", "Speed for real visitors and the facts your pages state in code"]}
              actions={<Button variant="primary" loading={checking} onClick={() => void checkSite()}>Check my site now</Button>}
            />
          ) : (
            <>
              <SectionHeader first title="Your website" sub={<>Checked <When at={health.at} mode="ago" fallback={new Date(health.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />. I check it every week.</>} end={<span className="x3-acts"><StaleBadge at={health.at} scheduleDays={7} /><Button size="sm" loading={checking} onClick={() => void checkSite()}>{checking ? "Checking, about a minute" : "Check again"}</Button></span>} />
              {healthStats}
              {health.aiBlocks.map((b) => (
                <section key={b.engine} className="ax-card x3-alert">
                  <StatusDot tone="bad" />
                  <div><b>Your website is blocking {b.engine}</b><span>It can’t read your pages, so it can’t name you in its answers.</span><span className="ax-t11">{b.fix}</span></div>
                </section>
              ))}
              <section>
                <SectionHeader title="Things to fix" sub="Each problem once, with the pages it’s on. Open one to see them." />
                <div className="ax-card x3-issues">
                  <IssueList
                    groups={health.groups.map((g) => ({
                      key: g.key, title: g.title, why: g.why, severity: g.severity, urls: g.urls, fix: g.fix,
                      action: <Button size="sm" onClick={() => askAlphaa({ say: `Help me fix this on my website: ${g.title.toLowerCase()}. Pages: ${g.urls.slice(0, 5).join(", ")}` })}>Help me fix it</Button>,
                    }))}
                    empty={<div className="x3-pad"><b>Nothing to fix from my last check.</b><span className="ax-t11">Every page had a title, a summary, a main heading and described pictures.</span></div>}
                  />
                </div>
              </section>
            </>
          )}
          {upkeep && <SiteUpkeep data={upkeep} />}
          {vitals && <SiteVitals data={vitals} />}
        </div>
      )}
      {node}
    </>
  )
}

function speedWord(v: VitalsData): string | null {
  const home = v.cwv?.pages[0]?.mobile
  const lcp = home?.field?.metrics.find((m) => m.key === "lcp")
  if (!lcp) return null
  return lcp.rating === "good" ? "Fast" : lcp.rating === "needs" ? "Could be faster" : "Slow"
}
