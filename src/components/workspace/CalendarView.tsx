"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { CalItem, CalKind } from "@/lib/calendar/items"
import { bestFor, CHANNEL_NAME, nextSlots, timeOnDay, type Best, type Channel } from "@/lib/calendar/best-time"
import { addDays, DAY_SHORT, dateKey, dowOfKey, hourLabel, isValidTz, parseKey, tzLabel, whenLabel, zonedParts, zonedToUtc } from "@/lib/calendar/tz"
import { AI_NOTE, toast } from "@/lib/workspace/events"

// Content calendar (Social Studio → Calendar). Month and week grids, an agenda on phones, every
// scheduled and published item across social (per platform), Google listing, website and email,
// coloured by channel. Drag an item to another day/hour (mouse, pen, or long-press on touch), or
// open it and pick a date/time (the keyboard way). Times are in the owner's own zone; the server
// stores UTC and applies the rules (lib/calendar/rules.ts): past times refused, the Autopilot stop
// window needs an explicit OK to cut short, a move is the OK when Autopilot is off.

export type CalData = { tz: string; tzSaved: boolean; auto: boolean; pro: boolean; items: CalItem[]; best: Partial<Record<Channel, Best>> }
type MoveRes = { ok: true; at: string; approved: boolean } | { ok: false; error: string; needsOk?: boolean; earliest?: string | null }
export type CalApi = {
  load: (from: string, to: string, tz: string) => Promise<CalData>
  move: (it: CalItem, at: string, confirm: boolean) => Promise<MoveRes>
  stop: (it: CalItem) => Promise<{ ok: boolean; error?: string }>
  saveTz: (tz: string) => Promise<boolean>
}

const jpost = async (url: string, body: unknown) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
  const d = (await r?.json().catch(() => null)) as Record<string, unknown> | null
  return { ok: !!r?.ok, d: d ?? {} }
}
const liveApi: CalApi = {
  async load(from, to, tz) {
    const r = await fetch(`/api/workspace/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&tz=${encodeURIComponent(tz)}`, { cache: "no-store" })
    if (!r.ok) throw new Error("load")
    return r.json()
  },
  async move(it, at, confirm) {
    const { ok, d } = await jpost("/api/workspace/calendar", { op: "move", kind: it.kind, id: it.id, at, confirm })
    return ok ? (d as MoveRes) : { ok: false, error: String(d.error ?? "That didn’t save. Try again."), needsOk: !!d.needsOk, earliest: (d.earliest as string | null) ?? null }
  },
  async stop(it) {
    const { ok, d } = await jpost("/api/workspace/hold", { kind: it.kind, id: it.id, op: "stop" })
    return { ok, error: d.error as string | undefined }
  },
  async saveTz(tz) { return (await jpost("/api/workspace/calendar", { op: "tz", tz })).ok },
}

/** The workspace palette's service tones (brand/color/README.md). */
const TONE: Record<"social" | "google" | "site" | "email", { ink: string; tint: string; soft: string; name: string }> = {
  social: { ink: "#e8457a", tint: "#fff0f4", soft: "#ffd6e2", name: "Social" },
  google: { ink: "#1f9d55", tint: "#effaf3", soft: "#c9efd8", name: "Google listing" },
  site: { ink: "#b07a00", tint: "#fffaeb", soft: "#ffedb3", name: "Website" },
  email: { ink: "#7a4fd6", tint: "#f5f0ff", soft: "#e1d4ff", name: "Email" },
}
const toneOf = (k: CalKind) => TONE[k === "gbp" ? "google" : k]
const ABBR: Partial<Record<Channel, string>> = { facebook: "FB", instagram: "IG", linkedin: "in", tiktok: "TT", x: "X" }
const STATUS: Record<CalItem["status"], string> = { scheduled: "Scheduled", planned: "Planned · waiting for your OK", draft: "Waiting for a time", published: "Published", failed: "Didn’t go out", sending: "Going out now" }
const FILTERS = [{ k: "all", label: "All" }, { k: "social", label: "Social" }, { k: "google", label: "Google listing" }, { k: "site", label: "Website" }, { k: "email", label: "Email" }] as const
type Filter = (typeof FILTERS)[number]["k"]
type View = "month" | "week" | "agenda"
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM - 10 PM rows in the week grid
const browserTz = () => { try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; return isValidTz(z) ? z : "UTC" } catch { return "UTC" } }
const mondayOf = (key: string) => addDays(key, -((dowOfKey(key) + 6) % 7))
const monthTitle = (key: string) => { const { y, m } = parseKey(key); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) }
const dayTitle = (key: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" }) => { const { y, m, d } = parseKey(key); return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" }) }

export function CalendarView({ api = liveApi, initial }: { api?: CalApi; initial?: CalData }) {
  const [tz, setTz] = useState<string>(initial?.tz ?? "UTC")
  const [data, setData] = useState<CalData | null>(initial ?? null)
  const [view, setView] = useState<View>("month")
  const [anchor, setAnchor] = useState(() => dateKey(Date.now(), initial?.tz ?? browserTz()))
  const [filter, setFilter] = useState<Filter>("all")
  const [open, setOpen] = useState<CalItem | null>(null)
  const [ask, setAsk] = useState<{ it: CalItem; at: string; message: string; earliest: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [tick, setTick] = useState(0)
  const today = dateKey(Date.now(), tz)

  // Phones get the agenda; remember the owner's last choice on bigger screens.
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 720px)").matches
    let saved: string | null = null
    try { saved = window.localStorage.getItem("alphaa.cal.view") } catch { /* private mode */ }
    if (narrow) setView("agenda")
    else if (saved === "week" || saved === "month" || saved === "agenda") setView(saved)
  }, [])
  const pickView = (v: View) => { setView(v); try { window.localStorage.setItem("alphaa.cal.view", v) } catch { /* ignore */ } }

  const range = useMemo(() => {
    if (view === "month") { const first = `${anchor.slice(0, 8)}01`; const start = mondayOf(first); return { start, days: 42 } }
    if (view === "week") return { start: mondayOf(anchor), days: 7 }
    return { start: anchor < today ? mondayOf(anchor) : today, days: 28 }
  }, [view, anchor, today])
  const days = useMemo(() => Array.from({ length: range.days }, (_, i) => addDays(range.start, i)), [range])

  const load = useCallback(async () => {
    const z = data?.tz ?? tz
    const { y, m, d } = parseKey(range.start)
    const end = parseKey(addDays(range.start, range.days))
    const from = zonedToUtc({ y, m, d, h: 0 }, z).toISOString()
    const to = zonedToUtc({ y: end.y, m: end.m, d: end.d, h: 0 }, z).toISOString()
    try {
      const res = await api.load(from, to, browserTz())
      setFailed(false)
      setData(res)
      if (res.tz !== tz) setTz(res.tz)
      // First visit: save the browser's zone as the owner's (they can change it below).
      if (!res.tzSaved) {
        const b = browserTz()
        if (b !== "UTC" && (await api.saveTz(b))) { setTz(b); setTick((t) => t + 1) }
      }
    } catch { setFailed(true) }
  }, [api, range, tz, data?.tz])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [range.start, range.days, tz, tick])

  const items = useMemo(() => (data?.items ?? []).filter((it) => filter === "all" || (filter === "social" ? it.kind === "social" : filter === "google" ? it.kind === "gbp" : it.kind === filter)), [data, filter])
  const byDay = useMemo(() => {
    const m = new Map<string, CalItem[]>()
    for (const it of items) { if (!it.at) continue; const k = dateKey(Date.parse(it.at), tz); m.set(k, [...(m.get(k) ?? []), it]) }
    for (const list of m.values()) list.sort((a, b) => Date.parse(a.at!) - Date.parse(b.at!))
    return m
  }, [items, tz])
  const waiting = items.filter((it) => !it.at)
  const times = useMemo(() => ({ at: "", tz, channels: data?.best ?? {} }), [data, tz])
  const bestOf = (it: CalItem) => bestFor(times, it.channels)

  async function doMove(it: CalItem, at: string, confirm = false) {
    if (busy) return
    setBusy(true)
    const r = await api.move(it, at, confirm)
    setBusy(false)
    if (!r.ok) {
      if (r.needsOk) return setAsk({ it, at, message: r.error, earliest: r.earliest ?? null })
      return toast(r.error)
    }
    setAsk(null)
    setOpen(null)
    setData((d) => d && { ...d, items: d.items.map((x) => x.key === it.key ? { ...x, at: r.at, status: "scheduled", ownerOk: x.ownerOk || r.approved || confirm, windowEnd: r.approved || confirm ? null : x.windowEnd } : x) })
    toast(`${it.status === "scheduled" ? "Moved to" : "Scheduled for"} ${whenLabel(r.at, tz)}${r.approved ? ". Moving it was your OK." : ""}`)
    setTick((t) => t + 1)
  }
  async function doStop(it: CalItem) {
    setBusy(true)
    const r = await api.stop(it)
    setBusy(false)
    if (!r.ok) return toast(r.error ?? "That didn’t save. Try again.")
    setOpen(null)
    toast("Stopped. It won’t go out. It waits for a new time.")
    setTick((t) => t + 1)
  }

  /** Dropped on a day (month/agenda: keep its time of day; tray items get the best time) or a day + hour (week). */
  function dropAt(it: CalItem, day: string, hour: number | null): string | null {
    const { y, m, d } = parseKey(day)
    if (hour != null) { const mi = it.at ? zonedParts(Date.parse(it.at), tz).mi : 0; return zonedToUtc({ y, m, d, h: hour, mi }, tz).toISOString() }
    if (it.at) { const p = zonedParts(Date.parse(it.at), tz); return zonedToUtc({ y, m, d, h: p.h, mi: p.mi }, tz).toISOString() }
    return (timeOnDay(bestOf(it), day, tz, Date.now(), 5 * 60_000) ?? zonedToUtc({ y, m, d, h: 9 }, tz)).toISOString()
  }

  // ── Drag and drop (pointer events: mouse + pen at once, touch after a long-press) ─────────
  const [drag, setDrag] = useState<{ it: CalItem; x: number; y: number; over: string | null } | null>(null)
  const gesture = useRef<{ it: CalItem; id: number; x: number; y: number; type: string; live: boolean; timer: number | null } | null>(null)
  const suppressClick = useRef(false)
  const targetAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-day]")
    return el ? { day: el.dataset.day!, hour: el.dataset.hour ? Number(el.dataset.hour) : null, key: `${el.dataset.day}:${el.dataset.hour ?? ""}` } : null
  }
  useEffect(() => {
    const end = (e: PointerEvent, cancel: boolean) => {
      const g = gesture.current
      if (!g || e.pointerId !== g.id) return
      if (g.timer) window.clearTimeout(g.timer)
      gesture.current = null
      if (!g.live) return
      suppressClick.current = true
      window.setTimeout(() => { suppressClick.current = false }, 50)
      setDrag(null)
      if (cancel) return
      const t = targetAt(e.clientX, e.clientY)
      if (!t) return
      const at = dropAt(g.it, t.day, t.hour)
      if (at && at !== g.it.at) void doMove(g.it, at)
    }
    const move = (e: PointerEvent) => {
      const g = gesture.current
      if (!g || e.pointerId !== g.id) return
      const far = Math.hypot(e.clientX - g.x, e.clientY - g.y) > (g.type === "touch" ? 10 : 5)
      if (!g.live) {
        if (g.type === "touch") { if (far && g.timer) { window.clearTimeout(g.timer); gesture.current = null } return }
        if (!far) return
        g.live = true
      }
      const t = targetAt(e.clientX, e.clientY)
      setDrag({ it: g.it, x: e.clientX, y: e.clientY, over: t?.key ?? null })
    }
    // While a touch drag is live, the page must not scroll under the finger.
    const touch = (e: TouchEvent) => { if (gesture.current?.live) e.preventDefault() }
    const up = (e: PointerEvent) => end(e, false)
    const cancel = (e: PointerEvent) => end(e, true)
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" && gesture.current?.live) { gesture.current = null; setDrag(null) } }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", cancel)
    window.addEventListener("touchmove", touch, { passive: false })
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", cancel)
      window.removeEventListener("touchmove", touch)
      window.removeEventListener("keydown", key)
    }
  })
  const onDown = (it: CalItem) => (e: React.PointerEvent) => {
    if (!it.movable || (e.pointerType === "mouse" && e.button !== 0)) return
    const g = { it, id: e.pointerId, x: e.clientX, y: e.clientY, type: e.pointerType, live: false, timer: null as number | null }
    if (e.pointerType === "touch") {
      g.timer = window.setTimeout(() => {
        if (gesture.current !== g) return
        g.live = true
        try { navigator.vibrate?.(12) } catch { /* not supported */ }
        setDrag({ it, x: g.x, y: g.y, over: null })
      }, 320)
    }
    gesture.current = g
  }

  // ── Pieces ─────────────────────────────────────────────────────────────────────────────
  const chip = (it: CalItem, compact = false) => {
    const t = toneOf(it.kind)
    const time = it.at ? (() => { const p = zonedParts(Date.parse(it.at!), tz); return hourLabel(p.h, p.mi) })() : null
    const nets = it.kind === "social" ? it.channels.map((c) => ABBR[c] ?? c).join(" ") : null
    const cls = `ax-cal-chip s-${it.status}${drag?.it.key === it.key ? " dragging" : ""}${it.movable ? " mv" : ""}`
    return (
      <button
        key={it.key}
        type="button"
        className={cls}
        style={{ "--c": t.ink, "--t": t.tint, "--s": t.soft } as React.CSSProperties}
        onPointerDown={onDown(it)}
        onClick={() => { if (!suppressClick.current) setOpen(it) }}
        onContextMenu={(e) => { if (gesture.current?.type === "touch") e.preventDefault() }}
        aria-label={`${t.name}${nets ? ` (${it.channels.map((c) => CHANNEL_NAME[c]).join(", ")})` : ""}: ${it.title}. ${STATUS[it.status]}${it.at ? `, ${whenLabel(it.at, tz)}` : ""}.${it.movable ? " Press Enter to change the time." : ""}`}
      >
        {!compact && time && <span className="tm">{time}</span>}
        {nets && <span className="nt">{nets}</span>}
        <span className="tt">{it.status === "published" ? "✓ " : ""}{it.title}</span>
      </button>
    )
  }
  const cell = (day: string, list: CalItem[], hour: number | null, extra = "") => {
    const over = drag && drag.over === `${day}:${hour ?? ""}`
    const past = hour == null ? day < today : zonedToUtc({ ...parseKey(day), h: hour + 1 }, tz).getTime() < Date.now()
    return { over, past, cls: `${extra}${over ? " over" : ""}${past ? " past" : ""}${day === today ? " today" : ""}` }
  }

  const monthGrid = () => (
    <div className="ax-cal-month" role="grid" aria-label={monthTitle(anchor)}>
      {DAY_SHORT.slice(1).concat(DAY_SHORT[0]).map((d) => <div key={d} className="ax-cal-dow" role="columnheader">{d}</div>)}
      {days.map((day) => {
        const list = byDay.get(day) ?? []
        const c = cell(day, list, null)
        const out = day.slice(0, 7) !== anchor.slice(0, 7)
        return (
          <div key={day} className={`ax-cal-day${c.cls}${out ? " out" : ""}`} data-day={day} role="gridcell" aria-label={`${dayTitle(day)}: ${list.length} item${list.length === 1 ? "" : "s"}`}>
            <span className="dn">{parseKey(day).d}</span>
            <div className="ls">{list.slice(0, 4).map((it) => chip(it))}{list.length > 4 && <button type="button" className="ax-cal-more" onClick={() => { setAnchor(day); pickView("week") }}>+{list.length - 4} more</button>}</div>
          </div>
        )
      })}
    </div>
  )

  const weekGrid = () => (
    <div className="ax-cal-week" role="grid" aria-label={`Week of ${dayTitle(days[0])}`}>
      <div className="corner" />
      {days.map((day) => <div key={day} className={`hd${day === today ? " today" : ""}`} role="columnheader"><b>{DAY_SHORT[dowOfKey(day)]}</b> {parseKey(day).d}</div>)}
      {HOURS.map((h) => (
        <div key={h} className="row" style={{ display: "contents" }}>
          <div className="hr">{hourLabel(h)}</div>
          {days.map((day) => {
            const list = (byDay.get(day) ?? []).filter((it) => { const p = zonedParts(Date.parse(it.at!), tz).h; return h === 6 ? p <= 6 : h === 22 ? p >= 22 : p === h })
            const c = cell(day, list, h, h === 6 || h === 22 ? " edge" : "")
            return <div key={day} className={`ax-cal-slot${c.cls}`} data-day={day} data-hour={h} role="gridcell" aria-label={`${dayTitle(day)} ${hourLabel(h)}`}>{list.map((it) => chip(it, false))}</div>
          })}
        </div>
      ))}
    </div>
  )

  const agenda = () => {
    const withItems = days.filter((d) => (byDay.get(d) ?? []).length)
    return (
      <div className="ax-cal-agenda">
        {withItems.length ? withItems.map((day) => (
          <section key={day} data-day={day} className={`ad${drag?.over === `${day}:` ? " over" : ""}`}>
            <h3>{day === today ? "Today" : day === addDays(today, 1) ? "Tomorrow" : dayTitle(day)}</h3>
            <div className="ls">{(byDay.get(day) ?? []).map((it) => chip(it))}</div>
          </section>
        )) : <p className="ax-cal-empty">Nothing scheduled in these 4 weeks{filter !== "all" ? " for this channel" : ""}.</p>}
      </div>
    )
  }

  const title = view === "month" ? monthTitle(anchor) : view === "week" ? `${dayTitle(days[0], { month: "short", day: "numeric" })} – ${dayTitle(days[6], { month: "short", day: "numeric", year: "numeric" })}` : `${dayTitle(days[0], { month: "short", day: "numeric" })} – ${dayTitle(days[days.length - 1], { month: "short", day: "numeric" })}`
  const step = (dir: 1 | -1) => {
    if (view === "month") { const { y, m } = parseKey(anchor); const t = new Date(Date.UTC(y, m - 1 + dir, 1)); setAnchor(t.toISOString().slice(0, 10)) }
    else setAnchor(addDays(view === "week" ? anchor : range.start, dir * (view === "week" ? 7 : 28)))
  }
  const counts = { scheduled: items.filter((i) => i.at && (i.status === "scheduled" || i.status === "planned") && Date.parse(i.at) > Date.now()).length }

  return (
    <div className="ax-cal" aria-busy={busy}>
      <div className="ax-cal-bar">
        <div className="nav">
          <button type="button" className="ax-btn s sm" onClick={() => step(-1)} aria-label="Previous">‹</button>
          <button type="button" className="ax-btn s sm" onClick={() => setAnchor(today)}>Today</button>
          <button type="button" className="ax-btn s sm" onClick={() => step(1)} aria-label="Next">›</button>
          <h2>{title}</h2>
        </div>
        <div className="ax-seg" role="tablist" aria-label="Calendar view">
          {(["month", "week", "agenda"] as const).map((v) => <button key={v} type="button" role="tab" aria-selected={view === v} className={view === v ? "on" : ""} onClick={() => pickView(v)}>{v === "month" ? "Month" : v === "week" ? "Week" : "Agenda"}</button>)}
        </div>
      </div>
      <div className="ax-cal-legend" role="toolbar" aria-label="Show channels">
        {FILTERS.map((f) => {
          const t = f.k === "all" ? null : TONE[f.k]
          return <button key={f.k} type="button" aria-pressed={filter === f.k} className={filter === f.k ? "on" : ""} onClick={() => setFilter(f.k)}>{t && <i style={{ background: t.ink }} />}{f.label}</button>
        })}
        <span className="hint">{counts.scheduled ? `${counts.scheduled} going out in this view · ` : ""}Drag to move, or open one to pick a time.</span>
      </div>

      {waiting.length > 0 && (
        <div className="ax-cal-tray" aria-label="Waiting for a time">
          <b>Waiting for a time ({waiting.length})</b>
          <span className="sub">Drop one on a day, or open it to pick a time. That’s your OK to post it.</span>
          <div className="ls">{waiting.map((it) => chip(it))}</div>
        </div>
      )}

      {failed && !data ? <p className="ax-cal-empty">I couldn’t load your calendar. <button type="button" className="ax-lnk" onClick={() => setTick((t) => t + 1)}>Try again</button></p>
        : !data ? <div className="ax-cal-skel" aria-hidden="true" />
          : view === "month" ? monthGrid() : view === "week" ? weekGrid() : agenda()}

      <p className="ax-cal-tz">Times in {tzLabel(tz)} · <TzPicker tz={tz} onPick={async (z) => { if (await api.saveTz(z)) { setTz(z); setTick((t) => t + 1); toast(`Times now show in ${tzLabel(z)}`) } else toast("That didn’t save. Try again.") }} /></p>

      {drag && (
        <div className="ax-cal-ghost" style={{ left: drag.x, top: drag.y, "--c": toneOf(drag.it.kind).ink, "--t": toneOf(drag.it.kind).tint } as React.CSSProperties} aria-hidden="true">
          {drag.it.title}
          {drag.over && (() => { const [day, hr] = drag.over.split(":"); const at = dropAt(drag.it, day, hr ? Number(hr) : null); return at ? <small>{whenLabel(at, tz)}</small> : null })()}
        </div>
      )}

      {open && <Picker it={open} tz={tz} auto={!!data?.auto} best={bestOf(open)} busy={busy} onClose={() => setOpen(null)} onSave={(at) => void doMove(open, at)} onStop={() => void doStop(open)} />}

      {ask && (
        <>
          <div className="ax-bk" style={{ zIndex: 64 }} onClick={() => setAsk(null)} aria-hidden="true" />
          <div className="ax-cal-ask" role="alertdialog" aria-modal="true" aria-labelledby="cal-ask-t">
            <h3 id="cal-ask-t">Post it before your stop window ends?</h3>
            <p>{ask.message}</p>
            <div className="acts">
              <button type="button" className="ax-btn s" onClick={() => setAsk(null)}>Keep it as it is</button>
              {ask.earliest && <button type="button" className="ax-btn s" disabled={busy} onClick={() => void doMove(ask.it, ask.earliest!)}>Use {whenLabel(ask.earliest, tz)}</button>}
              <button type="button" className="ax-btn p" disabled={busy} autoFocus onClick={() => void doMove(ask.it, ask.at, true)}>Yes, post it {whenLabel(ask.at, tz)}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TzPicker({ tz, onPick }: { tz: string; onPick: (tz: string) => void }) {
  const [edit, setEdit] = useState(false)
  const zones = useMemo(() => {
    try { return (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [] } catch { return [] }
  }, [])
  if (!edit || !zones.length) return <button type="button" className="ax-lnk" onClick={() => setEdit(true)}>Change</button>
  return (
    <select aria-label="Your time zone" className="ax-cal-sel" value={zones.includes(tz) ? tz : ""} onChange={(e) => { setEdit(false); if (e.target.value) onPick(e.target.value) }} onBlur={() => setEdit(false)} autoFocus>
      {!zones.includes(tz) && <option value="">{tz}</option>}
      {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
    </select>
  )
}

function Picker({ it, tz, auto, best, busy, onClose, onSave, onStop }: { it: CalItem; tz: string; auto: boolean; best: Best; busy: boolean; onClose: () => void; onSave: (at: string) => void; onStop: () => void }) {
  const start = it.at && Date.parse(it.at) > Date.now() ? Date.parse(it.at) : null
  const slots = useMemo(() => nextSlots(best, tz, Date.now(), 4), [best, tz])
  const first = start ?? (slots[0] ? Date.parse(slots[0].at) : Date.now() + 3_600_000)
  const p0 = zonedParts(first, tz)
  const [date, setDate] = useState(`${p0.y}-${String(p0.m).padStart(2, "0")}-${String(p0.d).padStart(2, "0")}`)
  const [time, setTime] = useState(`${String(p0.h).padStart(2, "0")}:${String(p0.mi).padStart(2, "0")}`)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [onClose])
  const chosen = (() => { const [h, mi] = time.split(":").map(Number); const { y, m, d } = parseKey(date); return Number.isFinite(h) && y ? zonedToUtc({ y, m, d, h, mi }, tz) : null })()
  const past = !chosen || chosen.getTime() < Date.now() + 5 * 60_000
  const t = toneOf(it.kind)
  const where = it.kind === "social" ? it.channels.map((c) => CHANNEL_NAME[c]).join(" & ") : t.name
  const setTo = (iso: string) => { const p = zonedParts(Date.parse(iso), tz); setDate(`${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`); setTime(`${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`) }
  const waitingForOk = it.status === "draft" || it.status === "planned" || !auto
  return (
    <>
      <div className="ax-bk" onClick={onClose} aria-hidden="true" />
      <aside className="ax-insp" role="dialog" aria-modal="true" aria-label={it.title}>
        <header>
          <div style={{ minWidth: 0 }}><div className="ax-eb" style={{ color: t.ink }}>{where} · {STATUS[it.status]}</div><h3>{it.title}</h3></div>
          <button className="ax-x" type="button" aria-label="Close" onClick={onClose}>✕</button>
        </header>
        <div className="bd">
          {it.image && <img src={it.image} alt="" />}
          {it.text && <div className="box"><div className="v">{it.text}</div></div>}
          {it.at && <div><div className="ax-eb" style={{ marginBottom: 6 }}>{it.status === "published" ? "Went out" : "Now"}</div><div className="v">{whenLabel(it.at, tz)}</div></div>}
          {it.result && <div><div className="ax-eb" style={{ marginBottom: 6 }}>What happened</div><div className="v">{it.result}</div></div>}
          {it.links.length > 0 && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{it.links.map((l) => <a key={l.url} className="ax-src" href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}</div>}
          {it.movable ? (
            <div className="ax-cal-pick">
              <div className="ax-eb">{it.at ? "Move it to" : "Schedule it for"}</div>
              <div className="row">
                <label><span>Date</span><input type="date" value={date} min={dateKey(Date.now(), tz)} onChange={(e) => setDate(e.target.value)} /></label>
                <label><span>Time</span><input type="time" value={time} step={300} onChange={(e) => setTime(e.target.value)} /></label>
              </div>
              <div className="ax-eb" style={{ marginTop: 6 }}>Best times <span className={`ax-pill ${best.source === "typical" ? "n" : "g"}`} style={{ marginLeft: 6 }}>{best.source === "typical" ? "Typical" : "Your data"}</span></div>
              <p className="src">{best.label}</p>
              <div className="slots">{slots.map((s) => <button key={s.at} type="button" className={`ax-pill ${chosen && Math.abs(chosen.getTime() - Date.parse(s.at)) < 60_000 ? "b" : "n"}`} onClick={() => setTo(s.at)}>{s.label} · {dayTitle(dateKey(Date.parse(s.at), tz), { month: "short", day: "numeric" })}</button>)}</div>
              {it.windowEnd && Date.parse(it.windowEnd) > Date.now() && <p className="note">Autopilot gives you until {whenLabel(it.windowEnd, tz)} to stop this. An earlier time needs your OK.</p>}
              {waitingForOk && <p className="note">{it.kind === "email" ? "Picking a time is your OK: it goes to your customer list then." : "Picking a time is your OK: it goes out then."}</p>}
              {past && <p className="note warn">Pick a time at least 5 minutes from now.</p>}
            </div>
          ) : it.why ? <p className="ax-note" style={{ marginTop: 0 }}>{it.why}</p> : null}
          <p className="ax-note" style={{ marginTop: 0 }}>{AI_NOTE}</p>
        </div>
        <footer>
          {it.status === "scheduled" && it.movable && <button className="ax-btn d" type="button" disabled={busy} onClick={onStop}>Stop it</button>}
          {it.kind === "social" && <Link className="ax-btn s" href="/dashboard/social">Open in Social Studio</Link>}
          <button className="ax-btn s" type="button" onClick={onClose}>Close</button>
          {it.movable && <button className="ax-btn p" type="button" disabled={busy || past} onClick={() => chosen && onSave(chosen.toISOString())}>{it.at && it.status === "scheduled" ? "Move it" : "Schedule it"}</button>}
        </footer>
      </aside>
    </>
  )
}

/** Social Studio: Calendar | Lists (the lists stay as the alternative view). */
export function ViewSwitch({ on }: { on: "calendar" | "lists" }) {
  return (
    <nav className="ax-viewsw" aria-label="Social Studio view">
      <Link href="/dashboard/social/calendar" className={on === "calendar" ? "on" : ""} aria-current={on === "calendar" ? "page" : undefined}>Calendar</Link>
      <Link href="/dashboard/social" className={on === "lists" ? "on" : ""} aria-current={on === "lists" ? "page" : undefined}>Lists</Link>
    </nav>
  )
}
