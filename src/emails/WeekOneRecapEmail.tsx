import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"

interface WeekOneRecapEmailProps {
  firstName?: string
  businessName: string
  postsPublished: number
  competitorRuns: number
  contentGapRuns: number
  keywordTrackingOn: boolean
  newReviewAlerts: number
  visibilityScore: number | null
}

export default function WeekOneRecapEmail({
  firstName, businessName, postsPublished, competitorRuns, contentGapRuns,
  keywordTrackingOn, newReviewAlerts, visibilityScore,
}: WeekOneRecapEmailProps) {
  const didLines: string[] = []
  if (postsPublished > 0) didLines.push(`${postsPublished} Google post${postsPublished === 1 ? "" : "s"} published to your Business Profile`)
  if (keywordTrackingOn) didLines.push("Keyword rank tracking switched on — your Google rankings are monitored daily")
  if (competitorRuns > 0) didLines.push("Local competitors found and added to your tracker")
  if (contentGapRuns > 0) didLines.push("Content opportunities found — topic ideas waiting in your content plan")
  if (newReviewAlerts > 0) didLines.push(`${newReviewAlerts} new review alert${newReviewAlerts === 1 ? "" : "s"} from your Google profile`)

  const hasActivity = didLines.length > 0

  const scheduledLines = [
    "Daily keyword + analytics sync from Google",
    "Google Business Profile posts every Monday and Thursday",
    "Competitor discovery and refresh every Sunday",
    "Your weekly report every Monday",
  ]

  return (
    <Html>
      <Head />
      <Preview>Your first week with alphaa — here&apos;s what happened</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>One week in{firstName ? `, ${firstName}` : ""}.</Heading>

            {hasActivity ? (
              <>
                <Text style={paragraph}>
                  <strong>{businessName}</strong> has been on autopilot for a week.
                  Here&apos;s what alphaa actually did:
                </Text>
                <Section style={recapBox}>
                  {didLines.map((item) => (
                    <Text key={item} style={recapItem}>✓ {item}</Text>
                  ))}
                </Section>
              </>
            ) : (
              <Text style={paragraph}>
                <strong>{businessName}</strong> is connected and on autopilot. The first
                automated runs are still warming up, so here&apos;s what&apos;s scheduled next:
              </Text>
            )}

            {visibilityScore !== null && (
              <Section style={scoreBox}>
                <Text style={scoreLabel}>CURRENT AI VISIBILITY SCORE</Text>
                <Text style={scoreValue}>{visibilityScore}/100</Text>
              </Section>
            )}

            <Text style={paragraph}>
              {hasActivity ? "And here's what stays on schedule:" : "Coming up on the schedule:"}
            </Text>
            <Section style={scheduleBox}>
              {scheduledLines.map((item) => (
                <Text key={item} style={scheduleItem}>→ {item}</Text>
              ))}
            </Section>

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
              See it all in your dashboard →
            </Button>

            <Hr style={hr} />

            <Text style={smallText}>
              Questions about anything above? Just reply to this email.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you have an alphaa account. Manage emails in Settings.
            </Text>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`} style={footerLink}>Manage preferences</Link>
              {" · "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>Privacy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

WeekOneRecapEmail.PreviewProps = {
  firstName: "James",
  businessName: "CoolAir Pro",
  postsPublished: 2,
  competitorRuns: 1,
  contentGapRuns: 1,
  keywordTrackingOn: true,
  newReviewAlerts: 3,
  visibilityScore: 61,
} satisfies WeekOneRecapEmailProps

const body = { backgroundColor: "#0a0a0a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }
const container = { maxWidth: "560px", margin: "0 auto" }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #1a1a1a" }
const logoText = { color: "#ff6b1a", fontSize: "20px", fontWeight: "700", margin: "0" }
const content = { padding: "32px 40px 0" }
const h1 = { color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: "0 0 16px", lineHeight: "1.3" }
const paragraph = { color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const recapBox = { backgroundColor: "#0b1105", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const recapItem = { color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.5" }
const scoreBox = { backgroundColor: "#110b05", border: "1px solid rgba(255,107,26,0.2)", borderRadius: "12px", padding: "16px 24px", margin: "0 0 24px", textAlign: "center" as const }
const scoreLabel = { color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", margin: "0 0 4px" }
const scoreValue = { color: "#ff6b1a", fontSize: "28px", fontWeight: "700", margin: "0" }
const scheduleBox = { backgroundColor: "#110b05", border: "1px solid rgba(255,107,26,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const scheduleItem = { color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.5" }
const button = { backgroundColor: "#ff6b1a", color: "#ffffff", borderRadius: "8px", fontSize: "16px", fontWeight: "600", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const hr = { borderColor: "#1a1a1a", margin: "24px 0" }
const smallText = { color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.6", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #1a1a1a" }
const footerText = { color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center" as const, margin: "0 0 4px" }
const footerLink = { color: "rgba(255,255,255,0.3)", textDecoration: "none" }
