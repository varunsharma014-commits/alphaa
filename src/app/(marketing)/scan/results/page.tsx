"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ScanLoader } from "@/components/scan/ScanLoader"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import type { ScanResult } from "@/types/scan"
import {
  Bot, MapPin, Star, LayoutGrid, HelpCircle,
  AlertCircle, AlertTriangle, Lightbulb,
  Globe, Sparkles, MessageSquare, Search,
  Building2, Rocket, Wand2, ArrowRight, Check,
} from "lucide-react"

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/[\s._\-]+/)
    .map((w) => w[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const ISSUE_ICONS = [Bot, MapPin, Star, LayoutGrid, HelpCircle]

function getIssueIcon(severity: string, index: number) {
  if (index < ISSUE_ICONS.length) return ISSUE_ICONS[index]
  if (severity === "critical") return AlertCircle
  if (severity === "warning") return AlertTriangle
  return Lightbulb
}

const dotGrid = {
  backgroundImage:
    "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const

const ENGINES = [
  {
    key: "chatgpt",
    responseKey: "chatgpt",
    name: "ChatGPT",
    Icon: MessageSquare,
    iconBg: "#1a1a2e",
    iconColor: "#22c55e",
  },
  {
    key: "google_ai",
    responseKey: "claude",
    name: "Google AI",
    Icon: Globe,
    iconBg: "#fff1f2",
    iconColor: "#dc2626",
  },
  {
    key: "perplexity",
    responseKey: "perplexity",
    name: "Perplexity",
    Icon: Search,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  {
    key: "gemini",
    responseKey: "gemini",
    name: "Gemini",
    Icon: Sparkles,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
  },
]

const SEVERITY_STYLE = {
  critical:    { iconBg: "#fef2f2", iconColor: "#dc2626" },
  warning:     { iconBg: "#fffbeb", iconColor: "#d97706" },
  improvement: { iconBg: "#eff6ff", iconColor: "#2563eb" },
} as const

// ── Main component ─────────────────────────────────────────────────────────

function ScanResultsContent() {
  const params  = useSearchParams()
  const scanId  = params.get("id")
  const [result, setResult]   = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    if (!scanId) { setError(true); setLoading(false); return }
    let attempts = 0
    const poll = async () => {
      try {
        const res  = await fetch(`/api/scan/result?id=${scanId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.ready) { setResult(data.result); setLoading(false); return }
        }
        attempts++
        if (attempts < 30) setTimeout(poll, 2000)
        else { setError(true); setLoading(false) }
      } catch {
        attempts++
        if (attempts < 30) setTimeout(poll, 2000)
        else { setError(true); setLoading(false) }
      }
    }
    poll()
  }, [scanId])

  if (loading) return <ScanLoader />

  if (error || !result) {
    return (
      <div className="pt-24 pb-20 px-4 text-center">
        <p className="text-white text-lg mb-4">We couldn&apos;t complete your scan.</p>
        <OrangePillButton href="/scan">Try again →</OrangePillButton>
      </div>
    )
  }

  // ── Derived data ──────────────────────────────────────────────────────
  const aiStatus       = result.aiSearchStatus as Record<string, string>
  const engineResponses = result.engineResponses ?? {}
  const businessName   = result.businessName || result.businessUrl
  const initials       = getInitials(businessName)
  const issueCount     = result.issues.length

  const engineData = ENGINES.map((e) => {
    const status = aiStatus[e.key]
    const found  = status === "occasionally" || status === "frequently"
    const raw    = engineResponses[e.responseKey]
    const detail = found
      ? (raw?.slice(0, 140) ?? `${businessName} was mentioned by ${e.name}.`)
      : `${e.name} searched for businesses like yours in ${result.city}. Yours wasn't mentioned.`
    return { ...e, found, detail }
  })

  const aiMentions = engineData.filter((e) => e.found).length

  return (
    <div className="pt-20 pb-20 px-4 sm:px-6" style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── 1. Business header bar ─────────────────────────────── */}
        <div
          className="flex items-center gap-3"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: "14px 18px" }}
        >
          {/* Avatar */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 40, height: 40, borderRadius: 8, background: "#e05a2b" }}
          >
            {result.ogData?.favicon ? (
              <img
                src={result.ogData.favicon}
                alt=""
                className="w-5 h-5 rounded"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            ) : (
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{initials}</span>
            )}
          </div>

          {/* Name + location */}
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontSize: 15, fontWeight: 500, color: "#111", margin: 0 }}>
              {businessName}
            </p>
            <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
              <MapPin style={{ width: 11, height: 11, color: "#9ca3af" }} />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{result.city}</span>
              {result.ogData?.domain && (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>&nbsp;· {result.ogData.domain}</span>
              )}
            </div>
          </div>

          {/* Scan complete badge */}
          <div
            className="flex items-center gap-1.5 flex-shrink-0"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 10px" }}
          >
            <Check style={{ width: 12, height: 12, color: "#16a34a" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#16a34a" }}>Scan complete</span>
          </div>
        </div>

        {/* ── 2. Hero ───────────────────────────────────────────────── */}
        <div style={{ background: "#0f0f0f", borderRadius: 20, padding: "36px 28px", position: "relative", overflow: "hidden" }}>
          <div style={{ ...dotGrid, position: "absolute", inset: 0, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>

            {/* Pill badge */}
            <div className="flex justify-center mb-5">
              <div
                className="inline-flex items-center gap-2"
                style={{ background: "#161616", border: "1px solid #222", borderRadius: 20, padding: "5px 12px" }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
                  display: "inline-block", boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
                }} />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>alphaa AI · scanned just now</span>
              </div>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.3, margin: "0 0 12px" }}>
              We found exactly what&apos;s holding{" "}
              <span style={{ color: "#e05a2b" }}>{businessName}</span>{" "}
              back.
            </h1>

            {/* Subline */}
            <p style={{
              fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 1.6,
              margin: "0 auto 28px", maxWidth: 420,
            }}>
              Our AI checked your business across the whole internet in 60 seconds. Here&apos;s
              the honest picture — in plain English, no tech-speak.
            </p>

            {/* 3-col stat grid */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { Icon: Bot,           color: "#dc2626", value: `${aiMentions} / 4`, label: "AI assistants mention you" },
                { Icon: Star,          color: "#d97706", value: "0",                 label: "Recent customer reviews" },
                { Icon: AlertTriangle, color: "#dc2626", value: String(issueCount),  label: "Things losing you customers" },
              ] as const).map((stat, i) => (
                <div key={i} style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "16px 10px", textAlign: "center" }}>
                  <stat.Icon style={{ width: 20, height: 20, color: stat.color, margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, lineHeight: 1.4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. AI Engines ─────────────────────────────────────────── */}
        <div>
          {/* Section label */}
          <div className="flex items-center gap-3 mb-4">
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
              When a customer asks AI &ldquo;who does this in {result.city}?&rdquo;
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          </div>

          {/* 2×2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {engineData.map((engine) => (
              <div
                key={engine.key}
                style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: 16 }}
              >
                {/* Top row: icon + name + status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 28, height: 28, borderRadius: 8, background: engine.iconBg }}
                    >
                      <engine.Icon style={{ width: 15, height: 15, color: engine.iconColor }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{engine.name}</span>
                  </div>
                  {engine.found ? (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: "#16a34a",
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      borderRadius: 20, padding: "3px 8px",
                    }}>
                      You&apos;re here! ✓
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: "#dc2626",
                      background: "#fef2f2", border: "1px solid #fecaca",
                      borderRadius: 20, padding: "3px 8px",
                    }}>
                      Not you
                    </span>
                  )}
                </div>
                {/* Detail text */}
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                  {engine.found ? <em>{engine.detail}</em> : engine.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Issues ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
              What&apos;s actually costing you customers right now
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          </div>

          {issueCount === 0 ? (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "24px", textAlign: "center" }}>
              <Check style={{ width: 24, height: 24, color: "#16a34a", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#166534", margin: 0 }}>
                Great news — no major issues found!
              </p>
              <p style={{ fontSize: 13, color: "#16a34a", marginTop: 4, marginBottom: 0 }}>
                Your business looks healthy across all our checks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.issues.map((issue, i) => {
                const sev   = issue.severity as keyof typeof SEVERITY_STYLE
                const style = SEVERITY_STYLE[sev] ?? SEVERITY_STYLE.improvement
                const Icon  = getIssueIcon(issue.severity, i)
                return (
                  <div
                    key={i}
                    style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: 16 }}
                  >
                    <div className="flex gap-3">
                      {/* Icon tile */}
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 48, height: 48, borderRadius: 12, background: style.iconBg }}
                      >
                        <Icon style={{ width: 22, height: 22, color: style.iconColor }} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: "0 0 6px", lineHeight: 1.4 }}>
                          {issue.headline}
                        </p>
                        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 10px" }}>
                          {issue.explanation}
                        </p>
                        {/* Fix row */}
                        <div
                          className="flex items-start gap-2"
                          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px" }}
                        >
                          <Wand2 style={{ width: 13, height: 13, color: "#16a34a", flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.5 }}>
                            {issue.fix_summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 5. CTA block ──────────────────────────────────────────── */}
        <div style={{ background: "#0f0f0f", borderRadius: 20, padding: "36px 28px", position: "relative", overflow: "hidden" }}>
          <div style={{ ...dotGrid, position: "absolute", inset: 0, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>

            {/* Eyebrow */}
            <p style={{ fontSize: 11, color: "#6b7280", textAlign: "center", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Here&apos;s the good news
            </p>

            {/* Headline */}
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", textAlign: "center", margin: "0 0 12px", lineHeight: 1.3 }}>
              alphaa fixes <span style={{ color: "#e05a2b" }}>all of this.</span>
              <br />
              <span style={{ fontWeight: 400, fontSize: 19 }}>Automatically. While you sleep.</span>
            </h2>

            {/* Subline */}
            <p style={{
              fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 1.6,
              margin: "0 auto 28px", maxWidth: 400,
            }}>
              You tell alphaa about your business once. It posts to Google, improves your AI
              visibility, handles reviews, and sends you weekly progress reports — forever, on autopilot.
            </p>

            {/* 3-step flow */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-6">
              {([
                { num: 1, Icon: Building2, label: "Tell alphaa about your business" },
                { num: 2, Icon: Globe,     label: "Connect Google with one click" },
                { num: 3, Icon: Rocket,    label: "alphaa runs everything from here" },
              ] as const).map((step, i) => (
                <div key={i} className="flex-1 flex items-center gap-2">
                  <div
                    style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "16px 12px", flex: 1, textAlign: "center" }}
                  >
                    <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      Step {step.num}
                    </div>
                    <step.Icon style={{ width: 22, height: 22, color: "#e05a2b", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>{step.label}</p>
                  </div>
                  {i < 2 && (
                    <ArrowRight style={{ width: 14, height: 14, color: "#333", flexShrink: 0 }} className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div style={{ maxWidth: 400, margin: "0 auto 10px" }}>
              <a
                href="https://alphaa.app/signup"
                style={{
                  display: "block", width: "100%", background: "#e05a2b", color: "#fff",
                  fontSize: 16, fontWeight: 600, textAlign: "center",
                  padding: "14px 24px", borderRadius: 12, textDecoration: "none",
                }}
              >
                Start my free 14-day trial →
              </a>
            </div>

            {/* Fine print */}
            <p style={{ fontSize: 12, color: "#6b7280", textAlign: "center", margin: "0 0 24px" }}>
              No credit card · Cancel anytime · First post goes live within 24 hours
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "#1e1e1e", marginBottom: 24 }} />

            {/* 3-col social proof */}
            <div
              className="grid grid-cols-3"
              style={{ borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e", padding: "20px 0", marginBottom: 24 }}
            >
              {([
                { value: "1,200+",  label: "businesses on alphaa" },
                { value: "4.9 / 5", label: "average rating" },
                { value: "$500/mo", label: "avg saved vs. agency" },
              ] as const).map((item, i) => (
                <div
                  key={i}
                  style={{ textAlign: "center", borderRight: i < 2 ? "1px solid #1e1e1e" : "none" }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div style={{ background: "#161616", borderRadius: 12, padding: 20 }}>
              <div className="flex gap-0.5 mb-3">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>{s}</span>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 14px" }}>
                &ldquo;I was paying $1,400 a month to an SEO agency and ChatGPT had never heard of
                me. I tried alphaa, appeared on ChatGPT in 11 days, and cancelled the agency the
                same week.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 34, height: 34, borderRadius: "50%", background: "#e05a2b" }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>SK</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>Sarah K.</p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>General Dentist, Austin TX</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default function ScanResultsPage() {
  return (
    <Suspense fallback={<ScanLoader />}>
      <ScanResultsContent />
    </Suspense>
  )
}
