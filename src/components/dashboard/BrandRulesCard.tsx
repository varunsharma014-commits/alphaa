"use client"

import { useEffect, useState } from "react"
import { Button, Field, FieldGrid, SettingsSection, Skeleton, TextArea, TextInput } from "@/components/workspace/ui"
import { useCan } from "@/components/workspace/role"

// "Brand rules" on Your business: words I never use, things I always say, the hashtags every social
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
  { key: "reviews", label: "Replies to Google reviews", hint: "Leave it empty and my replies carry no disclaimer." },
]
const lines = (a: string[] | undefined) => (a ?? []).join("\n")

export function BrandRulesCard() {
  const [f, setF] = useState<Record<string, string> | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
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

  const set = (k: string) => (e: { target: { value: string } }) => { const v = e.target.value; setF((x) => ({ ...(x ?? {}), [k]: v })); setDirty(true); setNote(null) }

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
    if (res?.ok) setDirty(false)
    setNote(res?.ok ? { ok: true, text: d?.said ?? "Saved." } : { ok: false, text: d?.error ?? "That didn’t save. Try again in a moment." })
  }

  const ro = !canEdit
  return (
    <SettingsSection
      id="brand-rules"
      title="Brand rules"
      text="Rules I follow in everything I write for you. If a draft breaks one, I throw it away and write it again."
      footer={f ? (
        canEdit ? (
          <>
            {note && <span className={note.ok ? "xs-ok" : "xs-err"} role={note.ok ? "status" : "alert"}>{note.text}</span>}
            <Button variant="primary" loading={saving} disabled={!dirty} onClick={() => void save()}>Save my brand rules</Button>
          </>
        ) : <span className="xs-fine">Only the owner or an admin can change brand rules.</span>
      ) : undefined}
    >
      {!f ? (
        <><Skeleton kind="line" width="40%" /><Skeleton kind="line" height={72} /><Skeleton kind="line" width="40%" /><Skeleton kind="line" height={40} /></>
      ) : (
        <>
          <FieldGrid min={220}>
            <Field label="Words I never use" hint="One per line. Whole words or phrases."><TextArea value={f.banned ?? ""} onChange={set("banned")} placeholder={"cheap\nno-brainer\nworld class"} readOnly={ro} /></Field>
            <Field label="Things I always say" hint="One per line. Only true facts about your business."><TextArea value={f.alwaysSay ?? ""} onChange={set("alwaysSay")} placeholder={"Family owned\nLicensed and insured"} readOnly={ro} /></Field>
          </FieldGrid>
          <Field label="Hashtags on every social post" hint="Added to every post on every platform."><TextInput value={f.hashtags ?? ""} onChange={set("hashtags")} placeholder="#YourBrand #YourCity" readOnly={ro} /></Field>
          <div><button type="button" className="ax-lnk" aria-expanded={more} onClick={() => setMore((m) => !m)}>{more ? "Hide hashtags for one platform" : "Add hashtags for one platform only"}</button></div>
          {more && (
            <FieldGrid min={160}>
              {(Object.keys(PLATFORM_NAME) as Platform[]).filter((p) => p !== "tiktok" || !!f.tags_tiktok).map((p) => (
                <Field key={p} label={`${PLATFORM_NAME[p]} only`}><TextInput value={f[`tags_${p}`] ?? ""} onChange={set(`tags_${p}`)} placeholder="#tag" readOnly={ro} /></Field>
              ))}
            </FieldGrid>
          )}
          <div>
            <h3 className="xs-h3">Disclaimers</h3>
            <p className="xs-fine">Required wording, like a licence number, “Not financial advice” or offer terms. Leave a channel blank if it needs none.</p>
          </div>
          <FieldGrid min={220}>
            {CHANNEL.map((c) => (
              <Field key={c.key} label={c.label} hint={c.hint} optional><TextArea rows={2} value={f[`dis_${c.key}`] ?? ""} onChange={set(`dis_${c.key}`)} readOnly={ro} /></Field>
            ))}
          </FieldGrid>
        </>
      )}
    </SettingsSection>
  )
}
