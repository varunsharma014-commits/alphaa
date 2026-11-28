"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { EngineIcon } from "./EngineIcon"
import type { BriefingData, DoneItem, GoingItem, PlanItem } from "@/lib/workspace/briefing"
import type { AiCard } from "@/lib/workspace/ai-cards"
import { AI_NOTE, askAlphaa, toast } from "@/lib/workspace/events"
import type { Message } from "@/lib/agent/types"
import {
  ActButton, Button, ChannelMark, EmptyState, Glyph, List, ListRow, PageHeader, Pill, RowIcon, SectionHeader, StatRow, StatTile, Timeline, When,
  useInspector, type Activity, type Channel, type Insp,
} from "./ui"
import { PlanRow } from "./PlanRow"
import { ChecklistStep, StepDots } from "./ChecklistStep"
import { useCan } from "./role"
import "./briefing.css"

// Scheduled website posts open in the saved editor; the saved text is what the cron publishes.
const DraftEditor = dynamic(() => import("@/components/editor/DraftEditor").then((m) => m.DraftEditor), { ssr: false })

type Slide = { eb: string; big: string; small: string; bg: string }

const SKIP_KEY = "alphaa.ws.skipQ"
const PLAN_CHANNEL: Record<PlanItem["kind"], { channels: Channel[]; label: string }> = {
  blog: { channels: ["web"], label: "Website page" },
  google: { channels: ["google"], label: "Google listing" },
  social: { channels: [], label: "Social post" },
}

/** "Good morning" in the viewer's own clock (set after mount, so the server never guesses). */
function useGreeting() {
  const [g, setG] = useState<string | null>(null)
  useEffect(() => { const h = new Date().getHours(); setG(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") }, [])
  return g
}

/** Group done items by local day: "Today", "Yesterday", "Fri, Nov 27". */
function byDay(items: DoneItem[]): { day: string; items: DoneItem[] }[] {
  const out: { day: string; items: DoneItem[] }[] = []
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const now = new Date()
  const yest = new Date(now.getTime() - 86_400_000)
  for (const it of items) {
    const d = new Date(it.at)
    const label = key(d) === key(now) ? "Today" : key(d) === key(yest) ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    const last = out[out.length - 1]
    if (last && last.day === label) last.items.push(it)
    else out.push({ day: label, items: [it] })
  }
  return out
}

export function BriefingView({ data, notice }: { data: BriefingData; notice?: Message | null }) {
  const { node, open } = useInspector()
  const greet = useGreeting()
  const [stopped, setStopped] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<string | null>(null)
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<string | null>(null)
  const [recap, setRecap] = useState<number | null>(null)
  const [planBusy, setPlanBusy] = useState(false)
  const [planDone, setPlanDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Teams (lib/team): reviewers and up may stop an item; only publishers put it back or approve the plan.
  const canStop = useCan("review")
  const canPublish = useCan("publish")
  const [teamDone, setTeamDone] = useState<Record<string, string>>({})
  useEffect(() => setMounted(true), [])

  async function teamGo(it: NonNullable<BriefingData["team"]>[number]) {
    setBusy(`t:${it.id}`)
    const res = it.kind === "social"
      ? await fetch("/api/workspace/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "social", id: it.id, window: false }) }).catch(() => null)
      : await fetch("/api/agent/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: it.kind === "site" ? "post" : it.kind, id: it.id }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; review?: string; message?: string } | null
    setBusy(null)
    if (!res?.ok) return toast(d?.error ?? "That didn’t go through. Nothing changed.")
    setTeamDone((x) => ({ ...x, [it.id]: d?.review ? "Approved, waiting for a publisher" : "Done" }))
    toast(d?.review ? "Approved" : "Done")
  }
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

  // One real line under the greeting: the headline number, else what's moving this week.
  const goingLive = data.going.filter((g) => !stopped[g.id]).length
  const sub = h.total != null
    ? `${h.total.toLocaleString("en-US")} calls and leads in the last 30 days.`
    : [goingLive ? `${goingLive} going out soon` : null, data.done.length ? `${data.done.length} thing${data.done.length === 1 ? "" : "s"} I did this week` : null].filter(Boolean).join(" · ") || "Here’s where your marketing stands today."
  const title = `${greet ?? "Hello"}${data.firstName ? `, ${data.firstName}` : ""}`

  const teamItems = data.team ?? []
  const alerts = data.siteAlerts ?? []
  const needs = !!q || alerts.length > 0 || teamItems.length > 0
  const setupMode = h.total == null && data.tiles.filter((t) => !t.value).length >= 2

  return (
    <>
      <PageHeader
        title={<span suppressHydrationWarning>{title}</span>}
        sub={sub}
        pill={h.total != null && h.prev != null ? <Pill tone={h.total >= h.prev ? "ok" : "idle"}>{h.total >= h.prev ? "+" : "−"}{Math.abs(h.total - h.prev)} vs the 30 days before</Pill> : null}
        actions={
          <>
            {data.recapReady && <Button onClick={() => setRecap(0)} icon={<span aria-hidden="true">▶</span>}>Play the recap</Button>}
            <Button variant="grad" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</Button>
          </>
        }
      />

      {needs && (
        <>
          <SectionHeader title="Needs you" sub={q ? "One thing at a time. I keep working on everything else." : "These wait for you."} />
          <div className="xb-needs">
            {q && (
              <section className="ax-card xb-q" aria-label="One question for you">
                <div className="xb-q__b">
                  {q.step ? <StepDots n={q.step.n} total={q.step.total} label={q.eyebrow} /> : <span className="ax-eb">{q.eyebrow}</span>}
                  <p className="xb-q__t">{q.title}</p>
                  <p className="xb-q__s">{q.text} <b>{q.fallback}</b></p>
                </div>
                <div className="xb-q__a">
                  <Button onClick={() => { setSkipped(q.id); try { sessionStorage.setItem(SKIP_KEY, q.id) } catch {}; toast("Okay. I’ll keep going without it.") }}>Not now</Button>
                  {q.review
                    ? <Button variant="primary" onClick={() => open({ eb: `${q.review!.ai} · a fact to check`, title: "Review & fix", rows: [{ k: `What ${q.review!.ai} tells customers`, v: `“${q.review!.claim}”`, box: true }, { k: "What your website says", v: q.review!.truth, box: true }, { k: "What I do when you confirm", v: "I write a short correction for your site in your voice. You see it before it goes live, and I check the AI answer again next week." }], cta: { label: "Confirm & write the correction", chip: q.review!.fix } })}>Review & fix</Button>
                    : q.acts.slice().reverse().map((a, i) => <ActButton key={i} act={a} />)}
                </div>
              </section>
            )}
            {alerts.length > 0 && (
              <List card label="Your website needs a look">
                {alerts.map((a, i) => (
                  <ListRow key={i} lead={<RowIcon><Glyph name="globe" size={18} /></RowIcon>} title={a.text} meta="Your website · from my weekly check" href={a.href} end={<Pill tone="warn">Needs a look</Pill>} wrapEnd />
                ))}
              </List>
            )}
            {teamItems.length > 0 && (
              <List card label="Waiting for review">
                {teamItems.map((it) => {
                  const doneText = teamDone[it.id]
                  const can = canPublish || (canStop && it.state === "submitted")
                  return (
                    <ListRow
                      key={`${it.kind}:${it.id}`}
                      lead={<RowIcon><Glyph name="inbox" size={18} /></RowIcon>}
                      title={it.title}
                      meta={doneText ?? it.label}
                      wrapEnd
                      end={!doneText && can ? (
                        <Button variant="primary" size="sm" loading={busy === `t:${it.id}`} onClick={() => void teamGo(it)}>
                          {canPublish ? (it.kind === "social" ? "Approve & schedule" : "Approve & publish") : "Approve"}
                        </Button>
                      ) : doneText ? <Pill tone="ok">{doneText}</Pill> : null}
                    />
                  )
                })}
              </List>
            )}
          </div>
        </>
      )}

      <AiRow cards={data.ai} open={open} pages={data.pagesInProgress} />

      <SectionHeader title="Calls and leads" sub={h.total != null ? "Last 30 days, from every source that’s connected." : "Every call and lead I can count, once its source is connected."} />
      {setupMode ? (
        <section className="ax-card xb-num">
          <div className="xb-setup">
            <div>
              <h3>{data.connected.n} of {data.connected.total} connected</h3>
              <p>{h.missing[0] ?? "Each one you connect adds its calls and leads here."}</p>
            </div>
            <div className="xb-checks" role="list" aria-label="Connections">
              {(data.connected.steps ?? []).map((s) => (
                <ChecklistStep key={s.key} done={s.ok} label={s.label} hint={s.ok ? "Connected" : undefined} action={!s.ok && data.connected.next?.label === s.act.label ? <ActButton act={{ ...s.act, primary: false }} small /> : null} />
              ))}
            </div>
          </div>
          {data.tiles.some((t) => t.value) && (
            <StatRow>{data.tiles.filter((t) => t.value).map((t) => <Tile key={t.key} t={t} />)}</StatRow>
          )}
        </section>
      ) : (
        <section className="ax-card xb-num">
          <div className="xb-num__top">
            <div>
              {h.total != null ? (
                <>
                  <div className="xb-big">{h.total.toLocaleString("en-US")}</div>
                  <div className="xb-num__l">{h.parts.map((p) => `${p.value.toLocaleString("en-US")} ${p.label.charAt(0).toLowerCase()}${p.label.slice(1)}`).join(" · ")}</div>
                </>
              ) : (
                <>
                  <div className="xb-num__l" style={{ marginTop: 0 }}>{h.missing[0] ?? "Once a source is connected, I count every call and lead."}</div>
                </>
              )}
            </div>
            {data.connected.next && h.total == null && <ActButton act={{ ...data.connected.next, primary: false }} small />}
          </div>
          {h.total != null && h.missing.length > 0 && <p className="ax-note" style={{ margin: 0 }}>{h.missing.join(" ")}</p>}
          {data.tiles.length > 0 && (
            <StatRow>
              {data.tiles.map((t) => <Tile key={t.key} t={t} />)}
            </StatRow>
          )}
        </section>
      )}

      <SectionHeader
        title="Going out soon"
        sub={data.autopilot ? "These go out on their own. Stop anything before it goes out." : "Scheduled to go out. Stop anything before it goes out."}
        end={<>{data.going.length > 0 && <Pill tone="info">{goingLive} scheduled</Pill>}<Link className="ax-lnk" href="/dashboard/social/calendar">See the calendar</Link></>}
      />
      {data.going.length ? (
        <List card label="Going out soon">
          {data.going.map((g) => {
            const st = !!stopped[g.id]
            const preview = () => open({ eb: g.lane, title: g.title, rows: [{ k: "Goes out", v: st ? "Stopped. It won’t go out." : g.when }, ...(g.image ? [{ k: "Image", v: "", image: g.image }] : []), { k: "Text", v: g.text, box: true }], cta: { label: "Open it in chat", topic: g.kind === "social" ? "social" : "content" } })
            return (
              <PlanRow
                key={g.id}
                channels={g.channels}
                label={g.lane}
                image={g.image}
                title={edited[g.id] ?? g.title}
                stopped={st}
                when={st ? "Stopped, won’t go out" : <When at={g.at} mode="ahead" prefix="Goes out " fallback={`Goes out ${g.when}`} />}
                onOpen={preview}
                actions={
                  <>
                    {g.kind === "site" && <Button size="sm" onClick={() => setEditDraft(g.id)}>Edit</Button>}
                    {(st ? canPublish : canStop) && <Button size="sm" variant={st ? "undo" : "ghost"} loading={busy === g.id} onClick={() => void hold(g)}>{st ? "Undo" : "Stop"}</Button>}
                  </>
                }
              />
            )
          })}
        </List>
      ) : data.plan ? (
        <section className="ax-card xb-plan" aria-label="This week’s plan">
          {data.plan.running ? (
            <div className="xb-running"><span className="ax-dot" /><span><b>I’m planning this week now.</b> Real posts and pages show up here in a few minutes.</span></div>
          ) : (
            <>
              <div className="xb-plan__h">
                <div><span className="ax-eb">This week’s plan</span><b>{data.plan.summary || "This week’s plan"}</b></div>
                {!data.autopilot && data.plan.needsOk > 0 && !planDone && canPublish && <Button variant="primary" loading={planBusy} onClick={() => void approvePlan()}>Approve this week’s plan</Button>}
                {(data.autopilot || planDone) && <Pill tone="ok" dot>{planDone ? "Approved, going out on schedule" : "Goes out on its own"}</Pill>}
              </div>
              <List label="This week’s plan">
                {data.plan.items.map((it, i) => {
                  const c = PLAN_CHANNEL[it.kind]
                  return <PlanRow key={i} channels={c.channels} label={c.label} title={it.title} when={it.day} actions={it.needsOk && !planDone && data.plan!.needsOk < data.plan!.items.length ? <Pill tone="idle">Waiting for your OK</Pill> : null} />
                })}
              </List>
            </>
          )}
        </section>
      ) : (
        <EmptyState
          icon={<Glyph name="clock" size={22} />}
          title="Nothing scheduled right now"
          text={data.waiting ? `${data.waiting} finished piece${data.waiting === 1 ? " is" : "s are"} waiting for your OK${data.autopilot ? "" : " because Autopilot is off"}.` : "Ask me to run your week and I’ll plan, write and schedule it."}
          bullets={["Each post and page shows here with its day and time", "Stop any of them before it goes out"]}
          actions={
            <>
              <Button variant="primary" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</Button>
              {data.waiting > 0 && <Button onClick={() => askAlphaa({ topic: data.waitingTopic, label: "What’s waiting?" })}>See what’s waiting</Button>}
            </>
          }
        />
      )}
      <p className="ax-note" role="note">{AI_NOTE}</p>

      <SectionHeader title="Done on my own" sub="The last 7 days. Open any of them to see it." />
      {data.done.length ? (
        <section className="ax-card xb-done" aria-label="Done on my own">
          {mounted ? (
            <Timeline groups={byDay(data.done).map((g) => ({ day: g.day, items: g.items.map((d): Activity => ({
              id: d.id,
              icon: d.channel ? <ChannelMark channel={d.channel} size={18} /> : <Glyph name="spark" size={14} />,
              title: d.text,
              why: <>{d.kind}{d.at ? ` · ${new Date(d.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}</>,
              end: d.href
                ? <Button size="sm" href={d.href} external>See it ↗</Button>
                : d.draftId ? <Button size="sm" onClick={() => setEditDraft(d.draftId!)}>Open</Button>
                  : d.open ? <Button size="sm" href={d.open}>Open</Button>
                    : <Button size="sm" onClick={() => askAlphaa({ topic: "work", label: "What have you done?" })}>Details</Button>,
            })) }))} />
          ) : null}
        </section>
      ) : (
        <EmptyState icon={<Glyph name="spark" size={22} />} title="Nothing logged this week yet" text="Every post, reply, fix and check I do shows up here with a link to it." />
      )}

      {slide && (
        <>
          <div className="ax-bk" onClick={() => setRecap(null)} aria-hidden="true" />
          <div className="ax-recap" role="dialog" aria-modal="true" aria-label="Recap" style={{ background: slide.bg }}>
            <div style={{ display: "flex", gap: 6 }} aria-hidden="true">{slides.map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= (recap ?? 0) ? "#fff" : "rgba(255,255,255,.35)" }} />)}</div>
            <div>
              <div style={{ fontSize: "var(--x-fs-sm)", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.8 }}>{slide.eb}</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.05, marginTop: 8 }}>{slide.big}</div>
              {slide.small && <div style={{ fontSize: "var(--x-fs-lg)", opacity: 0.9, marginTop: 10 }}>{slide.small}</div>}
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

/** A briefing number: a "+12%" delta becomes an arrow, anything else ("3 new reviews") a hint. */
function Tile({ t }: { t: BriefingData["tiles"][number] }) {
  const signed = !!t.value && !!t.delta && /^[+-]\d/.test(t.delta)
  return (
    <StatTile
      label={t.label}
      value={t.value}
      soft
      delta={signed ? { text: t.delta!.slice(1), dir: t.delta!.startsWith("-") ? "down" : "up" } : null}
      hint={t.value ? (!signed && t.delta ? t.delta : null) : t.href ? <a className="ax-lnk" href={t.href}>{t.empty}</a> : t.empty}
      empty="Not connected yet"
    />
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
      ? `${missing.join(", ").replace(/, ([^,]*)$/, " and $1")} ${missing.length === 1 ? "doesn’t" : "don’t"} name you yet. I’m writing pages that answer these questions.`
      : checked.length === cards.length ? "All four name you. I check again every week." : "I check them again every week."
  return (
    <section>
      <SectionHeader title="What AI tells your customers" sub="How each assistant answers when customers look for you." />
      <div className="ax-ai">
        {cards.map((c) => (
          <article key={c.engine} className="ax-card ax-aicard">
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="ax-mark" style={{ background: MARK_BG[c.engine] }} aria-hidden="true"><EngineIcon engine={c.engine} /></span>
                <b style={{ fontSize: "var(--x-fs-md)" }}>{c.name}</b>
              </span>
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                {c.state === "yes" && c.tone && <Pill tone={c.tone === "positive" ? "ok" : c.tone === "negative" ? "warn" : "idle"} title={c.toneQuote ? `“${c.toneQuote}”` : undefined}>{c.tone === "positive" ? "Positive" : c.tone === "negative" ? "Negative" : c.tone === "mixed" ? "Mixed" : "Neutral"}</Pill>}
                {c.state !== "unknown" && <Pill tone={c.state === "yes" ? "ok" : "idle"} dot>{c.state === "yes" ? "Names you" : "Not yet"}</Pill>}
              </span>
            </div>
            {c.state === "unknown" ? (
              <p className="ax-p" style={{ marginTop: 4 }}>Not checked yet. I’ll check this week.</p>
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
                    {c.citedPages ? <Link className="ax-lnk" href={`/dashboard/citations#${c.engine}`}>Cited sources ({c.citedPages})</Link> : null}
                    {c.answer && <button className="ax-lnk" type="button" onClick={() => open({ eb: `${c.name} · ${c.state === "yes" ? "names you" : "doesn’t name you yet"}`, title: c.questionFull ?? "The answer", rows: [{ k: "What it answered", v: c.answer ?? "", box: true }, ...(c.names.length ? [{ k: c.state === "yes" ? "Also named" : "Named instead", v: c.names.join(", ") }] : [])], cta: { label: "See every question", topic: "answers" } })}>See the answer</button>}
                  </span>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
      <div className="xb-ailine">
        <span className={`ax-dot${missing.length ? "" : " still"}`} />
        <span className="t">{line}</span>
        {pages > 0
          ? <Button size="sm" onClick={() => askAlphaa({ topic: "content", label: "My pages in progress" })}>See {pages} page{pages === 1 ? "" : "s"} in progress</Button>
          : <Button size="sm" onClick={() => askAlphaa({ topic: "insights", label: "What’s your plan?" })}>See my plan</Button>}
      </div>
    </section>
  )
}
