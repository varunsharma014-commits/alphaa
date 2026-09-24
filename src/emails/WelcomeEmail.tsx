import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Img, Link,
} from "@react-email/components"

interface WelcomeEmailProps {
  firstName: string
  businessName: string
  /** Unused since trials ended (2026-09); kept so existing callers still type-check. */
  trialEndDate?: string
}

export default function WelcomeEmail({ firstName, businessName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Alphaa — your AI visibility starts now</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>You're in, {firstName}.</Heading>
            <Text style={paragraph}>
              Your agent is set up for <strong>{businessName}</strong>. Its job: get you recommended when people ask ChatGPT, Gemini, Claude and Perplexity.
            </Text>
            <Text style={paragraph}>
              Here's what it works on first:
            </Text>

            <Section style={checklist}>
              {[
                "AI citation profile — structured data every AI engine pulls from",
                "First weekly content post to Google Business Profile",
                "Asks all 4 AI assistants about you — and tells you who they named",
                "Keyword tracking for your business category + city",
              ].map((item) => (
                <Text key={item} style={checkItem}>✓ {item}</Text>
              ))}
            </Section>

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
              Go to your dashboard →
            </Button>

            <Hr style={hr} />

            <Text style={smallText}>
              $99 a month, month to month. Cancel anytime in Billing — no contract, no exit fees.
            </Text>
            <Text style={smallText}>
              Questions? Reply to this email or email us at <Link href="mailto:support@alphaa.app" style={link}>support@alphaa.app</Link>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Alphaa · AI Search Visibility for Local Businesses</Text>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>Privacy</Link>
              {" · "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/terms`} style={footerLink}>Terms</Link>
              {" · "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`} style={footerLink}>Unsubscribe</Link>
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
const button = { backgroundColor: "#0071e3", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "8px 0 24px" }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const smallText = { color: "#6e6e73", fontSize: "13px", lineHeight: "1.6", margin: "0 0 8px" }
const link = { color: "#0066cc", textDecoration: "none" }
const footer = { padding: "24px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", margin: "0 0 4px", textAlign: "center" as const }
const footerLink = { color: "#86868b", textDecoration: "none" }
