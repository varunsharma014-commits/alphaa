import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link, Row, Column,
} from "@react-email/components"

interface EngineResult {
  name: string
  found: boolean
  snippet?: string
}

interface AuditResultsEmailProps {
  businessName: string
  city: string
  overallScore: number
  engines: EngineResult[]
  topIssue: string
  isSubscriber: boolean
}

export default function AuditResultsEmail({
  businessName, city, overallScore, engines, topIssue, isSubscriber,
}: AuditResultsEmailProps) {
  const found = engines.filter((e) => e.found).length
  const total = engines.length
  const scoreColor = overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#ef4444"
  const scoreLabel = overallScore >= 70 ? "Good" : overallScore >= 40 ? "Needs work" : "Critical gaps"

  return (
    <Html>
      <Head />
      <Preview>{businessName}: your AI visibility score is {String(overallScore)}/100 — {String(found)}/{String(total)} engines found you</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Your free AI visibility scan is ready</Heading>
            <Text style={paragraph}>
              We scanned {businessName} ({city}) across {String(total)} major AI assistants. Here's what we found.
            </Text>

            {/* Score */}
            <Section style={scoreCard}>
              <Row>
                <Column style={{ textAlign: "center" as const }}>
                  <Text style={scoreLabel2}>VISIBILITY SCORE</Text>
                  <Text style={{ ...scoreValue, color: scoreColor }}>{overallScore}<span style={scoreUnit}>/100</span></Text>
                  <Text style={{ ...scoreBadge, color: scoreColor }}>{scoreLabel}</Text>
                </Column>
                <Column style={{ textAlign: "center" as const }}>
                  <Text style={scoreLabel2}>ENGINES FOUND YOU</Text>
                  <Text style={scoreValue}>{found}<span style={scoreUnit}>/{total}</span></Text>
                  <Text style={scoreBadge2}>{total - found} still missing you</Text>
                </Column>
              </Row>
            </Section>

            {/* Engine breakdown */}
            <Text style={sectionLabel}>ENGINE-BY-ENGINE BREAKDOWN</Text>
            {engines.map((e) => (
              <Row key={e.name} style={engineRow}>
                <Column style={engineIconCol}>
                  <Text style={{ ...engineStatus, color: e.found ? "#22c55e" : "#ef4444" }}>
                    {e.found ? "✓" : "✗"}
                  </Text>
                </Column>
                <Column>
                  <Text style={engineName}>{e.name}</Text>
                  {e.snippet && <Text style={engineSnippet}>"{e.snippet}"</Text>}
                  {!e.found && <Text style={engineMissing}>Not mentioned in responses about {city} businesses</Text>}
                </Column>
              </Row>
            ))}

            <Hr style={hr} />

            {/* Top issue */}
            <Section style={issueBox}>
              <Text style={issueLabel}>TOP ISSUE FOUND</Text>
              <Text style={issueText}>{topIssue}</Text>
            </Section>

            {!isSubscriber && (
              <>
                <Text style={ctaHeading}>Fix your AI visibility in 2 weeks.</Text>
                <Text style={paragraph}>
                  Alphaa automatically builds your AI citation profile, posts weekly content, and re-checks your visibility across every major AI assistant each week.
                </Text>
                <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/pricing`}>
                  Start free 14-day trial →
                </Button>
                <Text style={trialNote}>$99/mo after a 14-day free trial. $0 today. Cancel anytime.</Text>
              </>
            )}

            {isSubscriber && (
              <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
                View full audit in dashboard →
              </Button>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>Privacy</Link>
              {" · "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/terms`} style={footerLink}>Terms</Link>
            </Text>
            <Text style={footerDisclaimer}>
              AI visibility results vary by business, location, and industry. No specific rankings are guaranteed.
              Alphaa is not affiliated with OpenAI, Anthropic, Google, Microsoft, or Perplexity.
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
  engines: [
    { name: "ChatGPT", found: true, snippet: "CoolAir Pro is a Phoenix-based HVAC service..." },
    { name: "Claude", found: false },
    { name: "Gemini", found: false },
    { name: "Perplexity", found: true, snippet: "For HVAC in Phoenix, CoolAir Pro offers..." },
    { name: "Google AI", found: false },
    { name: "Copilot", found: false },
  ],
  topIssue: "Your business has no structured schema markup, which is the primary signal AI engines use to identify and cite local businesses.",
  isSubscriber: false,
} satisfies AuditResultsEmailProps

const body = { backgroundColor: "#0a0a0a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }
const container = { maxWidth: "560px", margin: "0 auto" }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #1a1a1a" }
const logoText = { color: "#ff6b1a", fontSize: "20px", fontWeight: "700", margin: "0" }
const content = { padding: "32px 40px 0" }
const h1 = { color: "#ffffff", fontSize: "26px", fontWeight: "700", margin: "0 0 12px", lineHeight: "1.2" }
const paragraph = { color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const scoreCard = { backgroundColor: "#111", borderRadius: "12px", padding: "24px", margin: "0 0 28px", border: "1px solid #1e1e1e" }
const scoreLabel2 = { color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", margin: "0 0 6px" }
const scoreValue = { color: "#ffffff", fontSize: "44px", fontWeight: "800", margin: "0", lineHeight: "1" }
const scoreUnit = { fontSize: "20px", color: "rgba(255,255,255,0.3)" }
const scoreBadge = { fontSize: "13px", fontWeight: "600", margin: "6px 0 0" }
const scoreBadge2 = { fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }
const sectionLabel = { color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", margin: "0 0 12px" }
const engineRow = { marginBottom: "14px" }
const engineIconCol = { width: "32px" }
const engineStatus = { fontSize: "16px", fontWeight: "700", margin: "0" }
const engineName = { color: "#ffffff", fontSize: "14px", fontWeight: "600", margin: "0" }
const engineSnippet = { color: "rgba(255,255,255,0.4)", fontSize: "13px", fontStyle: "italic", margin: "2px 0 0" }
const engineMissing = { color: "#ef4444", fontSize: "12px", margin: "2px 0 0", opacity: 0.7 }
const hr = { borderColor: "#1a1a1a", margin: "24px 0" }
const issueBox = { backgroundColor: "#1a0a00", border: "1px solid rgba(255,107,26,0.3)", borderRadius: "10px", padding: "16px 20px", margin: "0 0 24px" }
const issueLabel = { color: "#ff6b1a", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", margin: "0 0 6px" }
const issueText = { color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6", margin: "0" }
const ctaHeading = { color: "#ffffff", fontSize: "20px", fontWeight: "700", margin: "0 0 12px" }
const button = { backgroundColor: "#ff6b1a", color: "#ffffff", borderRadius: "8px", fontSize: "15px", fontWeight: "600", padding: "12px 24px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const trialNote = { color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #1a1a1a" }
const footerText = { color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center" as const, margin: "0 0 8px" }
const footerLink = { color: "rgba(255,255,255,0.3)", textDecoration: "none" }
const footerDisclaimer = { color: "rgba(255,255,255,0.15)", fontSize: "11px", textAlign: "center" as const, margin: "0", lineHeight: "1.5" }
