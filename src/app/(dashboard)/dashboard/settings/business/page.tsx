"use client"

import { useEffect, useState } from "react"
import { Loader2, Check } from "lucide-react"
import { DsCard } from "@/components/dashboard/DsCard"

// Business details — the info alphaa uses to write posts and run checks.
// Previously this was only editable during onboarding; users had no way to fix
// a typo'd website address or update their city. Uses the existing
// /api/user/onboarding-progress GET/PATCH endpoint (partial updates are safe).

interface BusinessForm {
  businessName: string
  websiteUrl: string
  city: string
  state: string
  zip: string
  voiceDescription: string
  topicsToAvoid: string
}

const EMPTY: BusinessForm = {
  businessName: "",
  websiteUrl: "",
  city: "",
  state: "",
  zip: "",
  voiceDescription: "",
  topicsToAvoid: "",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--ds-surface)",
  border: "0.5px solid var(--ds-border)",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "var(--ds-text)",
  outline: "none",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--ds-text-strong)",
  marginBottom: "6px",
}

export default function BusinessSettingsPage() {
  const [form, setForm] = useState<BusinessForm>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/user/onboarding-progress")
        if (!res.ok) throw new Error("load")
        const { profile } = (await res.json()) as { profile: Partial<BusinessForm> | null }
        if (!cancelled && profile) {
          setForm({
            businessName: profile.businessName ?? "",
            websiteUrl: profile.websiteUrl ?? "",
            city: profile.city ?? "",
            state: profile.state ?? "",
            zip: profile.zip ?? "",
            voiceDescription: profile.voiceDescription ?? "",
            topicsToAvoid: profile.topicsToAvoid ?? "",
          })
        }
      } catch {
        if (!cancelled)
          setError("We couldn't load your details just now. Refresh the page to try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function update(patch: Partial<BusinessForm>) {
    setForm((f) => ({ ...f, ...patch }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/user/onboarding-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("save")
      setSaved(true)
    } catch {
      setError("We couldn't save just now. Please try again in a moment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>Business details</h1>
      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "4px", marginBottom: "20px", lineHeight: 1.6 }}>
        alphaa uses these details to write your posts and check your visibility. Keep them
        accurate and alphaa does the rest.
      </p>

      <DsCard>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 0", color: "var(--ds-text-mute)", fontSize: "13px" }}>
            <Loader2 size={15} className="animate-spin" />
            Loading your details…
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Business name</label>
              <input
                style={inputStyle}
                value={form.businessName}
                onChange={(e) => update({ businessName: e.target.value })}
                placeholder="Bright Smile Dental"
              />
            </div>

            <div>
              <label style={labelStyle}>Website address</label>
              <input
                style={inputStyle}
                value={form.websiteUrl}
                onChange={(e) => update({ websiteUrl: e.target.value })}
                placeholder="yourbusiness.com"
              />
              <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "6px", lineHeight: 1.5 }}>
                alphaa checks this site every week for anything hurting your visibility.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={form.city} onChange={(e) => update({ city: e.target.value })} placeholder="Austin" />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={form.state} onChange={(e) => update({ state: e.target.value })} placeholder="TX" />
              </div>
              <div>
                <label style={labelStyle}>ZIP</label>
                <input style={inputStyle} value={form.zip} onChange={(e) => update({ zip: e.target.value })} placeholder="78701" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>What makes your business different?</label>
              <textarea
                style={{ ...inputStyle, resize: "none" }}
                rows={3}
                value={form.voiceDescription}
                onChange={(e) => update({ voiceDescription: e.target.value })}
                placeholder="Family-owned, gentle care, no-wait appointments…"
              />
              <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "6px", lineHeight: 1.5 }}>
                alphaa writes your posts in this voice — not generic AI copy.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Topics to avoid (optional)</label>
              <textarea
                style={{ ...inputStyle, resize: "none" }}
                rows={2}
                value={form.topicsToAvoid}
                onChange={(e) => update({ topicsToAvoid: e.target.value })}
                placeholder="Don't mention pricing…"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--ds-accent)",
                  color: "var(--ds-text)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 20px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--ds-ok)" }}>
                  <Check size={14} /> Saved — alphaa will use these from now on
                </span>
              )}
              {error && <span style={{ fontSize: "12px", color: "var(--ds-warn)" }}>{error}</span>}
            </div>
          </div>
        )}
      </DsCard>
    </div>
  )
}
