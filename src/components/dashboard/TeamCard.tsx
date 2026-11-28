"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { DsCard } from "@/components/dashboard/DsCard"
import { MEMBER_ROLES, ROLE_HINT, ROLE_LABEL, type MemberRole, type Role } from "@/lib/team/permissions"

// "Team" on Your rules (lib/team, /api/team). The owner or an admin invites people by email and
// picks their role; nothing they make goes live without a publisher's or the owner's OK.
// Members see their own role, can get the weekly briefing, and can leave.
type Member = { id: string; email: string; name: string | null; role: MemberRole; status: "invited" | "active"; briefing: boolean }
type Data = { role: Role; manage: boolean; seats: number; used: number; members: Member[]; me: { id: string; briefing: boolean } | null }

const input: React.CSSProperties = { background: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "var(--ds-text)", outline: "none" }
const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--ds-accent)", color: "var(--ds-on-accent)", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }
const ghost: React.CSSProperties = { background: "none", border: "1px solid var(--ds-border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "var(--ds-text)", cursor: "pointer" }
const mute: React.CSSProperties = { fontSize: 12, color: "var(--ds-text-mute)", lineHeight: 1.5 }

export function TeamCard() {
  const [d, setD] = useState<Data | null>(null)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<MemberRole>("creator")
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<{ ok: boolean; text: string; url?: string | null } | null>(null)

  const load = () => fetch("/api/team").then((r) => (r.ok ? r.json() : null)).then((x: Data | null) => setD(x)).catch(() => setD(null))
  useEffect(() => { void load() }, [])

  async function post(body: Record<string, unknown>, key: string): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    setBusy(key)
    setNote(null)
    const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
    const data = ((await res?.json().catch(() => null)) ?? {}) as Record<string, unknown>
    setBusy(null)
    if (!res?.ok) setNote({ ok: false, text: String(data.error ?? "That didn’t work. Try again in a moment.") })
    return { ok: !!res?.ok, data }
  }

  async function invite() {
    const r = await post({ op: "invite", email, role }, "invite")
    if (!r.ok) return
    setEmail("")
    setNote(r.data.emailed ? { ok: true, text: `I emailed the invite to ${email.trim()}.` } : { ok: true, text: "Invite saved. The email didn’t go out, so copy the link and send it yourself. It only works for that email address.", url: (r.data.url as string) ?? null })
    void load()
  }

  if (!d) return null
  const seatsLeft = Math.max(0, d.seats - d.used)

  // A team member's own view.
  if (d.role !== "owner" && !d.manage) {
    return (
      <DsCard>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-text-strong)" }}>Team</h2>
        <p style={{ ...mute, marginTop: 6 }}>You’re a <b>{ROLE_LABEL[d.role].toLowerCase()}</b> on this brand. {ROLE_HINT[d.role]}</p>
        {d.me && (
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 12, color: "var(--ds-text)" }}>
            <input type="checkbox" checked={d.me.briefing} disabled={busy === "briefing"} onChange={async (e) => { const on = e.target.checked; const r = await post({ op: "briefing", on }, "briefing"); if (r.ok) setD({ ...d, me: { ...d.me!, briefing: on } }) }} />
            Email me the weekly briefing too
          </label>
        )}
        <div style={{ marginTop: 14 }}>
          <button type="button" style={ghost} disabled={busy === "leave"} onClick={async () => { if (!confirm("Leave this brand? You’ll lose access straight away.")) return; const r = await post({ op: "leave" }, "leave"); if (r.ok) window.location.href = "/dashboard" }}>Leave this brand</button>
        </div>
        {note && <p style={{ ...mute, marginTop: 10, color: note.ok ? "var(--ds-ok)" : "var(--ds-warn)" }}>{note.text}</p>}
      </DsCard>
    )
  }

  return (
    <DsCard>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-text-strong)" }}>Team</h2>
        {d.seats > 0 && <span style={mute}>{d.used} of {d.seats} seats used</span>}
      </div>
      <p style={{ ...mute, marginTop: 6 }}>
        Invite people to work on this brand with you. Nothing they make goes live until a publisher or you say so. Autopilot only covers work I make myself, and only you can turn it on.
      </p>

      {d.seats === 0 ? (
        <p style={{ fontSize: 13, marginTop: 12, color: "var(--ds-text)" }}>
          Teams come with Pro and Growth. On your plan it’s just you. <a href="/dashboard/upgrade" style={{ color: "var(--ds-accent)" }}>See the plans</a>
        </p>
      ) : (
        <>
          {d.members.length > 0 && (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {d.members.map((m) => (
                <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--ds-border)", paddingTop: 10 }}>
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ds-text)", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name || m.email}</div>
                    <div style={mute}>{m.status === "invited" ? `Invited · ${m.email}` : m.name ? m.email : "Joined"}</div>
                  </div>
                  <select aria-label={`Role for ${m.email}`} style={input} value={m.role} disabled={busy === m.id} onChange={async (e) => { const r = await post({ op: "role", id: m.id, role: e.target.value }, m.id); if (r.ok) void load() }}>
                    {MEMBER_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  {m.status === "invited" && <button type="button" style={ghost} disabled={busy === `r:${m.id}`} onClick={async () => { const r = await post({ op: "resend", id: m.id }, `r:${m.id}`); if (r.ok) setNote(r.data.emailed ? { ok: true, text: `I sent the invite to ${m.email} again.` } : { ok: true, text: "The email didn’t go out. Copy the link and send it yourself.", url: (r.data.url as string) ?? null }) }}>Send again</button>}
                  <button type="button" style={ghost} disabled={busy === `x:${m.id}`} onClick={async () => { if (!confirm(`Remove ${m.email}? They lose access straight away.`)) return; const r = await post({ op: "remove", id: m.id }, `x:${m.id}`); if (r.ok) void load() }}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {seatsLeft > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              <input style={{ ...input, flex: "1 1 220px" }} type="email" placeholder="name@company.com" value={email} onChange={(e) => { setEmail(e.target.value); setNote(null) }} aria-label="Email to invite" />
              <select style={input} value={role} onChange={(e) => setRole(e.target.value as MemberRole)} aria-label="Role">
                {MEMBER_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <button type="button" style={{ ...btn, opacity: busy === "invite" || !email.trim() ? 0.6 : 1 }} disabled={busy === "invite" || !email.trim()} onClick={() => void invite()}>
                {busy === "invite" && <Loader2 size={14} className="animate-spin" />}Invite
              </button>
            </div>
          ) : (
            <p style={{ ...mute, marginTop: 14 }}>Every seat is taken. Remove someone to invite someone else, or write to hi@alphaa.app.</p>
          )}

          <ul style={{ ...mute, marginTop: 14, paddingLeft: 16, listStyle: "disc" }}>
            {MEMBER_ROLES.map((r) => <li key={r}><b>{ROLE_LABEL[r]}</b>: {ROLE_HINT[r]}</li>)}
          </ul>
        </>
      )}
      {note && (
        <div style={{ ...mute, marginTop: 10, color: note.ok ? "var(--ds-ok)" : "var(--ds-warn)" }}>
          {note.text}
          {note.url && <input readOnly value={note.url} onFocus={(e) => e.currentTarget.select()} style={{ ...input, width: "100%", marginTop: 6, fontSize: 12 }} aria-label="Invite link" />}
        </div>
      )}
    </DsCard>
  )
}
