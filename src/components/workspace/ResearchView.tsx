"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { IdeaRow, ResearchData } from "@/lib/workspace/research"
import type { AttackCard, MoveCard } from "@/lib/workspace/rivals"
import { askAlphaa, ISLAND_EVENT, toast } from "@/lib/workspace/events"
import {
  Button, ChannelBadge, CopyButton, EmptyState, Field, Glyph, List, ListRow, Menu, Modal, PageHeader, Pill, SectionHeader, StaleBadge, Tabs, TextInput,
  When, useConfirm, useInspector, useTabParam, type Channel,
} from "./ui"
import { DraftSheet } from "./DraftSheet"
import { RepurposeButton } from "./RepurposeButton"
import { ReadySheet, type ReadySource } from "./ReadySheet"
import { TopicPlan } from "./TopicPlan"
import { KeywordsPanel } from "./KeywordsPanel"
import { BacklinksPanel } from "./BacklinksPanel"
import "./research.css"

// Research & Ideas: 5 tabs, each a deep link (?tab=). Older links (?tab=w|t|k|l|i|g|c) still land
// on the right tab. "My #1 move" sits on Ideas only, so a screen never stacks two hero cards.
type Tab = "ideas" | "plan" | "keywords" | "competitors" | "links"
const TABS: { key: Tab; label: string }[] = [
  { key: "ideas", label: "Ideas" },
  { key: "plan", label: "Topic plan" },
  { key: "keywords", label: "Keywords" },
  { key: "competitors", label: "Competitors" },
  { key: "links", label: "Who links to you" },
]
const LEGACY: Record<string, Tab> = { w: "ideas", i: "ideas", t: "plan", k: "keywords", l: "links", g: "competitors", c: "competitors" }
const ALL_KEYS = [...TABS.map((t) => t.key), ...Object.keys(LEGACY)] as const

const FORMAT_CHANNEL: Record<string, Channel | null> = { blog: "web", google: "google", social: null }

/** "2026-11-27 – 2026-11-30" → "Fri, Nov 27 to Mon, Nov 30". */
function niceWhen(s: string | null | undefined): string | null {
  if (!s) return null
  const out = s.replace(/\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?/g, (m) => {
    const d = new Date(m.length === 10 ? `${m}T12:00:00Z` : m)
    return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
  })
  return out.replace(/\s+[–—-]\s+/g, " to ").trim()
}

export function ResearchView({ data }: { data: ResearchData }) {
  const { node, open } = useInspector()
  const [raw, setRaw] = useTabParam<(typeof ALL_KEYS)[number]>(ALL_KEYS, "ideas")
  const tab: Tab = LEGACY[raw] ?? (raw as Tab)
  // An old link (?tab=w): show the new key in the address bar.
  useEffect(() => { if (LEGACY[raw]) setRaw(LEGACY[raw]) }, [raw, setRaw])
  const [all, setAll] = useState(false)
  const [sheet, setSheet] = useState<MoveCard | null>(null)
  const [sheetCluster, setSheetCluster] = useState<{ ref: string; pillar: string } | null>(null)
  const [ready, setReady] = useState<{ source: ReadySource; make: boolean } | null>(null)
  const [gone, setGone] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState<false | "open" | "busy">(false)
  const [addErr, setAddErr] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [finding, setFinding] = useState(false)
  const { confirm, node: confirmNode } = useConfirm()
  const router = useRouter()
  const working = all ? data.working : data.working.slice(0, 4)
  const comps = data.comps.filter((c) => !gone.has(c.host))
  const moves = data.moves.filter((m) => !gone.has(m.rivalHost))

  // The status island says what I found here, from the real counts.
  useEffect(() => {
    if (!data.island) return
    // After the shell's own effects (a parent's run after its children's), so it's listening.
    const t = window.setTimeout(() => window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: data.island })), 0)
    return () => { window.clearTimeout(t); window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: null })) }
  }, [data.island])

  async function dismiss(c: AttackCard) {
    setGone((g) => new Set(g).add(c.host))
    const res = await fetch("/api/workspace/competitor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "dismiss", host: c.host }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { looking?: boolean } | null
    if (!res?.ok) { setGone((g) => { const n = new Set(g); n.delete(c.host); return n }); return toast("That didn’t save. Try again.") }
    toast(d?.looking ? `Removed ${c.name}. I’m looking for a better match.` : `Removed ${c.name}.`)
  }
  async function add() {
    const u = url.trim()
    if (!u) return setAddErr("Type their website, like theirsite.com")
    setAdding("busy")
    setAddErr(null)
    const res = await fetch("/api/competitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: /^https?:\/\//i.test(u) ? u : `https://${u}` }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    if (!res?.ok) { setAdding("open"); return setAddErr(d?.error ?? "I couldn’t read that site. Check the address.") }
    setAdding(false)
    setUrl("")
    toast("Added. I read their site and I’m watching them now.")
    router.refresh()
  }
  async function findAgain() {
    const ok = await confirm({ title: "Look for competitors again?", text: "I search Google for businesses like yours and read their sites. The ones I found before are replaced. The ones you added stay.", confirmLabel: "Look again" })
    if (!ok) return
    setFinding(true)
    const res = await fetch("/api/competitors/discover", { method: "POST" }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setFinding(false)
    if (!res?.ok) return toast(d?.error ?? "That didn’t work. Try again in a minute.")
    toast("Done. Here’s who I found.")
    router.refresh()
  }

  const ideas = useMemo(() => {
    const rest = data.ideas.filter((h) => h !== data.topIdea)
    return data.topIdea ? [data.topIdea, ...rest] : rest
  }, [data.ideas, data.topIdea])
  const hookGroups = useMemo(() => {
    const m = new Map<string, IdeaRow[]>()
    for (const h of data.hooks) m.set(h.kind, [...(m.get(h.kind) ?? []), h])
    return [...m.entries()]
  }, [data.hooks])

  const sub = tab === "ideas" ? data.summary
    : tab === "plan" ? "Your main topics, the pages around each one, and what’s written so far."
      : tab === "keywords" ? "The searches that matter to you, with Google’s own numbers."
        : tab === "competitors" ? `I’m watching ${comps.length} competitor${comps.length === 1 ? "" : "s"} for you.`
          : "Who links to you, and the sites worth asking for a link."

  const footnotes = [
    data.working.length > 0 && data.instagram !== "on" ? (data.instagram === "connect" ? "I’ll show what’s working on Instagram once you connect it." : "I’ll add Instagram as soon as Meta approves Alphaa to read post stats.") : null,
    data.working.length > 0 && data.working.length < 3 ? `Only ${data.working.length} post${data.working.length === 1 ? "" : "s"} beat the typical engagement in your niche in my last look. I don’t pad this list.` : null,
    data.droppedPosts ? `I left out ${data.droppedPosts} that were off topic or below typical engagement.` : null,
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title="Research & Ideas"
        sub={sub}
        meta={tab === "competitors" && data.lastChecked ? <StaleBadge at={data.lastChecked} scheduleDays={28} always onRerun={() => void findAgain()} rerunLabel="Look again" busy={finding} /> : tab === "ideas" && data.ideasAt ? <span>Ideas updated <When at={data.ideasAt} mode="ago" fallback="recently" /></span> : null}
        actions={tab === "competitors" ? (
          <>
            <Button href="/dashboard/citations">AI share of voice</Button>
            <Button variant="primary" onClick={() => { setAdding("open"); setAddErr(null) }}>Add a competitor</Button>
          </>
        ) : null}
        tabs={<Tabs<Tab> label="Research sections" value={tab} onChange={setRaw} tabs={TABS} />}
      />

      {tab === "ideas" && (
        <>
          {data.top && (
            <section className="ax-card ax-move xr-move">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ax-eb xr-blue"><span className="ax-orb" style={{ width: 12, height: 12 }} />My #1 move this week</div>
                {data.top.kind === "move" ? (
                  <>
                    <p className="t">Publish “{data.top.move.title}”</p>
                    <p className="s">{data.top.move.why ? `Because ${data.top.move.why}.` : `${data.top.move.rival} has this page and you don’t, so they get the searches.`}</p>
                  </>
                ) : (
                  <>
                    <p className="t">Make your version of: {data.top.card.title}</p>
                    <p className="s">{data.top.why}</p>
                  </>
                )}
              </div>
              {(() => { const t = data.top; return t.kind === "move"
                ? <Button variant="primary" onClick={() => { setSheetCluster(t.cluster ?? null); setSheet(t.move) }}>Draft it</Button>
                : <Button variant="primary" onClick={() => askAlphaa({ chip: t.card.makeChip })}>Make my version</Button> })()}
            </section>
          )}

          <SectionHeader title="What’s working nearby" sub="Posts doing better than usual in your niche, each with a link to the original." />
          {working.length ? (
            <div className="ax-g2 xr-working">
              {working.map((w) => (
                <article key={w.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                  <div className={`ax-art${w.thumb ? " img" : ""}`} style={{ height: 170, background: w.thumb ? `#111 url("${w.thumb}") center/cover` : w.art }}>
                    <span style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between" }}>
                      <span className="ax-pill w">{w.where}{w.duration ? ` · ${w.duration}` : ""}</span>
                      {w.format && <span className="ax-pill w">{w.format}</span>}
                    </span>
                    {!w.thumb && <b className="xr-art-t">{w.hook ? `“${w.hook}”` : w.title}</b>}
                  </div>
                  <div className="ax-cb">
                    {w.thumb && w.hook && <p className="xr-hookline">“{w.hook}”</p>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {w.badge && <span className="ax-proof">{w.badge}</span>}
                      {w.stats.length > 0 && <span className="ax-t11">{w.stats.map((x) => `${x.v} ${x.k.toLowerCase()}`).join(" · ")}</span>}
                    </div>
                    {w.use && <p className="ax-p"><b className="xr-ink">My version: </b>{w.use}</p>}
                    <div className="ax-ft">
                      <a className="ax-src" href={w.url} target="_blank" rel="noopener noreferrer">Source ↗</a>
                      <span style={{ display: "flex", gap: 8 }}>
                        <Button size="sm" onClick={() => setReady({ source: { kind: "niche", card: w }, make: false })}>Why it worked</Button>
                        <Button size="sm" variant="primary" onClick={() => setReady({ source: { kind: "niche", card: w }, make: true })}>Make my version</Button>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Glyph name="spark" size={22} />}
              title={data.nicheOn ? "I haven’t looked at your niche yet" : "Niche research isn’t switched on yet"}
              text={data.nicheOn ? "I read the top videos and posts for businesses like yours and show what works, with a link to each one." : "It needs my research service, which isn’t set up on this account yet. Your ideas, topic plan and competitors still work."}
              bullets={data.nicheOn ? ["Posts beating the usual engagement in your niche", "Why each one worked, in plain words", "Your own version, written in your voice"] : undefined}
              actions={data.nicheOn ? <Button variant="primary" onClick={() => askAlphaa({ topic: "niche", label: "What’s working in my niche?" })}>Look now</Button> : null}
            />
          )}
          {data.working.length > 4 && <div className="xr-more"><Button onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${data.working.length}`}</Button></div>}
          {footnotes.length > 0 && <p className="ax-note">{footnotes.join(" ")}</p>}

          {data.trends.length > 0 && (
            <>
              <SectionHeader title="Timely this week" sub="From a live web search. Each one links to where I found it." />
              <List card label="Timely this week">
                {data.trends.map((t, i) => (
                  <ListRow key={i} lead={<span className="xr-ic"><Glyph name="clock" size={16} /></span>} title={t.title} meta={<>{t.why}{niceWhen(t.when) ? <> · {niceWhen(t.when)}</> : null}</>} href={t.url} end={<span className="ax-src">Source ↗</span>} label={`${t.title} (opens the source)`} />
                ))}
              </List>
            </>
          )}

          <SectionHeader title="Ideas from your numbers" sub="From your Google searches, visits and AI answers. Each says why." />
          {ideas.length ? (
            <List card label="Ideas from your numbers">
              {ideas.map((h, i) => {
                const ch = h.format ? FORMAT_CHANNEL[h.format] : null
                return (
                  <ListRow
                    key={i}
                    lead={ch ? <ChannelBadge channel={ch} label={false} size={28} /> : <span className="xr-ic"><Glyph name="spark" size={16} /></span>}
                    title={h.hook ? `“${h.hook}”` : h.text}
                    meta={<>{h === data.topIdea && <Pill tone="info">My top pick</Pill>}<span>{h.kind}</span>{h.proof && <span className="ax-proof">{h.proof}</span>}{h.hook ? <span>{h.text}</span> : null}{h.why && <span className="xr-why">{h.why}</span>}</>}
                    end={<Button size="sm" variant={h === data.topIdea ? "primary" : "secondary"} onClick={() => setReady({ source: { kind: "idea", idea: h }, make: true })}>Write it</Button>}
                    wrapEnd
                  />
                )
              })}
            </List>
          ) : (
            <EmptyState icon={<Glyph name="spark" size={22} />} title="No ideas from your numbers yet" text="Once a week I compare your Google searches, visits and AI answers with your competitors and suggest what to make next." actions={<Button variant="primary" onClick={() => askAlphaa({ topic: "insights", label: "What’s working?" })}>Look at my numbers</Button>} />
          )}

          <SectionHeader title="Hooks for your ads" sub="Opening lines from your ad plan, checked for claims I can back up." end={data.strategyAt ? <Button size="sm" href="/dashboard/ad-strategy">Open the full plan</Button> : null} />
          {hookGroups.length ? (
            <div className="xr-hooks">
              {hookGroups.map(([kind, list]) => (
                <div key={kind}>
                  <div className="xr-hooks__k">{kind}</div>
                  <div className="xr-hooks__g">
                    {list.map((h, i) => (
                      <figure key={i} className="ax-card xr-quote">
                        <blockquote>“{h.text}”</blockquote>
                        <figcaption><CopyButton text={h.text} /></figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Glyph name="copy" size={22} />} title="No ad plan yet" text="Your ad plan has the opening lines, scripts and budget split, built from what your competitors run." actions={<Button variant="primary" onClick={() => askAlphaa({ topic: "adplan", label: "My ad plan" })}>Make my ad plan</Button>} />
          )}
        </>
      )}

      {tab === "plan" && (
        <>
          <TopicPlan view={data.clusters} autopilot={data.autopilot} siteConnected={data.siteConnected} webPersonEmail={data.webPersonEmail} siteHost={data.siteHost} />
          {data.published.length > 0 && (
            <>
              <SectionHeader title="Pages I published" sub="Turn any of them into a social post, a Google update, an email and a video script. Each waits for your OK." />
              <List card label="Pages I published">
                {data.published.map((p) => (
                  <ListRow key={p.id} lead={<ChannelBadge channel="web" label={false} size={28} />} title={p.title} meta={<>Published <When at={p.at} mode="ago" fallback="recently" />{p.url ? <> · <a className="ax-src mut" href={p.url} target="_blank" rel="noopener noreferrer">Open ↗</a></> : null}</>} end={<RepurposeButton draftId={p.id} done={p.repurposed} />} wrapEnd />
                ))}
              </List>
            </>
          )}
        </>
      )}
      {tab === "keywords" && <KeywordsPanel autopilot={data.autopilot} siteConnected={data.siteConnected} />}
      {tab === "links" && <BacklinksPanel />}

      {tab === "competitors" && (
        <>
          {data.compGaps.length > 0 && (
            <section className="ax-card xr-gaps" aria-label="Gaps from what they advertise">
              <div className="ax-eb xr-blue">The gaps I’m taking, from what they advertise</div>
              <ul>{data.compGaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </section>
          )}
          {comps.length ? (
            <div className="xr-comps">
              {comps.map((c) => {
                const openIt = () => open({ eb: [c.tag, c.manual ? "Added by you" : null].filter(Boolean).join(" · ") || "Competitor", title: c.name, rows: [...c.detail.map((d) => (d.href ? { k: d.k, v: d.v, href: d.href } : { k: d.k, v: d.v, box: d.k === "Winning at" || d.k === "Weak spots" })), { k: "Their site", v: c.host, href: c.site }], cta: c.primary?.move ? null : c.primary?.topic ? { label: c.primary.label, topic: c.primary.topic } : c.primary?.chip ? { label: c.primary.label, chip: c.primary.chip } : null })
                return (
                  <article key={c.id} className="ax-card hv ax-rival xr-rival" onClick={openIt} role="button" tabIndex={0} aria-label={`More about ${c.name}`} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) openIt() }}>
                    <div className="xr-rival__h">
                      <img src={c.favicon} alt="" width={28} height={28} className="ax-fav" loading="lazy" />
                      <div className="xr-rival__n">
                        <b>{c.name}</b>
                        <span>{c.host}{c.manual ? " · added by you" : ""}</span>
                      </div>
                      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <Menu label={`More for ${c.name}`} items={[{ label: "Open their site", onClick: () => window.open(c.site, "_blank", "noopener") }, ...(c.adUrl ? [{ label: "See their ads", onClick: () => window.open(c.adUrl!, "_blank", "noopener") }] : []), "sep", { label: "Not a competitor", hint: "I stop watching them", danger: true, onClick: () => void dismiss(c) }]} />
                      </span>
                    </div>
                    {c.tag && <div><Pill tone={c.tag === "Ad spender" ? "warn" : c.tag === "Content machine" ? "info" : "idle"}>{c.tag}</Pill></div>}
                    <div className="ax-lines">
                      {c.winning && <div><span>Winning at</span>{c.winning}</div>}
                      {c.weak && <div><span>Weak spot</span>{c.weak}</div>}
                      {c.counter && <div><span>My counter move</span>{c.counter}</div>}
                      {c.instagram && !c.winning?.startsWith("Instagram") && <div><span>Instagram</span>{c.instagram.line}</div>}
                      {!c.winning && !c.weak && !c.counter && !c.instagram && <div className="ax-t11">I couldn’t read enough of their site yet. I’ll try again on my next pass.</div>}
                    </div>
                    <div className="xr-rival__f" onClick={(e) => e.stopPropagation()}>
                      {c.primary ? <Button size="sm" variant="primary" onClick={() => { const p = c.primary!; if (p.move) setSheet(p.move); else askAlphaa({ topic: p.topic, chip: p.chip, label: p.topic ? p.label : undefined }) }}>{c.primary.label}</Button> : <Button size="sm" onClick={openIt}>See details</Button>}
                      {c.instagram && <a className="ax-src" href={c.instagram.url} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}
                      {c.instagram?.make && <Button size="sm" onClick={() => askAlphaa({ chip: c.instagram!.make! })}>Make my version</Button>}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Glyph name="globe" size={22} />}
              title="I’m not watching any competitors yet"
              text={data.hiddenComps ? "The sites I found weren’t real competitors (wikis, directories or other industries), so I left them out. Add one you know." : "I find them from Google and from the businesses the AIs name instead of you, or you can add them."}
              bullets={["What each one is winning at, and their weak spot", "Pages they have that you don’t", "The ads they run"]}
              actions={<><Button variant="primary" onClick={() => { setAdding("open"); setAddErr(null) }}>Add a competitor</Button><Button loading={finding} onClick={() => void findAgain()}>Find them for me</Button></>}
            />
          )}
          {data.hiddenComps > 0 && comps.length > 0 && <p className="ax-note">I left out {data.hiddenComps} site{data.hiddenComps === 1 ? "" : "s"} that aren’t competitors (wikis, directories, platforms or other industries).</p>}

          <SectionHeader title="Pages they have that you don’t" sub={data.compared ? `I compared your site with ${data.compared} competitor site${data.compared === 1 ? "" : "s"}.` : "I compare your site with your competitors’ and list the pages they have that you don’t."} />
          {moves.length ? (
            <List card label="Pages they have that you don’t">
              {moves.map((m) => (
                <div key={m.id} className="xr-gap" role="listitem">
                  <div className="xr-gap__b">
                    {m.signals.length > 0 && <div className="xr-gap__s">{m.signals.map((g) => <span key={g.label} className={`ax-pill ${g.tone}`}>{g.label}</span>)}</div>}
                    <div className="xr-gap__t">{m.title}</div>
                    <div className="xr-gap__m">
                      {m.source?.read && m.source.words ? `${m.rival} has a ${m.source.words.toLocaleString("en-US")}-word page on this. I’d write a better one.` : `${m.rival} has this page. I’d write a better one.`}{" "}
                      <a className="ax-src mut" href={m.source?.url ?? `https://${m.rivalHost}`} target="_blank" rel="noopener noreferrer">{m.source?.url ? "Their page" : m.rivalHost} ↗</a>
                    </div>
                    {m.outline.length > 0 && (
                      <details className="xr-outline">
                        <summary>The page I’d write ({m.outline.length} sections)</summary>
                        <ol>{m.outline.map((x, n) => <li key={n}>{x}</li>)}</ol>
                      </details>
                    )}
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setSheet(m)}>Draft it</Button>
                </div>
              ))}
            </List>
          ) : (
            <EmptyState icon={<Glyph name="inbox" size={22} />} title="No page gaps found yet" text={data.hiddenGaps ? "The gaps I had came from sites that aren’t your competitors, so I left them out. Add a real competitor and I’ll compare again." : "Once I’m watching a competitor, I read their pages and list the ones you don’t have yet."} />
          )}
        </>
      )}

      <Modal
        open={!!adding}
        onClose={() => { if (adding !== "busy") setAdding(false) }}
        title="Add a competitor"
        sub="I read their site and start watching them: what they win at, their weak spots and the pages they have that you don’t."
        dismissible={adding !== "busy"}
        footer={<><Button onClick={() => setAdding(false)} disabled={adding === "busy"}>Cancel</Button><Button variant="primary" loading={adding === "busy"} onClick={() => void add()}>Add them</Button></>}
      >
        <form onSubmit={(e) => { e.preventDefault(); void add() }}>
          <Field label="Their website" error={addErr} hint={adding === "busy" ? "Reading their site. This takes about 20 seconds." : undefined}>
            <TextInput autoFocus placeholder="theirsite.com" value={url} onChange={(e) => setUrl(e.target.value)} disabled={adding === "busy"} inputMode="url" autoComplete="off" />
          </Field>
        </form>
      </Modal>
      {confirmNode}
      {node}
      {ready && <ReadySheet source={ready.source} make={ready.make} flags={{ autopilot: data.autopilot, siteConnected: data.siteConnected, hasSocialAccounts: data.hasSocialAccounts, gmbConnected: data.gmbConnected }} onClose={() => setReady(null)} />}
      {sheet && <DraftSheet move={sheet} cluster={sheetCluster} autopilot={data.autopilot} siteConnected={data.siteConnected} onClose={() => { setSheet(null); setSheetCluster(null) }} />}
    </>
  )
}
