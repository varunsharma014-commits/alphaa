"use client"

// Tracking & Setup → "Speed for real visitors" (Core Web Vitals, field data first; the lab test is
// labelled as such) and "Structured data" (what Google and AI read about you, checked against
// Google's rules and your real details). Data: lib/seo/site-vitals.ts via /api/workspace/vitals.
import { useEffect, useMemo, useState } from "react"
import { CORE, FIX, METRIC_NAME, METRIC_ORDER, METRIC_TECH, RATING_WORD, THRESHOLDS, fmt, sentence, type HistoryPoint, type MetricKey, type Rating, type Strategy, type StrategyResult } from "@/lib/seo/cwv"
import { validateBlocks } from "@/lib/schema/rules"
import type { SiteVitals as Data } from "@/lib/seo/site-vitals"
import type { PageAudit } from "@/lib/schema/audit"
import { toast } from "@/lib/workspace/events"
import { When } from "./ui"

const TONE: Record<Rating, { bg: string; fg: string; dot: string }> = {
  good: { bg: "var(--x-gbg)", fg: "var(--x-gink)", dot: "#34c759" },
  needs: { bg: "var(--x-abg)", fg: "var(--x-amber)", dot: "#ff9500" },
  poor: { bg: "rgba(255,59,48,.1)", fg: "#c93400", dot: "#ff3b30" },
}
const pathOf = (u: string) => { try { const x = new URL(u); return x.pathname === "/" ? "Homepage" : x.pathname } catch { return u } }
const row: React.CSSProperties = { display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", flexWrap: "wrap" }
const sub: React.CSSProperties = { fontSize: 13, color: "var(--x-mut)", marginTop: 3, lineHeight: 1.45 }

function Pill({ r, children }: { r: Rating; children: React.ReactNode }) {
  return <span className="ax-pill" style={{ background: TONE[r].bg, color: TONE[r].fg }}>{children}</span>
}

function Spark({ points, metric }: { points: HistoryPoint[]; metric: MetricKey }) {
  const vals = points.map((p) => p.p75).filter((v): v is number => v != null)
  if (vals.length < 3) return null
  const W = 160, H = 34
  const max = Math.max(...vals, THRESHOLDS[metric][0] * 1.2), min = 0
  const x = (i: number) => (i / (points.length - 1)) * W
  const y = (v: number) => H - ((v - min) / (max - min)) * H
  const d = points.map((p, i) => (p.p75 == null ? null : `${x(i).toFixed(1)},${y(p.p75).toFixed(1)}`)).filter(Boolean).join(" L")
  const good = y(THRESHOLDS[metric][0])
  const last = vals[vals.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${METRIC_NAME[metric]} over ${points.length} weeks, now ${fmt(metric, last)}`}>
      <line x1="0" x2={W} y1={good} y2={good} stroke="#34c759" strokeDasharray="3 3" strokeWidth="1" />
      <path d={`M${d}`} fill="none" stroke="var(--x-blue)" strokeWidth="1.8" />
    </svg>
  )
}

function StrategyBlock({ r, s }: { r: StrategyResult | null; s: Strategy }) {
  if (!r) return <div style={sub}>Google’s test didn’t finish for {s === "mobile" ? "phones" : "computers"} this time.</div>
  const f = r.field
  return (
    <div style={{ marginTop: 6 }}>
      {f ? (
        <>
          <div className="ax-t11" style={{ marginBottom: 4 }}>{f.scope === "page" ? "Real visitors to this page, last 28 days (Chrome UX Report)" : "Real visitors to your whole site, last 28 days (this page has too few visits on its own)"}</div>
          {METRIC_ORDER.map((k) => {
            const m = f.metrics.find((x) => x.key === k)
            if (!m) return null
            return (
              <div key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", flexWrap: "wrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: TONE[m.rating].dot, marginTop: 6, flex: "none" }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <b style={{ fontSize: 14, fontWeight: 600 }}>{METRIC_NAME[k]}</b> <span className="ax-t11">{METRIC_TECH[k]}{CORE.includes(k) ? "" : " · supporting"}</span>
                  {m.rating !== "good" && <div style={sub}>{sentence(m, s)} {FIX[k]}</div>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmt(k, m.p75)}</span>
                <Pill r={m.rating}>{RATING_WORD[m.rating]}</Pill>
              </div>
            )
          })}
        </>
      ) : (
        <div style={sub}>Not enough Chrome visitors yet for Google to report real-visitor speed on {s === "mobile" ? "phones" : "computers"}. The lab test below is all there is for now.</div>
      )}
      {r.lab && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--x-blue)" }}>Lab test (one run on Google’s servers, not real visitors): {r.lab.score ?? "?"}/100</summary>
          <div style={sub}>
            {r.lab.lcp != null && <>Main content {fmt("lcp", r.lab.lcp)} · </>}
            {r.lab.tbt != null && <>Blocking time {fmt("ttfb", r.lab.tbt)} · </>}
            {r.lab.cls != null && <>Layout shift {fmt("cls", r.lab.cls)}</>}
          </div>
          {r.lab.opportunities.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>
              {r.lab.opportunities.map((o) => <li key={o.id} style={{ marginTop: 3 }}>{o.title}{o.savingsMs ? ` (saves about ${fmt("lcp", o.savingsMs)})` : ""}</li>)}
            </ul>
          )}
        </details>
      )}
    </div>
  )
}

export function SiteVitals({ data: initial }: { data: Data }) {
  const [data, setData] = useState(initial)
  const [s, setS] = useState<Strategy>("mobile")
  const [busy, setBusy] = useState(false)
  const [polling, setPolling] = useState(initial.running)
  const [email, setEmail] = useState(initial.webPersonEmail ?? "")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!polling) return
    let n = 0
    const t = window.setInterval(async () => {
      n++
      const d = (await fetch("/api/workspace/vitals").then((r) => r.json()).catch(() => null)) as Data | null
      if (d) setData(d)
      if ((d && !d.running) || n > 45) { setPolling(false); window.clearInterval(t) }
    }, 8000)
    return () => window.clearInterval(t)
  }, [polling])

  async function runNow() {
    setBusy(true)
    const r = await fetch("/api/workspace/vitals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "run" }) }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setBusy(false)
    if (!r?.ok) return toast(d?.error ?? "That didn’t start. Try again in a minute.")
    toast("Checking now. It takes a few minutes.")
    setData((x) => ({ ...x, running: true }))
    setPolling(true)
  }

  async function generate() {
    setBusy(true)
    const r = await fetch("/api/schema/generate", { method: "POST" }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setBusy(false)
    if (!r?.ok) return toast(d?.error ?? "I couldn’t write it just now.")
    setData((x) => ({ ...x, generated: { at: d.generatedAt, items: d.schemas } }))
    toast("Written and checked")
  }

  async function install() {
    setBusy(true)
    const r = await fetch("/api/connect/wp/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "schema" }) }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setBusy(false)
    toast(r?.ok ? "Added to your site" : d?.error ?? "That didn’t go through. Nothing changed.")
  }

  async function sendToWebPerson() {
    setSending(true)
    const r = await fetch("/api/agent/handoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ what: "schema", email }) }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setSending(false)
    toast(r?.ok ? `Sent to ${email}` : d?.error ?? "The email didn’t send.")
  }

  const code = useMemo(() => (data.generated?.items ?? []).map((i) => `<!-- ${i.type} for ${i.pageUrl} -->\n<script type="application/ld+json">\n${JSON.stringify(i.jsonLd, null, 2)}\n</script>`).join("\n\n"), [data.generated])
  const cwv = data.cwv
  const hist = cwv?.history
  const usability = cwv?.pages[0]?.mobile?.usability
  const sd = data.schema

  return (
    <>
      <div className="ax-h2" id="vitals">
        <div>
          <h2>Speed for real visitors</h2>
          <p>{cwv ? <>Google’s Core Web Vitals for your homepage and top pages, <When at={cwv.at} mode="ago" prefix="checked " fallback="checked recently" />. Every week.</> : "Google’s Core Web Vitals: how fast your pages load and react for real visitors, on phones and computers."}</p>
        </div>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cwv && <div className="ax-seg" role="group" aria-label="Device" style={{ minWidth: 190 }}>
            <button type="button" className={s === "mobile" ? "on" : ""} aria-pressed={s === "mobile"} onClick={() => setS("mobile")}>Phones</button>
            <button type="button" className={s === "desktop" ? "on" : ""} aria-pressed={s === "desktop"} onClick={() => setS("desktop")}>Computers</button>
          </div>}
          <button className="ax-btn s sm" type="button" disabled={busy || data.running || polling} onClick={() => void runNow()}>{data.running || polling ? "Checking… (a few minutes)" : "Check now"}</button>
        </span>
      </div>
      {data.keyMissing ? (
        <section className="ax-card ax-empty"><div style={{ flex: 1 }}><b>Speed checks are switched off on my side</b><p>I read these numbers from Google’s PageSpeed Insights, and that connection isn’t set up yet. I won’t guess them. Your structured data check below still runs.</p></div></section>
      ) : !cwv ? (
        <p className="ax-note">{data.cwvFail ? `My last try didn’t get through: ${data.cwvFail.errors.join("; ")}. I’ll try again.` : "No speed check yet. It runs every Thursday, or tap Check now."}</p>
      ) : (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
          {cwv.pages.map((p) => (
            <div key={p.url} style={row}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: "inherit", wordBreak: "break-all" }}>{pathOf(p.url)}</a>
                <StrategyBlock r={p[s]} s={s} />
              </div>
            </div>
          ))}
          {(hist || usability || cwv.viewportMeta != null) && (
            <div style={row}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <b style={{ fontSize: 15 }}>On phones</b>
                {cwv.viewportMeta != null && <div style={sub}>{cwv.viewportMeta ? "Your homepage tells phones to fit the screen (viewport tag)." : "Your homepage has no mobile viewport tag, so phones show a zoomed out desktop page. Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">."}</div>}
                {usability?.fontSize === false && <div style={sub}>Some text is too small to read on a phone without zooming.</div>}
                {usability?.tapTargets === false && <div style={sub}>Some buttons or links are too small or too close together to tap.</div>}
                {hist && (
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
                    {(["lcp", "inp", "cls"] as MetricKey[]).map((k) => hist[k] ? (
                      <div key={k}>
                        <div className="ax-t11">{METRIC_NAME[k]}, {hist[k]!.length} weeks (dashed = Google’s goal)</div>
                        <Spark points={hist[k]!} metric={k} />
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="ax-h2" id="structured-data">
        <div>
          <h2>Structured data{sd ? ` (${sd.totals.errors} error${sd.totals.errors === 1 ? "" : "s"})` : ""}</h2>
          <p>{sd ? <>The facts your pages state in code for Google and AI, checked against Google’s rules and your real details, <When at={sd.at} mode="ago" prefix="checked " fallback="checked recently" />.</> : "The facts your pages state in code for Google and AI (name, address, products, FAQs), checked against Google’s rules."}</p>
        </div>
      </div>
      {sd && sd.mismatches.length > 0 && (
        <section className="ax-card" style={{ padding: "14px 22px", borderColor: "rgba(255,59,48,.35)" }}>
          <b style={{ fontSize: 15 }}>Your site and your profile disagree</b>
          {sd.mismatches.map((m) => (
            <div key={`${m.field}|${m.onSite}`} style={sub}>{pathOf(m.url)} says <b>“{m.onSite}”</b>, your profile says <b>“{m.ours}”</b>. AI repeats whichever it reads, so fix the wrong one.</div>
          ))}
        </section>
      )}
      {!sd ? (
        <p className="ax-note">{data.running || polling ? "Checking your pages now…" : "No check yet. It runs every Thursday, or tap Check now above."}</p>
      ) : (
        <section className="ax-card ax-list" style={{ padding: "2px 22px", marginTop: sd.mismatches.length ? 12 : 0 }}>
          {sd.pages.map((p: PageAudit) => (
            <div key={p.url} style={row}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: p.status == null ? "var(--x-line)" : p.errors ? "#ff3b30" : p.warnings ? "#ffcc00" : p.blocks ? "#34c759" : "var(--x-line)", flex: "none", marginTop: 6 }} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: "inherit", wordBreak: "break-all" }}>{pathOf(p.url)}</a>
                <div style={sub}>{p.status == null ? "I couldn’t open this page." : p.blocks ? `${p.types.join(", ") || "Unknown types"} · ${p.errors} error${p.errors === 1 ? "" : "s"}, ${p.warnings} suggestion${p.warnings === 1 ? "" : "s"}` : "No structured data on this page."}</div>
                {p.parseErrors.map((e, i) => <div key={i} style={{ ...sub, color: "#c93400" }}>A block isn’t valid JSON, so Google ignores all of it: {e.error}</div>)}
                {p.issues.filter((i) => i.level !== "note").length > 0 && (
                  <details style={{ marginTop: 4 }}>
                    <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--x-blue)" }}>What to fix</summary>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>
                      {p.issues.filter((i) => i.level !== "note").slice(0, 12).map((i, k) => (
                        <li key={k} style={{ marginTop: 3, color: i.level === "error" ? "#c93400" : undefined }}>{i.node}: {i.message} <a href={i.doc} target="_blank" rel="noopener noreferrer" style={{ color: "var(--x-blue)" }}>Google’s rule</a></li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {sd && sd.products.length > 0 && (
        <section className="ax-card" style={{ padding: "14px 22px", marginTop: 12 }}>
          <b style={{ fontSize: 15 }}>Product markup I can give you</b>
          <div style={sub}>Built from your store’s own product data (name, price, stock, photos). No ratings, since I don’t have your real ones.</div>
          {sd.products.map((p) => (
            <div key={p.pageUrl} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 180, fontSize: 13.5 }}>{p.name}</span>
              <button className="ax-btn s sm" type="button" onClick={() => { void navigator.clipboard?.writeText(`<script type="application/ld+json">\n${JSON.stringify(p.jsonLd, null, 2)}\n</script>`); toast("Copied") }}>Copy the code</button>
            </div>
          ))}
        </section>
      )}

      <section className="ax-card" style={{ padding: "16px 22px", marginTop: 12 }}>
        <b style={{ fontSize: 15 }}>What I’d add</b>
        {!data.generated?.items.length ? (
          <>
            <div style={sub}>Your business details (name, address, phone, logo) and an FAQ block built only from questions and answers already on your site. I check every block against Google’s rules before I offer it.</div>
            <button className="ax-btn p sm" type="button" style={{ marginTop: 10 }} disabled={busy} onClick={() => void generate()}>{busy ? "Writing…" : "Write my structured data"}</button>
          </>
        ) : (
          <>
            {data.generated.items.map((i) => {
              const v = validateBlocks([i.jsonLd])
              return (
                <div key={`${i.type}|${i.pageUrl}`} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ flex: 1, minWidth: 180, fontSize: 13.5 }}><b style={{ fontWeight: 600 }}>{i.type}</b> <span className="ax-t11">for {i.pageUrl === "/" ? "every page" : i.pageUrl}</span></span>
                  {v.errors ? <Pill r="poor">{v.errors} error{v.errors === 1 ? "" : "s"}</Pill> : <Pill r="good">Passes Google’s rules</Pill>}
                </div>
              )
            })}
            <div style={{ ...sub, marginTop: 10 }}>{data.install.how} {data.install.posts}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
              {data.install.auto && <button className="ax-btn p sm" type="button" disabled={busy} onClick={() => void install()}>Add it to my site</button>}
              <button className="ax-btn s sm" type="button" onClick={() => { void navigator.clipboard?.writeText(code); toast("Copied") }}>Copy the code</button>
              <button className="ax-btn s sm" type="button" disabled={busy} onClick={() => void generate()}>Write it again</button>
            </div>
            {!data.install.auto && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your web person’s email" aria-label="Your web person’s email" style={{ flex: 1, minWidth: 200, padding: "7px 12px", borderRadius: 999, border: "1px solid var(--x-line)", fontSize: 13, background: "var(--x-surf)", color: "inherit" }} />
                <button className="ax-btn s sm" type="button" disabled={sending || !/^\S+@\S+\.\S+$/.test(email)} onClick={() => void sendToWebPerson()}>{sending ? "Sending…" : "Send it to my web person"}</button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
