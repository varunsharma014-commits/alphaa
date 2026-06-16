export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { LucideIcon } from "lucide-react"
import { Bot, Globe, Globe2, Sparkles, Search, Wand2, RefreshCw } from "lucide-react"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { DsCard } from "@/components/dashboard/DsCard"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import RunScanButton from "../RunScanButton"

type EngineSlug = "chatgpt" | "claude" | "gemini" | "perplexity" | "google-ai"
type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"

// Each per-engine screen maps to the real scan data:
// aiEngineResults.engine ∈ {chatgpt, claude, gemini, perplexity};
// aiSearchStatus keys are {chatgpt, google_ai (Claude), gemini, perplexity}.
// "Google AI" reuses Gemini's data, since Gemini powers Google's AI Overviews.
const CONFIG: Record<
  EngineSlug,
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
      "Claude cites authoritative, well-structured local sources. Clear service pages and an llms.txt file help Claude find and describe your business accurately.",
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
      "Gemini uses Google's index. Your Google Business Profile and local keywords matter most here.",
    actions: [
      "Keeping your Google Business Profile active with weekly posts",
      "Targeting local keywords across your content",
      "Adding LocalBusiness schema so Google understands your business",
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
  "google-ai": {
    label: "Google AI",
    engineKey: "gemini",
    statusKey: "gemini",
    Icon: Globe2,
    explainer:
      "Google AI Overviews are powered by Gemini and Google's index. A complete Google Business Profile and local keyword content are what move the needle here.",
    actions: [
      "Keeping your Google Business Profile complete and active",
      "Publishing local keyword content for your service area",
      "Adding structured data so Google can summarize your business",
    ],
  },
}

export default async function EngineVisibilityPage({
  params,
}: {
  params: Promise<{ engine: string }>
}) {
  const { engine } = await params
  const config = CONFIG[engine as EngineSlug]
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
  const aiStatus = (audit?.aiSearchStatus ?? {}) as Record<string, string>
  const result = audit?.aiEngineResults.find((r) => r.engine === config.engineKey) ?? null
  const status = aiStatus[config.statusKey] ?? null
  const isFound = Boolean(result?.appeared) || status === "frequently" || status === "appeared"
  const isPartial = status === "occasionally"
  const Icon = config.Icon

  const foundDate = audit?.createdAt
    ? audit.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null

  // Hero state
  const hero = noScan
    ? { accent: "#444444", label: "First scan running…", color: "#888888", sub: "alphaa is asking " + config.label + " the questions your customers type. Results appear here shortly." }
    : isFound
      ? { accent: "#22c55e", label: "Mentioned", color: "#22c55e", sub: "Customers can find you on " + config.label + " when they ask." }
      : isPartial
        ? { accent: "#f59e0b", label: "Sometimes", color: "#f59e0b", sub: config.label + " mentions you for some searches — alphaa is working to make it consistent." }
        : { accent: "#444444", label: "Not yet", color: "#888888", sub: "alphaa is working to get you mentioned on " + config.label + "." }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <AutopilotBar message={`alphaa checks ${config.label} weekly and works to get you mentioned`} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon size={20} color={isFound ? "#22c55e" : "#888888"} />
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>{config.label} visibility</h1>
        </div>
        <div style={{ flexShrink: 0 }}>
          <RunScanButton />
        </div>
      </div>

      {/* Hero stat */}
      <DsCard accent={hero.accent} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {noScan && <RefreshCw size={22} color="#e05a2b" className="animate-spin" />}
          <div>
            <div style={{ fontSize: "26px", fontWeight: 600, color: hero.color, lineHeight: 1.1 }}>{hero.label}</div>
            <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "4px" }}>{hero.sub}</p>
          </div>
        </div>
      </DsCard>

      {/* The actual mention, if found */}
      {isFound && (result?.snippet || result?.query) && (
        <DsCard style={{ marginBottom: "16px" }}>
          {result?.snippet && (
            <p style={{ fontSize: "13px", fontStyle: "italic", color: "#cccccc", lineHeight: 1.7 }}>
              &ldquo;{result.snippet}&rdquo;
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: result?.snippet ? "12px" : 0 }}>
            {result?.query && (
              <div>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444" }}>Triggered by</div>
                <div style={{ fontSize: "13px", color: "#888888", marginTop: "2px" }}>&ldquo;{result.query}&rdquo;</div>
              </div>
            )}
            {foundDate && (
              <div>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444" }}>Found</div>
                <div style={{ fontSize: "13px", color: "#888888", marginTop: "2px" }}>{foundDate}</div>
              </div>
            )}
          </div>
        </DsCard>
      )}

      {/* What alphaa is doing */}
      <SectionDivider>WHAT ALPHAA IS DOING FOR {config.label.toUpperCase()}</SectionDivider>
      <DsCard accent="#22c55e">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Wand2 size={15} color="#22c55e" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>Working on your behalf</span>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "8px" }}>
          {config.actions.map((line) => (
            <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>
              <span style={{ color: "#22c55e", flexShrink: 0 }}>•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {foundDate && (
          <p style={{ fontSize: "11px", color: "#555555", marginTop: "12px" }}>
            Last automatic scan {foundDate} · next scan runs within 7 days
          </p>
        )}
      </DsCard>

      {/* How this engine finds businesses */}
      <SectionDivider>HOW {config.label.toUpperCase()} FINDS BUSINESSES LIKE YOURS</SectionDivider>
      <DsCard>
        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.7 }}>{config.explainer}</p>
      </DsCard>
    </div>
  )
}
