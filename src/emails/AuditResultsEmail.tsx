import {
  Body, Button, Container, Head, Hr, Html,
  Preview, Section, Text, Link, Row, Column,
} from "@react-email/components"
import { appUrl, inCity, orYou } from "@/emails/copy"
import type { ScanEngineRow } from "@/lib/scan-engines"

interface AuditResultsEmailProps {
  /** Business name or the site's domain; null falls back to "you". */
  businessName?: string | null
  city?: string | null
  overallScore: number
  /** found / missing / unknown per engine. Unknown (didn't answer) is never counted as "not named". */
  engines: ScanEngineRow[]
  /** "ready": the automatic Day-0 email. "requested": the "Email me this report" button (shows snippets). */
  variant?: "ready" | "requested"
  /** Unused since the 2026-10 rewrite; kept so older callers type-check. */
  topIssue?: string
  isSubscriber?: boolean
  /** Tokenised link to the full report (the results page is gated). */
  resultsUrl?: string | null
  /** "Hire your AI Agent": /signup?scan=<id> when a scan exists, else /start. */
  hireUrl?: string | null
}

const list = (xs: string[]) => (xs.length <= 1 ? xs[0] ?? "" : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)

export default function AuditResultsEmail({
  businessName, city, overallScore, engines, variant = "ready", isSubscriber = false, resultsUrl, hireUrl,
}: AuditResultsEmailProps) {
  const base = appUrl()
  const found = engines.filter((e) => e.status === "found").length
  const answered = engines.filter((e) => e.status !== "unknown").length
  const silent = engines.filter((e) => e.status === "unknown").map((e) => e.name)
  const scoreColor = overallScore >= 70 ? "#1d8a4e" : overallScore >= 40 ? "#b64400" : "#d70015"
  const who = orYou(businessName)
  const hire = hireUrl || `${base}/start`

  return (
    <Html>
      <Head />
      <Preview>
        {answered > 0
          ? `${found} of the ${answered === 4 ? "4" : `${answered}`} AIs ${answered === 4 ? "I checked" : "that answered"} named ${who}.`
          : `Here is what I found when I checked ${who}.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            {variant === "requested" ? (
              <Text style={paragraph}>Here is the AI visibility scan you requested{businessName?.trim() ? ` for ${businessName.trim()}` : ""}.</Text>
            ) : (
              <>
                <Text style={paragraph}>Here is your free AI visibility scan.</Text>
                <Text style={paragraph}>
                  I checked what ChatGPT, Gemini, Claude, and Perplexity say about {who}{inCity(city)}.
                </Text>
              </>
            )}
            {silent.length > 0 && (
              <Text style={paragraph}>
                {list(silent)} didn&apos;t answer this time, so I left {silent.length === 1 ? "it" : "them"} out of the count.
              </Text>
            )}

            {/* Score */}
            <Section style={scoreCard}>
              <Row>
                <Column style={{ textAlign: "center" as const }}>
                  <Text style={scoreLabel2}>VISIBILITY SCORE</Text>
                  <Text style={{ ...scoreValue, color: scoreColor }}>{overallScore}<span style={scoreUnit}>/100</span></Text>
                </Column>
                <Column style={{ textAlign: "center" as const }}>
                  <Text style={scoreLabel2}>ENGINES THAT NAMED YOU</Text>
                  {answered > 0 ? (
                    <>
                      <Text style={scoreValue}>{found}<span style={scoreUnit}>/{answered}</span></Text>
                      {answered < 4 && <Text style={scoreBadge2}>of the {answered} that answered</Text>}
                    </>
                  ) : (
                    <Text style={scoreBadge2}>No AI answered this time</Text>
                  )}
                </Column>
              </Row>
            </Section>

            {/* Snippets of each engine's answer ("Email me this report" only) */}
            {variant === "requested" && (
              <>
                <Text style={sectionLabel}>WHAT EACH AI SAID</Text>
                {engines.map((e) => (
                  <Row key={e.name} style={engineRow}>
                    <Column style={engineIconCol}>
                      <Text style={{ ...engineStatus, color: e.status === "found" ? "#1d8a4e" : e.status === "missing" ? "#d70015" : "#86868b" }}>
                        {e.status === "found" ? "✓" : e.status === "missing" ? "✗" : "–"}
                      </Text>
                    </Column>
                    <Column>
                      <Text style={engineName}>{e.name}</Text>
                      {e.status === "found" && e.snippet && <Text style={engineSnippet}>&ldquo;{e.snippet}&rdquo;</Text>}
                      {e.status === "found" && !e.snippet && <Text style={engineNote}>Named you in its answer.</Text>}
                      {e.status === "missing" && <Text style={engineNote}>Didn&apos;t name you in its answer.</Text>}
                      {e.status === "unknown" && <Text style={engineNote}>Didn&apos;t answer this time.</Text>}
                    </Column>
                  </Row>
                ))}
              </>
            )}

            {resultsUrl && (
              <>
                <Button style={button} href={resultsUrl}>
                  View your full report →
                </Button>
                <Text style={trialNote}>This unique link shows exactly what the AI assistants said.</Text>
              </>
            )}

            <Hr style={hr} />

            {isSubscriber ? (
              <Button style={button} href={`${base}/briefing`}>
                Open my briefing →
              </Button>
            ) : (
              <>
                <Text style={ctaHeading}>Let me fix it.</Text>
                <Text style={paragraph}>
                  {variant === "requested"
                    ? "I am an AI agent that does the work to get you recommended. I write the answers, update your profile, and check your visibility weekly."
                    : "I am an AI agent. I write the facts AI needs to read, update your Google profile, and check your visibility every week. You just tap approve."}
                </Text>
                <Button style={button} href={hire}>
                  Get recommended by AI →
                </Button>
                {variant === "ready" && <Text style={trialNote}>Month to month. Cancel in two clicks.</Text>}
              </>
            )}

            <Text style={paragraph}>— Alphaa</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${base}/privacy`} style={footerLink}>Privacy</Link>
              {" · "}
              <Link href={`${base}/terms`} style={footerLink}>Terms</Link>
            </Text>
            <Text style={footerDisclaimer}>
              AI visibility results vary by business, location, and industry. No specific rankings are guaranteed.
              Alphaa is not affiliated with OpenAI, Google, Anthropic, or Perplexity.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

AuditResultsEmail.PreviewProps = {
  businessName: "CoolAir Pro",
  city: "Phoenix, AZ",
  overallScore: 31,
  variant: "requested",
  engines: [
    { name: "ChatGPT", status: "found", snippet: "CoolAir Pro is a Phoenix-based HVAC service..." },
    { name: "Gemini", status: "missing" },
    { name: "Claude", status: "unknown" },
    { name: "Perplexity", status: "found", snippet: "For HVAC in Phoenix, CoolAir Pro offers..." },
  ],
  resultsUrl: "https://alphaa.app/scan/results?id=abc&t=123",
  hireUrl: "https://alphaa.app/signup?scan=abc",
} satisfies AuditResultsEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#000000", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const scoreCard = { backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", margin: "0 0 28px", border: "1px solid #d2d2d7" }
const scoreLabel2 = { color: "#86868b", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", margin: "0 0 6px" }
const scoreValue = { color: "#1d1d1f", fontSize: "44px", fontWeight: "600", margin: "0", lineHeight: "1" }
const scoreUnit = { fontSize: "20px", color: "#86868b" }
const scoreBadge2 = { fontSize: "13px", color: "#6e6e73", margin: "6px 0 0" }
const sectionLabel = { color: "#86868b", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", margin: "0 0 12px" }
const engineRow = { marginBottom: "14px" }
const engineIconCol = { width: "32px" }
const engineStatus = { fontSize: "16px", fontWeight: "600", margin: "0" }
const engineName = { color: "#1d1d1f", fontSize: "14px", fontWeight: "600", margin: "0" }
const engineNote = { color: "#6e6e73", fontSize: "12px", margin: "2px 0 0" }
const engineSnippet = { color: "#6e6e73", fontSize: "13px", fontStyle: "italic", margin: "2px 0 0" }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const ctaHeading = { color: "#1d1d1f", fontSize: "20px", fontWeight: "600", margin: "0 0 12px" }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "15px", fontWeight: "400", padding: "12px 24px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const trialNote = { color: "#86868b", fontSize: "12px", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0 0 8px" }
const footerLink = { color: "#86868b", textDecoration: "none" }
const footerDisclaimer = { color: "#86868b", fontSize: "11px", textAlign: "center" as const, margin: "0", lineHeight: "1.5" }
