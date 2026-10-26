import {
  Body, Button, Container, Head, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"
import { appUrl, hi, orYourBusiness } from "@/emails/copy"

interface WeekOneRecapEmailProps {
  firstName?: string | null
  businessName?: string | null
  postsPublished: number
  competitorRuns: number
  contentGapRuns: number
  /** Unused since the 2026-10 rewrite (keyword tracking isn't a line any more); kept for callers. */
  keywordTrackingOn?: boolean
  newReviewAlerts: number
  visibilityScore: number | null
  /** Google Business Profile location connected: only then do we promise Monday/Thursday posts. */
  gbpConnected?: boolean
  /** Paying subscriber: only they get the weekly report (cron/weekly). */
  weeklyReportOn?: boolean
}

export default function WeekOneRecapEmail({
  firstName, businessName, postsPublished, competitorRuns, contentGapRuns,
  newReviewAlerts, visibilityScore, gbpConnected = true, weeklyReportOn = true,
}: WeekOneRecapEmailProps) {
  const base = appUrl()
  // Only true statements: each line needs real, non-zero ledger data.
  const didLines: string[] = []
  if (postsPublished > 0) didLines.push(`Published ${postsPublished} post${postsPublished === 1 ? "" : "s"} to your Google Business Profile.`)
  if (competitorRuns > 0) didLines.push("Found your top local competitors for AI tracking.")
  if (newReviewAlerts > 0) didLines.push(`Tracked ${newReviewAlerts} new review${newReviewAlerts === 1 ? "" : "s"}.`)
  if (contentGapRuns > 0) didLines.push("Found new questions to answer in your content plan.")

  const nextLines = [
    "Checking ChatGPT, Gemini, Claude, and Perplexity for changes.",
    ...(gbpConnected ? ["Publishing to Google on Monday and Thursday."] : []),
    ...(weeklyReportOn ? ["Sending your weekly report."] : []),
  ]

  return (
    <Html>
      <Head />
      <Preview>Here is what I actually did in your first week, and what I am doing next.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>{hi(firstName)}</Text>
            <Text style={paragraph}>
              I have been running {orYourBusiness(businessName)} on autopilot for a week.
              {didLines.length === 0 ? " My first automated runs are still warming up." : ""}
            </Text>

            {didLines.length > 0 && (
              <>
                <Text style={paragraph}>Here is what I actually did:</Text>
                <Section style={recapBox}>
                  {didLines.map((item) => (
                    <Text key={item} style={recapItem}>✓ {item}</Text>
                  ))}
                </Section>
              </>
            )}

            {visibilityScore !== null && (
              <Section style={scoreBox}>
                <Text style={scoreLabel}>CURRENT AI VISIBILITY SCORE</Text>
                <Text style={scoreValue}>{visibilityScore}/100</Text>
              </Section>
            )}

            <Text style={paragraph}>Here is what I am doing next week:</Text>
            <Section style={scheduleBox}>
              {nextLines.map((item) => (
                <Text key={item} style={scheduleItem}>• {item}</Text>
              ))}
            </Section>

            <Button style={button} href={`${base}/dashboard`}>
              See the details in your dashboard →
            </Button>

            <Text style={paragraph}>— Your AI Agent</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you have an alphaa account. Manage emails in Settings.
            </Text>
            <Text style={footerText}>
              <Link href={`${base}/dashboard/settings`} style={footerLink}>Manage preferences</Link>
              {" · "}
              <Link href={`${base}/privacy`} style={footerLink}>Privacy</Link>
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

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#000000", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const recapBox = { backgroundColor: "#edfaf1", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const recapItem = { color: "#424245", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.5" }
const scoreBox = { backgroundColor: "#f5f5f7", border: "1px solid #d2d2d7", borderRadius: "12px", padding: "16px 24px", margin: "0 0 24px", textAlign: "center" as const }
const scoreLabel = { color: "#6e6e73", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", margin: "0 0 4px" }
const scoreValue = { color: "#000000", fontSize: "28px", fontWeight: "600", margin: "0" }
const scheduleBox = { backgroundColor: "#f5f5f7", border: "1px solid #d2d2d7", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const scheduleItem = { color: "#424245", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.5" }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 20px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0 0 4px" }
const footerLink = { color: "#86868b", textDecoration: "none" }
