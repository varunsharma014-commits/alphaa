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
  /** Tokenised link to the full report. The results page is gated, so this is
   *  the only way the recipient can open it — always the primary button. */
  resultsUrl?: string
}

export default function AuditResultsEmail({
  businessName, city, overallScore, engines, topIssue, isSubscriber, resultsUrl,
}: AuditResultsEmailProps) {
  const found = engines.filter((e) => e.found).length
  const total = engines.length
  const scoreColor = overallScore >= 70 ? "#1d8a4e" : overallScore >= 40 ? "#b64400" : "#d70015"
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
                  <Text style={{ ...engineStatus, color: e.found ? "#1d8a4e" : "#d70015" }}>
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

            {resultsUrl && (
              <>
                <Button style={button} href={resultsUrl}>
                  View your full report →
                </Button>
                <Text style={trialNote}>
                  This link is unique to you — it opens the full scan, including
                  what each AI assistant actually said.
                </Text>
              </>
            )}

            {!isSubscriber && (
              <>
                <Text style={ctaHeading}>Let your agent fix it.</Text>
                <Text style={paragraph}>
                  Alphaa is an AI agent that does the work: it writes what AI needs to read about you, keeps your Google profile active, and asks ChatGPT, Gemini, Claude and Perplexity about you every week. You approve with one tap.
                </Text>
                <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/pricing`}>
                  Start today →
                </Button>
                <Text style={trialNote}>$99 a month. Month to month — cancel in two clicks.</Text>
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
    { name: "Claude", found: false },
    { name: "Copilot", found: false },
  ],
  topIssue: "Your business has no structured schema markup, which is the primary signal AI engines use to identify and cite local businesses.",
  isSubscriber: false,
} satisfies AuditResultsEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#0066cc", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const h1 = { color: "#1d1d1f", fontSize: "26px", fontWeight: "600", margin: "0 0 12px", lineHeight: "1.2" }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const scoreCard = { backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", margin: "0 0 28px", border: "1px solid #d2d2d7" }
const scoreLabel2 = { color: "#86868b", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", margin: "0 0 6px" }
const scoreValue = { color: "#1d1d1f", fontSize: "44px", fontWeight: "600", margin: "0", lineHeight: "1" }
const scoreUnit = { fontSize: "20px", color: "#86868b" }
const scoreBadge = { fontSize: "13px", fontWeight: "600", margin: "6px 0 0" }
const scoreBadge2 = { fontSize: "13px", color: "#6e6e73", margin: "6px 0 0" }
const sectionLabel = { color: "#86868b", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", margin: "0 0 12px" }
const engineRow = { marginBottom: "14px" }
const engineIconCol = { width: "32px" }
const engineStatus = { fontSize: "16px", fontWeight: "600", margin: "0" }
const engineName = { color: "#1d1d1f", fontSize: "14px", fontWeight: "600", margin: "0" }
const engineSnippet = { color: "#6e6e73", fontSize: "13px", fontStyle: "italic", margin: "2px 0 0" }
const engineMissing = { color: "#d70015", fontSize: "12px", margin: "2px 0 0", opacity: 0.7 }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const issueBox = { backgroundColor: "#fff5eb", border: "1px solid rgba(0,113,227,0.3)", borderRadius: "10px", padding: "16px 20px", margin: "0 0 24px" }
const issueLabel = { color: "#0066cc", fontSize: "10px", fontWeight: "600", letterSpacing: "2px", margin: "0 0 6px" }
const issueText = { color: "#1d1d1f", fontSize: "14px", lineHeight: "1.6", margin: "0" }
const ctaHeading = { color: "#1d1d1f", fontSize: "20px", fontWeight: "600", margin: "0 0 12px" }
const button = { backgroundColor: "#0071e3", color: "#ffffff", borderRadius: "980px", fontSize: "15px", fontWeight: "400", padding: "12px 24px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const trialNote = { color: "#86868b", fontSize: "12px", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0 0 8px" }
const footerLink = { color: "#86868b", textDecoration: "none" }
const footerDisclaimer = { color: "#86868b", fontSize: "11px", textAlign: "center" as const, margin: "0", lineHeight: "1.5" }
