"use client"

// Dev-only sample data for the content calendar (/preview?ws=calendar). Moves run through the real
// rules (lib/calendar/rules.ts) in memory; nothing is saved or published.
import { useMemo } from "react"
import { CalendarView, ViewSwitch, type CalApi, type CalData } from "@/components/workspace/CalendarView"
import type { CalItem } from "@/lib/calendar/items"
import { typical, CHANNELS, type Best, type Channel } from "@/lib/calendar/best-time"
import { decideMove } from "@/lib/calendar/rules"
import { whenLabel } from "@/lib/calendar/tz"
import { PageHeader } from "@/components/workspace/ui"

const H = 3_600_000
const at = (h: number) => { const t = new Date(Date.now() + h * H); t.setMinutes(0, 0, 0); return t.toISOString() }

function sample(empty: boolean): CalData {
  const base = { image: null, links: [], result: null, ownerOk: false, windowEnd: null, why: null, movable: true, text: "Sample caption (preview only)." }
  const items: CalItem[] = empty ? [] : [
    { ...base, key: "social:s1", kind: "social", id: "s1", channels: ["instagram", "facebook"], title: "Sample post: a first-visit walk-through", status: "scheduled", at: at(26), windowEnd: at(60) },
    { ...base, key: "social:s2", kind: "social", id: "s2", channels: ["linkedin"], title: "Sample post: three questions to ask", status: "planned", at: at(50) },
    { ...base, key: "social:s3", kind: "social", id: "s3", channels: ["facebook"], title: "Sample post that went out", status: "published", at: at(-30), movable: false, why: "It already went out.", result: "1,204 views · 18 likes" },
    { ...base, key: "gbp:g1", kind: "gbp", id: "g1", channels: ["google"], title: "Sample Google update about weekend hours", status: "scheduled", at: at(74), ownerOk: true },
    { ...base, key: "gbp:g2", kind: "gbp", id: "g2", channels: ["google"], title: "Sample Google draft", status: "draft", at: null },
    { ...base, key: "site:w1", kind: "site", id: "w1", channels: ["site"], title: "Sample page: what a first visit costs", status: "scheduled", at: at(98), windowEnd: at(98) },
    { ...base, key: "site:w2", kind: "site", id: "w2", channels: ["site"], title: "Sample published post", status: "published", at: at(-80), movable: false, why: "It’s already live." },
    { ...base, key: "email:e1", kind: "email", id: "e1", channels: ["email"], title: "Sample December note to customers", status: "draft", at: null },
    { ...base, key: "social:s4", kind: "social", id: "s4", channels: ["tiktok"], title: "Sample TikTok idea", status: "scheduled", at: at(140), ownerOk: true },
  ]
  const best: Partial<Record<Channel, Best>> = {}
  for (const c of CHANNELS) best[c] = typical(c)
  best.linkedin = { ...typical("linkedin"), source: "yours", label: "From 9 of your LinkedIn Page posts: Tue around 9 AM got the most engagement (sample)" }
  return { tz: "America/Toronto", tzSaved: false, tzFrom: "business", auto: true, pro: true, items, best }
}

export function CalendarPreview({ empty }: { empty: boolean }) {
  const api = useMemo<CalApi>(() => {
    const store = sample(empty)
    return {
      async load() { await new Promise((r) => setTimeout(r, 150)); return { ...store, items: store.items.map((i) => ({ ...i })) } },
      async move(it, iso, confirm) {
        const cur = store.items.find((x) => x.key === it.key)!
        const d = decideMove({ now: Date.now(), target: Date.parse(iso), autopilotOn: store.auto, status: cur.status === "scheduled" ? "scheduled" : "draft", ownerOk: cur.ownerOk, windowEnd: cur.windowEnd && cur.at ? Math.min(Date.parse(cur.windowEnd), Date.parse(cur.at)) : cur.windowEnd ? Date.parse(cur.windowEnd) : null, confirm }, (t) => whenLabel(t, store.tz))
        if (!d.ok) return { ok: false, error: d.message, needsOk: d.reason === "window", earliest: d.earliest ? new Date(d.earliest).toISOString() : null }
        Object.assign(cur, { at: iso, status: "scheduled", ownerOk: d.ownerOk || cur.ownerOk, windowEnd: d.ownerOk ? null : cur.windowEnd })
        return { ok: true, at: iso, approved: d.approves }
      },
      async stop(it) { const cur = store.items.find((x) => x.key === it.key)!; Object.assign(cur, { status: "draft", at: null }); return { ok: true } },
      async saveTz(tz) { store.tz = tz; return true },
    }
  }, [empty])
  return (
    <>
      <PageHeader title="Calendar" sub="Sample data (preview only)." actions={<ViewSwitch on="calendar" />} />
      <CalendarView api={api} />
    </>
  )
}
