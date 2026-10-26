import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"
import { hi, orYou } from "@/emails/copy"

type KeywordMover = {
  query: string
  positionBefore: number
  positionAfter: number
  change: number
}

type VisibilityDelta = Record<string, number>

interface WeeklyReportEmailProps {
  firstName?: string | null
  businessName?: string | null
  summary: string
  postsPublished: number
  reviewsNew: number
  visibilityDelta: VisibilityDelta
  /** Not shown since the 2026-10 rewrite (Google rank tables are SEO jargon); still stored on the report. */
  keywordMovers?: KeywordMover[]
  reportUrl: string
  /** Plain-English results (AI visitors, calls, directions) — omitted when we can't measure them. */
  results?: string[]
  /** Marketing footer: why they get it, our mailing address (when set) and a signed unsubscribe link. */
  footer?: { address?: string | null; unsubscribeUrl?: string | null }
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  google_ai: "Claude",
  claude: "Claude",
  perplexity: "Perplexity",
}

const changeLabel = (d: number) => (d > 0 ? "Started naming you" : d < 0 ? "Stopped naming you" : "No change")

export default function WeeklyReportEmail({
  firstName,
  businessName,
  summary,
  postsPublished,
  reviewsNew,
  visibilityDelta,
  reportUrl,
  results = [],
  footer: foot,
}: WeeklyReportEmailProps) {
  const weekLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const visibilityEntries = Object.entries(visibilityDelta ?? {})
  const changes = visibilityEntries.filter(([, d]) => d !== 0).length
  const who = orYou(businessName)
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

  return (
    <Html>
      <Head />
      <Preview>Here is my weekly report for {who}.</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
            <Text style={weekLabel2}>Weekly report · {weekLabel}</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={paragraph}>{hi(firstName)}</Text>
            <Text style={paragraph}>Here is my weekly report for {who}.</Text>

            {results.length > 0 && (
              <Section style={{ background: "#f5f5f7", borderRadius: 14, padding: "16px 20px", margin: "0 0 16px" }}>
                <Text style={{ ...paragraph, fontWeight: 600, margin: "0 0 6px" }}>Your results this week</Text>
                {results.map((r) => (
                  <Text key={r} style={{ ...paragraph, margin: "0 0 6px" }}>{r}</Text>
                ))}
              </Section>
            )}
            {summary.trim() && <Text style={paragraph}>{summary}</Text>}

            <Text style={{ ...paragraph, fontWeight: 600, margin: "0 0 8px" }}>This week&apos;s work:</Text>
            <Text style={listItem}>• {n(postsPublished, "post", "posts")} published.</Text>
            <Text style={listItem}>• {n(reviewsNew, "new review", "new reviews")} found.</Text>
            <Text style={{ ...listItem, margin: "0 0 20px" }}>• {n(changes, "visibility change", "visibility changes")} tracked.</Text>

            {/* AI visibility changes, in plain words */}
            {visibilityEntries.length > 0 && (
              <>
                <Hr style={hr} />
                <Text style={sectionLabel}>AI VISIBILITY CHANGES</Text>
                <Row style={visibilityGrid}>
                  {visibilityEntries.map(([engine, delta]) => (
                    <Column key={engine} style={visibilityCell}>
                      <Text style={engineName}>{ENGINE_LABELS[engine] ?? engine}</Text>
                      <Text style={{ ...deltaValue, color: delta > 0 ? "#1d8a4e" : delta < 0 ? "#d70015" : "#6e6e73" }}>
                        {changeLabel(delta)}
                      </Text>
                    </Column>
                  ))}
                </Row>
              </>
            )}

            <Hr style={hr} />

            {/* CTA */}
            <Section style={{ textAlign: "center" as const }}>
              <Button style={button} href={reportUrl}>
                View Full Report in Dashboard →
              </Button>
            </Section>
            <Text style={{ ...paragraph, margin: "20px 0 0" }}>— Your AI Agent</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you have an active Alphaa subscription.
            </Text>
            <Text style={footerText}>
              Alphaa{foot?.address ? ` · ${foot.address}` : " · AI Search Visibility for Local Businesses"}
            </Text>
            {foot?.unsubscribeUrl && (
              <Text style={footerText}>
                <Link href={foot.unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

WeeklyReportEmail.PreviewProps = {
  firstName: "Maria",
  businessName: "Torres Family Law",
  summary:
    "I asked ChatGPT, Gemini, Claude and Perplexity about you this week. I published 3 Google updates. One draft needs your OK.",
  postsPublished: 3,
  reviewsNew: 2,
  visibilityDelta: { chatgpt: 1, perplexity: 0, google_ai: 1, gemini: -1 },
  reportUrl: "https://alphaa.app/dashboard/t/briefings",
  footer: { address: "123 Example St, City", unsubscribeUrl: "https://alphaa.app/unsubscribe?s=u_x&t=y" },
} satisfies WeeklyReportEmailProps

// Styles
const body = {
  backgroundColor: "#f5f5f7",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
}
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = {
  color: "#000000",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0",
}
const weekLabel2 = {
  color: "#86868b",
  fontSize: "13px",
  margin: "4px 0 0",
}
const content = { padding: "32px 40px" }
const paragraph = {
  color: "#424245",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 0",
}
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const sectionLabel = {
  color: "#86868b",
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "2px",
  margin: "0 0 12px",
}
const visibilityGrid = { margin: "0" }
const visibilityCell = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "12px",
  textAlign: "center" as const,
  border: "1px solid #d2d2d7",
}
const engineName = {
  color: "#424245",
  fontSize: "12px",
  margin: "0 0 4px",
}
const deltaValue = {
  fontSize: "13px",
  fontWeight: "600",
  margin: "0",
}
const button = {
  backgroundColor: "#000000",
  color: "#1d1d1f",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
}
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = {
  color: "#86868b",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0 0 4px",
}
const listItem = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 4px" }
const footerLink = { color: "#86868b", textDecoration: "underline" }
