"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { ResearchData } from "@/lib/workspace/research"
import type { AttackCard, MoveCard } from "@/lib/workspace/rivals"
import { askAlphaa, ISLAND_EVENT, toast } from "@/lib/workspace/events"
import { CopyButton, Empty, Tabs, When, useInspector } from "./ui"
import { DraftSheet } from "./DraftSheet"
import { RepurposeButton } from "./RepurposeButton"
import { ReadySheet, type ReadySource } from "./ReadySheet"
import { TopicPlan } from "./TopicPlan"

type Tab = "w" | "t" | "i" | "g" | "c"

export function ResearchView({ data }: { data: ResearchData }) {
  const { node, open } = useInspector()
  const [tab, setTab] = useState<Tab>("w")
  const [all, setAll] = useState(false)
  const [sheet, setSheet] = useState<MoveCard | null>(null)
  const [ready, setReady] = useState<{ source: ReadySource; make: boolean } | null>(null)
  const [gone, setGone] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState<false | "open" | "busy">(false)
  const [url, setUrl] = useState("")
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
    if (!u) return
    setAdding("busy")
    const res = await fetch("/api/competitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: /^https?:\/\//i.test(u) ? u : `https://${u}` }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    if (!res?.ok) { setAdding("open"); return toast(d?.error ?? "I couldn’t read that site. Check the address.") }
    setAdding(false)
    setUrl("")
    toast("Added. I read their site and I’m watching them now.")
    router.refresh()
  }

  const sub = tab === "w" ? `${data.summary}${data.droppedPosts ? ` I left out ${data.droppedPosts} that were off-topic or below typical engagement.` : ""}`
    : tab === "i" ? null
      : tab === "g" ? (data.compared ? `I compared your site with ${data.compared} competitor site${data.compared === 1 ? "" : "s"}. These are the pages they have that you don’t.` : "I compare your site with your competitors’ and list the pages they have that you don’t.")
        : null

  return (
    <>
      <h1 className="ax-h1">Research & Ideas</h1>
      {tab === "t" ? <p className="ax-sub">Your main topics, the pages around each one, and what’s written so far.</p> : tab === "i" ? <p className="ax-sub">From your analytics and AI checks{data.ideasAt ? <> · updated <When at={data.ideasAt} mode="ago" fallback="recently" /></> : null}</p> : tab !== "c" ? <p className="ax-sub">{sub}</p> : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
          <p className="ax-sub" style={{ margin: 0, flex: 1, minWidth: 220 }}>
            Tracking {comps.length} competitor{comps.length === 1 ? "" : "s"}{data.lastChecked ? <> · last checked <When at={data.lastChecked} mode="ago" fallback="recently" /></> : null}
          </p>
          <Link className="ax-btn s sm" href="/dashboard/citations">AI share of voice & sources →</Link>
          {adding ? (
            <form onSubmit={(e) => { e.preventDefault(); void add() }} style={{ display: "flex", gap: 6 }}>
              <input className="ax-input" autoFocus placeholder="theirsite.com" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Competitor website" disabled={adding === "busy"} />
              <button className="ax-btn p sm" type="submit" disabled={adding === "busy"}>{adding === "busy" ? "Reading…" : "Add"}</button>
              <button className="ax-btn s sm" type="button" onClick={() => setAdding(false)} disabled={adding === "busy"}>Cancel</button>
            </form>
          ) : <button className="ax-btn s sm" type="button" onClick={() => setAdding("open")}>+ Add competitor</button>}
        </div>
      )}

      {data.top && (
        <section className="ax-card ax-move">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ax-eb" style={{ color: "var(--x-blue)", display: "flex", gap: 6, alignItems: "center" }}><span className="ax-orb" style={{ width: 12, height: 12 }} />My #1 move this week</div>
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
            ? <button className="ax-btn p" type="button" onClick={() => setSheet(t.move)}>Draft it</button>
            : <button className="ax-btn p" type="button" onClick={() => askAlphaa({ chip: t.card.makeChip })}>Make my version</button> })()}
        </section>
      )}
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ key: "w", label: "What’s working nearby" }, { key: "t", label: "Topic plan" }, { key: "i", label: "Ideas & hooks" }, { key: "g", label: "Blog & page gaps" }, { key: "c", label: "Competitors" }]} />

      {tab === "w" && (
        <>
          {working.length ? (
            <div className="ax-g2">
              {working.map((w) => (
                <article key={w.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                  <div className={`ax-art${w.thumb ? " img" : ""}`} style={{ height: 170, background: w.thumb ? `#111 url("${w.thumb}") center/cover` : w.art }}>
                    <span style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between" }}>
                      <span className="ax-pill w">{w.where}{w.duration ? ` · ${w.duration}` : ""}</span>
                      {w.format && <span className="ax-pill w">{w.format}</span>}
                    </span>
                    {!w.thumb && <b style={{ fontSize: w.hook ? 17 : 18, lineHeight: 1.3, fontWeight: w.hook ? 600 : 700 }}>{w.hook ? `“${w.hook}”` : w.title}</b>}
                  </div>
                  <div className="ax-cb">
                    {w.thumb && w.hook && <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>“{w.hook}”</p>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {w.badge && <span className="ax-proof">{w.badge}</span>}
                      {w.stats.length > 0 && <span className="ax-t11" style={{ fontSize: 12 }}>{w.stats.map((x) => `${x.v} ${x.k.toLowerCase()}`).join(" · ")}</span>}
                    </div>
                    {w.use && <p className="ax-p"><b style={{ color: "var(--x-ink)", fontWeight: 600 }}>My version: </b>{w.use}</p>}
                    <div className="ax-ft">
                      <a className="ax-src" href={w.url} target="_blank" rel="noopener noreferrer">Source ↗</a>
                      <span style={{ display: "flex", gap: 8 }}>
                        <button className="ax-btn s sm" type="button" onClick={() => setReady({ source: { kind: "niche", card: w }, make: false })}>X-Ray</button>
                        <button className="ax-btn p sm" type="button" onClick={() => setReady({ source: { kind: "niche", card: w }, make: true })}>Make my version</button>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 22 }}>
              <Empty
                title={data.nicheOn ? "I haven’t looked at your niche yet" : "Niche research isn’t switched on yet"}
                text={data.nicheOn ? `I read the top YouTube videos for businesses like yours${data.instagram === "on" ? ", the top Instagram posts and what your competitors post there" : ""}, then show you what works with a link to each one.${data.instagram === "connect" ? " I’ll show what’s working on Instagram once you connect it." : data.instagram === "pending" ? " I’ll add Instagram as soon as Meta approves Alphaa to read post stats." : ""}` : "It needs our research service, which isn’t set up on this account yet. Your ideas, page gaps and competitors below still work."}
                act={data.nicheOn ? { label: "Look now", topic: "niche", primary: true } : null}
              />
            </div>
          )}
          {data.working.length > 0 && data.instagram !== "on" && <p className="ax-note">{data.instagram === "connect" ? "I’ll show what’s working on Instagram once you connect it." : "I’ll add Instagram as soon as Meta approves Alphaa to read post stats."}</p>}
          {data.working.length > 0 && data.working.length < 3 && <p className="ax-note">Only {data.working.length} post{data.working.length === 1 ? "" : "s"} beat the typical engagement in your niche in my last look. I don’t pad this list.</p>}
          {data.working.length > 4 && <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}><button className="ax-btn s" type="button" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${data.working.length}`}</button></div>}
          {data.trends.length > 0 && (
            <>
              <div className="ax-h2"><div><h2>Timely this week</h2><p>From a live web search. Each one links to where I found it.</p></div></div>
              <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
                {data.trends.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}><b style={{ fontSize: 15 }}>{t.title}</b><div className="ax-p" style={{ marginTop: 3 }}>{t.why}</div></div>
                    {t.when && <span className="ax-pill n">{t.when}</span>}
                    <a className="ax-src" href={t.url} target="_blank" rel="noopener noreferrer">Source ↗</a>
                  </div>
                ))}
              </section>
            </>
          )}
        </>
      )}

      {tab === "t" && <TopicPlan view={data.clusters} autopilot={data.autopilot} siteConnected={data.siteConnected} webPersonEmail={data.webPersonEmail} />}

      {tab === "i" && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 22 }}>
          {data.topIdea && (
            <section className="ax-card ax-move" style={{ marginTop: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span className="ax-eb" style={{ color: "var(--x-blue)" }}>My top pick this week</span>{data.topIdea.proof && <span className="ax-proof">{data.topIdea.proof}</span>}</div>
                <p className="t">{data.topIdea.hook ? `“${data.topIdea.hook}”` : data.topIdea.text}</p>
                <p className="s">{data.topIdea.why}</p>
              </div>
              <button className="ax-btn p" type="button" onClick={() => setReady({ source: { kind: "idea", idea: data.topIdea! }, make: true })}>Write it</button>
            </section>
          )}
          {data.ideas.length ? (
            <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
              {data.ideas.filter((h) => h !== data.topIdea).map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}><span className="ax-pill n">{h.kind}</span>{h.proof && <span className="ax-proof">{h.proof}</span>}</div>
                    {h.hook ? <><div style={{ fontSize: 16, fontWeight: 700 }}>“{h.hook}”</div><div className="ax-p" style={{ marginTop: 2 }}>{h.text}</div></> : <div style={{ fontSize: 16, fontWeight: 600 }}>{h.text}</div>}
                    {h.why && <div className="ax-p" style={{ marginTop: 4 }}>{h.why}</div>}
                  </div>
                  <button className="ax-btn p sm" type="button" onClick={() => setReady({ source: { kind: "idea", idea: h }, make: true })}>Write it</button>
                </div>
              ))}
            </section>
          ) : (
            <Empty title="No ideas from your numbers yet" text="Once a week I compare your Google searches, visits and AI answers with your competitors, and suggest what to make next." act={{ label: "Look at my numbers", topic: "insights", primary: true }} />
          )}
          <div>
            <div className="ax-h2" style={{ marginTop: 8 }}><div><h2>Hooks for your ads</h2><p>Opening lines from your ad plan, checked for claims I can back up.</p></div>{data.strategyAt && <a className="ax-src" href="/dashboard/ad-strategy">Open the full plan</a>}</div>
            {data.hooks.length ? (
              <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
                {data.hooks.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 0" }}>
                    <div style={{ flex: 1, minWidth: 0 }}><span className="ax-pill n" style={{ marginBottom: 6 }}>{h.kind}</span><div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 6 }}>“{h.text}”</div></div>
                    <CopyButton text={h.text} />
                  </div>
                ))}
              </section>
            ) : (
              <Empty title="No ad plan yet" text="Your ad plan has the hooks, scripts and budget split, built from what your competitors run." act={{ label: "Make my ad plan", topic: "adplan", primary: true }} />
            )}
          </div>
        </div>
      )}

      {tab === "g" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
          {moves.length ? moves.map((m) => (
            <article key={m.id} className="ax-card hv" style={{ padding: "20px 22px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                {m.signals.length > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>{m.signals.map((g) => <span key={g.label} className={`ax-pill ${g.tone}`}>{g.label}</span>)}</div>}
                <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-.015em" }}>{m.title}</div>
                <div className="ax-p" style={{ marginTop: 4 }}>
                  {m.source?.read && m.source.words ? <>{m.rival} has a {m.source.words.toLocaleString("en-US")}-word page on this · </> : `Covers what ${m.rival} covers, better · `}
                  <a className="ax-src mut" href={m.source?.url ?? `https://${m.rivalHost}`} target="_blank" rel="noopener noreferrer">{m.source?.url ? "their page" : m.rivalHost} ↗</a>
                </div>
              </div>
              <span style={{ display: "flex", gap: 8 }}>
                {m.outline.length > 0 && <button className="ax-btn s sm" type="button" onClick={() => open({ eb: "The page I’d write", title: m.title, rows: [...m.outline.map((x, n) => ({ k: `Section ${n + 1}`, v: x, box: true })), ...(m.source?.headings.length ? [{ k: "Their page covers", v: m.source.headings.join(" · "), box: true }] : []), { k: "Why", v: m.why ? `Because ${m.why}.` : `${m.rival} has a page on this and you don’t.` }] })}>Outline</button>}
                <button className="ax-btn p sm" type="button" onClick={() => setSheet(m)}>Draft it</button>
              </span>
            </article>
          )) : null}
          {!moves.length && (
            <Empty title="No page gaps found yet" text={data.hiddenGaps ? "The gaps I had came from sites that aren’t your competitors, so I left them out. Add a real competitor and I’ll compare again." : "I compare your site with a competitor’s and list the pages they have that you don’t."} act={{ label: "Find them", href: "/dashboard/content-gaps", primary: true }} />
          )}
          {data.published.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="ax-h2"><div><h2>Pages I published</h2><p>Turn any of them into a social post, a LinkedIn post, a Google update, an email and a video script. Each waits for your OK.</p></div></div>
              <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
                {data.published.map((p) => (
                  <div key={p.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{p.title}</div>
                      <div className="ax-p" style={{ marginTop: 2 }}>Published <When at={p.at} mode="ago" fallback="recently" />{p.url ? <> · <a className="ax-src mut" href={p.url} target="_blank" rel="noopener noreferrer">open ↗</a></> : null}</div>
                    </div>
                    <RepurposeButton draftId={p.id} done={p.repurposed} />
                  </div>
                ))}
              </section>
            </div>
          )}
        </div>
      )}

      {tab === "c" && data.compGaps.length > 0 && (
        <section style={{ marginTop: 22, background: "rgba(0,113,227,.07)", border: "1px solid rgba(0,113,227,.18)", borderRadius: 18, padding: "16px 18px" }}>
          <div className="ax-eb" style={{ color: "var(--x-blue)", marginBottom: 6 }}>The gaps I’m taking, from what they advertise</div>
          {data.compGaps.map((g, i) => <div key={i} style={{ fontSize: 14, padding: "3px 0" }}>{g}</div>)}
        </section>
      )}
      {tab === "c" && (
        comps.length ? (
          <div className="ax-g3" style={{ marginTop: 22 }}>
            {comps.map((c) => (
              <article key={c.id} className="ax-card hv ax-rival" onClick={() => open({ eb: [c.tag, c.manual ? "Added by you" : null].filter(Boolean).join(" · ") || "Competitor", title: c.name, rows: [...c.detail.map((d) => (d.href ? { k: d.k, v: d.v, href: d.href } : { k: d.k, v: d.v, box: d.k === "Winning at" || d.k === "Weak spots" })), { k: "Their site", v: c.host, href: c.site }], cta: c.primary?.move ? null : c.primary?.topic ? { label: c.primary.label, topic: c.primary.topic } : c.primary?.chip ? { label: c.primary.label, chip: c.primary.chip } : null })} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLElement).click() }}>
                <button className="ax-dismiss" type="button" title="Not a competitor" aria-label={`${c.name} is not a competitor`} onClick={(e) => { e.stopPropagation(); void dismiss(c) }}>× Not a competitor</button>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <img src={c.favicon} alt="" width={28} height={28} className="ax-fav" loading="lazy" />
                  <b style={{ fontSize: 16, minWidth: 0, overflowWrap: "anywhere", lineHeight: 1.25 }}>{c.name}</b>
                  {c.tag && <span className={`ax-pill ${c.tag === "Ad spender" ? "a" : c.tag === "Content machine" ? "b" : "n"}`} style={{ marginLeft: "auto" }}>{c.tag}</span>}
                </div>
                <div className="ax-lines">
                  {c.winning && <div><span>Winning at</span>{c.winning}</div>}
                  {c.weak && <div><span>Weak spot</span>{c.weak}</div>}
                  {c.counter && <div><span>My counter-move</span>{c.counter}</div>}
                  {c.instagram && !c.winning?.startsWith("Instagram") && <div><span>Instagram</span>{c.instagram.line}</div>}
                  {!c.winning && !c.weak && !c.counter && !c.instagram && <div className="ax-t11" style={{ fontSize: 13 }}>I couldn’t read enough of their site yet. I’ll try again on my next weekly pass.</div>}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: "auto", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                  {c.primary && <button className="ax-btn p sm" type="button" onClick={() => { const p = c.primary!; if (p.move) setSheet(p.move); else askAlphaa({ topic: p.topic, chip: p.chip, label: p.topic ? p.label : undefined }) }}>{c.primary.label}</button>}
                  <a className="ax-src" href={c.site} target="_blank" rel="noopener noreferrer">Their site ↗</a>
                  {c.adUrl && <a className="ax-src" href={c.adUrl} target="_blank" rel="noopener noreferrer">Their ads ↗</a>}
                  {c.instagram && <a className="ax-src" href={c.instagram.url} target="_blank" rel="noopener noreferrer">Their Instagram ↗</a>}
                  {c.instagram?.make && <button className="ax-btn s sm" type="button" onClick={() => askAlphaa({ chip: c.instagram!.make! })}>Make my version</button>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 22 }}><Empty title="I’m not watching any competitors yet" text={data.hiddenComps ? "The sites I had found weren’t real competitors (wikis, directories or other industries), so I left them out. Add one you know, and I’ll keep looking." : "I find them from Google and from the businesses the AIs name instead of you, or you can add them."} /></div>
        )
      )}
      {tab === "c" && data.hiddenComps > 0 && comps.length > 0 && <p className="ax-note">I left out {data.hiddenComps} site{data.hiddenComps === 1 ? "" : "s"} that aren’t competitors (wikis, directories, platforms or other industries).</p>}
      {node}
      {ready && <ReadySheet source={ready.source} make={ready.make} flags={{ autopilot: data.autopilot, siteConnected: data.siteConnected, hasSocialAccounts: data.hasSocialAccounts, gmbConnected: data.gmbConnected }} onClose={() => setReady(null)} />}
      {sheet && <DraftSheet move={sheet} autopilot={data.autopilot} siteConnected={data.siteConnected} onClose={() => setSheet(null)} />}
    </>
  )
}
