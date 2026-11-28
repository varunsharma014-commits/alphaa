"use client"

import { useEffect, useState } from "react"
import { Loader2, Check } from "lucide-react"
import { DsCard } from "@/components/dashboard/DsCard"
import { useCan } from "@/components/workspace/role"

// "Brand rules" on Your rules: words I never use, things I always say, the hashtags every social
// post carries (all platforms, or one platform) and the disclaimer each channel ends with.
// Saved via /api/agent/guardrails; enforced in code by every writer (lib/guardrails.ts).
type Platform = "facebook" | "instagram" | "linkedin" | "tiktok" | "x"
type Channel = "social" | "blog" | "email" | "ads" | "reviews"
type Rules = { banned: string[]; hashtags: string[]; platformHashtags: Partial<Record<Platform, string[]>>; disclaimers: Partial<Record<Channel, string>>; alwaysSay: string[] }

const PLATFORM_NAME: Record<Platform, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok", x: "X" }
const CHANNEL: { key: Channel; label: string; hint: string }[] = [
  { key: "social", label: "Social posts and Google updates", hint: "Added at the end of every post, inside each platform’s length limit." },
  { key: "blog", label: "Blog posts and website pages", hint: "Added as the last line of the page." },
  { key: "email", label: "Customer emails", hint: "Added as the last paragraph." },
  { key: "ads", label: "Ads", hint: "Added where it fits the ad’s length. If it doesn’t fit, I tell you instead of running it cut." },
  { key: "reviews", label: "Replies to Google reviews", hint: "Leave it empty and my replies carry no disclaimer. Set one and every reply ends with it." },
]

const input: React.CSSProperties = { width: "100%", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--ds-text)", outline: "none", resize: "vertical" }
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--ds-text-strong)", marginBottom: 6 }
const hint: React.CSSProperties = { fontSize: 11, color: "var(--ds-text-faint)", marginTop: 5, lineHeight: 1.5 }
const lines = (a: string[] | undefined) => (a ?? []).join("\n")

export function BrandRulesCard() {
  const [f, setF] = useState<Record<string, string> | null>(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [more, setMore] = useState(false)
  const canEdit = useCan("settings") // teams: owner or admin

  useEffect(() => {
    let off = false
    fetch("/api/agent/guardrails").then((r) => (r.ok ? r.json() : Promise.reject(new Error("load")))).then((d: { guardrails: Rules }) => {
      if (off) return
      const g = d.guardrails
      const next: Record<string, string> = { banned: lines(g.banned), alwaysSay: lines(g.alwaysSay), hashtags: g.hashtags.join(" ") }
      for (const p of Object.keys(PLATFORM_NAME) as Platform[]) next[`tags_${p}`] = (g.platformHashtags[p] ?? []).join(" ")
      for (const c of CHANNEL) next[`dis_${c.key}`] = g.disclaimers[c.key] ?? ""
      setF(next)
      setMore(Object.keys(g.platformHashtags).length > 0)
    }).catch(() => { if (!off) setF({}) })
    return () => { off = true }
  }, [])

  const set = (k: string, v: string) => { setF((x) => ({ ...(x ?? {}), [k]: v })); setNote(null) }

  async function save() {
    if (!f) return
    setSaving(true)
    const body = {
      banned: f.banned ?? "", alwaysSay: f.alwaysSay ?? "", hashtags: f.hashtags ?? "",
      platformHashtags: Object.fromEntries((Object.keys(PLATFORM_NAME) as Platform[]).map((p) => [p, f[`tags_${p}`] ?? ""])),
      disclaimers: Object.fromEntries(CHANNEL.map((c) => [c.key, f[`dis_${c.key}`] ?? ""])),
    }
    const res = await fetch("/api/agent/guardrails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { said?: string; error?: string } | null
    setSaving(false)
    setNote(res?.ok ? { ok: true, text: d?.said ?? "Saved." } : { ok: false, text: d?.error ?? "That didn’t save. Try again in a moment." })
  }

  return (
    <DsCard style={{ marginBottom: "1.25rem" }}>
      <div id="brand-rules" />
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-text-strong)", marginBottom: 4 }}>Brand rules</h2>
      <p style={{ fontSize: 12, color: "var(--ds-text-mute)", marginBottom: 14, lineHeight: 1.6 }}>
        Rules I follow in everything I write for you: social posts, Google updates, blog posts, emails and ads. If a draft breaks one, I throw it away and write it again.
      </p>
      {!f ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ds-text-mute)", fontSize: 13 }}><Loader2 size={15} className="animate-spin" />Loading your rules…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <div>
              <label style={label} htmlFor="br-banned">Words I never use</label>
              <textarea id="br-banned" style={input} rows={3} value={f.banned ?? ""} onChange={(e) => set("banned", e.target.value)} placeholder={"cheap\nno-brainer\nworld class"} />
              <p style={hint}>One per line. Whole words or phrases.</p>
            </div>
            <div>
              <label style={label} htmlFor="br-always">Things I always say</label>
              <textarea id="br-always" style={input} rows={3} value={f.alwaysSay ?? ""} onChange={(e) => set("alwaysSay", e.target.value)} placeholder={"Family-owned\nLicensed and insured"} />
              <p style={hint}>One per line. Only true facts about your business.</p>
            </div>
          </div>
          <div>
            <label style={label} htmlFor="br-tags">Hashtags on every social post</label>
            <input id="br-tags" style={input} value={f.hashtags ?? ""} onChange={(e) => set("hashtags", e.target.value)} placeholder="#YourBrand #YourCity" />
            <p style={hint}>Added to every post on every platform. <button type="button" onClick={() => setMore((m) => !m)} style={{ background: "none", border: 0, padding: 0, color: "var(--ds-accent)", cursor: "pointer", fontSize: 11 }}>{more ? "Hide per-platform hashtags" : "Add hashtags for one platform only"}</button></p>
          </div>
          {more && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {(Object.keys(PLATFORM_NAME) as Platform[]).filter((p) => p !== "tiktok" || !!f.tags_tiktok).map((p) => (
                <div key={p}>
                  <label style={label} htmlFor={`br-t-${p}`}>{PLATFORM_NAME[p]} only</label>
                  <input id={`br-t-${p}`} style={input} value={f[`tags_${p}`] ?? ""} onChange={(e) => set(`tags_${p}`, e.target.value)} placeholder="#tag" />
                </div>
              ))}
            </div>
          )}
          <div>
            <div style={{ ...label, marginBottom: 2 }}>Disclaimers</div>
            <p style={{ ...hint, marginTop: 0, marginBottom: 8 }}>Required wording (licence numbers, “Not financial advice”, offer terms). Leave a channel blank if it needs none.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {CHANNEL.map((c) => (
                <div key={c.key}>
                  <label style={label} htmlFor={`br-d-${c.key}`}>{c.label}</label>
                  <textarea id={`br-d-${c.key}`} style={input} rows={2} value={f[`dis_${c.key}`] ?? ""} onChange={(e) => set(`dis_${c.key}`, e.target.value)} />
                  <p style={hint}>{c.hint}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {!canEdit ? <span style={{ fontSize: 12, color: "var(--ds-text-mute)" }}>Only the owner or an admin can change brand rules.</span> : <button type="button" onClick={() => void save()} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--ds-accent)", color: "var(--ds-on-accent)", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving && <Loader2 size={14} className="animate-spin" />}{saving ? "Saving…" : "Save my brand rules"}
            </button>}
            {note && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: note.ok ? "var(--ds-ok)" : "var(--ds-warn)" }}>{note.ok && <Check size={14} />}{note.text}</span>}
          </div>
        </div>
      )}
    </DsCard>
  )
}
