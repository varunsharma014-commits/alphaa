"use client"

import { useEffect, useState } from "react"
import type { ReportWeek, ReportsData } from "@/lib/workspace/reports"
import { EmptyState, Glyph, List, ListRow, PageHeader, Pill, SectionHeader, Sheet, StatRow, StatTile, isStale } from "./ui"
import "./detail.css"

// Weekly reports: the newest week up top, older weeks as a list that opens each one.

const fmtWeek = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

const COUNTS: { key: keyof ReportWeek["counts"]; one: string; many: string }[] = [
  { key: "google", one: "Google update", many: "Google updates" },
  { key: "social", one: "social post", many: "social posts" },
  { key: "reviews", one: "new review", many: "new reviews" },
  { key: "replies", one: "review reply", many: "review replies" },
  { key: "emails", one: "customer email", many: "customer emails" },
  { key: "ads", one: "ad change", many: "ad changes" },
]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function weekLine(w: ReportWeek): string {
  const parts = COUNTS.filter((c) => w.counts[c.key] > 0).map((c) => `${w.counts[c.key]} ${w.counts[c.key] === 1 ? c.one : c.many}`)
  return parts.length ? parts.join(" · ") : "Nothing went out this week"
}

function WeekBody({ w }: { w: ReportWeek }) {
  const shown = COUNTS.filter((c) => w.counts[c.key] > 0)
  return (
    <div className="xp-stack">
      {w.summary && <p className="xp-week__sum">{w.summary}</p>}
      {shown.length ? (
        <StatRow min={130}>
          {shown.map((c) => <StatTile key={c.key} soft label={cap(w.counts[c.key] === 1 ? c.one : c.many)} value={w.counts[c.key]} />)}
        </StatRow>
      ) : (
        <p className="ax-p">Nothing was published that week.</p>
      )}
      {w.ai.length > 0 && (
        <div>
          <div className="xp-eng__lbl">AI search that week</div>
          <div className="xp-chips">{w.ai.map((a) => <Pill key={a.name} tone={a.change > 0 ? "ok" : "warn"}>{a.name} {a.change > 0 ? "started naming you" : "stopped naming you"}</Pill>)}</div>
        </div>
      )}
      {w.movers.length > 0 && (
        <div>
          <div className="xp-eng__lbl">Google searches that moved</div>
          <ul className="xp-movers">
            {w.movers.map((m) => {
              const n = Math.max(1, Math.round(Math.abs(m.change)))
              return <li key={m.query}><span>{m.query}</span><span className={`xd-delta ${m.change > 0 ? "up" : "down"}`}>{m.change > 0 ? "↑ up" : "↓ down"} {n} {n === 1 ? "spot" : "spots"}</span></li>
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Newest report date; amber when it's more than 8 days old (a week was missed). Client clock only. */
function Freshness({ at }: { at: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { setNow(Date.now()) }, [])
  if (now == null) return null
  return isStale(at, 4, now)
    ? <Pill tone="warn" dot>No new report since {fmtWeek(at)}</Pill>
    : <span>Newest report {fmtWeek(at)}</span>
}

export function ReportsView({ data }: { data: ReportsData }) {
  const [open, setOpen] = useState<ReportWeek | null>(null)
  const [latest, ...past] = data.weeks

  return (
    <>
      <PageHeader
        title="Weekly reports"
        sub="Every Monday I email you what I did and what changed. Past weeks are here."
        meta={latest ? <Freshness at={latest.at} /> : undefined}
      />

      {!latest ? (
        <EmptyState
          hero
          icon={<Glyph name="mail" size={26} />}
          title="Your first report arrives Monday"
          text={`I email it to ${data.email}. No login needed to read it.`}
          bullets={["What I published, on every channel", "Which AIs started or stopped naming you", "Google searches that moved"]}
        />
      ) : (
        <>
          <section className="xp-week" aria-label={`Week of ${fmtWeek(latest.at)}`}>
            <div className="xp-week__top">
              <div>
                <div className="xp-eng__lbl">Latest week</div>
                <h2 className="xp-week__t">Week of {fmtWeek(latest.at)}</h2>
              </div>
              {latest.emailed ? <Pill tone="ok" dot>Emailed to you</Pill> : <Pill tone="idle">Not emailed</Pill>}
            </div>
            <WeekBody w={latest} />
          </section>

          {past.length > 0 && (
            <>
              <SectionHeader title="Earlier weeks" />
              <List card label="Earlier weekly reports">
                {past.map((w) => <ListRow key={w.id} title={`Week of ${fmtWeek(w.at)}`} meta={weekLine(w)} onClick={() => setOpen(w)} />)}
              </List>
            </>
          )}
        </>
      )}

      <Sheet open={!!open} onClose={() => setOpen(null)} eyebrow="Weekly report" title={open ? `Week of ${fmtWeek(open.at)}` : ""}>
        {open && <WeekBody w={open} />}
      </Sheet>
    </>
  )
}
