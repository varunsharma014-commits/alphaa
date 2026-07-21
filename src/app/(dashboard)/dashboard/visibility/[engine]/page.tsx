export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { LucideIcon } from "lucide-react"
import { Bot, Globe, Sparkles, Search, Wand2, RefreshCw } from "lucide-react"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { DsCard } from "@/components/dashboard/DsCard"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import RunScanButton from "../RunScanButton"
import { getEngineEvidence, SOURCE_LABEL } from "@/lib/engine-evidence"

type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"

// One page per engine the scan actually runs (see src/lib/visibility-scan.ts).
// aiEngineResults.engine ∈ {chatgpt, claude, gemini, perplexity} — unambiguous,
// so it is always preferred. aiSearchStatus is only a fallback; its keys are
// {chatgpt, google_ai, gemini, perplexity}, and by a legacy quirk the scan
// writes Claude's status under the "google_ai" key.
const CONFIG: Record<
  EngineKey,
  {
    label: string
    engineKey: EngineKey
    statusKey: string
    Icon: LucideIcon
    explainer: string
    actions: string[]
  }
> = {
  chatgpt: {
    label: "ChatGPT",
    engineKey: "chatgpt",
    statusKey: "chatgpt",
    Icon: Bot,
    explainer:
      "ChatGPT pulls from websites it has indexed. Publishing fresh, specific content about your services helps it find and recommend you.",
    actions: [
      "Publishing in-depth service pages ChatGPT can index",
      "Adding FAQ content that answers what your customers actually ask",
      "Keeping your site free of AI-crawler blocks so ChatGPT can read it",
    ],
  },
  claude: {
    label: "Claude",
    engineKey: "claude",
    statusKey: "google_ai",
    Icon: Globe,
    explainer:
      "Claude cites authoritative, well-structured sources. Clear service pages and an llms.txt file help Claude find and describe your business accurately.",
    actions: [
      "Generating and hosting your llms.txt so Claude understands your business",
      "Publishing authoritative, well-structured service pages",
      "Keeping your name, address and phone consistent across your site",
    ],
  },
  gemini: {
    label: "Gemini",
    engineKey: "gemini",
    statusKey: "gemini",
    Icon: Sparkles,
    explainer:
      "Gemini uses Google's index. Your Google presence and the keywords your customers search matter most here.",
    actions: [
      "Keeping your Google Business Profile active with weekly posts",
      "Targeting the keywords your customers actually search",
      "Adding structured data so Google understands your business",
    ],
  },
  perplexity: {
    label: "Perplexity",
    engineKey: "perplexity",
    statusKey: "perplexity",
    Icon: Search,
    explainer:
      "Perplexity cites recent content. Blog posts and FAQ pages published in the last 90 days are the most effective.",
    actions: [
      "Publishing fresh blog posts every month",
      "Adding FAQ pages Perplexity can cite directly",
      "Keeping your content recent and well-sourced",
    ],
  },
}

export default async function EngineVisibilityPage({
  params,
}: {
  params: Promise<{ engine: string }>
}) {
  const { engine } = await params
  // The retired "Google AI" page reused Gemini's data (Gemini powers Google's
  // AI Overviews) — send old links there instead of 404ing.
  if (engine === "google-ai") redirect("/dashboard/visibility/gemini")
  const config = CONFIG[engine as EngineKey]
  if (!config) notFound()

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  const audit = await db.audit.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { aiEngineResults: true },
  })

  const noScan = !audit
  const result = audit?.aiEngineResults.find((r) => r.engine === config.engineKey) ?? null

  // Merge ALL evidence sources (weekly audit, public scans by this email,
  // sandbox questions) and use the freshest verdict. The old code read only
  // the weekly audit, so an engine whose weekly data was missing showed
  // "Not yet" (= not mentioned) while the same day's free scan showed the
  // engine naming the business — three surfaces, three verdicts. "unknown"
  // (no data anywhere) now renders as its own state, never as "Not yet".
  const evidence = await getEngineEvidence({ id: user.id, email: user.email })
  const engineEvidence = evidence[config.engineKey]
  const isFound = engineEvidence.state === "found"
  const isPartial = engineEvidence.state === "partial"
  const isUnknown = engineEvidence.state === "unknown"
  const Icon = config.Icon

  const evidenceDate = engineEvidence.at
    ? engineEvidence.at.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null
  const foundDate = audit?.createdAt
    ? audit.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null
  const evidenceCaption =
    engineEvidence.source && evidenceDate
      ? `From ${SOURCE_LABEL[engineEvidence.source]} · ${evidenceDate}`
      : null

  // Hero state — "no data" (noScan/unknown) is deliberately distinct from
  // "checked and not mentioned".
  const hero = noScan
    ? { accent: "var(--ds-text-ghost)", label: "First scan running…", color: "var(--ds-text-mute)", sub: "alphaa is asking " + config.label + " the questions your customers type. Results appear here shortly." }
    : isFound
      ? { accent: "var(--ds-ok)", label: "Mentioned", color: "var(--ds-ok)", sub: "Customers can find you on " + config.label + " when they ask." }
      : isPartial
        ? { accent: "var(--ds-warn)", label: "Sometimes", color: "var(--ds-warn)", sub: config.label + " mentions you for some searches — alphaa is working to make it consistent." }
        : isUnknown
          ? { accent: "var(--ds-warn)", label: "No data yet", color: "var(--ds-text-mute)", sub: "alphaa hasn't been able to check " + config.label + " recently — the next automatic check runs this week. Use “Check again now” or ask a live question to get a fresh answer." }
          : { accent: "var(--ds-text-ghost)", label: "Not yet", color: "var(--ds-text-mute)", sub: "alphaa is working to get you mentioned on " + config.label + "." }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <AutopilotBar message={`alphaa checks ${config.label} weekly and works to get you mentioned`} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon size={20} color={isFound ? "var(--ds-ok)" : "var(--ds-text-mute)"} />
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>{config.label} visibility</h1>
        </div>
        <div style={{ flexShrink: 0 }}>
          <RunScanButton />
        </div>
      </div>

      {/* Hero stat */}
      <DsCard accent={hero.accent} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {noScan && <RefreshCw size={22} color="var(--ds-accent)" className="animate-spin" />}
          <div>
            <div style={{ fontSize: "26px", fontWeight: 600, color: hero.color, lineHeight: 1.1 }}>{hero.label}</div>
            <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "4px" }}>{hero.sub}</p>
            {!noScan && !isUnknown && evidenceCaption && (
              <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "6px" }}>{evidenceCaption}</p>
            )}
          </div>
        </div>
      </DsCard>

      {/* The actual mention, if found */}
      {isFound && (result?.snippet || result?.query) && (
        <DsCard style={{ marginBottom: "16px" }}>
          {result?.snippet && (
            <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--ds-text-strong)", lineHeight: 1.7 }}>
              &ldquo;{result.snippet}&rdquo;
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: result?.snippet ? "12px" : 0 }}>
            {result?.query && (
              <div>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ds-text-ghost)" }}>Triggered by</div>
                <div style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "2px" }}>&ldquo;{result.query}&rdquo;</div>
              </div>
            )}
            {foundDate && (
              <div>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ds-text-ghost)" }}>Found</div>
                <div style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "2px" }}>{foundDate}</div>
              </div>
            )}
          </div>
        </DsCard>
      )}

      {/* What alphaa is doing */}
      <SectionDivider>WHAT ALPHAA IS DOING FOR {config.label.toUpperCase()}</SectionDivider>
      <DsCard accent="var(--ds-ok)">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Wand2 size={15} color="var(--ds-ok)" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>Working on your behalf</span>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "8px" }}>
          {config.actions.map((line) => (
            <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6 }}>
              <span style={{ color: "var(--ds-ok)", flexShrink: 0 }}>•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {foundDate && (
          <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "12px" }}>
            Last automatic scan {foundDate} · next scan runs within 7 days
          </p>
        )}
      </DsCard>

      {/* How this engine finds businesses */}
      <SectionDivider>HOW {config.label.toUpperCase()} FINDS BUSINESSES LIKE YOURS</SectionDivider>
      <DsCard>
        <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.7 }}>{config.explainer}</p>
      </DsCard>
    </div>
  )
}
