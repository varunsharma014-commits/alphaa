"use client"

import { useEffect, useState } from "react"
import type { SocialData, SocialCard } from "@/lib/workspace/social"
import { AI_NOTE, askAlphaa, ISLAND_EVENT, toast } from "@/lib/workspace/events"
import { Empty, PlanGate, Tabs, When } from "./ui"
import { ViewSwitch } from "./CalendarView"
import { SizePreview } from "./SizePreview"

// Social Studio: ready for your OK (autopilot off) / going out soon (with Stop) / posted (with the
// stats the platform shares). Preview opens a drawer with the post in each place it goes (size
// switcher, SizePreview) and style swatches that re-draw its picture in one click and remember the choice.

const STYLES = [
  { key: "minimal", name: "Minimal light", swatch: "linear-gradient(135deg,#FAFAF7,#E6E4DE)" },
  { key: "editorial", name: "Editorial dark", swatch: "linear-gradient(135deg,#101114,#26282D)" },
  { key: "gradient", name: "Bold gradient", swatch: "linear-gradient(135deg,#0b5a4a,#2f9b84)" },
  { key: "warm", name: "Warm", swatch: "linear-gradient(135deg,#F6EBDD,#E5D3BD)" },
] as const

export function SocialView({ data }: { data: SocialData | null }) {
  const [tab, setTab] = useState("All")
  const [over, setOver] = useState<Record<string, SocialCard["status"]>>({})
  const [img, setImg] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [preview, setPreview] = useState<SocialCard | null>(null)
  const [fix, setFix] = useState<SocialData["accounts"][number] | null>(null)

  useEffect(() => {
    if (!data?.island) return
    const t = window.setTimeout(() => window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: data.island })), 0)
    return () => { window.clearTimeout(t); window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: null })) }
  }, [data?.island])

  if (!data) {
    return (
      <>
        <h1 className="ax-h1">Social Studio</h1>
        <p className="ax-sub">I write, design and post to Facebook, Instagram and LinkedIn in your voice, with your brand on every image.</p>
        <div style={{ marginTop: 26 }}><PlanGate plan="Pro" title="Social media comes with the Pro plan" text="Pro adds branded posts for your social accounts, posted as each platform allows." /></div>
      </>
    )
  }

  async function act(p: SocialCard, op: "stop" | "undo" | "approve") {
    setBusy(p.id)
    const res = op === "approve"
      ? await fetch("/api/agent/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "approve", id: p.id }) }).catch(() => null)
      : await fetch("/api/workspace/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "social", id: p.id, op }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(null)
    if (!res?.ok) return toast(d?.error ?? "That didn’t save. Try again.")
    setOver((o) => ({ ...o, [p.id]: op === "stop" ? "draft" : "scheduled" }))
    toast(op === "stop" ? "Stopped. It won’t go out." : op === "undo" ? "Back on the schedule" : "Approved. It goes out on schedule.")
  }
  async function restyle(p: SocialCard, style: string) {
    setBusy(`${p.id}:${style}`)
    const res = await fetch("/api/workspace/restyle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, style }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; image?: string } | null
    setBusy(null)
    if (!res?.ok || !d?.image) return toast(d?.error ?? "That didn’t redraw. Try again.")
    setImg((m) => ({ ...m, [p.id]: d.image! }))
    toast(`${STYLES.find((x) => x.key === style)?.name} · I’ll use it for your next posts too`)
  }

  const tabs = ["All", ...data.tabs]
  const visible = data.posts.filter((p) => tab === "All" || p.nets.includes(tab))
  const statusOf = (p: SocialCard) => over[p.id] ?? p.status
  const stoppedHere = (p: SocialCard) => over[p.id] === "draft" && p.status === "scheduled"
  const ready = visible.filter((p) => statusOf(p) === "draft" && !stoppedHere(p))
  const going = visible.filter((p) => statusOf(p) === "scheduled" || stoppedHere(p))
  const posted = visible.filter((p) => ["published", "partial", "failed", "publishing"].includes(p.status))

  const card = (p: SocialCard) => {
    const st = statusOf(p)
    const stopped = stoppedHere(p)
    const image = img[p.id] ?? p.image
    return (
      <article key={p.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nets.join(" & ")}</span>
          {p.status === "failed" && <span className="ax-pill a">Didn’t post</span>}
        </div>
        <button type="button" className="ax-img" onClick={() => setPreview(p)} style={{ background: image ? `url("${image}") center/cover` : "linear-gradient(135deg,#0071e3,#af52de)" }} aria-label={`Preview ${p.title}`}>
          {!image && <b>{p.title}</b>}
        </button>
        <div className="ax-cb">
          <p className={`ax-ttl${stopped ? " st" : ""}`}>{p.title}</p>
          <p className="ax-p ax-clamp">{p.text}</p>
          {p.error && p.status !== "published" && <p className="ax-p" style={{ color: "var(--x-amber)" }}>{p.error}</p>}
          <div className="ax-ft">
            <span style={{ fontSize: 12.5, color: "var(--x-mut)", minWidth: 0 }}>
              {stopped ? "Stopped · won’t go out" : p.verb ? <When at={p.at} mode={p.verb === "Posted " ? "ago" : "ahead"} prefix={p.verb} fallback={p.when} /> : p.when}
              {p.result && <> · <b style={{ color: "var(--x-ink)", fontWeight: 600 }}>{p.result}</b></>}
            </span>
            <span style={{ display: "flex", gap: 6, alignItems: "center", flex: "none" }}>
              {p.links.map((l) => <a key={l.url} className="ax-src" href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}
              {st === "draft" && !stopped && (p.nets[0] === "No account yet"
                ? <button className="ax-btn s sm" type="button" onClick={() => askAlphaa({ topic: "social", label: "Connect an account" })}>Connect an account</button>
                : <button className="ax-btn p sm" type="button" disabled={busy === p.id} onClick={() => void act(p, "approve")}>Approve & schedule</button>)}
              {(st === "scheduled" || stopped) && <button className={`ax-btn d sm${stopped ? " undo" : ""}`} type="button" disabled={busy === p.id} onClick={() => void act(p, stopped ? "undo" : "stop")}>{stopped ? "Undo" : "Stop"}</button>}
            </span>
          </div>
        </div>
      </article>
    )
  }
  const section = (title: string, sub: string, list: SocialCard[]) => list.length > 0 && (
    <>
      <div className="ax-h2"><div><h2>{title} ({list.length})</h2><p>{sub}</p></div></div>
      <div className="ax-g2" style={{ marginTop: 0 }}>{list.map(card)}</div>
    </>
  )

  return (
    <>
      <div className="ax-hdr">
        <div><h1 className="ax-h1">Social Studio</h1><p className="ax-sub">I write and design every post in your voice{data.auto ? " and post it on schedule. Stop anything before it goes out." : ". Approve a post and it goes out on schedule."}</p></div>
        <ViewSwitch on="lists" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
        {data.accounts.length ? data.accounts.map((a) => (
          a.ok
            ? <span key={a.id} className="ax-pill n"><span className="ax-sdot" style={{ background: "#34c759" }} />{a.platform} · {a.name}</span>
            : <button key={a.id} type="button" className="ax-pill a" style={{ border: 0 }} onClick={() => setFix(a)} title={a.fix ?? ""}><span className="ax-sdot" style={{ background: "#ff9500" }} />{a.platform} · {a.name} · Fix</button>
        )) : <span className="ax-t11" style={{ fontSize: 13 }}>No social accounts connected yet.</span>}
        <button className="ax-lnk" type="button" onClick={() => askAlphaa({ topic: "social", label: "My social accounts" })}>{data.accounts.length ? "Manage accounts" : data.canConnect ? "Connect an account" : "See what’s opening soon"}</button>
      </div>
      {fix && (
        <section className="ax-card" style={{ marginTop: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", borderColor: "rgba(255,149,0,.4)" }}>
          <span style={{ flex: 1, minWidth: 220, fontSize: 14 }}>{fix.fix}</span>
          {fix.reconnect && <a className="ax-btn p sm" href={fix.reconnect}>Reconnect {fix.platform}</a>}
          <button className="ax-btn s sm" type="button" onClick={() => setFix(null)}>Close</button>
        </section>
      )}
      {data.audience.length > 0 && (
        <div className="ax-g3" style={{ marginTop: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {data.audience.map((a) => (
            <section key={`${a.platform}:${a.name}`} className="ax-card" style={{ padding: "14px 18px" }} aria-label={`${a.platform} followers`}>
              <div className="ax-eb">{a.platform} followers · {a.name}</div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 650, letterSpacing: "-.02em" }}>{a.followers.toLocaleString("en-US")}</div>
                  <div style={{ fontSize: 12.5, color: "var(--x-mut)" }}>
                    {a.change == null ? "I save the count every day, so growth shows from tomorrow." : `${a.change > 0 ? "+" : ""}${a.change.toLocaleString("en-US")} since ${new Date(`${a.since}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  </div>
                </div>
                <Spark points={a.points} />
              </div>
            </section>
          ))}
        </div>
      )}
      {data.statsAsk && (
        <section className="ax-card" style={{ marginTop: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}><p className="ax-ttl" style={{ margin: 0 }}>{data.statsAsk.title}</p><p className="ax-p" style={{ margin: "4px 0 0" }}>{data.statsAsk.text}</p></div>
          {data.statsAsk.href && <a className="ax-btn p sm" href={data.statsAsk.href}>Reconnect Facebook & Instagram</a>}
        </section>
      )}
      {tabs.length > 2 && <Tabs value={tab} onChange={setTab} tabs={tabs.map((t) => ({ key: t, label: t }))} />}

      {visible.length ? (
        <>
          {section(data.auto ? "Ready for your OK" : "Ready for your OK", data.auto ? "Written outside the schedule. Approve to send them out." : "Approve one and it goes out on its planned day.", ready)}
          {section("Going out soon", "These go out on their own. Stop anything before it goes out.", going)}
          {going.length > 0 && <p className="ax-note" role="note" style={{ marginTop: 10 }}>{AI_NOTE}</p>}
          {section("Posted", "With the numbers each platform shares.", posted)}
        </>
      ) : (
        <div style={{ marginTop: 22 }}>
          <Empty
            title={data.drafting ? "I’m drafting your next posts" : "No posts yet"}
            text={data.drafting ? "They show up here in a few minutes, in your voice and with your brand." : data.accounts.length ? "Ask me to run your week and I’ll plan, write and design your posts." : "Connect Facebook & Instagram (or LinkedIn) and I’ll plan, write and design your posts."}
            acts={data.accounts.length ? [] : [{ label: "Connect an account", topic: "social", primary: true }]}
          />
          {data.accounts.length > 0 && !data.drafting && <div style={{ marginTop: 10 }}><button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</button></div>}
        </div>
      )}

      {preview && (() => {
        const p = preview
        const editable = statusOf(p) === "draft" || statusOf(p) === "scheduled"
        const image = img[p.id] ?? p.image
        return (
          <>
            <div className="ax-bk" onClick={() => setPreview(null)} aria-hidden="true" />
            <aside className="ax-insp" role="dialog" aria-modal="true" aria-label={p.title}>
              <header>
                <div style={{ minWidth: 0 }}><div className="ax-eb">{p.nets.join(" & ")}</div><h3>{p.title}</h3></div>
                <button className="ax-x" type="button" aria-label="Close" onClick={() => setPreview(null)}>✕</button>
              </header>
              <div className="bd">
                {image ? <SizePreview postId={p.id} text={p.text} image={image} nets={p.nets} brandName={data.brandName} version={image} /> : null}
                {editable && image && (
                  <div>
                    <div className="ax-eb" style={{ marginBottom: 8 }}>Picture style</div>
                    <div className="ax-swatches">
                      {STYLES.map((s) => (
                        <button key={s.key} type="button" onClick={() => void restyle(p, s.key)} disabled={!!busy} aria-label={s.name}>
                          <span style={{ background: s.swatch }} />{busy === `${p.id}:${s.key}` ? "Drawing…" : s.name}
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
                    {p.resultBy.map((r) => <div key={r.platform} className="v"><b style={{ fontWeight: 600 }}>{r.platform}</b> · {r.line}{r.basic ? <span style={{ color: "var(--x-mut)" }}> (reach not shared yet)</span> : null}</div>)}
                  </div>
                ) : p.result ? <div><div className="ax-eb" style={{ marginBottom: 6 }}>Numbers from the platform</div><div className="v">{p.result}</div></div> : null}
                <p className="ax-note" style={{ marginTop: 0 }}>{AI_NOTE}</p>
              </div>
              <footer><button className="ax-btn s" type="button" onClick={() => setPreview(null)}>Close</button></footer>
            </aside>
          </>
        )
      })()}
    </>
  )
}

/** A tiny follower line (last 90 daily counts). Nothing to draw with under 2 points. */
function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 96, h = 30, lo = Math.min(...points), hi = Math.max(...points), span = hi - lo || 1
  const d = points.map((v, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - lo) / span) * (h - 4)).toFixed(1)}`).join(" ")
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ flex: "none" }}><path d={d} fill="none" stroke="var(--x-blue, #0071e3)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" /></svg>
}
