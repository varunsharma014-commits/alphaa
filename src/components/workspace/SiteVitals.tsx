"use client"

// Tracking & Setup → Site health → "Speed for real visitors" (Core Web Vitals, field data first;
// the lab test is labelled as such) and "What your pages tell Google and AI" (structured data,
// checked against Google's rules and your real details). Data: lib/seo/site-vitals.ts via
// /api/workspace/vitals. Plain names only: no schema type names or code on screen until the
// owner opens "Show the code".
import { useEffect, useMemo, useState } from "react"
import { CORE, FIX, METRIC_NAME, METRIC_ORDER, RATING_WORD, THRESHOLDS, fmt, sentence, type HistoryPoint, type MetricKey, type Rating, type Strategy, type StrategyResult } from "@/lib/seo/cwv"
import { validateBlocks } from "@/lib/schema/rules"
import type { SiteVitals as Data } from "@/lib/seo/site-vitals"
import type { PageAudit } from "@/lib/schema/audit"
import { toast } from "@/lib/workspace/events"
import { Button, CodeBlock, EmptyState, Field, Glyph, List, ListRow, Pill, SectionHeader, Segmented, StatusDot, TextInput, When } from "./ui"
import "./p3.css"

const TONE: Record<Rating, "ok" | "warn" | "bad"> = { good: "ok", needs: "warn", poor: "bad" }
const pathOf = (u: string) => { try { const x = new URL(u); return x.pathname === "/" ? "Homepage" : x.pathname } catch { return u } }

// Structured data type names → what an owner calls them.
const TYPE_WORD: [RegExp, string][] = [
  [/^(Organization|Corporation|LocalBusiness)$/, "Business details"],
  [/^WebSite$/, "Site name"],
  [/^WebPage$/, "Page details"],
  [/^FAQPage$/, "Questions and answers"],
  [/^(Product|ProductGroup|Offer)$/, "Products"],
  [/^BreadcrumbList$/, "Page path"],
  [/^(Article|BlogPosting|NewsArticle)$/, "Article details"],
  [/^(Review|AggregateRating)$/, "Ratings"],
  [/^HowTo$/, "How to steps"],
  [/^(Event)$/, "Events"],
  [/^(Person)$/, "Person"],
  [/^(ImageObject|VideoObject)$/, "Media"],
]
const typeWord = (t: string) => TYPE_WORD.find(([re]) => re.test(t))?.[1] ?? "Business details"
const typeWords = (ts: string[]) => [...new Set(ts.map(typeWord))].join(", ")

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
      <line x1="0" x2={W} y1={good} y2={good} stroke="var(--x-ok)" strokeDasharray="3 3" strokeWidth="1" />
      <path d={`M${d}`} fill="none" stroke="var(--x-blue)" strokeWidth="1.8" />
    </svg>
  )
}

function StrategyBlock({ r, s }: { r: StrategyResult | null; s: Strategy }) {
  if (!r) return <div className="x3-ev">Google’s test didn’t finish for {s === "mobile" ? "phones" : "computers"} this time.</div>
  const f = r.field
  return (
    <div>
      {f ? (
        <>
          <div className="x3-ev">{f.scope === "page" ? "Real visitors to this page, last 28 days" : "Real visitors to your whole site, last 28 days (this page has too few visits on its own)"}</div>
          {METRIC_ORDER.filter((k) => CORE.includes(k)).map((k) => {
            const m = f.metrics.find((x) => x.key === k)
            if (!m) return null
            return (
              <div key={k} className="x3-metric">
                <StatusDot tone={TONE[m.rating]} />
                <div className="x3-metric__b">
                  <b>{METRIC_NAME[k]}</b>
                  {m.rating !== "good" && <span className="x3-ev">{sentence(m, s)} {FIX[k]}</span>}
                </div>
                <span className="x3-metric__v">{fmt(k, m.p75)}</span>
                <Pill tone={TONE[m.rating]}>{RATING_WORD[m.rating]}</Pill>
              </div>
            )
          })}
        </>
      ) : (
        <div className="x3-ev">Not enough Chrome visitors yet for Google to report real visitor speed on {s === "mobile" ? "phones" : "computers"}. The lab test below is all there is for now.</div>
      )}
      {r.lab && (
        <details className="x3-fold">
          <summary>Lab test, one run on Google’s computers: {r.lab.score ?? "?"} out of 100</summary>
          <ul>
            {r.lab.lcp != null && <li>Main content shows in {fmt("lcp", r.lab.lcp)}</li>}
            {r.lab.tbt != null && <li>Page is busy for {fmt("ttfb", r.lab.tbt)} before it reacts</li>}
            {r.lab.cls != null && <li>Layout moves {fmt("cls", r.lab.cls)} while loading</li>}
            {r.lab.opportunities.map((o) => <li key={o.id}>{o.title}{o.savingsMs ? ` (saves about ${fmt("lcp", o.savingsMs)})` : ""}</li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

export function SiteVitals({ data: initial }: { data: Data }) {
  const [data, setData] = useState(initial)
  const [s, setS] = useState<Strategy>("mobile")
  const [busy, setBusy] = useState<string | null>(null)
  const [polling, setPolling] = useState(initial.running)
  const [email, setEmail] = useState(initial.webPersonEmail ?? "")

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
    setBusy("run")
    const r = await fetch("/api/workspace/vitals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "run" }) }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setBusy(null)
    if (!r?.ok) return toast(d?.error ?? "That didn’t start. Try again in a minute.")
    toast("Checking now. It takes a few minutes.")
    setData((x) => ({ ...x, running: true }))
    setPolling(true)
  }

  async function generate() {
    setBusy("gen")
    const r = await fetch("/api/schema/generate", { method: "POST" }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setBusy(null)
    if (!r?.ok) return toast(d?.error ?? "I couldn’t write it just now.")
    setData((x) => ({ ...x, generated: { at: d.generatedAt, items: d.schemas } }))
    toast("Written and checked")
  }

  async function install() {
    setBusy("install")
    const r = await fetch("/api/connect/wp/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "schema" }) }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setBusy(null)
    toast(r?.ok ? "Added to your site" : d?.error ?? "That didn’t go through. Nothing changed.")
  }

  async function sendToWebPerson() {
    setBusy("send")
    const r = await fetch("/api/agent/handoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ what: "schema", email }) }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setBusy(null)
    toast(r?.ok ? `Sent to ${email}` : d?.error ?? "The email didn’t send.")
  }

  const code = useMemo(() => (data.generated?.items ?? []).map((i) => `<script type="application/ld+json">\n${JSON.stringify(i.jsonLd, null, 2)}\n</script>`).join("\n\n"), [data.generated])
  const cwv = data.cwv
  const hist = cwv?.history
  const usability = cwv?.pages[0]?.mobile?.usability
  const sd = data.schema
  const running = data.running || polling

  return (
    <>
      <section id="vitals">
        <SectionHeader
          title="Speed for real visitors"
          sub={cwv ? <>Your homepage and top pages, <When at={cwv.at} mode="ago" prefix="checked " fallback="checked recently" />. I check every week.</> : "How fast your pages load and react for real visitors, on phones and computers."}
          end={<span className="x3-acts">
            {cwv && <Segmented label="Device" size="sm" value={s} onChange={setS} options={[{ value: "mobile", label: "Phones" }, { value: "desktop", label: "Computers" }]} />}
            <Button size="sm" loading={busy === "run" || running} onClick={() => void runNow()}>{running ? "Checking, a few minutes" : "Check now"}</Button>
          </span>}
        />
        {data.keyMissing ? (
          <EmptyState icon={<Glyph name="clock" size={22} />} title="Speed checks are switched off on my side" text="I read these numbers from Google’s PageSpeed Insights, and that connection isn’t set up yet. I won’t guess them. The checks below still run." />
        ) : !cwv ? (
          <p className="ax-note x3-flat">{data.cwvFail ? "My last try didn’t get through. I’ll try again." : "No speed check yet. It runs every Thursday, or tap Check now."}</p>
        ) : (
          <List card label="Speed by page">
            {cwv.pages.map((p) => (
              <ListRow key={p.url} title={<a className="x3-path" href={p.url} target="_blank" rel="noopener noreferrer">{pathOf(p.url)}</a>} meta={<StrategyBlock r={p[s]} s={s} />} />
            ))}
            {(hist || usability || cwv.viewportMeta != null) && (
              <ListRow
                title="On phones"
                meta={<>
                  {cwv.viewportMeta != null && <span className="x3-ev">{cwv.viewportMeta ? "Your homepage fits phone screens." : "Your homepage doesn’t tell phones to fit the screen, so phones show a zoomed out desktop page. Your web person can fix this in a minute."}</span>}
                  {usability?.fontSize === false && <span className="x3-ev">Some text is too small to read on a phone without zooming.</span>}
                  {usability?.tapTargets === false && <span className="x3-ev">Some buttons or links are too small or too close together to tap.</span>}
                  {hist && (
                    <span className="x3-sparks">
                      {(["lcp", "inp", "cls"] as MetricKey[]).map((k) => hist[k] ? (
                        <span key={k}>
                          <span className="x3-ev">{METRIC_NAME[k]}, {hist[k]!.length} weeks (dashed line = Google’s goal)</span>
                          <Spark points={hist[k]!} metric={k} />
                        </span>
                      ) : null)}
                    </span>
                  )}
                </>}
              />
            )}
          </List>
        )}
      </section>

      <section id="structured-data">
        <SectionHeader
          title="What your pages tell Google and AI"
          sub={sd ? <>The facts your pages state in code (name, address, products, questions), checked against Google’s rules and your real details, <When at={sd.at} mode="ago" prefix="checked " fallback="checked recently" />.</> : "The facts your pages state in code (name, address, products, questions), checked against Google’s rules."}
          end={sd ? <Pill tone={sd.totals.errors ? "bad" : "ok"} dot>{sd.totals.errors ? `${sd.totals.errors} to fix` : "No errors"}</Pill> : undefined}
        />
        <div className="x3-col">
          {sd && sd.mismatches.length > 0 && (
            <section className="ax-card x3-alert">
              <StatusDot tone="bad" />
              <div>
                <b>Your site and your profile disagree</b>
                {sd.mismatches.map((m) => (
                  <span key={`${m.field}|${m.onSite}`}>{pathOf(m.url)} says “{m.onSite}”, your profile says “{m.ours}”. AI repeats whichever it reads, so fix the wrong one.</span>
                ))}
              </div>
            </section>
          )}
          {!sd ? (
            <p className="ax-note x3-flat">{running ? "Checking your pages now." : "No check yet. It runs every Thursday, or tap Check now above."}</p>
          ) : (
            <List card label="Pages checked">
              {sd.pages.map((p: PageAudit) => {
                const issues = p.issues.filter((i) => i.level !== "note")
                return (
                  <ListRow
                    key={p.url}
                    lead={<StatusDot tone={p.status == null || !p.blocks ? "idle" : p.errors ? "bad" : p.warnings ? "warn" : "ok"} />}
                    title={<a className="x3-path" href={p.url} target="_blank" rel="noopener noreferrer">{pathOf(p.url)}</a>}
                    meta={<>
                      <span className="x3-ev">{p.status == null ? "I couldn’t open this page." : p.blocks ? `${typeWords(p.types)}. ${p.errors ? `${p.errors} to fix` : "Nothing to fix"}${p.warnings ? `, ${p.warnings} suggestion${p.warnings === 1 ? "" : "s"}` : ""}.` : "This page doesn’t describe itself to Google and AI."}</span>
                      {p.parseErrors.length > 0 && <span className="x3-ev x3-warn">One block has a typo in its code, so Google ignores all of it.</span>}
                      {issues.length > 0 && (
                        <details className="x3-fold">
                          <summary>What to fix</summary>
                          <ul>
                            {issues.slice(0, 12).map((i, k) => <li key={k} className={i.level === "error" ? "x3-warn" : undefined}>{i.message} <a className="ax-lnk" href={i.doc} target="_blank" rel="noopener noreferrer">Google’s rule</a></li>)}
                          </ul>
                        </details>
                      )}
                    </>}
                  />
                )
              })}
            </List>
          )}

          {sd && sd.products.length > 0 && (
            <section className="ax-card x3-pad">
              <SectionHeader first title="Product details I can give you" sub="Built from your store’s own product data (name, price, stock, photos). No ratings, since I don’t have your real ones." />
              {sd.products.map((p) => (
                <CodeBlock key={p.pageUrl} title={p.name} where="Goes in the page’s head section" foldAt={4} copyLabel="Copy the code" code={`<script type="application/ld+json">\n${JSON.stringify(p.jsonLd, null, 2)}\n</script>`} />
              ))}
            </section>
          )}

          <section className="ax-card x3-pad">
            <SectionHeader first title="What I’d add" sub={!data.generated?.items.length ? "Your business details (name, address, phone, logo) and questions and answers already on your site. I check every block against Google’s rules before I offer it." : `${data.install.how} ${data.install.posts}`} />
            {!data.generated?.items.length ? (
              <div className="x3-acts"><Button variant="primary" loading={busy === "gen"} onClick={() => void generate()}>Write it for me</Button></div>
            ) : (
              <>
                <List label="What I’d add">
                  {data.generated.items.map((i) => {
                    const v = validateBlocks([i.jsonLd])
                    return <ListRow key={`${i.type}|${i.pageUrl}`} title={typeWord(i.type)} meta={i.pageUrl === "/" ? "On every page" : `On ${i.pageUrl}`} end={v.errors ? <Pill tone="bad">{v.errors} to fix</Pill> : <Pill tone="ok" dot>Passes Google’s rules</Pill>} />
                  })}
                </List>
                <div className="x3-acts">
                  {data.install.auto && <Button variant="primary" loading={busy === "install"} onClick={() => void install()}>Add it for me</Button>}
                  <Button loading={busy === "gen"} onClick={() => void generate()}>Write it again</Button>
                </div>
                <details className="x3-fold">
                  <summary>Show the code</summary>
                  <CodeBlock code={code} title="Your business details for Google and AI" where={data.install.auto ? "I add this to your site for you. Copy it only if you want it somewhere else." : "Paste it into your site’s head code, or send it to your web person."} copyLabel="Copy the code" />
                </details>
                {!data.install.auto && (
                  <div className="x3-inline">
                    <Field label="Your web person’s email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></Field>
                    <Button size="sm" loading={busy === "send"} disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={() => void sendToWebPerson()}>Send it to them</Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </>
  )
}
