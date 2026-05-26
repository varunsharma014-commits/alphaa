import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"

type KeywordMover = {
  query: string
  positionBefore: number
  positionAfter: number
  change: number
}

type VisibilityDelta = Record<string, number>

interface WeeklyReportEmailProps {
  businessName: string
  summary: string
  postsPublished: number
  reviewsNew: number
  visibilityDelta: VisibilityDelta
  keywordMovers: KeywordMover[]
  reportUrl: string
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  google_ai: "Google AI",
  gemini: "Gemini",
}

export default function WeeklyReportEmail({
  businessName,
  summary,
  postsPublished,
  reviewsNew,
  visibilityDelta,
  keywordMovers,
  reportUrl,
}: WeeklyReportEmailProps) {
  const weekLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const visibilityEntries = Object.entries(visibilityDelta)
  const topMovers = (keywordMovers ?? []).slice(0, 3)

  return (
    <Html>
      <Head />
      <Preview>
        Your weekly Alphaa report — {businessName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
            <Text style={weekLabel2}>Weekly Report · Week of {weekLabel}</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={h1}>Your Weekly Alphaa Report — {businessName}</Text>
            <Text style={paragraph}>{summary}</Text>

            <Hr style={hr} />

            {/* Stat boxes */}
            <Row style={statsRow}>
              <Column style={statBox}>
                <Text style={statValue}>{postsPublished}</Text>
                <Text style={statLabel}>Posts Published</Text>
              </Column>
              <Column style={statBoxMiddle}>
                <Text style={statValue}>{reviewsNew}</Text>
                <Text style={statLabel}>New Reviews</Text>
              </Column>
              <Column style={statBox}>
                <Text style={statValue}>
                  {visibilityEntries.filter(([, d]) => d > 0).length}
                </Text>
                <Text style={statLabel}>Visibility Gains</Text>
              </Column>
            </Row>

            {/* Visibility delta */}
            {visibilityEntries.length > 0 && (
              <>
                <Hr style={hr} />
                <Text style={sectionLabel}>AI VISIBILITY CHANGES</Text>
                <Row style={visibilityGrid}>
                  {visibilityEntries.map(([engine, delta]) => (
                    <Column key={engine} style={visibilityCell}>
                      <Text style={engineName}>{ENGINE_LABELS[engine] ?? engine}</Text>
                      <Text
                        style={{
                          ...deltaValue,
                          color:
                            delta > 0
                              ? "#22c55e"
                              : delta < 0
                              ? "#ef4444"
                              : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta === 0 ? "—" : delta}
                      </Text>
                    </Column>
                  ))}
                </Row>
              </>
            )}

            {/* Keyword movers */}
            {topMovers.length > 0 && (
              <>
                <Hr style={hr} />
                <Text style={sectionLabel}>TOP KEYWORD MOVERS</Text>
                <Section style={table}>
                  <Row style={tableHeader}>
                    <Column style={tableColKeyword}>
                      <Text style={tableHeadText}>Keyword</Text>
                    </Column>
                    <Column style={tableColNum}>
                      <Text style={tableHeadText}>Before</Text>
                    </Column>
                    <Column style={tableColNum}>
                      <Text style={tableHeadText}>After</Text>
                    </Column>
                    <Column style={tableColNum}>
                      <Text style={tableHeadText}>Change</Text>
                    </Column>
                  </Row>
                  {topMovers.map((k) => (
                    <Row key={k.query} style={tableRow}>
                      <Column style={tableColKeyword}>
                        <Text style={tableCell}>{k.query}</Text>
                      </Column>
                      <Column style={tableColNum}>
                        <Text style={tableCellMono}>#{Math.round(k.positionBefore)}</Text>
                      </Column>
                      <Column style={tableColNum}>
                        <Text style={tableCellMono}>#{Math.round(k.positionAfter)}</Text>
                      </Column>
                      <Column style={tableColNum}>
                        <Text
                          style={{
                            ...tableCellMono,
                            color:
                              k.change > 0
                                ? "#22c55e"
                                : k.change < 0
                                ? "#ef4444"
                                : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {k.change > 0 ? "+" : ""}
                          {k.change}
                        </Text>
                      </Column>
                    </Row>
                  ))}
                </Section>
              </>
            )}

            <Hr style={hr} />

            {/* CTA */}
            <Section style={{ textAlign: "center" as const }}>
              <Button style={button} href={reportUrl}>
                View Full Report →
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you have an active Alphaa subscription.
            </Text>
            <Text style={footerText}>
              Alphaa · AI Search Visibility for Local Businesses
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

WeeklyReportEmail.PreviewProps = {
  businessName: "Torres Family Law",
  summary:
    "This was a strong week for Torres Family Law — you published 3 posts, earned 2 new reviews, and your ranking for \"family lawyer Miami\" climbed 4 positions. Keep the momentum going!",
  postsPublished: 3,
  reviewsNew: 2,
  visibilityDelta: { chatgpt: 1, perplexity: 0, google_ai: 1, gemini: -1 },
  keywordMovers: [
    { query: "family lawyer Miami", positionBefore: 12, positionAfter: 8, change: 4 },
    { query: "divorce attorney FL", positionBefore: 18, positionAfter: 14, change: 4 },
    { query: "child custody Miami", positionBefore: 25, positionAfter: 22, change: 3 },
  ],
  reportUrl: "https://alphaa.app/dashboard/reports",
} satisfies WeeklyReportEmailProps

// Styles
const body = {
  backgroundColor: "#0a0a0a",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}
const container = { maxWidth: "560px", margin: "0 auto" }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #1a1a1a" }
const logoText = {
  color: "#ff6b1a",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
}
const weekLabel2 = {
  color: "rgba(255,255,255,0.3)",
  fontSize: "13px",
  margin: "4px 0 0",
}
const content = { padding: "32px 40px" }
const h1 = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 12px",
  lineHeight: "1.3",
}
const paragraph = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 0",
}
const hr = { borderColor: "#1a1a1a", margin: "24px 0" }
const statsRow = { margin: "0 0 0" }
const statBox = {
  backgroundColor: "#111",
  borderRadius: "10px",
  padding: "16px",
  textAlign: "center" as const,
  border: "1px solid #1e1e1e",
}
const statBoxMiddle = {
  ...statBox,
  margin: "0 8px",
}
const statValue = {
  color: "#ff6b1a",
  fontSize: "32px",
  fontWeight: "800",
  margin: "0",
  lineHeight: "1",
}
const statLabel = {
  color: "rgba(255,255,255,0.4)",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  margin: "6px 0 0",
}
const sectionLabel = {
  color: "rgba(255,255,255,0.3)",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "2px",
  margin: "0 0 12px",
}
const visibilityGrid = { margin: "0" }
const visibilityCell = {
  backgroundColor: "#111",
  borderRadius: "8px",
  padding: "12px",
  textAlign: "center" as const,
  border: "1px solid #1e1e1e",
}
const engineName = {
  color: "rgba(255,255,255,0.6)",
  fontSize: "12px",
  margin: "0 0 4px",
}
const deltaValue = {
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
}
const table = { backgroundColor: "#111", borderRadius: "10px", border: "1px solid #1e1e1e", overflow: "hidden" }
const tableHeader = { borderBottom: "1px solid #1e1e1e" }
const tableRow = { borderBottom: "1px solid #1a1a1a" }
const tableColKeyword = { padding: "10px 14px", width: "55%" }
const tableColNum = { padding: "10px 10px", width: "15%", textAlign: "right" as const }
const tableHeadText = {
  color: "rgba(255,255,255,0.3)",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "1px",
  margin: "0",
}
const tableCell = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "13px",
  margin: "0",
}
const tableCellMono = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "13px",
  fontFamily: "monospace",
  margin: "0",
}
const button = {
  backgroundColor: "#ff6b1a",
  color: "#ffffff",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
}
const footer = { padding: "20px 40px", borderTop: "1px solid #1a1a1a" }
const footerText = {
  color: "rgba(255,255,255,0.2)",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0 0 4px",
}
