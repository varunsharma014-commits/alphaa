import {
  Body, Container, Head, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"
import { appUrl, hi, orYourBusiness } from "@/emails/copy"

interface WelcomeEmailProps {
  firstName?: string | null
  /** Unknown at sign-up unless the person ran a scan first; the copy falls back to "your business". */
  businessName?: string | null
  /** Unused since trials ended (2026-09); kept so existing callers still type-check. */
  trialEndDate?: string
}

export default function WelcomeEmail({ firstName, businessName }: WelcomeEmailProps) {
  const base = appUrl()
  const steps: [string, string][] = [
    ["Checking your baseline:", "Asking all 4 AIs what they say about you now."],
    ["Fixing your facts:", "Writing the verified details AI engines look for before they recommend you."],
    ["Connecting to Google:", "Preparing your Google Business Profile for weekly updates."],
  ]
  return (
    <Html>
      <Head />
      <Preview>Your agent is live. Here is what I am starting on today.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>{hi(firstName)}</Text>
            <Text style={paragraph}>Your agent is live.</Text>
            <Text style={paragraph}>
              My only job is to get {orYourBusiness(businessName)} recommended when your customers ask ChatGPT, Gemini, Claude, and Perplexity who to hire.
            </Text>
            <Text style={paragraph}>Here is what I am starting on today:</Text>

            <Section style={checklist}>
              {steps.map(([label, text]) => (
                <Text key={label} style={checkItem}>• <strong>{label}</strong> {text}</Text>
              ))}
            </Section>

            <Text style={paragraph}>
              There&apos;s no software for you to learn. When I draft an update or finish a report, I send it straight to you. You just tap approve.
            </Text>
            <Text style={paragraph}>
              I&apos;ll reach out when your first visibility report is ready.
            </Text>
            <Text style={paragraph}>— Your AI Agent</Text>

            <Hr style={hr} />

            <Text style={smallText}>$99/mo · No contract · Cancel anytime in two clicks</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Alphaa · AI Search Visibility for Local Businesses</Text>
            <Text style={footerText}>
              <Link href={`${base}/privacy`} style={footerLink}>Privacy</Link>
              {" · "}
              <Link href={`${base}/terms`} style={footerLink}>Terms</Link>
              {" · "}
              <Link href={`${base}/briefing/preferences`} style={footerLink}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: "Sarah",
  businessName: "Bright Smile Dental",
  trialEndDate: "June 3, 2026",
} satisfies WelcomeEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const, padding: "0 0 40px" }
const header = { padding: "32px 40px 0", borderBottom: "1px solid #d2d2d7" }
const logo = { color: "#1d1d1f", fontSize: "20px", fontWeight: "600", margin: "0 0 24px" }
const content = { padding: "40px 40px 0" }
const h1 = { color: "#1d1d1f", fontSize: "28px", fontWeight: "600", margin: "0 0 16px", lineHeight: "1.2" }
const paragraph = { color: "#424245", fontSize: "16px", lineHeight: "1.6", margin: "0 0 16px" }
const checklist = { backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px 24px", margin: "24px 0" }
const checkItem = { color: "#1d1d1f", fontSize: "15px", margin: "0 0 8px", lineHeight: "1.5" }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const smallText = { color: "#6e6e73", fontSize: "13px", lineHeight: "1.6", margin: "0 0 8px" }
const footer = { padding: "24px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", margin: "0 0 4px", textAlign: "center" as const }
const footerLink = { color: "#86868b", textDecoration: "none" }
