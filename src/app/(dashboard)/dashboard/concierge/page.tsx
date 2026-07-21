"use client"

// "Do it for me" — human-fulfilled setup service.
//
// Honesty rules for this page (they ARE the product here):
// - Sold as a real person doing the work within a stated SLA, never as
//   more automation.
// - Access is invite-based and revocable (WP admin invite, Shopify
//   collaborator, Webflow seat…). We NEVER ask for passwords, and we say so.
// - Intake is captured BEFORE Stripe so an abandoned payment still leaves a
//   lead we can help.

import { useEffect, useState } from "react"
import { DsCard } from "@/components/dashboard/DsCard"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { CheckCircle2, HandHelping, ShieldCheck, Clock } from "lucide-react"

const SUPPORT_EMAIL = "hi@alphaa.app"

const PLATFORMS: { key: string; label: string; steps: string[] }[] = [
  {
    key: "WordPress",
    label: "WordPress",
    steps: [
      `In your WordPress admin, go to Users → Add New User.`,
      `Email: ${SUPPORT_EMAIL} · Role: Administrator.`,
      `That's it — we do the rest and you can remove the user the moment we're done.`,
    ],
  },
  {
    key: "Shopify",
    label: "Shopify",
    steps: [
      `In Shopify admin, go to Settings → Users and permissions.`,
      `Send a collaborator invite to ${SUPPORT_EMAIL}.`,
      `Collaborators don't count toward your staff limit and can be removed anytime.`,
    ],
  },
  {
    key: "Webflow",
    label: "Webflow",
    steps: [
      `In your Webflow site settings, open Site access (or Workspace members).`,
      `Invite ${SUPPORT_EMAIL} with editor/designer access.`,
      `Remove the seat once we confirm everything is live.`,
    ],
  },
  {
    key: "Squarespace",
    label: "Squarespace",
    steps: [
      `In Squarespace, go to Settings → Permissions & Ownership.`,
      `Invite ${SUPPORT_EMAIL} as an Administrator (needed for code injection).`,
      `Revoke the invite when we're done — you'll get a confirmation email from us first.`,
    ],
  },
  {
    key: "Wix",
    label: "Wix",
    steps: [
      `In your Wix dashboard, go to Settings → Roles & Permissions.`,
      `Invite ${SUPPORT_EMAIL} as a Website Manager.`,
      `Remove the collaborator anytime — one click.`,
    ],
  },
  {
    key: "Other",
    label: "Other / custom site",
    steps: [
      `No problem — most site builders and hosts have a way to invite a collaborator.`,
      `Tell us what your site runs on in the notes below, or loop in whoever manages it.`,
      `We'll reply from ${SUPPORT_EMAIL} with exactly what we need. Never send passwords.`,
    ],
  },
]

export default function ConciergePage() {
  const [platform, setPlatform] = useState<string>("WordPress")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState<"setup" | "fullservice" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<"paid" | "upgraded" | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("paid") === "1") setDone("paid")
    else if (params.get("upgraded") === "1") setDone("upgraded")
  }, [])

  async function book(service: "setup" | "fullservice") {
    setBusy(service)
    setError(null)
    try {
      // Capture intake first — an abandoned checkout should still reach us.
      await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, service, notes }),
      })
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase: service }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? "Couldn't open checkout — please try again.")
    } catch {
      setError("Couldn't open checkout — please try again.")
    }
    setBusy(null)
  }

  const selected = PLATFORMS.find((p) => p.key === platform) ?? PLATFORMS[0]

  if (done) {
    return (
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <DsCard accent="var(--ds-ok)" style={{ background: "var(--ds-ok-bg)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <CheckCircle2 size={22} color="var(--ds-ok)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ds-text)" }}>
                {done === "paid" ? "You're booked." : "Welcome to Full Service."}
              </h1>
              <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.7, marginTop: "6px" }}>
                A real person from alphaa will complete your setup <strong>within 2 business days</strong>.
                Here's what happens next:
              </p>
              <ol style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.8, marginTop: "8px", paddingLeft: "18px" }}>
                <li>Send the collaborator invite for <strong>{selected.label}</strong> to {SUPPORT_EMAIL} (steps below).</li>
                <li>We install your code, verify it renders, and confirm AI crawlers can read your site.</li>
                <li>You get a confirmation email with proof — then you can revoke our access.</li>
              </ol>
              <div style={{ marginTop: "12px", padding: "12px", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "8px" }}>
                {selected.steps.map((s, i) => (
                  <p key={i} style={{ fontSize: "12.5px", color: "var(--ds-text-mute)", lineHeight: 1.7, margin: 0 }}>
                    {i + 1}. {s}
                  </p>
                ))}
              </div>
              <p style={{ fontSize: "12px", color: "var(--ds-text-faint)", marginTop: "10px" }}>
                Questions? Email {SUPPORT_EMAIL} — a real person reads every message.
              </p>
            </div>
          </div>
        </DsCard>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <AutopilotBar message="This is a human service — a real person from alphaa does the work, on a stated deadline" />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <HandHelping size={20} color="var(--ds-accent)" />
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>We'll set it up for you</h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.7, marginBottom: "16px" }}>
        Never touch a code snippet. A real person from alphaa installs your AI-visibility code,
        verifies it renders, and confirms the AI crawlers can read your site —{" "}
        <strong style={{ color: "var(--ds-text)" }}>within 2 business days</strong>.
      </p>

      {/* Trust strip */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ds-text-mute)" }}>
          <ShieldCheck size={14} color="var(--ds-ok)" /> Invite-based access — never your password
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ds-text-mute)" }}>
          <Clock size={14} color="var(--ds-ok)" /> Done within 2 business days
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--ds-text-mute)" }}>
          <CheckCircle2 size={14} color="var(--ds-ok)" /> Revoke our access anytime
        </span>
      </div>

      <SectionDivider>1 — WHAT RUNS YOUR WEBSITE?</SectionDivider>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            style={{
              padding: "7px 14px",
              borderRadius: "999px",
              fontSize: "13px",
              cursor: "pointer",
              border: `1px solid ${platform === p.key ? "var(--ds-accent)" : "var(--ds-border)"}`,
              background: platform === p.key ? "var(--ds-warn-bg)" : "var(--ds-surface)",
              color: platform === p.key ? "var(--ds-accent)" : "var(--ds-text-mute)",
              fontWeight: platform === p.key ? 600 : 400,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <DsCard style={{ marginBottom: "18px" }}>
        <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ds-text-ghost)", marginBottom: "8px" }}>
          How you'll give us access — after you book
        </p>
        {selected.steps.map((s, i) => (
          <p key={i} style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.8, margin: 0 }}>
            {i + 1}. {s}
          </p>
        ))}
      </DsCard>

      <SectionDivider>2 — ANYTHING WE SHOULD KNOW? (OPTIONAL)</SectionDivider>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={2000}
        placeholder="e.g. My developer manages the site — cc dev@example.com · The site is in French · Please don't touch the homepage layout"
        style={{
          width: "100%",
          minHeight: "80px",
          padding: "12px",
          fontSize: "13px",
          borderRadius: "8px",
          border: "1px solid var(--ds-border)",
          background: "var(--ds-surface)",
          color: "var(--ds-text)",
          resize: "vertical",
          marginBottom: "18px",
        }}
      />

      <SectionDivider>3 — PICK YOUR SERVICE</SectionDivider>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <DsCard accent="var(--ds-accent)">
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ds-text)" }}>One-time setup</h2>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--ds-text)", margin: "6px 0" }}>
            $149 <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ds-text-faint)" }}>one-time</span>
          </div>
          <ul style={{ listStyle: "none", margin: "0 0 14px", padding: 0, display: "grid", gap: "6px" }}>
            {["We install all your Vault code", "We add your llms.txt", "We verify AI crawlers can read your site", "Proof emailed to you when done"].map((f) => (
              <li key={f} style={{ display: "flex", gap: "7px", fontSize: "12.5px", color: "var(--ds-text-mute)", lineHeight: 1.5 }}>
                <CheckCircle2 size={13} color="var(--ds-ok)" style={{ flexShrink: 0, marginTop: "2px" }} />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => book("setup")}
            disabled={busy !== null}
            style={{
              width: "100%", padding: "10px", borderRadius: "999px", border: "none", cursor: "pointer",
              background: "var(--ds-accent)", color: "#fff", fontSize: "13.5px", fontWeight: 600,
              opacity: busy && busy !== "setup" ? 0.5 : 1,
            }}
          >
            {busy === "setup" ? "Opening checkout…" : "Book my setup — $149"}
          </button>
        </DsCard>

        <DsCard>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ds-text)" }}>Full Service</h2>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--ds-text)", margin: "6px 0" }}>
            $299 <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ds-text-faint)" }}>/month</span>
          </div>
          <ul style={{ listStyle: "none", margin: "0 0 14px", padding: 0, display: "grid", gap: "6px" }}>
            {["Everything in Pro, plus:", "Setup included (no $149 fee)", "A human publishes your monthly blogs & FAQs to your site", "Schema kept up to date for you"].map((f) => (
              <li key={f} style={{ display: "flex", gap: "7px", fontSize: "12.5px", color: "var(--ds-text-mute)", lineHeight: 1.5 }}>
                <CheckCircle2 size={13} color="var(--ds-ok)" style={{ flexShrink: 0, marginTop: "2px" }} />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => book("fullservice")}
            disabled={busy !== null}
            style={{
              width: "100%", padding: "10px", borderRadius: "999px", cursor: "pointer",
              border: "1px solid var(--ds-accent)", background: "transparent",
              color: "var(--ds-accent)", fontSize: "13.5px", fontWeight: 600,
              opacity: busy && busy !== "fullservice" ? 0.5 : 1,
            }}
          >
            {busy === "fullservice" ? "Opening checkout…" : "Upgrade to Full Service"}
          </button>
        </DsCard>
      </div>

      {error && (
        <p style={{ fontSize: "13px", color: "var(--ds-bad)", marginBottom: "12px" }}>{error}</p>
      )}

      <p style={{ fontSize: "12px", color: "var(--ds-text-faint)", lineHeight: 1.7 }}>
        Both are fulfilled by a real person at alphaa — not automation — within 2 business days of
        getting access. Payments secured by Stripe. Questions first? Email {SUPPORT_EMAIL}.
      </p>
    </div>
  )
}
