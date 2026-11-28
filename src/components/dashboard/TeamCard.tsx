"use client"

import { useEffect, useState } from "react"
import { Button, Field, Pill, Select, SettingsSection, Skeleton, TextInput, useConfirm } from "@/components/workspace/ui"
import { MEMBER_ROLES, ROLE_HINT, ROLE_LABEL, type MemberRole, type Role } from "@/lib/team/permissions"

// "Team" on Your business (lib/team, /api/team). The owner or an admin invites people by email and
// picks their role; nothing they make goes live without a publisher's or the owner's OK.
// Members see their own role, can get the weekly briefing, and can leave.
type Member = { id: string; email: string; name: string | null; role: MemberRole; status: "invited" | "active"; briefing: boolean }
type Data = { role: Role; manage: boolean; seats: number; used: number; members: Member[]; me: { id: string; briefing: boolean } | null }
const ROLE_OPTS = MEMBER_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))

export function TeamCard() {
  const [d, setD] = useState<Data | null | undefined>(undefined)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<MemberRole>("creator")
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<{ ok: boolean; text: string; url?: string | null } | null>(null)
  const { confirm, node } = useConfirm()

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
    const to = email.trim()
    const r = await post({ op: "invite", email: to, role }, "invite")
    if (!r.ok) return
    setEmail("")
    setNote(r.data.emailed ? { ok: true, text: `I emailed the invite to ${to}.` } : { ok: true, text: "Invite saved. The email didn’t go out, so copy the link and send it yourself. It only works for that email address.", url: (r.data.url as string) ?? null })
    void load()
  }

  const notes = note && (
    <div className={note.ok ? "xs-ok" : "xs-err"} role={note.ok ? "status" : "alert"}>
      {note.text}
      {note.url && <Field label="Invite link"><TextInput readOnly value={note.url} onFocus={(e) => e.currentTarget.select()} /></Field>}
    </div>
  )

  if (d === undefined) return <SettingsSection title="Team" text="People who work on this brand with you."><Skeleton kind="row" rows={2} /></SettingsSection>
  if (d === null) return null
  const seatsLeft = Math.max(0, d.seats - d.used)

  // A team member's own view.
  if (d.role !== "owner" && !d.manage) {
    return (
      <SettingsSection title="Team" text={<>You’re a <b>{ROLE_LABEL[d.role].toLowerCase()}</b> on this brand. {ROLE_HINT[d.role]}</>}>
        {d.me && (
          <label className="xs-check">
            <input type="checkbox" checked={d.me.briefing} disabled={busy === "briefing"} onChange={async (e) => { const on = e.target.checked; const r = await post({ op: "briefing", on }, "briefing"); if (r.ok) setD({ ...d, me: { ...d.me!, briefing: on } }) }} />
            Email me the weekly briefing too
          </label>
        )}
        <div><Button variant="ghost" loading={busy === "leave"} onClick={async () => { if (!(await confirm({ title: "Leave this brand?", text: "You lose access straight away. The owner can invite you again.", confirmLabel: "Leave", danger: true }))) return; const r = await post({ op: "leave" }, "leave"); if (r.ok) window.location.href = "/dashboard" }}>Leave this brand</Button></div>
        {notes}
        {node}
      </SettingsSection>
    )
  }

  return (
    <SettingsSection
      title="Team"
      text="Invite people to work on this brand with you. Nothing they make goes live until a publisher or you say so. Only you can turn on Autopilot."
      id="team"
    >
      {d.seats === 0 ? (
        <p className="xs-mute">Teams come with Pro and Growth. On your plan it’s just you. <a href="/dashboard/upgrade?plan=pro">See the plans</a></p>
      ) : (
        <>
          <div className="xs-row"><Pill tone={seatsLeft ? "idle" : "warn"}>{d.used} of {d.seats} seats used</Pill></div>
          {d.members.length > 0 && (
            <div>
              {d.members.map((m) => (
                <div key={m.id} className="xs-member">
                  <div className="xs-member__who">
                    <b title={m.name || m.email}>{m.name || m.email}</b>
                    <span>{m.status === "invited" ? `Invited · ${m.email}` : m.name ? m.email : "Joined"}</span>
                  </div>
                  <Select aria-label={`Role for ${m.email}`} value={m.role} disabled={busy === m.id} options={ROLE_OPTS} onChange={async (e) => { const r = await post({ op: "role", id: m.id, role: e.target.value }, m.id); if (r.ok) void load() }} />
                  {m.status === "invited" && <Button size="sm" loading={busy === `r:${m.id}`} onClick={async () => { const r = await post({ op: "resend", id: m.id }, `r:${m.id}`); if (r.ok) setNote(r.data.emailed ? { ok: true, text: `I sent the invite to ${m.email} again.` } : { ok: true, text: "The email didn’t go out. Copy the link and send it yourself.", url: (r.data.url as string) ?? null }) }}>Send again</Button>}
                  <Button size="sm" variant="ghost" loading={busy === `x:${m.id}`} onClick={async () => { if (!(await confirm({ title: `Remove ${m.email}?`, text: "They lose access straight away.", confirmLabel: "Remove", danger: true }))) return; const r = await post({ op: "remove", id: m.id }, `x:${m.id}`); if (r.ok) void load() }}>Remove</Button>
                </div>
              ))}
            </div>
          )}

          {seatsLeft > 0 ? (
            <form className="xs-invite" onSubmit={(e) => { e.preventDefault(); if (email.trim()) void invite() }}>
              <Field label="Email to invite"><TextInput type="email" placeholder="name@company.com" value={email} onChange={(e) => { setEmail(e.target.value); setNote(null) }} autoComplete="off" /></Field>
              <Field label="Role"><Select value={role} options={ROLE_OPTS} onChange={(e) => setRole(e.target.value as MemberRole)} /></Field>
              <Button type="submit" variant="primary" loading={busy === "invite"} disabled={!email.trim()}>Invite</Button>
            </form>
          ) : (
            <p className="xs-mute">Every seat is taken. Remove someone to invite someone else, or write to <a href="mailto:hi@alphaa.app">hi@alphaa.app</a>.</p>
          )}

          <ul className="xs-roles">
            {MEMBER_ROLES.map((r) => <li key={r}><b>{ROLE_LABEL[r]}</b>: {ROLE_HINT[r]}</li>)}
          </ul>
        </>
      )}
      {notes}
      {node}
    </SettingsSection>
  )
}
