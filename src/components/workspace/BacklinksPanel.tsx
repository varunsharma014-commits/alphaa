"use client"

// Research → "Who links to you vs competitors" (lib/backlinks ← /api/workspace/backlinks): sites
// linking in, new and lost last month, the top competitors side by side, and the link gap as
// suggested actions. "Help me ask" opens the chat with the facts; I never email anyone.
import { useEffect, useState } from "react"
import type { BacklinksView } from "@/lib/backlinks/view"
import { askAlphaa, toast } from "@/lib/workspace/events"
import { Button, EmptyState, Glyph, List, ListRow, Pill, SectionHeader, Skeleton, StatRow, StatTile, When } from "./ui"
import "./keywords.css"

const n = (x: number | null | undefined) => (x == null ? null : x.toLocaleString("en-US"))
const monthName = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo - 1, 15)).toLocaleString("en-US", { month: "long", timeZone: "UTC" }) }

export function BacklinksPanel() {
  const [v, setV] = useState<BacklinksView | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    const r = await fetch("/api/workspace/backlinks").catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: BacklinksView } | null
    if (!r?.ok || !d?.view) return setFailed(true)
    setFailed(false)
    setV(d.view)
  }
  useEffect(() => { void load() }, [])

  async function refresh() {
    setBusy(true)
    const r = await fetch("/api/workspace/backlinks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "refresh" }) }).catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: BacklinksView; error?: string } | null
    setBusy(false)
    if (d?.view) setV(d.view)
    if (!r?.ok) return toast(d?.error ?? "That didn’t work. Try again later.")
    toast("Checked. Here’s who links to you now.")
  }

  if (failed && !v) return <div className="ax-kw-top"><EmptyState icon={<Glyph name="link" size={22} />} title="I couldn’t load your link data" text="That’s on my side. Try again in a minute." actions={<Button onClick={() => void load()}>Try again</Button>} /></div>
  if (!v) return <div className="ax-kw-top" aria-busy="true" aria-label="Loading who links to you"><StatRow><Skeleton kind="tile" /><Skeleton kind="tile" /><Skeleton kind="tile" /></StatRow></div>
  if (!v.scope) {
    return (
      <div className="ax-kw-top">
        <EmptyState
          icon={<Glyph name="link" size={22} />}
          title="Link checks come with a paid plan"
          text="Every month I check which sites link to you and what changed."
          bullets={["Sites linking to you, gained and lost each month", "You next to your top competitors", <>Sites that link to them and not you <Pill tone="info">Pro</Pill></>]}
          actions={<Button variant="primary" href="/dashboard/settings/billing">See plans</Button>}
        />
      </div>
    )
  }

  const s = v.snapshot
  if (!s?.summary) {
    return (
      <div className="ax-kw-top">
        <EmptyState
          icon={<Glyph name="link" size={22} />}
          title="I haven’t checked your links yet"
          text={s?.notes[0] ?? "It takes about 20 seconds. After that I check once a month on my own."}
          bullets={["How many sites link to you, and how strong they are", "What you gained and lost last month", ...(v.scope === "full" ? ["Sites that link to your competitors and not to you"] : [])]}
          actions={<Button variant="primary" loading={busy} disabled={!v.canRefresh} onClick={() => void refresh()}>Check my links now</Button>}
        />
      </div>
    )
  }
  const sum = s.summary
  const mom = s.mom
  const all = [{ host: s.host, name: "You", me: true, sum }, ...s.competitors.map((c) => ({ host: c.host, name: c.name ?? c.host, me: false, sum: c.summary }))]
  const maxRd = Math.max(1, ...all.map((x) => x.sum?.referringDomains ?? 0))

  return (
    <div className="ax-kw-top">
      <div className="ax-kw-head">
        <p className="ax-kw-note" style={{ margin: 0 }}>Checked <When at={s.at} mode="ago" fallback="recently" />. I look again every month.</p>
        <Button size="sm" loading={busy} disabled={!v.canRefresh} onClick={() => void refresh()}>{v.canRefresh ? "Check again" : "Checked today"}</Button>
      </div>
      <div style={{ marginTop: 14 }}>
        <StatRow>
          <StatTile label="Sites linking to you" value={n(sum.referringDomains)} />
          <StatTile label="Links in total" value={n(sum.backlinks)} />
          {mom && mom.newDomains !== null && <StatTile label={`New in ${monthName(mom.month)}`} value={n(mom.newDomains)} delta={mom.newDomains ? { text: "gained", dir: "up" } : null} />}
          {mom && mom.lostDomains !== null && <StatTile label={`Lost in ${monthName(mom.month)}`} value={n(mom.lostDomains)} delta={mom.lostDomains ? { text: "lost", dir: "down" } : null} />}
          <StatTile label="Link strength" value={n(sum.rank)} hint="0 to 100" />
        </StatRow>
      </div>

      {s.scope === "full" && s.competitors.length > 0 && (
        <>
          <SectionHeader title="You next to your competitors" sub="Sites linking to each of you. More usually means more trust from Google and AI." />
          <section className="ax-card ax-bl-cmp">
            {all.map((x) => (
              <div key={x.host}>
                <div className="ax-bl-row">
                  <b>{x.me ? `You (${x.host})` : x.name}</b>
                  <span className="ax-kw-none">{x.sum ? `${n(x.sum.referringDomains)} sites · strength ${n(x.sum.rank) ?? "not measured"}` : "Couldn’t read"}</span>
                </div>
                <div className={`ax-bl-bar${x.me ? " me" : ""}`}><i style={{ width: `${Math.round(((x.sum?.referringDomains ?? 0) / maxRd) * 100)}%` }} /></div>
              </div>
            ))}
          </section>
        </>
      )}

      {s.scope === "full" && (
        <>
          <SectionHeader title="Sites that link to them, not you" sub="Each links to at least 2 of your competitors. I never contact anyone for you." />
          {v.actions.length ? (
            <List card label="Sites worth asking for a link">
              {v.actions.map((a) => (
                <ListRow key={a.domain} lead={<span className="xd-row__ic"><Glyph name="link" size={16} /></span>} title={a.domain} meta={<><Pill tone="idle">{a.kindLabel}</Pill><span>{a.text}</span></>} end={<Button size="sm" variant="primary" onClick={() => askAlphaa({ say: a.ask })}>Help me ask</Button>} wrapEnd />
              ))}
            </List>
          ) : <p className="ax-note">{s.notes.find((x) => /competitor/i.test(x)) ?? "I didn’t find a site that links to 2 of your competitors and not to you this month."}</p>}
          {s.gap.length > v.actions.length && <p className="ax-note">{s.gap.length - v.actions.length} more on my list. I show the strongest first.</p>}
        </>
      )}

      {s.top.length > 0 && (
        <>
          <SectionHeader title="Strongest sites linking to you" sub="Strongest first." />
          <List card label="Strongest sites linking to you">
            {s.top.slice(0, 10).map((t) => (
              <ListRow key={t.domain} lead={<span className="xd-row__ic"><Glyph name="globe" size={16} /></span>} title={t.domain} meta={`${n(t.backlinks) ?? 0} link${t.backlinks === 1 ? "" : "s"} · strength ${n(t.rank) ?? "not measured"}`} href={`https://${t.domain}`} />
            ))}
          </List>
        </>
      )}
      {s.scope === "own" && <p className="ax-note">On Pro I also put you next to your top 3 competitors and list the sites that link to them and not to you.</p>}
      {s.notes.filter((x) => !/competitor/i.test(x)).length > 0 && <p className="ax-note">{s.notes.filter((x) => !/competitor/i.test(x)).join(" ")}</p>}
    </div>
  )
}
