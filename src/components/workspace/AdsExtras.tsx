"use client"

import { useCallback, useEffect, useState } from "react"
import { askAlphaa, toast } from "@/lib/workspace/events"
import type { AdRule, RuleMetric } from "@/lib/ad-rules/engine"
import { Button, CopyButton, EmptyState, Field, Glyph, List, ListRow, Pill, SectionHeader, Segmented, Select, Sentence, Sheet, Skeleton, TextInput, TokenSelect, useConfirm } from "./ui"
import "./p3.css"

// Three Ads sections that load their own data: Automations (the owner's ad rules: preset cards,
// a sentence builder with a live preview), Promote a post (organic post → paused ad → owner turns
// it on) and Share (signed read-only links + the monthly email).

async function call<T>(url: string, body?: unknown): Promise<(T & { said?: string }) | null> {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined).catch(() => null)
  const d = (await res?.json().catch(() => null)) as (T & { error?: string; said?: string }) | null
  if (!res?.ok) { toast(d?.error ?? "That didn’t work. Nothing changed."); return null }
  if (d?.said) toast(d.said)
  return d
}

function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return <EmptyState title={`I couldn’t load ${what}`} text="That’s on my side. Nothing changed. Try again in a moment." actions={<Button onClick={onRetry}>Try again</Button>} />
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })

// ── Automations (the owner's ad rules) ──────────────────────────────────────
type RulesData = { rules: (AdRule & { text: string })[]; presets: { key: string; label: string; rule: Omit<AdRule, "id" | "createdAt" | "on" | "campaign"> }[]; lastRun: string | null; currency: string; campaigns: { key: string; label: string; platform: "meta" | "google" }[]; canChangeBudget: boolean; hasLimit: boolean; googleOn: boolean; preview?: { ruleId: string; kind: string; why: string }[]; waiting?: number; errors?: string[] }
type Draft = Partial<AdRule> & { budgetDir?: "up" | "down" }

const METRICS: { v: RuleMetric; label: string; unit: "money" | "pct" | "n" | "x" }[] = [
  { v: "cpl", label: "cost per lead", unit: "money" },
  { v: "spend", label: "spend", unit: "money" },
  { v: "conversions", label: "leads", unit: "n" },
  { v: "ctr", label: "click rate", unit: "pct" },
  { v: "cpc", label: "cost per click", unit: "money" },
  { v: "frequency", label: "times each person saw it", unit: "n" },
  { v: "roas", label: "return on ad spend", unit: "x" },
]
const blank: Draft = { action: "pause", level: "ad", platform: "all", campaign: null, metric: "cpl", op: "gt", value: 30, minSpend: 60, minImpressions: 0, days: 30, budgetPct: 20, budgetDir: "up" }

/** The rule as one plain sentence, for the live preview. */
function ruleSentence(d: Draft, cur: string, campaigns: RulesData["campaigns"]): string {
  const m = METRICS.find((x) => x.v === d.metric) ?? METRICS[0]
  const what = d.action === "pause" ? `I pause ${d.level === "campaign" ? "a campaign" : "an ad"}` : d.action === "budget" ? `I move a campaign’s budget ${d.budgetDir === "down" ? "down" : "up"} ${Math.abs(Number(d.budgetPct) || 0)}%` : `I tell you about ${d.level === "campaign" ? "a campaign" : "an ad"}`
  const where = d.platform === "meta" ? " on Facebook & Instagram" : d.platform === "google" ? " on Google" : ""
  const camp = d.campaign ? ` in “${campaigns.find((c) => c.key === d.campaign)?.label ?? "that campaign"}”` : ""
  const val = m.unit === "money" ? `${cur}${d.value}` : m.unit === "pct" ? `${d.value}%` : m.unit === "x" ? `${d.value}x` : `${d.value}`
  const cond = d.metric === "conversions" ? `has fewer than ${val} leads` : `${m.label} is ${d.op === "lt" ? "under" : "over"} ${val}`
  return `${what}${where}${camp} when its ${cond} over the last ${d.days} days, once it has spent ${cur}${d.minSpend ?? 0}${d.minImpressions ? ` and been seen ${Number(d.minImpressions).toLocaleString("en-US")} times` : ""}.`
}

export function AdRulesPanel() {
  const [d, setD] = useState<RulesData | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const { confirm, node: confirmNode } = useConfirm()
  const load = useCallback(async () => { setFailed(false); const r = await call<RulesData>("/api/workspace/ad-rules"); setD(r); setFailed(!r) }, [])
  useEffect(() => { void load() }, [load])

  if (!d && failed) return <section><SectionHeader first title="Your automations" /><LoadFailed what="your automations" onRetry={() => void load()} /></section>
  if (!d) {
    return (
      <section>
        <SectionHeader first title="Your automations" />
        <div className="ax-card x3-pad"><Skeleton kind="row" rows={3} /></div>
      </section>
    )
  }

  const post = async (body: unknown, key: string) => { setBusy(key); const r = await call<RulesData>("/api/workspace/ad-rules", body); setBusy(null); if (r) setD(r); return r }
  const set = (p: Draft) => setDraft((x) => ({ ...(x ?? blank), ...p }))
  const save = async () => {
    if (!draft) return
    const { budgetDir, ...rule } = draft
    const pct = Math.abs(Number(rule.budgetPct) || 0) * (budgetDir === "down" ? -1 : 1)
    if (await post({ op: "save", rule: { ...rule, budgetPct: pct } }, "save")) { setDraft(null); toast("Rule saved") }
  }
  const fromPreset = (p: RulesData["presets"][number]) => setDraft({ ...blank, ...p.rule, id: draft?.id, budgetPct: Math.abs(p.rule.budgetPct ?? 20), budgetDir: (p.rule.budgetPct ?? 1) < 0 ? "down" : "up" })
  const unit = METRICS.find((m) => m.v === draft?.metric)?.unit ?? "money"
  const cur = d.currency === "USD" ? "$" : `${d.currency} `
  const n = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0)

  return (
    <section className="x3-col">
      <SectionHeader
        first
        title="Your automations"
        sub="Rules I check once a day against your real numbers, on running ads only. Every change shows below with Undo."
        end={d.rules.length > 0 ? (
          <span className="x3-acts">
            <Button size="sm" loading={busy === "check"} disabled={!d.rules.some((r) => r.on)} onClick={() => void post({ op: "check" }, "check")}>Check now</Button>
            {!draft && <Button size="sm" variant="primary" onClick={() => setDraft({ ...blank })}>New rule</Button>}
          </span>
        ) : undefined}
      />
      {!d.canChangeBudget && <p className="ax-note x3-flat">Budget rules only tell you until Autopilot is on. Pause and “tell me” rules work now.</p>}
      {d.canChangeBudget && !d.hasLimit && <p className="ax-note x3-flat">Set your monthly limit first. I never raise a budget without one.</p>}

      {d.preview && (
        <section className="ax-card x3-pad">
          <b>If I checked now</b>
          {d.preview.length ? d.preview.map((p, i) => <div key={i} className="x3-line">{p.why}</div>) : <div className="ax-t11">No rule would act{d.waiting ? `. ${d.waiting} ${d.waiting === 1 ? "check is" : "checks are"} still waiting for enough data` : ""}.</div>}
          {(d.errors ?? []).map((e, i) => <div key={`e${i}`} className="ax-t11 x3-warn">{e}</div>)}
        </section>
      )}

      {!draft && !d.rules.length && (
        <EmptyState
          icon={<Glyph name="spark" size={22} />}
          title="Start from one of mine"
          text="Tap one, then change the numbers to yours. Nothing runs until you save it."
          chips={<div className="x3-presets">{d.presets.map((p) => <button key={p.key} type="button" className="x3-preset" onClick={() => fromPreset(p)}><Glyph name="spark" size={14} />{p.label}</button>)}</div>}
          actions={<Button onClick={() => setDraft({ ...blank })}>Write my own</Button>}
        />
      )}

      {draft && (
        <section className="ax-card x3-pad x3-builder" aria-label="Rule builder">
          {d.presets.length > 0 && (
            <div>
              <div className="x3-k">Start from</div>
              <div className="x3-presets">{d.presets.map((p) => <button key={p.key} type="button" className="x3-preset" onClick={() => fromPreset(p)}>{p.label}</button>)}</div>
            </div>
          )}
          <Sentence>
            <TokenSelect label="What I do" value={draft.action ?? "pause"} onChange={(v) => set({ action: v as AdRule["action"], ...(v === "budget" ? { level: "campaign" as const } : {}) })} options={[{ value: "pause", label: "Pause" }, { value: "budget", label: "Change the budget of" }, { value: "notify", label: "Tell me about" }]} />{" "}
            {draft.action === "budget" ? "a campaign" : <TokenSelect label="Ad or campaign" value={draft.level ?? "ad"} onChange={(v) => set({ level: v as AdRule["level"] })} options={[{ value: "ad", label: "an ad" }, { value: "campaign", label: "a campaign" }]} />}{" "}
            on <TokenSelect label="Platform" value={draft.platform ?? "all"} onChange={(v) => set({ platform: v as AdRule["platform"], campaign: null })} options={[{ value: "all", label: "any platform" }, { value: "meta", label: "Facebook & Instagram" }, ...(d.googleOn ? [{ value: "google", label: "Google" }] : [])]} />{" "}
            in <TokenSelect label="Campaign" value={draft.campaign ?? ""} onChange={(v) => set({ campaign: v || null })} options={[{ value: "", label: "every campaign" }, ...d.campaigns.filter((c) => draft.platform === "all" || c.platform === draft.platform).map((c) => ({ value: c.key, label: c.label }))]} />{" "}
            {draft.action === "budget" && (<>by <TokenSelect label="Percent" value={String(draft.budgetPct ?? 20)} onChange={(v) => set({ budgetPct: Number(v) })} options={[5, 10, 15, 20, 25, 30, 40, 50].map((x) => ({ value: String(x), label: `${x}%` }))} />{" "}<TokenSelect label="Up or down" value={draft.budgetDir ?? "up"} onChange={(v) => set({ budgetDir: v as "up" | "down" })} options={[{ value: "up", label: "up" }, { value: "down", label: "down" }]} />{" "}</>)}
            when its <TokenSelect label="Number I watch" value={draft.metric ?? "cpl"} onChange={(v) => set({ metric: v as RuleMetric, ...(v === "conversions" ? { op: "lt" as const, value: 1 } : {}) })} options={METRICS.map((m) => ({ value: m.v, label: m.label }))} />{" "}
            is {draft.metric === "conversions" ? "under" : <TokenSelect label="Over or under" value={draft.op ?? "gt"} onChange={(v) => set({ op: v as AdRule["op"] })} options={[{ value: "gt", label: "over" }, { value: "lt", label: "under" }]} />}
          </Sentence>
          <div className="x3-fields">
            <Field label="Limit"><TextInput type="number" min={0} step="any" prefix={unit === "money" ? cur.trim() : undefined} suffix={unit === "pct" ? "%" : unit === "x" ? "x" : undefined} value={String(draft.value ?? 0)} onChange={(e) => set({ value: n(e.target.value) })} /></Field>
            <Field label="Wait until it has spent"><TextInput type="number" min={0} prefix={cur.trim()} value={String(draft.minSpend ?? 0)} onChange={(e) => set({ minSpend: n(e.target.value) })} /></Field>
            <Field label="And been seen at least"><TextInput type="number" min={0} suffix="times" value={String(draft.minImpressions ?? 0)} onChange={(e) => set({ minImpressions: n(e.target.value) })} /></Field>
            <Field label="Looking at the last"><Select value={String(draft.days ?? 30)} onChange={(e) => set({ days: Number(e.target.value) as AdRule["days"] })} options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }]} /></Field>
          </div>
          <div className="x3-preview" aria-live="polite"><span className="x3-k">In plain words</span>{ruleSentence(draft, cur, d.campaigns)}</div>
          <div className="ax-t11">I always wait for enough data, change each ad at most once a day, never touch paused campaigns and never go over your monthly limit.</div>
          <div className="x3-acts">
            <Button variant="primary" loading={busy === "save"} onClick={() => void save()}>Save rule</Button>
            <Button onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </section>
      )}

      {d.rules.length > 0 && (
        <List card label="Your rules">
          {d.rules.map((r) => (
            <ListRow
              key={r.id}
              lead={<button className={`ax-sw${r.on ? " on" : ""}`} type="button" role="switch" aria-checked={r.on} aria-label={r.on ? "Turn rule off" : "Turn rule on"} disabled={!!busy} onClick={() => void post({ op: "toggle", id: r.id, on: !r.on }, `t${r.id}`)}><i /></button>}
              title={<span className={r.on ? "" : "x3-off"}>{r.text}</span>}
              meta={r.on ? "On" : "Off"}
              wrapEnd
              end={<>
                <Button size="sm" onClick={() => setDraft({ ...r, budgetPct: Math.abs(r.budgetPct ?? 20), budgetDir: (r.budgetPct ?? 1) < 0 ? "down" : "up" })}>Edit</Button>
                <Button size="sm" variant="ghost" loading={busy === `d${r.id}`} onClick={async () => { if (await confirm({ title: "Delete this rule?", text: r.text, confirmLabel: "Delete it", danger: true })) void post({ op: "delete", id: r.id }, `d${r.id}`) }}>Delete</Button>
              </>}
            />
          ))}
        </List>
      )}
      {d.lastRun && <div className="ax-t11">Last checked {new Date(d.lastRun).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</div>}
      {confirmNode}
    </section>
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
  const [open, setOpen] = useState<PostCard | null>(null)
  const [daily, setDaily] = useState(10)
  const [days, setDays] = useState(7)
  const [notPolitical, setNotPolitical] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(() => { setFailed(false); void call<PromoData>("/api/workspace/promote").then((x) => { setD(x); setFailed(!x); if (x?.defaults) { setDaily(x.defaults.daily); setDays(x.defaults.days) } }) }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (note) toast(note) }, [note])
  if (!d && failed) return <LoadFailed what="your posts" onRetry={load} />
  if (!d) return <div className="ax-g3 x3-flat"><Skeleton kind="card" /><Skeleton kind="card" /><Skeleton kind="card" /></div>
  const post = async (body: unknown, key: string) => { setBusy(key); const r = await call<PromoData>("/api/workspace/promote", body); setBusy(null); if (r) { setD(r); setOpen(null) } return r }

  const blocked = d.metaOn && !!d.defaults?.ready
  const li = open?.platform === "linkedin"
  const min = li ? 10 : 1
  const cardFor = (p: PostCard) => {
    const k = `${p.socialPostId}:${p.accountId}`
    const off = !!p.blocked || (blocked && p.platform !== "linkedin")
    return (
      <article key={k} className="ax-card x3-post">
        {p.image && <img src={p.image} alt="" loading="lazy" />}
        <div className="x3-post__b">
          <div className="x3-row"><b>{PNAME[p.platform]} · {p.accountName}</b><span className="ax-t11">{fmtDay(p.publishedAt)}</span></div>
          <p className="ax-p ax-clamp x3-ink">{p.text}</p>
          {p.stats && <div className="ax-t11">{p.stats}{p.rate !== null ? ` · ${p.rate}% engaged` : ""}</div>}
          {p.blocked && <div className="ax-t11 x3-warn">{p.blocked}</div>}
          <div className="x3-acts x3-push">
            <Button size="sm" variant="primary" disabled={off} onClick={() => { setOpen(p); setNotPolitical(true) }}>Boost this post</Button>
            {p.url && <Button size="sm" href={p.url} external>See it</Button>}
          </div>
        </div>
      </article>
    )
  }
  const promos = [...d.promotions.map((p) => ({ ...p, li: false })), ...d.linkedin.promos.map((p) => ({ ...p, from: "linkedin", postUrl: null, text: "", endsAt: p.endsAt ?? null, error: p.error ?? null, li: true }))]

  return (
    <div className="x3-col">
      {!d.metaOn && (
        <EmptyState
          title="Connect your Facebook & Instagram ad account"
          text="Then I can show your best posts to more people near you. Every promotion is built paused for your OK."
          actions={<Button variant="primary" onClick={() => askAlphaa({ topic: "ads", label: "Connect Facebook & Instagram ads" })}>Connect it</Button>}
        />
      )}
      {blocked && (
        <section className="ax-card x3-banner">
          <Glyph name="link" size={18} />
          <span>{d.defaults!.ready}</span>
          <Button size="sm" variant="primary" onClick={() => askAlphaa({ topic: "ads", label: "Pick my ad account" })}>Pick it</Button>
        </section>
      )}
      {d.linkedin.flag && !d.linkedin.usable && (
        <section className="ax-card x3-banner">
          <Glyph name="link" size={18} />
          <span>Promote your LinkedIn company Page posts too. Connect your LinkedIn ad account first.</span>
          <Button size="sm" href="/api/linkedin-ads/connect">Connect LinkedIn</Button>
        </section>
      )}
      {d.linkedin.usable && d.linkedin.accounts.length > 1 && (
        <Field label="LinkedIn ad account">
          <Select value={d.linkedin.pick ?? ""} placeholder="Pick one" onChange={(e) => void post({ op: "li_pick", id: e.target.value }, "pick")} options={d.linkedin.accounts.map((a) => ({ value: a.id, label: a.name }))} />
        </Field>
      )}

      {promos.length > 0 && (
        <List card label="Your promotions">
          {promos.map((p) => (
            <ListRow
              key={p.id}
              title={`${p.li ? "LinkedIn" : PNAME[p.from as "facebook" | "instagram"]} promotion · ${p.daily} ${p.currency} a day for ${p.days} days`}
              meta={p.error ? `Didn’t finish building: ${p.error}` : p.status === "active" ? `Running${p.endsAt ? ` until ${fmtDay(p.endsAt)}` : ""}` : p.status === "paused" ? "Built and paused. Nothing is spending." : p.status}
              wrapEnd
              end={!p.error && p.status === "paused" ? <Button size="sm" variant="primary" loading={busy === p.id} onClick={() => void post({ op: p.li ? "li_on" : "meta_on", id: p.id }, p.id)}>Turn it on</Button>
                : p.status === "active" ? <Button size="sm" loading={busy === p.id} onClick={() => void post({ op: p.li ? "li_off" : "meta_off", id: p.id }, p.id)}>Pause</Button>
                : p.error ? <Pill tone="warn">Didn’t build</Pill> : undefined}
            />
          ))}
        </List>
      )}

      {d.ranked.length > 0 && (<>
        <SectionHeader title="Your best posts" sub={`Ranked by your LinkedIn Page’s own numbers (posts with ${d.minViews}+ views).`} />
        <div className="ax-g3 x3-flat">{d.ranked.map(cardFor)}</div>
      </>)}
      {d.recent.length > 0 && (<>
        <SectionHeader title="Recent posts" sub="Newest first. These don’t have enough reach numbers yet to rank." />
        <div className="ax-g3 x3-flat">{d.recent.map(cardFor)}</div>
      </>)}
      {!d.ranked.length && !d.recent.length && (d.metaOn || d.linkedin.usable) && (
        <EmptyState title="No published posts yet" text="Once I publish your social posts, the ones you can promote show up here." actions={<Button href="/dashboard/social">Open Social Studio</Button>} />
      )}

      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title="Boost this post"
        sub={open ? `${PNAME[open.platform]} · ${open.accountName}` : undefined}
        footer={open && <>
          <Button onClick={() => setOpen(null)}>Cancel</Button>
          <Button variant="primary" loading={busy === "build"} disabled={daily < min} onClick={() => void post({ op: li ? "li_build" : "meta_build", socialPostId: open.socialPostId, accountId: open.accountId, daily, days, ...(li ? { notPolitical } : {}) }, "build")}>Build it paused</Button>
        </>}
      >
        {open && (
          <div className="x3-col">
            <p className="ax-p ax-clamp x3-ink">{open.text}</p>
            <Field label={`A day (${d.defaults?.currency ?? ""})`} hint={d.defaults?.maxDaily != null ? `Up to ${d.defaults.maxDaily} a day fits your monthly limit.${li ? " LinkedIn needs at least 10 a day." : ""}` : `No monthly limit set yet.${li ? " LinkedIn needs at least 10 a day." : ""}`}>
              <TextInput type="number" min={min} max={d.defaults?.maxDaily ?? undefined} value={String(daily)} onChange={(e) => setDaily(Number(e.target.value))} className="x3-amt" />
            </Field>
            <input type="range" className="ax-range" min={min} max={Math.max(min, d.defaults?.maxDaily ?? 100)} step={1} value={daily} onChange={(e) => setDaily(Number(e.target.value))} aria-label="Daily budget slider" />
            <div>
              <div className="x3-k">How long</div>
              <Segmented label="How long" value={String(days)} onChange={(v) => setDays(Number(v))} options={d.days.map((x) => ({ value: String(x), label: `${x} days` }))} />
            </div>
            {d.defaults?.audience && <div className="ax-t11">Who sees it: {d.defaults.audience}.</div>}
            {li && <label className="x3-check"><input type="checkbox" checked={notPolitical} onChange={(e) => setNotPolitical(e.target.checked)} /> This isn’t political advertising under the law of the countries it targets, including EU law.</label>}
            <p className="ax-note x3-flat">Nothing spends until you tap Turn it on.</p>
          </div>
        )}
      </Sheet>
    </div>
  )
}

// ── Share a report ──────────────────────────────────────────────────────────
type LinkRow = { id: string; label: string; from: string; to: string; createdAt: string; expiresAt: string; revokedAt?: string | null; by: string; url: string | null; live: boolean }
type ReportData = { links: LinkRow[]; monthly: boolean; to: string | null; ttls: number[]; link?: LinkRow }

export function ReportPanel() {
  const [d, setD] = useState<ReportData | null>(null)
  const [range, setRange] = useState<"last7" | "last30" | "month">("last30")
  const [ttl, setTtl] = useState("30")
  const [to, setTo] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [fresh, setFresh] = useState<LinkRow | null>(null)
  const { confirm, node: confirmNode } = useConfirm()
  const [failed, setFailed] = useState(false)
  const load = useCallback(() => { setFailed(false); void call<ReportData>("/api/workspace/ad-report").then((x) => { setD(x); setFailed(!x); setTo(x?.to ?? ""); if (x?.ttls?.length && !x.ttls.includes(30)) setTtl(String(x.ttls[0])) }) }, [])
  useEffect(() => { load() }, [load])
  if (!d && failed) return <LoadFailed what="your report links" onRetry={load} />
  if (!d) return <div className="x3-col"><Skeleton kind="card" /><Skeleton kind="card" lines={2} /></div>
  const post = async (body: unknown, key: string) => { setBusy(key); const r = await call<ReportData>("/api/workspace/ad-report", body); setBusy(null); if (r) { setD(r); if (r.link) setFresh(r.link) } }
  const emailOk = !to.trim() || /^\S+@\S+\.\S+$/.test(to.trim())

  return (
    <div className="x3-col">
      <section className="ax-card x3-pad">
        <SectionHeader first title="Share a read-only report" sub="Spend, leads, cost per lead, each campaign, your top ads and what I changed. Anyone with the link can see it, nobody can change anything." />
        <div className="x3-fields">
          <div><div className="x3-k">Dates</div><Segmented label="Dates" value={range} onChange={setRange} options={[{ value: "last7", label: "7 days" }, { value: "last30", label: "30 days" }, { value: "month", label: "Last month" }]} /></div>
          <Field label="Link works for"><Select value={ttl} onChange={(e) => setTtl(e.target.value)} options={d.ttls.map((x) => ({ value: String(x), label: `${x} days` }))} /></Field>
        </div>
        <div className="x3-acts"><Button variant="primary" loading={busy === "create"} onClick={() => void post({ op: "create", range, ttl: Number(ttl) }, "create")}>Make a link</Button></div>
        {fresh?.url && (
          <div className="x3-copy">
            <TextInput readOnly value={fresh.url} aria-label="Report link" onFocus={(e) => e.currentTarget.select()} />
            <CopyButton text={fresh.url} />
            <Button size="sm" href={fresh.url} external>Open</Button>
          </div>
        )}
      </section>

      {d.links.length > 0 && (
        <section>
          <SectionHeader title="Your links" />
          <List card label="Report links">
            {d.links.map((l) => (
              <ListRow
                key={l.id}
                title={l.label}
                meta={`Made ${fmtDay(l.createdAt)}${l.by === "monthly" ? " · monthly email" : ""}`}
                wrapEnd
                end={<>
                  {l.live ? <Pill tone="ok" dot>Works until {fmtDay(l.expiresAt)}</Pill> : <Pill tone="idle">{l.revokedAt ? "Turned off" : "Expired"}</Pill>}
                  {l.live && l.url && <CopyButton text={l.url} />}
                  {l.live && <Button size="sm" variant="ghost" loading={busy === l.id} onClick={async () => { if (await confirm({ title: "Turn this link off?", text: "Anyone who has it won’t be able to open the report anymore.", confirmLabel: "Turn it off", danger: true })) void post({ op: "revoke", id: l.id }, l.id) }}>Turn off</Button>}
                </>}
              />
            ))}
          </List>
        </section>
      )}

      <section className="ax-card x3-pad">
        <div className="x3-sw">
          <button className={`ax-sw${d.monthly ? " on" : ""}`} type="button" role="switch" aria-checked={d.monthly} aria-label="Monthly report email" disabled={!!busy} onClick={() => void post({ op: "monthly", on: !d.monthly, to: to.trim() || null }, "monthly")}><i /></button>
          <div><b>Email me last month’s report on the 1st</b><div className="ax-t11">It goes to your account email.</div></div>
        </div>
        {d.monthly && (
          <div className="x3-inline">
            <Field label="Also send it to" optional error={emailOk ? undefined : "That doesn’t look like an email address."}>
              <TextInput type="email" placeholder="name@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Button size="sm" loading={busy === "to"} disabled={!emailOk || to.trim() === (d.to ?? "")} onClick={() => void post({ op: "monthly", on: d.monthly, to: to.trim() || null }, "to")}>Save</Button>
          </div>
        )}
      </section>
      {confirmNode}
    </div>
  )
}
