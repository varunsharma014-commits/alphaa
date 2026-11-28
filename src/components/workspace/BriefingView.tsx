"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { EngineIcon } from "./EngineIcon"
import type { BriefingData, GoingItem } from "@/lib/workspace/briefing"
import type { AiCard } from "@/lib/workspace/ai-cards"
import { AI_NOTE, askAlphaa, toast } from "@/lib/workspace/events"
import type { Message } from "@/lib/agent/types"
import { ActButton, Empty, When, useInspector, type Insp } from "./ui"
import dynamic from "next/dynamic"

// Scheduled website posts open in the saved editor; the saved text is what the cron publishes.
const DraftEditor = dynamic(() => import("@/components/editor/DraftEditor").then((m) => m.DraftEditor), { ssr: false })

type Slide = { eb: string; big: string; small: string; bg: string }

const SKIP_KEY = "alphaa.ws.skipQ"

export function BriefingView({ data, notice }: { data: BriefingData; notice?: Message | null }) {
  const { node, open } = useInspector()
  const [stopped, setStopped] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<string | null>(null)
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<string | null>(null)
  const [recap, setRecap] = useState<number | null>(null)
  const [planBusy, setPlanBusy] = useState(false)
  const [planDone, setPlanDone] = useState(false)
  async function approvePlan() {
    if (!data.plan) return
    setPlanBusy(true)
    const res = await fetch("/api/workspace/approve-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId: data.plan.runId }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { done?: number; problems?: string[]; error?: string } | null
    setPlanBusy(false)
    if (!res?.ok) return toast(d?.error ?? "That didn’t go through. Nothing changed.")
    setPlanDone(true)
    toast(d?.problems?.length ? `Approved ${d.done}. ${d.problems[0]}` : `Approved ${d?.done ?? 0}. They go out on schedule.`)
  }

  // Back from connecting a website (?connected= …): say how it went, in the chat.
  useEffect(() => {
    if (!notice) return
    // After the shell's own effects (a parent's run after its children's), so it's listening.
    const t = window.setTimeout(() => askAlphaa({ push: [notice] }), 0)
    return () => window.clearTimeout(t)
  }, [notice])
  useEffect(() => { try { setSkipped(sessionStorage.getItem(SKIP_KEY)) } catch {} }, [])

  const q = data.question && data.question.id !== skipped ? data.question : null
  const h = data.headline

  async function hold(g: GoingItem) {
    const st = !!stopped[g.id]
    setBusy(g.id)
    const res = await fetch("/api/workspace/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: g.kind, id: g.id, op: st ? "undo" : "stop" }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(null)
    if (!res?.ok) return toast(d?.error ?? "That didn’t save. Try again.")
    setStopped((s) => ({ ...s, [g.id]: !st }))
    toast(st ? "Back on the schedule" : "Stopped. It won’t go out.")
  }

  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = []
    if (h.total != null) out.push({ eb: "Last 30 days", big: `${h.total} calls and leads`, small: h.prev != null ? `${h.prev} in the 30 days before.` : h.parts.map((p) => `${p.label}: ${p.value}`).join(" · "), bg: "linear-gradient(135deg,#0071e3,#af52de)" })
    for (const t of data.tiles) if (t.value) out.push({ eb: t.label, big: t.value, small: t.delta ?? "", bg: out.length % 2 ? "linear-gradient(135deg,#0f766e,#0071e3)" : "linear-gradient(135deg,#db2777,#7c3aed)" })
    if (data.done.length) out.push({ eb: "This week", big: `${data.done.length} thing${data.done.length === 1 ? "" : "s"} done`, small: data.done.slice(0, 2).map((d) => d.text).join(". "), bg: "linear-gradient(135deg,#1e3a8a,#0071e3)" })
    out.push({ eb: "Next", big: data.going.length ? `${data.going.length} going out soon` : "Nothing scheduled yet", small: data.going.length ? "Stop any of them before it goes out." : "Ask me to run your marketing for the week.", bg: "linear-gradient(135deg,#1d1d1f,#3a3a3c)" })
    return out
  }, [h, data.tiles, data.done, data.going])
  const slide = recap != null ? slides[recap] : null

  return (
    <>
      {q ? (
        <>
          <div className="ax-h2" style={{ marginTop: 0 }}><div><h2>One question for you</h2><p>Only money, a new fact or a first-time connection comes here, one at a time.</p></div></div>
          <section className="ax-card ax-q" style={{ marginBottom: 26 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ax-eb">{q.eyebrow}</span>
              <p className="t">{q.title}</p>
              <p className="s">{q.text} <b style={{ color: "var(--x-ink)", fontWeight: 600 }}>{q.fallback}</b></p>
            </div>
            <div className="acts">
              <button className="ax-btn s" type="button" onClick={() => { setSkipped(q.id); try { sessionStorage.setItem(SKIP_KEY, q.id) } catch {}; toast("Okay. I’ll keep going without it.") }}>Not now</button>
              {q.review
                ? <button className="ax-btn p" type="button" onClick={() => open({ eb: `${q.review!.ai} · a fact to check`, title: "Review & fix", rows: [{ k: `What ${q.review!.ai} tells customers`, v: `“${q.review!.claim}”`, box: true }, { k: "What your website says", v: q.review!.truth, box: true }, { k: "What I do when you confirm", v: "I write a short correction for your site in your voice. You see it before it goes live, and I check the AI answer again next week." }], cta: { label: "Confirm & write the correction", chip: q.review!.fix } })}>Review & fix</button>
                : q.acts.slice().reverse().map((a, i) => <ActButton key={i} act={a} />)}
            </div>
          </section>
        </>
      ) : null}
      <AiRow cards={data.ai} open={open} pages={data.pagesInProgress} />
      {h.total == null && data.tiles.filter((t) => !t.value).length >= 2 ? (
        <section className="ax-card ax-setupbar">
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="ax-eb" style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="ax-dot" />{data.firstName ? `${data.firstName}, your briefing` : "Your briefing"}</div>
            <div style={{ fontSize: 17, fontWeight: 650, marginTop: 6 }}>{data.connected.n} of {data.connected.total} connected · calls and leads show up as each one connects</div>
            <div className="ax-bar" style={{ marginTop: 10, maxWidth: 360 }}><i style={{ width: `${data.connected.total ? Math.round((data.connected.n / data.connected.total) * 100) : 0}%` }} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {data.connected.next && <ActButton act={{ ...data.connected.next, primary: false }} />}
            <button className="ax-btn grad" type="button" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</button>
          </div>
        </section>
      ) : (
      <section className="ax-card ax-hero">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div className="ax-eb" style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="ax-dot" />{data.firstName ? `${data.firstName}, your briefing` : "Your briefing"} · last 30 days</div>
            {h.total != null ? (
              <>
                <div style={{ display: "flex", gap: 14, alignItems: "baseline", marginTop: 12, flexWrap: "wrap" }}>
                  <span className="ax-big">{h.total.toLocaleString("en-US")}</span>
                  {h.prev != null && <span className={`ax-pill ${h.total >= h.prev ? "g" : "n"}`}>{h.total >= h.prev ? "+" : "−"}{Math.abs(h.total - h.prev)} vs the 30 days before</span>}
                </div>
                <p className="ax-sub" style={{ marginTop: 6 }}>{h.parts.map((p) => `${p.value.toLocaleString("en-US")} ${p.label.charAt(0).toLowerCase()}${p.label.slice(1)}`).join(" · ")}.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.03em", marginTop: 12 }}>Calls and leads show up here</div>
                <p className="ax-sub" style={{ marginTop: 6 }}>{h.missing[0] ?? "Once a source is connected, I count every call and lead."}</p>
              </>
            )}
          </div>
          {data.recapReady ? <button className="ax-btn grad" type="button" onClick={() => setRecap(0)}>▶ Play the recap</button> : <button className="ax-btn grad" type="button" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</button>}
        </div>
        {h.total != null && h.missing.length > 0 && <p className="ax-note" style={{ marginTop: 8 }}>{h.missing.join(" ")}</p>}
        <div className="ax-g3" style={{ marginTop: 22 }}>
          {data.tiles.map((t) => (
            <div className="ax-tile" key={t.key}>
              <div className="k">{t.label}</div>
              {t.value ? (
                <div className="v"><b>{t.value}</b>{t.delta && <span className={t.delta.startsWith("-") ? "ax-down" : "ax-up"}>{t.delta}</span>}</div>
              ) : (
                <div className="e">{t.href ? <a className="ax-src" href={t.href}>{t.empty}</a> : t.empty}</div>
              )}
            </div>
          ))}
        </div>
      </section>
      )}

      <div className="ax-h2">
        <div><h2>Going out soon</h2><p>{data.autopilot ? "These go out on their own. Stop anything before it goes out." : "Scheduled to go out. Stop anything before it goes out."}</p></div>
        <span style={{ display: "flex", gap: 10, alignItems: "center", flex: "none" }}>
          {data.going.length > 0 && <span className="ax-pill b">{data.going.filter((g) => !stopped[g.id]).length} scheduled</span>}
          <Link className="ax-lnk" href="/dashboard/social/calendar">See the calendar →</Link>
        </span>
      </div>
      {data.going.length ? (
        <div className="ax-g3 ax-going">
          {data.going.map((g) => {
            const st = !!stopped[g.id]
            return (
              <article key={g.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                <div className={`ax-art${g.image ? " img" : ""}`} style={{ background: g.image ? `url("${g.image}") center/cover` : g.art }}>
                  <span className="ax-pill w" style={{ alignSelf: "flex-start" }}>{g.lane}</span>
                  {!g.image && <div><b>{g.big}</b>{g.small && <small>{g.small}</small>}</div>}
                </div>
                <div className="ax-cb">
                  <p className={`ax-ttl${st ? " st" : ""}`}>{edited[g.id] ?? g.title}</p>
                  <p className="ax-p ax-clamp">{g.text}</p>
                  <div className="ax-ft">
                    <span style={{ fontSize: 12.5, color: "var(--x-mut)" }}>{st ? "Stopped · won’t go out" : <When at={g.at} mode="ahead" prefix="Goes out " fallback={`Goes out ${g.when}`} />}</span>
                    <span style={{ display: "flex", gap: 4 }}>
                      {g.kind === "site" && <button className="ax-btn s sm" type="button" onClick={() => setEditDraft(g.id)}>Edit</button>}
                      <button className="ax-btn s sm" type="button" onClick={() => open({ eb: g.lane, title: g.title, rows: [{ k: "Goes out", v: st ? "Stopped. It won’t go out." : g.when }, ...(g.image ? [{ k: "Image", v: "", image: g.image }] : []), { k: "Text", v: g.text, box: true }], cta: { label: "Open it in chat", topic: g.kind === "social" ? "social" : "content" } })}>Preview</button>
                      <button className={`ax-btn d sm${st ? " undo" : ""}`} type="button" disabled={busy === g.id} onClick={() => void hold(g)}>{st ? "Undo" : "Stop"}</button>
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : data.plan ? (
        <section className="ax-card ax-plan">
          {data.plan.running ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="ax-dot" /><span><b>I’m planning this week now.</b> <span className="ax-p" style={{ display: "inline" }}>Real posts and pages show up here in a few minutes.</span></span></div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div><div className="ax-eb">This week’s plan</div><div style={{ fontSize: 16, fontWeight: 650, marginTop: 4 }}>{data.plan.summary || "This week’s plan"}</div></div>
                {!data.autopilot && data.plan.needsOk > 0 && !planDone && <button className="ax-btn p" type="button" disabled={planBusy} onClick={() => void approvePlan()}>{planBusy ? "Approving…" : "Approve this week’s plan"}</button>}
                {(data.autopilot || planDone) && <span className="ax-pill g">{planDone ? "Approved · going out on schedule" : "Goes out on its own · stop any item from here"}</span>}
              </div>
              <div className="ax-list" style={{ marginTop: 10 }}>
                {data.plan.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", opacity: 0.92 }}>
                    <span className="ax-pill n" style={{ width: 84, justifyContent: "center" }}>{it.kind === "blog" ? "Page" : it.kind === "google" ? "Google" : "Social"}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{it.title}</span>
                    <span className="ax-t11">{it.day}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <Empty
          title="Nothing scheduled right now"
          text={data.waiting ? `${data.waiting} finished piece${data.waiting === 1 ? " is" : "s are"} waiting for your OK${data.autopilot ? "" : " because autopilot is off"}.` : "Ask me to run your marketing for the week and I’ll plan, write and schedule it."}
        />
      )}
      {!data.going.length && !data.plan && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</button>
          {data.waiting > 0 && <button className="ax-btn s sm" type="button" onClick={() => askAlphaa({ topic: data.waitingTopic, label: "What’s waiting?" })}>See what’s waiting</button>}
        </div>
      )}

      <p className="ax-note" role="note">{AI_NOTE}</p>

      <div className="ax-h2"><div><h2>Done on my own</h2><p>Last 7 days</p></div></div>
      {data.done.length ? (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
          {data.done.map((d, i) => (
            <div key={i} className="ax-done">
              <span className="ax-dot still" />
              <span className="ax-pill n ch">{d.ch}</span>
              <span className="tx">{d.text}</span>
              <span className="wh"><When at={d.at || null} mode="ago" fallback={d.when} /></span>
              {d.href ? <a className="ax-lnk" href={d.href} target="_blank" rel="noopener noreferrer">See it ↗</a> : <button className="ax-lnk" type="button" onClick={() => askAlphaa({ topic: "work", label: "What have you done?" })}>Details</button>}
            </div>
          ))}
        </section>
      ) : (
        <Empty title="Nothing logged this week yet" text="Every post, reply, fix and check I do shows up here with a link to see it." />
      )}

      {slide && (
        <>
          <div className="ax-bk" onClick={() => setRecap(null)} aria-hidden="true" />
          <div className="ax-recap" role="dialog" aria-modal="true" aria-label="Recap" style={{ background: slide.bg }}>
            <div style={{ display: "flex", gap: 6 }} aria-hidden="true">{slides.map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= (recap ?? 0) ? "#fff" : "rgba(255,255,255,.35)" }} />)}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.8 }}>{slide.eb}</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.05, marginTop: 8 }}>{slide.big}</div>
              {slide.small && <div style={{ fontSize: 17, opacity: 0.9, marginTop: 10 }}>{slide.small}</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="ax-btn" type="button" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }} onClick={() => setRecap(null)}>Close</button>
              <button className="ax-btn" type="button" style={{ background: "#fff", color: "#1d1d1f" }} onClick={() => setRecap((r) => (r == null || r >= slides.length - 1 ? null : r + 1))}>{(recap ?? 0) >= slides.length - 1 ? "Done" : "Next"}</button>
            </div>
          </div>
        </>
      )}
      {node}
      {editDraft && <DraftEditor draftId={editDraft} onClose={(d) => { if (d) setEdited((e) => ({ ...e, [d.draftId]: d.title })); setEditDraft(null) }} />}
    </>
  )
}

const MARK_BG: Record<string, string> = { chatgpt: "#0f0f0f", claude: "linear-gradient(135deg,#d97757,#b85c3c)", perplexity: "linear-gradient(135deg,#1f6f7a,#20808d)", gemini: "linear-gradient(135deg,#4f6bed,#9b72cb)" }

/** What the four AI assistants tell customers: one card each, from the stored checks. */
function AiRow({ cards, open, pages }: { cards: AiCard[]; open: (i: Insp | null) => void; pages: number }) {
  if (!cards.length) return null
  const checked = cards.filter((c) => c.state !== "unknown")
  const missing = cards.filter((c) => c.state === "no").map((c) => c.name)
  const line = !checked.length
    ? "I haven’t asked them yet. My first check runs this week."
    : missing.length
      ? `${missing.join(", ").replace(/, ([^,]*)$/, " and $1")} ${missing.length === 1 ? "doesn’t" : "don’t"} name you yet. I’m working on it: pages that answer these questions.`
      : checked.length === cards.length ? "All four name you. I check again every week." : "I check them again every week."
  return (
    <section style={{ marginBottom: 22 }}>
      <div className="ax-h2" style={{ marginTop: 0 }}><div><h2>What AI tells your customers</h2><p>How each assistant answers when customers look for you.</p></div></div>
      <div className="ax-ai">
        {cards.map((c) => (
          <article key={c.engine} className="ax-card ax-aicard">
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="ax-mark" style={{ background: MARK_BG[c.engine] }} aria-hidden="true"><EngineIcon engine={c.engine} /></span>
                <b style={{ fontSize: 14.5 }}>{c.name}</b>
              </span>
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                {c.state === "yes" && c.tone && <span className={`ax-pill ${c.tone === "positive" ? "g" : c.tone === "negative" ? "a" : "n"}`} title={c.toneQuote ? `“${c.toneQuote}”` : undefined}>{c.tone === "positive" ? "Positive" : c.tone === "negative" ? "Negative" : c.tone === "mixed" ? "Mixed" : "Neutral"}</span>}
                {c.state !== "unknown" && <span className={`ax-pill ${c.state === "yes" ? "g" : "n"}`}>{c.state === "yes" ? "Names you" : "Not yet"}</span>}
              </span>
            </div>
            {c.state === "unknown" ? (
              <p className="ax-p" style={{ marginTop: 4 }}>Not checked yet · I’ll check this week.</p>
            ) : (
              <>
                {c.question && <p className="ax-p" style={{ color: "var(--x-ink)" }}>“{c.question}”</p>}
                {c.names.length > 0 && (
                  <div>
                    <div className="ax-t11" style={{ marginBottom: 4 }}>{c.state === "yes" ? "Also named" : "Named instead of you"}{c.namesFrom === "weekly" ? <span style={{ color: "var(--x-ter)" }}> · my weekly questions</span> : null}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{c.names.map((n) => <span key={n} className="ax-chip">{n}</span>)}</div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginTop: "auto", paddingTop: 6, flexWrap: "wrap" }}>
                  <span className="ax-t11" style={{ whiteSpace: "nowrap" }}>{c.at ? <When at={c.at} mode="ago" prefix="asked " fallback="" /> : ""}</span>
                  <span style={{ display: "inline-flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  {c.citedPages ? <Link className="ax-lnk" href={`/dashboard/citations#${c.engine}`} style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>Cited sources ({c.citedPages})</Link> : null}
                  {c.answer && <button className="ax-lnk" type="button" style={{ fontSize: 12.5, whiteSpace: "nowrap" }} onClick={() => open({ eb: `${c.name} · ${c.state === "yes" ? "names you" : "doesn’t name you yet"}`, title: c.questionFull ?? "The answer", rows: [{ k: "What it answered", v: c.answer ?? "", box: true }, ...(c.names.length ? [{ k: c.state === "yes" ? "Also named" : "Named instead", v: c.names.join(", ") }] : [])], cta: { label: "See every question", topic: "answers" } })}>See the answer</button>}
                  </span>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <span className="ax-dot" />
        <span style={{ fontSize: 13.5, color: "var(--x-mut)", flex: 1, minWidth: 220 }}>{line}</span>
        {pages > 0
          ? <button className="ax-btn s sm" type="button" onClick={() => askAlphaa({ topic: "content", label: "My pages in progress" })}>See {pages} page{pages === 1 ? "" : "s"} in progress →</button>
          : <button className="ax-btn s sm" type="button" onClick={() => askAlphaa({ topic: "insights", label: "What’s your plan?" })}>See my plan →</button>}
      </div>
    </section>
  )
}
