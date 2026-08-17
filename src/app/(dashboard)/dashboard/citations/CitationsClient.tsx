"use client"

import { useState } from "react"
import { ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { DsCard } from "@/components/dashboard/DsCard"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import type { CitationReport, CitationTarget, CitationKind } from "@/lib/citations"

// Plain English for each source type. A dentist should not have to know what a
// "citation source" is to use this screen.
const KIND_LABEL: Record<CitationKind, string> = {
  bestof: "“Best of” list",
  directory: "Directory",
  review: "Review site",
  forum: "Forum",
  other: "Other page",
}

const KIND_WHY: Record<CitationKind, string> = {
  bestof: "AI quotes these lists almost word for word.",
  directory: "AI checks these to confirm you exist and where you are.",
  review: "AI reads these to decide if you're any good.",
  forum: "Perplexity and ChatGPT lean on real people's answers.",
  other: "AI may read this page when answering about your area.",
}

function StatusChip({ status }: { status: CitationTarget["status"] }) {
  if (status === "listed") return <StatusPill variant="found">You&apos;re on it</StatusPill>
  if (status === "missing") return <StatusPill variant="warning">Not on it</StatusPill>
  // Never say "missing" when the page simply couldn't be read.
  return <StatusPill variant="neutral">Couldn&apos;t check</StatusPill>
}

export function CitationsClient({ initial }: { initial: CitationReport | null }) {
  const [report, setReport] = useState<CitationReport | null>(initial)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch("/api/citations", { method: "POST" })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Scan failed.")
      else setReport(data.report)
    } catch {
      setError("Scan failed. Check your connection and try again.")
    } finally {
      setRunning(false)
    }
  }

  const missing = report?.targets.filter((t) => t.status === "missing") ?? []
  const listed = report?.targets.filter((t) => t.status === "listed") ?? []
  const unknown = report?.targets.filter((t) => t.status === "unknown") ?? []

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ds-text)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Where AI looks you up
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ds-text-mute)", marginTop: "6px", lineHeight: 1.6, maxWidth: "60ch" }}>
            When someone asks ChatGPT or Gemini for a business like yours, it reads a handful of
            pages to decide who to name. These are those pages.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "var(--ds-accent)", color: "#fff",
            borderRadius: "980px", padding: "10px 20px",
            fontSize: "14px", fontWeight: 590, border: "none",
            cursor: running ? "default" : "pointer", opacity: running ? 0.7 : 1,
            flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          {running ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {running ? "Checking…" : report ? "Check again" : "Check now"}
        </button>
      </div>

      {running && (
        <DsCard style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "var(--ds-text-mute)", margin: 0, lineHeight: 1.6 }}>
            Searching the way a customer would, then opening each page to see whether you&apos;re on
            it. This takes a couple of minutes.
          </p>
        </DsCard>
      )}

      {error && (
        <DsCard accent="var(--ds-bad)" style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "var(--ds-text)", margin: 0 }}>{error}</p>
        </DsCard>
      )}

      {report && !report.searchConfigured && (
        <DsCard accent="var(--ds-warn)" style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "var(--ds-text)", margin: 0, lineHeight: 1.6 }}>
            Search isn&apos;t switched on for this account yet, so we couldn&apos;t look anything up.
            Nothing here is a verdict on your business.
          </p>
        </DsCard>
      )}

      {!report && !running && (
        <DsCard>
          <p style={{ fontSize: "15px", fontWeight: 590, color: "var(--ds-text)", margin: 0 }}>
            Let&apos;s find out where AI looks you up.
          </p>
          <p style={{ fontSize: "14px", color: "var(--ds-text-mute)", marginTop: "6px", lineHeight: 1.6, marginBottom: 0 }}>
            We&apos;ll search the way your customers do, then open each result and check whether your
            business is named. Nothing is changed on your site.
          </p>
        </DsCard>
      )}

      {report && report.targets.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "8px" }}>
            {[
              { v: listed.length, l: "you're named on" },
              { v: missing.length, l: "you're missing from" },
              { v: unknown.length, l: "couldn't be read" },
            ].map((s) => (
              <DsCard key={s.l}>
                <p style={{ fontSize: "30px", fontWeight: 600, color: "var(--ds-text)", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.v}</p>
                <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "6px", marginBottom: 0 }}>{s.l}</p>
              </DsCard>
            ))}
          </div>

          {missing.length > 0 && (
            <>
              <SectionDivider>Start here — pages that decide the answer</SectionDivider>
              <DsCard style={{ padding: 0 }}>
                {missing.map((t, i) => (
                  <Row key={t.url} t={t} last={i === missing.length - 1} />
                ))}
              </DsCard>
            </>
          )}

          {listed.length > 0 && (
            <>
              <SectionDivider>Already naming you</SectionDivider>
              <DsCard style={{ padding: 0 }}>
                {listed.map((t, i) => (
                  <Row key={t.url} t={t} last={i === listed.length - 1} />
                ))}
              </DsCard>
            </>
          )}

          {unknown.length > 0 && (
            <>
              <SectionDivider>Couldn&apos;t be read</SectionDivider>
              <DsCard style={{ padding: 0 }}>
                {unknown.map((t, i) => (
                  <Row key={t.url} t={t} last={i === unknown.length - 1} />
                ))}
              </DsCard>
              <p style={{ fontSize: "13px", color: "var(--ds-text-soft)", marginTop: "8px" }}>
                These pages blocked us or timed out. That doesn&apos;t mean you&apos;re not on them —
                we just couldn&apos;t tell.
              </p>
            </>
          )}

          <p style={{ fontSize: "13px", color: "var(--ds-text-soft)", marginTop: "24px" }}>
            Checked {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · searched
            for {report.queries.map((q) => `“${q}”`).join(", ")}
          </p>
        </>
      )}
    </div>
  )
}

function Row({ t, last }: { t: CitationTarget; last: boolean }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "14px 1.5rem",
        borderBottom: last ? "none" : "1px solid var(--ds-border)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ds-text-mute)" }}>
            {KIND_LABEL[t.kind]}
          </span>
          <span style={{ fontSize: "12px", color: "var(--ds-text-soft)" }}>{t.domain}</span>
        </div>
        <a
          href={t.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px", lineHeight: 1.45 }}
        >
          {t.title}
          <ExternalLink size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
        </a>
        <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", margin: "3px 0 0", lineHeight: 1.5 }}>
          {KIND_WHY[t.kind]}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        <StatusChip status={t.status} />
      </div>
    </div>
  )
}
