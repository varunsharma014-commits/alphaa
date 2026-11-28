"use client"

import { useCallback, useEffect, useState } from "react"
import { askAlphaa, toast } from "@/lib/workspace/events"
import type { AdRule, RuleMetric } from "@/lib/ad-rules/engine"
import { CopyButton } from "./ui"

// Three Ads tabs that load their own data: Your rules (the owner's ad rules, plain-English
// builder + presets), Promote a post (organic post → paused ad → owner turns it on) and Share a
// report (signed read-only links + the monthly email).

async function call<T>(url: string, body?: unknown): Promise<(T & { said?: string }) | null> {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined).catch(() => null)
  const d = (await res?.json().catch(() => null)) as (T & { error?: string; said?: string }) | null
  if (!res?.ok) { toast(d?.error ?? "That didn’t work. Nothing changed."); return null }
  if (d?.said) toast(d.said)
  return d
}

const sel = { width: "auto", borderRadius: 10, padding: "6px 8px" } as const
const num = { width: 90, borderRadius: 10 } as const
const card = { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 } as const

// ── Your rules ───────────────────────────────────────────────────────────────
type RulesData = { rules: (AdRule & { text: string })[]; presets: { key: string; label: string; rule: Omit<AdRule, "id" | "createdAt" | "on" | "campaign"> }[]; lastRun: string | null; currency: string; campaigns: { key: string; label: string; platform: "meta" | "google" }[]; canChangeBudget: boolean; hasLimit: boolean; googleOn: boolean; preview?: { ruleId: string; kind: string; why: string }[]; waiting?: number; errors?: string[] }
type Draft = Partial<AdRule> & { budgetDir?: "up" | "down" }

const METRICS: { v: RuleMetric; label: string; unit: "money" | "pct" | "n" | "x" }[] = [
  { v: "cpl", label: "cost per lead", unit: "money" },
  { v: "spend", label: "spend", unit: "money" },
  { v: "conversions", label: "leads", unit: "n" },
  { v: "ctr", label: "click rate", unit: "pct" },
  { v: "cpc", label: "cost per click", unit: "money" },
  { v: "frequency", label: "frequency (times seen)", unit: "n" },
  { v: "roas", label: "return on ad spend (when sales are tracked)", unit: "x" },
]
const blank: Draft = { action: "pause", level: "ad", platform: "all", campaign: null, metric: "cpl", op: "gt", value: 30, minSpend: 60, minImpressions: 0, days: 30, budgetPct: 20, budgetDir: "up" }

export function AdRulesPanel() {
  const [d, setD] = useState<RulesData | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => setD(await call<RulesData>("/api/workspace/ad-rules")), [])
  useEffect(() => { void load() }, [load])
  if (!d) return <p className="ax-note" style={{ marginTop: 22 }}>Loading your rules…</p>

  const post = async (body: unknown) => { setBusy(true); const r = await call<RulesData>("/api/workspace/ad-rules", body); setBusy(false); if (r) setD(r); return r }
  const set = (p: Draft) => setDraft((x) => ({ ...(x ?? blank), ...p }))
  const save = async () => {
    if (!draft) return
    const { budgetDir, ...rule } = draft
    const pct = Math.abs(Number(rule.budgetPct) || 0) * (budgetDir === "down" ? -1 : 1)
    if (await post({ op: "save", rule: { ...rule, budgetPct: pct } })) setDraft(null)
  }
  const unit = METRICS.find((m) => m.v === draft?.metric)?.unit ?? "money"
  const cur = d.currency === "USD" ? "$" : `${d.currency} `

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
      <section className="ax-card" style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <div><b style={{ fontSize: 15 }}>Your own rules</b><p className="ax-p" style={{ marginTop: 4 }}>I check them once a day against your real numbers and act on running ads only. Every change shows in What I changed, with Undo.</p></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ax-btn s sm" type="button" disabled={busy || !d.rules.some((r) => r.on)} onClick={() => void post({ op: "check" })}>Check my rules now</button>
            {!draft && <button className="ax-btn p sm" type="button" onClick={() => setDraft({ ...blank })}>New rule</button>}
          </div>
        </div>
        {!d.canChangeBudget && <p className="ax-note" style={{ margin: 0 }}>Budget rules only tell you until Autopilot is on. Pause and “tell me” rules work now.</p>}
        {d.canChangeBudget && !d.hasLimit && <p className="ax-note" style={{ margin: 0 }}>Set your monthly limit first: I never raise a budget without one.</p>}
        {d.preview && (
          <div style={{ borderTop: "1px solid var(--x-line)", paddingTop: 10 }}>
            <b style={{ fontSize: 13.5 }}>If I checked now</b>
            {d.preview.length ? d.preview.map((p, i) => <div key={i} style={{ fontSize: 13.5, marginTop: 6 }}>{p.why}</div>) : <div className="ax-t11" style={{ marginTop: 4 }}>No rule would act{d.waiting ? `. ${d.waiting} ${d.waiting === 1 ? "check is" : "checks are"} still waiting for enough data` : ""}.</div>}
            {(d.errors ?? []).map((e, i) => <div key={`e${i}`} className="ax-t11" style={{ color: "#b25000", marginTop: 4 }}>{e}</div>)}
          </div>
        )}
      </section>

      {draft && (
        <section className="ax-card" style={card}>
          <div className="ax-eb">Start from</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {d.presets.map((p) => <button key={p.key} className="ax-btn s sm" type="button" onClick={() => setDraft({ ...blank, ...p.rule, id: draft.id, budgetPct: Math.abs(p.rule.budgetPct ?? 20), budgetDir: (p.rule.budgetPct ?? 1) < 0 ? "down" : "up" })}>{p.label}</button>)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 14.5, lineHeight: 2.2 }}>
            <select className="ax-input" style={sel} value={draft.action} onChange={(e) => set({ action: e.target.value as AdRule["action"], ...(e.target.value === "budget" ? { level: "campaign" } : {}) })} aria-label="What I do">
              <option value="pause">Pause</option><option value="budget">Change the budget of</option><option value="notify">Tell me about</option>
            </select>
            <select className="ax-input" style={sel} value={draft.level} onChange={(e) => set({ level: e.target.value as AdRule["level"] })} aria-label="Ad or campaign" disabled={draft.action === "budget"}>
              <option value="ad">an ad</option><option value="campaign">a campaign</option>
            </select>
            <span>on</span>
            <select className="ax-input" style={sel} value={draft.platform} onChange={(e) => set({ platform: e.target.value as AdRule["platform"], campaign: null })} aria-label="Platform">
              <option value="all">any platform</option><option value="meta">Facebook & Instagram</option>{d.googleOn && <option value="google">Google</option>}
            </select>
            <span>in</span>
            <select className="ax-input" style={{ ...sel, maxWidth: 260 }} value={draft.campaign ?? ""} onChange={(e) => set({ campaign: e.target.value || null })} aria-label="Campaign">
              <option value="">every campaign</option>
              {d.campaigns.filter((c) => draft.platform === "all" || c.platform === draft.platform).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            {draft.action === "budget" && (<>
              <span>by</span>
              <input className="ax-input" style={{ ...num, width: 70 }} type="number" min={1} max={50} value={draft.budgetPct ?? 20} onChange={(e) => set({ budgetPct: Number(e.target.value) })} aria-label="Percent" /><span>%</span>
              <select className="ax-input" style={sel} value={draft.budgetDir} onChange={(e) => set({ budgetDir: e.target.value as "up" | "down" })} aria-label="Up or down"><option value="up">up</option><option value="down">down</option></select>
            </>)}
            <span>when its</span>
            <select className="ax-input" style={sel} value={draft.metric} onChange={(e) => set({ metric: e.target.value as RuleMetric, ...(e.target.value === "conversions" ? { op: "lt", value: 1 } : {}) })} aria-label="Number I watch">
              {METRICS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
            </select>
            <span>is</span>
            <select className="ax-input" style={sel} value={draft.op} onChange={(e) => set({ op: e.target.value as AdRule["op"] })} aria-label="Over or under" disabled={draft.metric === "conversions"}>
              <option value="gt">over</option><option value="lt">under</option>
            </select>
            {unit === "money" && <span>{cur}</span>}
            <input className="ax-input" style={num} type="number" min={0} step="any" value={draft.value ?? 0} onChange={(e) => set({ value: Number(e.target.value) })} aria-label="Limit" />
            {unit === "pct" && <span>%</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 14 }}>
            <span>Wait until it has spent</span>{cur && <span>{cur}</span>}
            <input className="ax-input" style={num} type="number" min={0} value={draft.minSpend ?? 0} onChange={(e) => set({ minSpend: Number(e.target.value) })} aria-label="Minimum spend" />
            <span>and has</span>
            <input className="ax-input" style={{ ...num, width: 100 }} type="number" min={0} value={draft.minImpressions ?? 0} onChange={(e) => set({ minImpressions: Number(e.target.value) })} aria-label="Minimum impressions" />
            <span>impressions, looking at the last</span>
            <select className="ax-input" style={sel} value={draft.days} onChange={(e) => set({ days: Number(e.target.value) as AdRule["days"] })} aria-label="Days"><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option></select>
          </div>
          <div className="ax-t11">I always wait for enough data, act at most once a day per ad, never touch paused campaigns, and never go above your monthly limit.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ax-btn p sm" type="button" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save rule"}</button>
            <button className="ax-btn s sm" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </section>
      )}

      {d.rules.length ? (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
          {d.rules.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", flexWrap: "wrap" }}>
              <button className={`ax-sw${r.on ? " on" : ""}`} type="button" role="switch" aria-checked={r.on} aria-label={r.on ? "Turn rule off" : "Turn rule on"} disabled={busy} onClick={() => void post({ op: "toggle", id: r.id, on: !r.on })}><i /></button>
              <div style={{ flex: 1, minWidth: 220, fontSize: 14.5, color: r.on ? "var(--x-ink)" : "var(--x-mut)" }}>{r.text}</div>
              <button className="ax-lnk" type="button" onClick={() => setDraft({ ...r, budgetPct: Math.abs(r.budgetPct ?? 20), budgetDir: (r.budgetPct ?? 1) < 0 ? "down" : "up" })}>Edit</button>
              <button className="ax-lnk" type="button" disabled={busy} onClick={() => void post({ op: "delete", id: r.id })}>Delete</button>
            </div>
          ))}
        </section>
      ) : !draft && <p className="ax-note" style={{ marginTop: 0 }}>No rules yet. Start from one of mine and change the numbers to yours.</p>}
      {d.lastRun && <div className="ax-t11">Last checked {new Date(d.lastRun).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</div>}
    </div>
  )
}

// ── Promote a post ──────────────────────────────────────────────────────────
type PostCard = { socialPostId: string; accountId: string; platform: "facebook" | "instagram" | "linkedin"; accountName: string; text: string; image: string | null; url: string | null; publishedAt: string; stats: string | null; rate: number | null; blocked: string | null }
type Promo = { id: string; name: string; status: string; daily: number; currency: string; days: number; endsAt: string | null; from: string; postUrl: string | null; error: string | null; text: string }
type LiPromo = { id: string; name: string; status: string; daily: number; currency: string; days: number; endsAt?: string | null; error?: string | null }
type PromoData = { metaOn: boolean; linkedin: { flag: boolean; connected: boolean; usable: boolean; accounts: { id: string; name: string }[]; pick: string | null; promos: LiPromo[] }; ranked: PostCard[]; recent: PostCard[]; minViews: number; defaults: { daily: number; maxDaily: number | null; days: number; audience: string; currency: string; ready: string | null } | null; days: number[]; promotions: Promo[] }
const PNAME = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" } as const

export function PromotePanel({ note }: { note?: string | null }) {
  const [d, setD] = useState<PromoData | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [daily, setDaily] = useState(10)
  const [days, setDays] = useState(7)
  const [notPolitical, setNotPolitical] = useState(true)
  const [busy, setBusy] = useState(false)
  useEffect(() => { void call<PromoData>("/api/workspace/promote").then((x) => { setD(x); if (x?.defaults) { setDaily(x.defaults.daily); setDays(x.defaults.days) } }) }, [])
  useEffect(() => { if (note) toast(note) }, [note])
  if (!d) return <p className="ax-note" style={{ marginTop: 22 }}>Loading your posts…</p>
  const post = async (body: unknown) => { setBusy(true); const r = await call<PromoData>("/api/workspace/promote", body); setBusy(false); if (r) { setD(r); setOpen(null) } }

  const cardFor = (p: PostCard) => {
    const k = `${p.socialPostId}:${p.accountId}`
    const li = p.platform === "linkedin"
    const min = li ? 10 : 1
    return (
      <article key={k} className="ax-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><b style={{ fontSize: 13.5 }}>{PNAME[p.platform]} · {p.accountName}</b><span className="ax-t11">{new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
        {p.image && <img src={p.image} alt="" style={{ width: "100%", borderRadius: 10, maxHeight: 180, objectFit: "cover" }} />}
        <p className="ax-p ax-clamp" style={{ color: "var(--x-ink)" }}>{p.text}</p>
        {p.stats && <div className="ax-t11">{p.stats}{p.rate !== null ? ` · ${p.rate}% engaged` : ""}</div>}
        {p.url && <a className="ax-src" href={p.url} target="_blank" rel="noopener noreferrer">See the post ↗</a>}
        {p.blocked ? <div className="ax-t11" style={{ color: "#b25000" }}>{p.blocked}</div> : open === k ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--x-line)", paddingTop: 10 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, flexWrap: "wrap" }}>A day <input className="ax-input" style={num} type="number" min={min} max={d.defaults?.maxDaily ?? undefined} value={daily} onChange={(e) => setDaily(Number(e.target.value))} /> {d.defaults?.currency}
              <select className="ax-input" style={sel} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="How long">{d.days.map((x) => <option key={x} value={x}>for {x} days</option>)}</select>
            </label>
            <div className="ax-t11">{d.defaults?.audience}. {d.defaults?.maxDaily != null ? `Up to ${d.defaults.maxDaily} ${d.defaults.currency} a day fits your monthly limit.` : "No monthly limit set yet."}{li ? " LinkedIn needs at least 10 a day." : ""}</div>
            {li && <label style={{ display: "flex", gap: 8, fontSize: 12.5, alignItems: "flex-start" }}><input type="checkbox" checked={notPolitical} onChange={(e) => setNotPolitical(e.target.checked)} /> I confirm this is not political advertising. None of my ads qualify as political advertising under the law of the targeted countries, including EU law.</label>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ax-btn p sm" type="button" disabled={busy || daily < min} onClick={() => void post({ op: li ? "li_build" : "meta_build", socialPostId: p.socialPostId, accountId: p.accountId, daily, days, ...(li ? { notPolitical } : {}) })}>{busy ? "Building…" : "Build it paused"}</button>
              <button className="ax-btn s sm" type="button" onClick={() => setOpen(null)}>Cancel</button>
            </div>
            <div className="ax-t11">Nothing spends until you tap Turn it on.</div>
          </div>
        ) : <div><button className="ax-btn s sm" type="button" disabled={!!d.defaults?.ready && !li} onClick={() => setOpen(k)}>Promote this post</button></div>}
      </article>
    )
  }
  const promos = [...d.promotions.map((p) => ({ ...p, li: false })), ...d.linkedin.promos.map((p) => ({ ...p, from: "linkedin", postUrl: null, text: "", endsAt: p.endsAt ?? null, error: p.error ?? null, li: true }))]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
      {!d.metaOn && <section className="ax-card ax-empty"><div style={{ flex: 1 }}><b>Connect Facebook & Instagram ads first</b><p>Then I can show your best posts to more people near you.</p></div><button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ topic: "ads", label: "Connect Facebook & Instagram ads" })}>Set it up</button></section>}
      {d.defaults?.ready && d.metaOn && <p className="ax-note" style={{ marginTop: 0 }}>{d.defaults.ready}</p>}
      {d.linkedin.flag && !d.linkedin.usable && <section className="ax-card ax-empty"><div style={{ flex: 1 }}><b>Promote company Page posts on LinkedIn</b><p>Connect your LinkedIn ad account. I build each promotion paused for your OK.</p></div><a className="ax-btn s sm" href="/api/linkedin-ads/connect">Connect LinkedIn Ads</a></section>}
      {d.linkedin.usable && d.linkedin.accounts.length > 1 && (
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>LinkedIn ad account
          <select className="ax-input" style={sel} value={d.linkedin.pick ?? ""} onChange={(e) => void post({ op: "li_pick", id: e.target.value })}><option value="" disabled>Pick one</option>{d.linkedin.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </label>
      )}

      {promos.length > 0 && (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
          {promos.map((p) => (
            <div key={p.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <b style={{ fontSize: 14 }}>{p.li ? "LinkedIn" : PNAME[p.from as "facebook" | "instagram"]} promotion · {p.daily} {p.currency} a day for {p.days} days</b>
                <div className="ax-t11" style={{ marginTop: 3 }}>{p.error ? `Didn’t finish building: ${p.error}` : p.status === "active" ? `Running${p.endsAt ? ` until ${new Date(p.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}` : p.status === "paused" ? "Built and paused. Nothing is spending." : p.status}</div>
              </div>
              {!p.error && p.status === "paused" && <button className="ax-btn p sm" type="button" disabled={busy} onClick={() => void post({ op: p.li ? "li_on" : "meta_on", id: p.id })}>Turn it on</button>}
              {p.status === "active" && <button className="ax-btn s sm" type="button" disabled={busy} onClick={() => void post({ op: p.li ? "li_off" : "meta_off", id: p.id })}>Pause</button>}
            </div>
          ))}
        </section>
      )}

      {d.ranked.length > 0 && (<>
        <div className="ax-h2" style={{ marginTop: 4 }}><div><h2>Your best posts</h2><p>Ranked by LinkedIn’s own numbers for your company Page (posts with {d.minViews}+ views).</p></div></div>
        <div className="ax-g3" style={{ marginTop: 0 }}>{d.ranked.map(cardFor)}</div>
      </>)}
      {d.recent.length > 0 && (<>
        <div className="ax-h2" style={{ marginTop: 4 }}><div><h2>Recent posts</h2><p>Newest first, not ranked: Facebook and Instagram don’t share post stats with me yet.</p></div></div>
        <div className="ax-g3" style={{ marginTop: 0 }}>{d.recent.map(cardFor)}</div>
      </>)}
      {!d.ranked.length && !d.recent.length && (d.metaOn || d.linkedin.usable) && <p className="ax-note" style={{ marginTop: 0 }}>No published posts from the last 90 days yet. Once I publish your social posts, the ones you can promote show here.</p>}
    </div>
  )
}

// ── Share a report ──────────────────────────────────────────────────────────
type LinkRow = { id: string; label: string; from: string; to: string; createdAt: string; expiresAt: string; revokedAt?: string | null; by: string; url: string | null; live: boolean }
type ReportData = { links: LinkRow[]; monthly: boolean; to: string | null; ttls: number[]; link?: LinkRow }

export function ReportPanel() {
  const [d, setD] = useState<ReportData | null>(null)
  const [range, setRange] = useState<"last7" | "last30" | "month">("last30")
  const [ttl, setTtl] = useState(30)
  const [to, setTo] = useState("")
  const [busy, setBusy] = useState(false)
  const [fresh, setFresh] = useState<LinkRow | null>(null)
  useEffect(() => { void call<ReportData>("/api/workspace/ad-report").then((x) => { setD(x); setTo(x?.to ?? "") }) }, [])
  if (!d) return <p className="ax-note" style={{ marginTop: 22 }}>Loading…</p>
  const post = async (body: unknown) => { setBusy(true); const r = await call<ReportData>("/api/workspace/ad-report", body); setBusy(false); if (r) { setD(r); if (r.link) setFresh(r.link) } }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
      <section className="ax-card" style={card}>
        <b style={{ fontSize: 15 }}>Share a read-only report</b>
        <p className="ax-p" style={{ margin: 0 }}>A page with spend, leads, cost per lead, click rate, each campaign, your top ads and what I changed. Anyone with the link can see it; nobody can change anything. You can turn a link off any time. It can be saved as a PDF.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 14 }}>
          <select className="ax-input" style={sel} value={range} onChange={(e) => setRange(e.target.value as typeof range)} aria-label="Dates"><option value="last7">Last 7 days</option><option value="last30">Last 30 days</option><option value="month">Last month</option></select>
          <span>link works for</span>
          <select className="ax-input" style={sel} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} aria-label="How long the link works">{d.ttls.map((x) => <option key={x} value={x}>{x} days</option>)}</select>
          <button className="ax-btn p sm" type="button" disabled={busy} onClick={() => void post({ op: "create", range, ttl })}>Make a link</button>
        </div>
        {fresh?.url && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><code style={{ fontSize: 12, wordBreak: "break-all", flex: 1, minWidth: 200 }}>{fresh.url}</code><CopyButton text={fresh.url} /><a className="ax-btn s sm" href={fresh.url} target="_blank" rel="noopener noreferrer">Open</a></div>}
      </section>

      {d.links.length > 0 && (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
          {d.links.map((l) => (
            <div key={l.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}><b style={{ fontSize: 14 }}>{l.label}</b><div className="ax-t11">{l.live ? `Works until ${new Date(l.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : l.revokedAt ? "Turned off" : "Expired"}{l.by === "monthly" ? " · monthly email" : ""}</div></div>
              {l.live && l.url && <><CopyButton text={l.url} /><button className="ax-btn s sm" type="button" disabled={busy} onClick={() => void post({ op: "revoke", id: l.id })}>Turn off</button></>}
            </div>
          ))}
        </section>
      )}

      <section className="ax-card" style={card}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className={`ax-sw${d.monthly ? " on" : ""}`} type="button" role="switch" aria-checked={d.monthly} aria-label="Monthly report email" disabled={busy} onClick={() => void post({ op: "monthly", on: !d.monthly, to: to || null })}><i /></button>
          <div><b style={{ fontSize: 14.5 }}>Email me last month’s report on the 1st</b><div className="ax-t11">Goes to your account email. Add one more address only if you want someone else to get it.</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="ax-input" type="email" placeholder="Also send to (optional)" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Also send to" style={{ width: 260 }} />
          <button className="ax-btn s sm" type="button" disabled={busy || (to.trim() === (d.to ?? ""))} onClick={() => void post({ op: "monthly", on: d.monthly, to: to.trim() || null })}>Save</button>
        </div>
      </section>
    </div>
  )
}
