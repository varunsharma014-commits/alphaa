import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link, Row, Column,
} from "@react-email/components"

interface EngineScore {
  name: string
  score: number
  change: number
}

interface WeeklyReportEmailProps {
  firstName: string
  businessName: string
  weekOf: string
  overallScore: number
  overallChange: number
  engines: EngineScore[]
  mentionsThisWeek: number
  postsPublished: number
  topKeyword: string
}

export default function WeeklyReportEmail({
  firstName, businessName, weekOf, overallScore, overallChange,
  engines, mentionsThisWeek, postsPublished, topKeyword,
}: WeeklyReportEmailProps) {
  const changeColor = overallChange >= 0 ? "#22c55e" : "#ef4444"
  const changePrefix = overallChange >= 0 ? "+" : ""

  return (
    <Html>
      <Head />
      <Preview>Your AI visibility report for {weekOf} — {businessName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
            <Text style={weekLabel}>Weekly Report · {weekOf}</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Your AI visibility this week</Heading>
            <Text style={paragraph}>Here's how {businessName} performed across all 6 AI search engines.</Text>

            {/* Overall score */}
            <Section style={scoreCard}>
              <Text style={scoreLabel}>OVERALL VISIBILITY SCORE</Text>
              <Text style={scoreValue}>{overallScore}<span style={scoreUnit}>/100</span></Text>
              <Text style={{ ...changeText, color: changeColor }}>{changePrefix}{overallChange} pts from last week</Text>
            </Section>

            {/* Engine breakdown */}
            <Text style={sectionLabel}>BY ENGINE</Text>
            {engines.map((e) => (
              <Row key={e.name} style={engineRow}>
                <Column style={engineName}>{e.name}</Column>
                <Column style={engineBar}>
                  <div style={{ ...bar, width: `${e.score}%` }} />
                </Column>
                <Column style={engineScore}>{e.score}</Column>
                <Column style={{ ...engineDelta, color: e.change >= 0 ? "#22c55e" : "#ef4444" }}>
                  {e.change >= 0 ? "+" : ""}{e.change}
                </Column>
              </Row>
            ))}

            <Hr style={hr} />

            {/* Stats row */}
            <Row style={statsRow}>
              <Column style={statCell}>
                <Text style={statValue}>{mentionsThisWeek}</Text>
                <Text style={statLabel}>AI mentions</Text>
              </Column>
              <Column style={statCell}>
                <Text style={statValue}>{postsPublished}</Text>
                <Text style={statLabel}>Posts published</Text>
              </Column>
              <Column style={statCell}>
                <Text style={statValue}>#{topKeyword}</Text>
                <Text style={statLabel}>Top keyword</Text>
              </Column>
            </Row>

            <Hr style={hr} />

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
              View full report →
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`} style={footerLink}>Manage email preferences</Link>
              {" · "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>Privacy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

WeeklyReportEmail.PreviewProps = {
  firstName: "Marco",
  businessName: "Torres Family Law",
  weekOf: "May 12–18, 2026",
  overallScore: 74,
  overallChange: 8,
  engines: [
    { name: "ChatGPT", score: 82, change: 5 },
    { name: "Claude", score: 79, change: 12 },
    { name: "Gemini", score: 71, change: 3 },
    { name: "Perplexity", score: 68, change: 9 },
    { name: "Google AI", score: 75, change: 7 },
    { name: "Copilot", score: 58, change: 11 },
  ],
  mentionsThisWeek: 14,
  postsPublished: 3,
  topKeyword: "family lawyer Miami",
} satisfies WeeklyReportEmailProps

const body = { backgroundColor: "#0a0a0a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }
const container = { maxWidth: "560px", margin: "0 auto" }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #1a1a1a" }
const logoText = { color: "#ff6b1a", fontSize: "20px", fontWeight: "700", margin: "0" }
const weekLabel = { color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "4px 0 0" }
const content = { padding: "32px 40px 0" }
const h1 = { color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: "0 0 8px" }
const paragraph = { color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0 0 24px" }
const scoreCard = { backgroundColor: "#111", borderRadius: "12px", padding: "28px", textAlign: "center" as const, margin: "0 0 24px", border: "1px solid #1e1e1e" }
const scoreLabel = { color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", margin: "0 0 8px" }
const scoreValue = { color: "#ffffff", fontSize: "56px", fontWeight: "800", margin: "0", lineHeight: "1" }
const scoreUnit = { fontSize: "24px", color: "rgba(255,255,255,0.4)" }
const changeText = { fontSize: "14px", fontWeight: "600", margin: "8px 0 0" }
const sectionLabel = { color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", margin: "0 0 12px" }
const engineRow = { marginBottom: "10px" }
const engineName = { color: "rgba(255,255,255,0.7)", fontSize: "14px", width: "100px" }
const engineBar = { paddingRight: "12px" }
const bar = { height: "6px", backgroundColor: "#ff6b1a", borderRadius: "3px", opacity: 0.8 }
const engineScore = { color: "#ffffff", fontSize: "14px", fontWeight: "700", width: "32px", textAlign: "right" as const }
const engineDelta = { fontSize: "12px", width: "36px", textAlign: "right" as const }
const hr = { borderColor: "#1a1a1a", margin: "24px 0" }
const statsRow = { margin: "0 0 24px" }
const statCell = { textAlign: "center" as const }
const statValue = { color: "#ff6b1a", fontSize: "28px", fontWeight: "800", margin: "0" }
const statLabel = { color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "4px 0 0" }
const button = { backgroundColor: "#ff6b1a", color: "#ffffff", borderRadius: "8px", fontSize: "15px", fontWeight: "600", padding: "12px 24px", textDecoration: "none", display: "inline-block" }
const footer = { padding: "20px 40px", borderTop: "1px solid #1a1a1a" }
const footerText = { color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "rgba(255,255,255,0.3)", textDecoration: "none" }
