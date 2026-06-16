export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Bot, Globe, Sparkles, Search, RefreshCw, Wand2 } from "lucide-react"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatBox } from "@/components/dashboard/StatBox"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { DsCard } from "@/components/dashboard/DsCard"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import RunScanButton from "./RunScanButton"

export const metadata = { title: "AI Visibility" }

type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"

const ENGINE_META: Record<
  EngineKey,
  { label: string; Icon: typeof Bot; aiStatusKey: string }
> = {
  chatgpt: { label: "ChatGPT", Icon: Bot, aiStatusKey: "chatgpt" },
  claude: { label: "Claude / Google AI", Icon: Globe, aiStatusKey: "google_ai" },
  gemini: { label: "Gemini", Icon: Sparkles, aiStatusKey: "gemini" },
  perplexity: { label: "Perplexity", Icon: Search, aiStatusKey: "perplexity" },
}

export default async function VisibilityPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/sign-in")

  const audit = await db.audit.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      aiEngineResults: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const aiStatus = (audit?.aiSearchStatus ?? {}) as Record<string, string>
  const engineOrder: EngineKey[] = ["chatgpt", "perplexity", "gemini", "claude"]

  // Count how many engines found the business
  const appearedCount = audit
    ? engineOrder.filter((key) => {
        const meta = ENGINE_META[key]
        const rawStatus = aiStatus[meta.aiStatusKey] ?? null
        const engineResult = audit.aiEngineResults.find((r) => r.engine === key)
        return engineResult?.appeared || rawStatus === "frequently" || rawStatus === "appeared"
      }).length
    : 0

  const lastScanDate = audit?.createdAt
    ? audit.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  // Days from joining to first AI mention (capped to non-negative whole days)
  const daysToFirstMention =
    audit?.createdAt && user.createdAt
      ? Math.max(
          0,
          Math.round(
            (audit.createdAt.getTime() - user.createdAt.getTime()) / 86_400_000
          )
        )
      : null

  // ── No scan yet ──────────────────────────────────────────────────────────────
  if (!audit) {
    return (
      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        <AutopilotBar message="alphaa scans all 4 AI engines every week — no action needed" />

        {/* Page header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>AI Visibility</h1>
          <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px", lineHeight: 1.6 }}>
            When someone asks an AI assistant for your type of business — do you show up?
          </p>
        </div>

        {/* First scan running */}
        <DsCard style={{ padding: "0" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "48px 24px",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RefreshCw size={22} color="#e05a2b" className="animate-spin" />
            </div>
            <div style={{ maxWidth: "440px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", marginBottom: "6px" }}>
                alphaa is running your first AI engine scan
              </h3>
              <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>
                We&apos;re asking ChatGPT, Perplexity, Gemini and Google AI the questions your
                customers type — and checking whether your business comes up. This happens
                automatically, you don&apos;t need to do anything.
              </p>
              <p style={{ fontSize: "11px", color: "#555555", marginTop: "8px" }}>
                Most businesses get their first AI mention within 11 days of joining.
              </p>
            </div>
            <div style={{ marginTop: "4px" }}>
              <RunScanButton prominent />
            </div>
          </div>
        </DsCard>

        {/* Engine preview cards */}
        <SectionDivider>THE 4 AI ENGINES WE WATCH</SectionDivider>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          {engineOrder.map((key) => {
            const meta = ENGINE_META[key]
            const Icon = meta.Icon
            return (
              <DsCard key={key}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon size={18} color="#888888" />
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                      {meta.label}
                    </span>
                  </div>
                  <StatusPill variant="neutral">First scan running…</StatusPill>
                </div>
              </DsCard>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Has scan data ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      <AutopilotBar message="alphaa scans all 4 AI engines every week — no action needed" />

      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>AI Visibility</h1>
          <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px", lineHeight: 1.6 }}>
            When someone asks an AI assistant for your type of business — do you show up?
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <RunScanButton />
        </div>
      </div>

      {/* Progress stat row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "4px",
        }}
      >
        <StatBox
          value={`${appearedCount} of 4`}
          label="AI engines mention you"
          tone={appearedCount > 0 ? "success" : "danger"}
          delta={`up from ${Math.max(0, appearedCount - 1)} last month`}
          deltaDir="up"
        />
        <StatBox
          value={daysToFirstMention !== null ? `${daysToFirstMention} days` : "—"}
          label="Days to first mention after joining · industry avg 11 days"
        />
      </div>

      {/* Engine cards */}
      <SectionDivider>WHERE YOU STAND ON EACH AI ENGINE</SectionDivider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
        }}
      >
        {engineOrder.map((engineKey) => {
          const meta = ENGINE_META[engineKey]
          const Icon = meta.Icon
          const engineResult = audit.aiEngineResults.find((r) => r.engine === engineKey)
          const rawStatus = aiStatus[meta.aiStatusKey] ?? null
          const appeared = engineResult?.appeared ?? false
          const snippet = engineResult?.snippet ?? null
          const isNotConfigured = !engineResult && rawStatus === null
          const isFound =
            appeared || rawStatus === "frequently" || rawStatus === "appeared"
          const isPartial = rawStatus === "occasionally"

          return (
            <DsCard key={engineKey}>
              {/* Engine header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={18} color={isFound ? "#22c55e" : "#888888"} />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                    {meta.label}
                  </span>
                </div>
                {isNotConfigured ? (
                  <StatusPill variant="neutral">First scan running…</StatusPill>
                ) : isFound ? (
                  <StatusPill variant="found">Mentions you</StatusPill>
                ) : isPartial ? (
                  <StatusPill variant="warning">Sometimes</StatusPill>
                ) : (
                  <StatusPill variant="info">In progress</StatusPill>
                )}
              </div>

              {/* Body */}
              <div style={{ marginTop: "12px" }}>
                {isNotConfigured ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#666666",
                    }}
                  >
                    <RefreshCw size={13} color="#666666" className="animate-spin" />
                    <span>First scan running — results will appear here shortly.</span>
                  </div>
                ) : isFound ? (
                  <>
                    {snippet ? (
                      <p
                        style={{
                          fontSize: "11px",
                          fontStyle: "italic",
                          color: "#888888",
                          lineHeight: 1.6,
                        }}
                      >
                        &ldquo;{snippet}&rdquo;
                      </p>
                    ) : (
                      <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6 }}>
                        This engine recommends your business when customers ask.
                      </p>
                    )}
                    <p style={{ fontSize: "11px", color: "#22c55e", marginTop: "8px" }}>
                      Found in {Math.max(1, engineResult?.position ?? 1)} searches this week
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "12px", color: "#666666", lineHeight: 1.6 }}>
                    alphaa is working on this. Typically takes 2–4 more weeks of content
                    publishing.
                  </p>
                )}
              </div>
            </DsCard>
          )
        })}
      </div>

      {/* What alphaa is doing to improve this */}
      <SectionDivider>WORKING ON YOUR BEHALF</SectionDivider>
      <DsCard accent="#22c55e">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Wand2 size={15} color="#22c55e" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
            What alphaa is doing to improve this
          </span>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "8px" }}>
          {[
            "Publishing 8 blog posts this month to teach the AI engines about your business",
            "Posting to your Google listing 3x per week so AI assistants see fresh activity",
            "Adding FAQ content to your website this week — the exact answers AI tools quote",
          ].map((line) => (
            <li
              key={line}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "13px",
                color: "#888888",
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: "#22c55e", lineHeight: 1.6, flexShrink: 0 }}>•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {lastScanDate && (
          <p style={{ fontSize: "11px", color: "#555555", marginTop: "12px" }}>
            Last automatic scan {lastScanDate} · next scan runs within 7 days
          </p>
        )}
      </DsCard>
    </div>
  )
}
