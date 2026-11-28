"use client"

import { useEffect, useMemo, useState } from "react"
import type { SocialData, SocialCard } from "@/lib/workspace/social"
import { AI_NOTE, askAlphaa, ISLAND_EVENT, toast } from "@/lib/workspace/events"
import {
  Button, ChannelMark, EmptyState, FilterPills, Glyph, PageHeader, Pill, PlanGate, PlatformIcons, SectionHeader, Sheet, StatRow, StatTile, StatusDot, When,
  channelsOf, type Channel,
} from "./ui"
import { ViewSwitch } from "./CalendarView"
import { SizePreview } from "./SizePreview"
import "./social.css"

// Social Studio: ready for your OK (autopilot off) / going out soon (with Stop) / posted (with the
// stats the platform shares). Approving moves the card to "Going out soon" at once, with Undo on
// it. Preview opens a sheet with the post in each place it goes (SizePreview, the real account's
// name and picture) and style swatches that re-draw its picture in one click and remember the choice.

const STYLES = [
  { key: "minimal", name: "Minimal light", swatch: "linear-gradient(135deg,#FAFAF7,#E6E4DE)" },
  { key: "editorial", name: "Editorial dark", swatch: "linear-gradient(135deg,#101114,#26282D)" },
  { key: "gradient", name: "Bold gradient", swatch: "linear-gradient(135deg,#0b5a4a,#2f9b84)" },
  { key: "warm", name: "Warm", swatch: "linear-gradient(135deg,#F6EBDD,#E5D3BD)" },
] as const

const chOf = (name: string): Channel | null => channelsOf(name)[0] ?? null

type Local = "approved" | "stopped" | "back"

export function SocialView({ data }: { data: SocialData | null }) {
  const [tab, setTab] = useState("All")
  // What the owner changed on this visit: approved (draft → going out), stopped (scheduled → held), back (Undo).
  const [local, setLocal] = useState<Record<string, Local>>({})
  const [img, setImg] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [preview, setPreview] = useState<SocialCard | null>(null)
  const [fix, setFix] = useState<SocialData["accounts"][number] | null>(null)

  useEffect(() => {
    if (!data?.island) return
    const t = window.setTimeout(() => window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: data.island })), 0)
    return () => { window.clearTimeout(t); window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: null })) }
  }, [data?.island])

  const posts = data?.posts ?? []
  /** Where each card sits now, after this visit's approvals and stops. */
  const lane = (p: SocialCard): "ready" | "going" | "posted" => {
    if (["published", "partial", "failed", "publishing"].includes(p.status)) return "posted"
    const l = local[p.id]
    if (p.status === "draft") return l === "approved" ? "going" : "ready"
    return "going" // scheduled (stopped ones stay here with Undo)
  }
  const counts = useMemo(() => ({
    ready: posts.filter((p) => lane(p) === "ready").length,
    going: posts.filter((p) => lane(p) === "going" && local[p.id] !== "stopped").length,
    posted: posts.filter((p) => lane(p) === "posted").length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [posts, local])

  if (!data) {
    return (
      <>
        <PageHeader title="Social Studio" sub="I write, design and post to Facebook, Instagram and LinkedIn in your voice, with your brand on every image." />
        <div style={{ marginTop: 26 }}><PlanGate plan="Pro" title="Social media comes with the Pro plan" text="Pro adds branded posts for your social accounts, posted as each platform allows." /></div>
      </>
    )
  }

  async function act(p: SocialCard, op: "stop" | "undo" | "approve") {
    // Approve shows at once; a failure puts it back.
    const before = local[p.id]
    if (op === "approve") setLocal((l) => ({ ...l, [p.id]: "approved" }))
    setBusy(p.id)
    const res = op === "approve"
      ? await fetch("/api/agent/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "approve", id: p.id }) }).catch(() => null)
      : await fetch("/api/workspace/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "social", id: p.id, op }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(null)
    if (!res?.ok) {
      setLocal((l) => { const n = { ...l }; if (before) n[p.id] = before; else delete n[p.id]; return n })
      return toast(d?.error ?? "That didn’t save. Try again.")
    }
    if (op === "stop") {
      // Undoing an approval made on this visit sends it back to Ready; a scheduled post is held in place.
      setLocal((l) => { const n = { ...l }; if (p.status === "draft") delete n[p.id]; else n[p.id] = "stopped"; return n })
      toast(p.status === "draft" ? "Undone. It waits for your OK again." : "Stopped. It won’t go out.")
    } else if (op === "undo") {
      setLocal((l) => ({ ...l, [p.id]: "back" }))
      toast("Back on the schedule")
    } else toast("Approved. It goes out on schedule.")
  }
  async function restyle(p: SocialCard, style: string) {
    setBusy(`${p.id}:${style}`)
    const res = await fetch("/api/workspace/restyle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, style }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; image?: string } | null
    setBusy(null)
    if (!res?.ok || !d?.image) return toast(d?.error ?? "That didn’t redraw. Try again.")
    setImg((m) => ({ ...m, [p.id]: d.image! }))
    toast(`${STYLES.find((x) => x.key === style)?.name}. I’ll use it for your next posts too.`)
  }

  const tabs = ["All", ...data.tabs]
  const visible = posts.filter((p) => tab === "All" || p.nets.includes(tab))
  const ready = visible.filter((p) => lane(p) === "ready")
  const going = visible.filter((p) => lane(p) === "going")
  const posted = visible.filter((p) => lane(p) === "posted")
  const stoppedHere = (p: SocialCard) => local[p.id] === "stopped"
  const approvedHere = (p: SocialCard) => local[p.id] === "approved"
  const noAccount = (p: SocialCard) => p.nets[0] === "No account yet"

  const statusPill = (p: SocialCard) => {
    if (p.status === "failed") return <Pill tone="warn">Didn’t post</Pill>
    if (p.status === "partial") return <Pill tone="warn">Posted in part</Pill>
    if (p.status === "publishing") return <Pill tone="info" dot>Posting now</Pill>
    if (p.status === "published") return <Pill tone="glass">Posted</Pill>
    if (stoppedHere(p)) return <Pill tone="glass">Stopped</Pill>
    if (lane(p) === "going") return <Pill tone="glass" dot>Scheduled</Pill>
    return <Pill tone="glass">Ready for your OK</Pill>
  }

  const card = (p: SocialCard, compact = false) => {
    const stopped = stoppedHere(p)
    const image = img[p.id] ?? p.image
    const marks = p.nets.map(chOf).filter((c): c is Channel => !!c)
    return (
      <article key={p.id} className={`ax-card hv xs-card${compact ? " compact" : ""}`}>
        <button type="button" className="xs-img" onClick={() => setPreview(p)} style={{ background: image ? `url("${image}") center/cover` : "linear-gradient(135deg,#0071e3,#af52de)" }} aria-label={`Preview ${p.title}`}>
          {!image && <b>{p.title}</b>}
          <span className="xs-img__st">{statusPill(p)}</span>
        </button>
        <div className="ax-cb">
          <div className="xs-where">{marks.length ? <PlatformIcons channels={marks} size={18} /> : null}<span>{noAccount(p) ? "No account yet" : p.nets.join(", ")}</span></div>
          <p className={`ax-ttl${stopped ? " st" : ""}`}>{p.title}</p>
          {!compact && <p className="ax-p ax-clamp">{p.text}</p>}
          {p.error && p.status !== "published" && <p className="ax-p xs-err">{p.error}</p>}
          <div className="ax-ft">
            <span className="xs-when">
              {stopped ? "Stopped, won’t go out" : approvedHere(p) ? "Approved just now" : p.verb ? <When at={p.at} mode={p.verb === "Posted " ? "ago" : "ahead"} prefix={p.verb} fallback={p.when} /> : p.when}
              {p.result && <> · <b>{p.result}</b></>}
            </span>
            <span className="xs-acts">
              {p.links.map((l) => <a key={l.url} className="ax-src" href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}
              {lane(p) === "posted" && data.canBoost && p.links.length > 0 && <Button size="sm" href="/dashboard/ads?tab=promote">Boost this post</Button>}
              {lane(p) === "ready" && (noAccount(p)
                ? <Button size="sm" onClick={() => askAlphaa({ topic: "social", label: "Connect an account" })}>Connect an account</Button>
                : <Button size="sm" variant="primary" loading={busy === p.id} onClick={() => void act(p, "approve")}>Approve & schedule</Button>)}
              {approvedHere(p) && <Button size="sm" variant="undo" loading={busy === p.id} onClick={() => void act(p, "stop")}>Undo</Button>}
              {lane(p) === "going" && !approvedHere(p) && (stopped
                ? <Button size="sm" variant="undo" loading={busy === p.id} onClick={() => void act(p, "undo")}>Undo</Button>
                : <Button size="sm" variant="ghost" loading={busy === p.id} onClick={() => void act(p, "stop")}>Stop</Button>)}
            </span>
          </div>
        </div>
      </article>
    )
  }

  const followers = data.audience
  return (
    <>
      <PageHeader
        title="Social Studio"
        sub={`I write and design every post in your voice${data.auto ? " and post it on schedule. Stop anything before it goes out." : ". Approve a post and it goes out on schedule."}`}
        actions={<ViewSwitch on="lists" />}
      />

      <div className="xs-accts" aria-label="Your social accounts">
        {data.accounts.length ? data.accounts.map((a) => {
          const ch = chOf(a.platform)
          return a.ok
            ? <span key={a.id} className="xs-acct">{ch && <ChannelMark channel={ch} size={18} />}<span className="xs-acct__n">{a.name}</span><StatusDot tone="ok" label="Connected" /></span>
            : <button key={a.id} type="button" className="xs-acct warn" onClick={() => setFix(a)}>{ch && <ChannelMark channel={ch} size={18} />}<span className="xs-acct__n">{a.name}</span><StatusDot tone="warn" label="Needs reconnecting" /><span className="xs-acct__fix">Fix</span></button>
        }) : <span className="ax-t11">No social accounts connected yet.</span>}
        <Button size="sm" onClick={() => askAlphaa({ topic: "social", label: "My social accounts" })}>{data.accounts.length ? "Manage accounts" : data.canConnect ? "Connect an account" : "See what’s opening soon"}</Button>
      </div>

      <div className="xs-stats">
        <StatRow>
          <StatTile label="Ready for your OK" value={String(counts.ready)} hint={counts.ready ? "Approve below" : "Nothing waiting"} />
          <StatTile label="Going out soon" value={String(counts.going)} hint="Stop any of them first" />
          <StatTile label="Posted" value={String(counts.posted)} hint="Last 40 posts" />
          {followers.map((a) => (
            <StatTile
              key={`${a.platform}:${a.name}`}
              icon={chOf(a.platform) ? <ChannelMark channel={chOf(a.platform)!} size={14} /> : undefined}
              label={`${a.platform} followers`}
              value={a.followers.toLocaleString("en-US")}
              delta={a.change != null && a.change !== 0 ? { text: Math.abs(a.change).toLocaleString("en-US"), dir: a.change > 0 ? "up" : "down" } : null}
              hint={<span className="xs-spark">{a.change == null ? "Growth shows from tomorrow" : `Since ${new Date(`${a.since}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`}<Spark points={a.points} /></span>}
            />
          ))}
        </StatRow>
      </div>
      {data.statsAsk && (data.statsAsk.href ? (
        <section className="ax-card xs-ask">
          <span className="xs-ask__ic" aria-hidden="true"><Glyph name="spark" size={16} /></span>
          <div className="xs-ask__b"><b>{data.statsAsk.title}</b><span>{data.statsAsk.text}</span></div>
          <Button size="sm" variant="primary" href={data.statsAsk.href}>Reconnect</Button>
        </section>
      ) : <p className="ax-note">{data.statsAsk.text}</p>)}

      {tabs.length > 2 && (
        <div className="xs-filter">
          <FilterPills label="Show posts for" scroll value={tab} onChange={setTab} options={tabs.map((t) => { const ch = chOf(t); return { value: t, label: t, icon: ch ? <ChannelMark channel={ch} size={14} /> : undefined } })} />
        </div>
      )}

      {visible.length ? (
        <>
          {ready.length > 0 && <><SectionHeader title="Ready for your OK" sub={data.auto ? "Written outside the schedule. Approve to send them out." : "Approve one and it goes out on its planned day."} end={<Pill tone="info">{ready.length}</Pill>} /><div className="xs-grid">{ready.map((p) => card(p))}</div></>}
          {going.length > 0 && (
            <>
              <SectionHeader title="Going out soon" sub="These go out on their own. Stop anything before it goes out." end={<Pill tone="ok" dot>{going.filter((p) => !stoppedHere(p)).length} scheduled</Pill>} />
              <div className="xs-grid">{going.map((p) => card(p))}</div>
              <p className="ax-note" role="note">{AI_NOTE}</p>
            </>
          )}
          {posted.length > 0 && <><SectionHeader title="Posted" sub="With the numbers each platform shares." /><div className="xs-grid three">{posted.map((p) => card(p, true))}</div></>}
          {!ready.length && !going.length && !posted.length && <EmptyState title={`No ${tab} posts yet`} text="Pick another account above." />}
        </>
      ) : (
        <EmptyState
          icon={<Glyph name="spark" size={22} />}
          title={data.drafting ? "I’m drafting your next posts" : "No posts yet"}
          text={data.drafting ? "They show up here in a few minutes, in your voice and with your brand." : data.accounts.length ? "Ask me to run your week and I’ll plan, write and design your posts." : "Connect Facebook and Instagram, or LinkedIn, and I’ll plan, write and design your posts."}
          bullets={data.drafting ? undefined : ["Posts in your voice, with your brand on every picture", "Approve each one, or let Autopilot post them", "The numbers each platform shares, per post"]}
          actions={data.drafting ? null : data.accounts.length
            ? <Button variant="primary" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</Button>
            : <Button variant="primary" onClick={() => askAlphaa({ topic: "social", label: "Connect an account" })}>Connect an account</Button>}
        />
      )}

      <Sheet
        open={!!fix}
        onClose={() => setFix(null)}
        side="center"
        title={fix ? `Reconnect ${fix.platform}` : ""}
        footer={<><Button onClick={() => setFix(null)}>Not now</Button>{fix?.reconnect && <Button variant="primary" href={fix.reconnect}>Reconnect {fix.platform}</Button>}</>}
      >
        <p className="xs-fix">{fix?.fix}</p>
      </Sheet>

      {(() => {
        const p = preview
        if (!p) return <Sheet open={false} onClose={() => setPreview(null)} />
        const editable = lane(p) !== "posted"
        const image = img[p.id] ?? p.image
        const isReady = lane(p) === "ready" && !noAccount(p)
        const isGoing = lane(p) === "going" && !stoppedHere(p) && !approvedHere(p)
        return (
          <Sheet
            open
            onClose={() => setPreview(null)}
            wide
            eyebrow={p.nets.join(", ")}
            title={p.title}
            footer={
              <>
                {editable && <Button onClick={() => { setPreview(null); askAlphaa({ topic: "social", label: "Change a post" }) }}>Change it</Button>}
                {isGoing && <Button variant="ghost" loading={busy === p.id} onClick={() => void act(p, "stop")}>Stop it</Button>}
                {isReady ? <Button variant="primary" loading={busy === p.id} onClick={() => { void act(p, "approve"); setPreview(null) }}>Approve & schedule</Button> : <Button onClick={() => setPreview(null)}>Close</Button>}
              </>
            }
          >
            <div className="xs-prev">
              {image ? <SizePreview postId={p.id} text={p.text} image={image} nets={p.nets} brandName={data.brandName} who={data.who} version={image} /> : null}
              {editable && image && (
                <div>
                  <div className="ax-eb" style={{ marginBottom: 8 }}>Picture style</div>
                  <div className="ax-swatches">
                    {STYLES.map((s) => (
                      <button key={s.key} type="button" onClick={() => void restyle(p, s.key)} disabled={!!busy} aria-label={s.name} aria-busy={busy === `${p.id}:${s.key}` || undefined}>
                        <span style={{ background: s.swatch }} />{busy === `${p.id}:${s.key}` ? "Drawing" : s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="box"><div className="ax-eb" style={{ marginBottom: 6 }}>Caption</div><div className="v">{p.text}</div></div>
              <div><div className="ax-eb" style={{ marginBottom: 6 }}>When</div><div className="v">{p.verb ? <When at={p.at} mode={p.verb === "Posted " ? "ago" : "ahead"} prefix={p.verb} fallback={p.when} /> : p.when}</div></div>
              {p.resultBy.length ? (
                <div>
                  <div className="ax-eb" style={{ marginBottom: 6 }}>Numbers from the platform</div>
                  {p.resultBy.map((r) => <div key={r.platform} className="v"><b>{r.platform}</b> · {r.line}{r.basic ? <span className="xs-mut"> (reach not shared yet)</span> : null}</div>)}
                </div>
              ) : p.result ? <div><div className="ax-eb" style={{ marginBottom: 6 }}>Numbers from the platform</div><div className="v">{p.result}</div></div> : null}
              <p className="ax-note" style={{ marginTop: 0 }}>{AI_NOTE}</p>
            </div>
          </Sheet>
        )
      })()}
    </>
  )
}

/** A tiny follower line (last 90 daily counts). Nothing to draw with under 2 points. */
function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 72, h = 22, lo = Math.min(...points), hi = Math.max(...points), span = hi - lo || 1
  const d = points.map((v, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - lo) / span) * (h - 4)).toFixed(1)}`).join(" ")
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ flex: "none" }}><path d={d} fill="none" stroke="var(--x-blue)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" /></svg>
}
