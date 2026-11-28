"use client"

import { useCallback, useState } from "react"
import type { AdsData, FirstAd } from "@/lib/workspace/ads"
import { askAlphaa, toast } from "@/lib/workspace/events"
import { Button, EmptyState, Glyph, ListRow, List, PageHeader, Pill, PlanGate, SectionHeader, Segmented, Spinner, StatRow, StatTile, Timeline, PlatformIcons, ChannelMark, useInspector, type Channel } from "./ui"
import { RoasCampaigns, RoasKpis, RoasLeads } from "./RoasPanel"
import { AdRulesPanel, PromotePanel, ReportPanel } from "./AdsExtras"
import { AdPreview } from "./AdPreview"
import { LimitCard } from "./LimitCard"
import { AdsTabs, type AdsTab } from "./AdsTabs"
import "./p3.css"

// Ads: show the ads before asking for money. Tabs (5 at most): Ads (first ads from the plan, then
// what's built and running) next to the one monthly limit; Results (account numbers only);
// Automations (the owner's rules, what I changed with Undo, the guardrails I keep); Share (a
// read-only report link); Your plan (/dashboard/ads/plan). Promote a post sits under Ads.

const LEGACY: Record<string, AdsTab> = { f: "ads", a: "ads", r: "results", t: "auto", x: "auto", p: "promote", s: "share" }
const KEYS: AdsTab[] = ["ads", "results", "auto", "share", "promote"]

// What I always keep to, in plain words (the code enforces each one).
const GUARDRAILS = [
  { icon: "check", t: "Never above your monthly limit.", d: "Daily budgets are worked out from it and rounded down." },
  { icon: "clock", t: "New campaigns start paused.", d: "Nothing spends until you or Autopilot say go." },
  { icon: "x", t: "I pause ads that spend without results.", d: "After about 2 days of budget with nothing back, and never every ad in a campaign." },
  { icon: "spark", t: "Money moves toward what works.", d: "20% at a time, to the campaign that gets results for less. When real sales are tracked, I follow sales instead." },
  { icon: "link", t: "Every line passes my claims check.", d: "No guarantees, no “best”, numbers only from your own facts." },
] as const

const channelsFor = (p: FirstAd["platform"] | string): Channel[] => (p === "Google search" || /google/i.test(p) ? ["google"] : p === "LinkedIn" ? ["linkedin"] : ["facebook", "instagram"])

export function AdsView({ data, initialTab, note }: { data: AdsData | null; initialTab?: string | null; note?: string | null }) {
  const { node, open } = useInspector()
  const start = (initialTab && (LEGACY[initialTab] ?? (KEYS.includes(initialTab as AdsTab) ? (initialTab as AdsTab) : null))) || (data?.live ? "results" : "ads")
  const [tab, setTabState] = useState<AdsTab>(start)
  const [undone, setUndone] = useState<Record<number, boolean>>({})
  const [undoing, setUndoing] = useState<number | null>(null)
  const [win, setWin] = useState<"7" | "30">("30")
  const setTab = useCallback((k: AdsTab) => {
    setTabState(k)
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete("note")
      if (k === "ads") url.searchParams.delete("tab")
      else url.searchParams.set("tab", k)
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    } catch { /* URL sync is a convenience */ }
  }, [])

  const pill = <Pill tone="info">Growth · early access</Pill>
  if (!data) {
    return (
      <>
        <PageHeader title="Ads" sub="I build, run and tune your Facebook, Instagram and Google ads inside a monthly limit you set." pill={pill} />
        <PlanGate plan="Growth" title="Ads come with the Growth plan" text="Growth is in early access while Google and Meta approve ads access. When ads open, I build your ads from what your competitors run, keep them inside your limit, and pause what stops working." />
      </>
    )
  }

  async function undo(i: number, body: Record<string, string>) {
    setUndoing(i)
    // A change one of the owner's rules made has its own undo (lib/ad-rules); the rest is Google's.
    const res = body.op === "rule_undo"
      ? await fetch("/api/workspace/ad-rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "undo", key: body.key }) }).catch(() => null)
      : await fetch("/api/agent/ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setUndoing(null)
    if (!res?.ok) return toast(d?.error ?? "That didn’t undo. Nothing changed.")
    setUndone((u) => ({ ...u, [i]: true }))
    toast("Undone")
  }

  const w = Number(win) as 7 | 30
  const checked = data.firstAds.filter((a) => !a.inPlanOnly).length

  const firstAds = (
    <>
      <SectionHeader first title="Your first ads" sub="Ready to launch once your limit is saved and you say go." end={checked > 0 ? <Pill tone="ok" dot>{checked === 1 ? "Passed my claims check" : `All ${checked} passed my claims check`}</Pill> : undefined} />
      {data.planState === "running" && !data.firstAds.length ? (
        <EmptyState icon={<Spinner size={20} />} title="I’m writing your first ads" text="I read your competitors’ live ads first, then write yours. It takes a few minutes, and they show up here." />
      ) : data.firstAds.length ? (
        <div className="x3-adlist">
          {data.firstAds.map((a, i) => (
            <article key={i} className="ax-card x3-adcard">
              <div className="x3-adcard__h">
                <span className="x3-adcard__p"><PlatformIcons channels={channelsFor(a.platform)} size={16} />{a.platform}</span>
                {a.inPlanOnly && <Pill tone="idle">I prepare these, you run them</Pill>}
              </div>
              <AdPreview frame={a.platform === "Google search" ? "google" : a.platform === "LinkedIn" ? "linkedin" : "meta"} page={data.brand.page} site={data.brand.site} headline={a.headline} primary={a.primary} image={a.image} />
              {a.audience && <div className="x3-adcard__aud"><Glyph name="globe" size={14} />{a.audience}</div>}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No ad plan yet"
          text="I start from what your competitors run, then write your first ads for you to look at."
          bullets={["2 Facebook & Instagram ads with their pictures", "A Google search ad", "Every line checked against your own facts"]}
          actions={<Button variant="primary" onClick={() => askAlphaa({ chip: { label: "Make my ad plan", action: { type: "agent-op", endpoint: "adplan", body: { op: "make" } } } })}>Make my ad plan</Button>}
        />
      )}
    </>
  )

  const campaigns = data.campaigns.length > 0 && (
    <>
      <SectionHeader first={data.live} title={data.live ? "Your campaigns" : "Built, waiting for your OK"} sub={data.live ? "What’s running and what’s paused, from your ad accounts." : "Built paused. Nothing spends until you turn it on."} />
      <List card label="Campaigns">
        {data.campaigns.map((a) => (
          <ListRow
            key={a.id}
            thumb={a.image}
            lead={a.image ? undefined : <span className="xd-row__ic"><ChannelMark channel={channelsFor(a.platform)[0]} size={18} /></span>}
            title={a.name}
            meta={<>{a.platform}{a.daily ? ` · ${a.daily}` : ""}</>}
            end={<Pill tone={a.pc === "g" ? "ok" : a.pc === "a" ? "warn" : a.pc === "b" ? "info" : "idle"}>{a.status}</Pill>}
            wrapEnd
            onClick={() => open({ eb: a.platform, title: a.name, rows: [...(a.image ? [{ k: "Image", v: "", image: a.image }] : []), { k: "Status", v: a.status }, { k: "Ad text", v: a.text, box: true }, ...(a.daily ? [{ k: "Budget", v: a.daily }] : [])], cta: { label: "Ask me about it", topic: "ads" } })}
          />
        ))}
      </List>
    </>
  )

  const results = (() => {
    const has = data.results.length > 0 || !!data.roas
    if (!has) {
      return (
        <>
          <EmptyState
            hero
            icon={<Glyph name="spark" size={26} />}
            title="Results show up once your ads spend"
            text="I read these straight from your Facebook and Google ad accounts. Nothing here is a forecast."
            bullets={["Spend, leads and cost per lead, last 7 or 30 days", "Return on ad spend when real sales are tracked", "Ads that are wearing out, flagged early"]}
            actions={<Button variant="primary" onClick={() => setTab("ads")}>See your first ads</Button>}
          />
          <StatRow>
            <StatTile label="Spent" value={null} empty="Nothing yet" />
            <StatTile label="Leads" value={null} empty="Nothing yet" />
            <StatTile label="Cost per lead" value={null} empty="Nothing yet" />
          </StatRow>
        </>
      )
    }
    return (
      <>
        <div className="x3-row">
          {data.fetchFailed ? <p className="ax-note x3-flat">{data.fetchFailed}</p> : <span />}
          <Segmented label="Period" size="sm" value={win} onChange={setWin} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }]} />
        </div>
        {data.tired.length > 0 && (
          <section className="ax-card x3-pad">
            <SectionHeader first title={data.tired.length === 1 ? "1 ad is wearing out" : `${data.tired.length} ads are wearing out`} end={<Pill tone="warn">Flagged, nothing changed</Pill>} />
            {data.tired.map((t, i) => (
              <div key={i} className="x3-tired">
                <div>{t.why}</div>
                {t.headline && <div className="ax-t11">Headline “{t.headline}”. I’d test a fresh opening over the same offer.</div>}
              </div>
            ))}
            <div><Button size="sm" onClick={() => askAlphaa({ topic: "ads", label: "Write fresh hooks for my tired ads" })}>Write fresh openings</Button></div>
          </section>
        )}
        {data.roas && <RoasKpis roas={data.roas} win={w} />}
        {data.results.map((r) => {
          const x = r.windows?.find((y) => y.days === w)
          const conv = r.platform === "Google Ads" ? "conversion" : "lead"
          return (
            <section key={r.platform} className="ax-card x3-pad" aria-label={r.platform}>
              <SectionHeader first title={<span className="x3-ttl"><PlatformIcons channels={channelsFor(r.platform)} size={16} />{r.platform}</span>} sub={`Last ${x ? w : r.days} days${r.extra ? ` · ${r.extra}` : ""}`} />
              <StatRow>
                <StatTile soft label="Spent" value={x?.spend ?? r.spend} />
                <StatTile soft label={r.platform === "Google Ads" ? "Conversions" : "Leads"} value={(x ? x.leads : r.leads) ?? null} empty="None yet" />
                <StatTile soft label={`Cost per ${conv}`} value={(x ? x.perLead : r.perLead) ?? null} empty="None yet" />
              </StatRow>
              {x ? (
                <details className="x3-fold">
                  <summary>More numbers</summary>
                  <StatRow min={130}>
                    <StatTile soft label="Times shown" value={x.impressions} />
                    <StatTile soft label={r.platform === "Google Ads" ? "Clicks" : "Link clicks"} value={x.clicks} />
                    <StatTile soft label="Click rate" value={x.ctr} empty="None yet" />
                    <StatTile soft label="Cost per click" value={x.cpc} empty="None yet" />
                    <StatTile soft label="Per 1,000 views" value={x.cpm} empty="None yet" />
                    <StatTile soft label={`Clicks that became ${conv}s`} value={x.convRate} empty="None yet" />
                  </StatRow>
                </details>
              ) : <div className="ax-t11">{r.clicks} clicks</div>}
            </section>
          )
        })}
        {data.roas && <RoasCampaigns roas={data.roas} win={w} />}
        {data.roas && <RoasLeads roas={data.roas} />}
        {!data.sevenDays && data.watching.length > 0 && (
          <>
            <SectionHeader title="Competitor ads I’m watching" sub="Their live Google search ads, from Google’s public ad library." />
            <div className="ax-g2 x3-flat">
              {data.watching.map((c, i) => (
                <article key={i} className="ax-card x3-pad">
                  <div className="x3-row"><b>{c.page}</b>{c.days != null && <Pill tone="idle">Running {c.days} days</Pill>}</div>
                  {c.text ? <p className="ax-p ax-clamp x3-ink">“{c.text}”</p> : <p className="ax-p">A {c.format === "video" ? "video" : c.format === "image" ? "picture" : ""} ad on {c.where === "google" ? "Google" : "Facebook and Instagram"}.</p>}
                  {data.beatIt.length > 0 && <p className="ax-p"><b className="x3-ink">How I’d beat it: </b>{data.beatIt[i % data.beatIt.length]}</p>}
                  <Button size="sm" href={c.url} external>{c.where === "google" ? "See it on Google" : "See it in the Ad Library"}</Button>
                </article>
              ))}
            </div>
          </>
        )}
      </>
    )
  })()

  const groups = (() => {
    const out: { day: string; items: Parameters<typeof Timeline>[0]["groups"][number]["items"] }[] = []
    data.changes.forEach((c, i) => {
      const day = c.when || "Earlier"
      let g = out.find((x) => x.day === day)
      if (!g) { g = { day, items: [] }; out.push(g) }
      g.items.push({
        id: String(i),
        icon: <ChannelMark channel={channelsFor(c.platform)[0]} size={14} />,
        title: undone[i] ? <s>{c.text}</s> : c.text,
        why: `${c.by === "Me" ? "I did this" : "You did this"} on ${c.platform}`,
        end: undone[i] ? <Pill tone="idle">Undone</Pill> : c.undo ? <Button size="sm" variant="undo" loading={undoing === i} onClick={() => void undo(i, c.undo!)} icon={<Glyph name="undo" size={14} />}>Undo</Button> : undefined,
      })
    })
    return out
  })()

  return (
    <>
      <PageHeader title="Ads" sub="I build, run and tune your Facebook, Instagram and Google ads inside the monthly limit you set." pill={pill} tabs={<AdsTabs value={tab} onChange={setTab} />} />

      {tab === "ads" && (
        <div className="x3-adsgrid">
          <div className="x3-col">
            {data.live ? campaigns : firstAds}
            {!data.live && campaigns}
            <List card label="More">
              {data.plan && <ListRow lead={<span className="xd-row__ic"><Glyph name="spark" size={16} /></span>} title="See the full plan" meta="Video scripts, opening lines, static ads and the budget split" href="/dashboard/ads/plan" />}
              <ListRow lead={<span className="xd-row__ic"><Glyph name="link" size={16} /></span>} title="Promote a post you already published" meta="Show your best post to more people nearby, built paused for your OK" onClick={() => setTab("promote")} />
            </List>
          </div>
          <LimitCard budget={data.budget} inputs={data.planInputs} />
        </div>
      )}

      {tab === "promote" && (
        <>
          <div className="x3-back"><Button size="sm" variant="undo" onClick={() => setTab("ads")}>Back to Ads</Button></div>
          <SectionHeader first title="Promote a post" sub="Pick a post you already published. I build the promotion paused, you turn it on." />
          <PromotePanel note={note} />
        </>
      )}

      {tab === "results" && <div className="x3-col x3-top">{results}</div>}

      {tab === "auto" && (
        <div className="x3-col x3-top">
          <AdRulesPanel />
          <section>
            <SectionHeader title="What I changed" sub={data.changes.length ? "Newest first. Undo puts it back the way it was." : undefined} />
            {data.changes.length ? (
              <div className="ax-card x3-pad"><Timeline groups={groups} /></div>
            ) : (
              <EmptyState icon={<Glyph name="clock" size={22} />} title="No changes yet" text="Every change I or your rules make to your ads shows here, with the reason and an Undo." />
            )}
          </section>
          <details className="ax-card x3-guard">
            <summary>The rules I always keep</summary>
            <ul>
              {GUARDRAILS.map((g) => (
                <li key={g.t}><span className="x3-guard__ic"><Glyph name={g.icon} size={15} /></span><span><b>{g.t}</b> {g.d}</span></li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {tab === "share" && <div className="x3-top"><ReportPanel /></div>}
      {node}
    </>
  )
}
