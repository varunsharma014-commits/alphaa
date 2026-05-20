import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"

interface TrialEndingEmailProps {
  firstName: string
  businessName: string
  daysLeft: number
  currentScore: number
  enginesFound: number
}

export default function TrialEndingEmail({
  firstName, businessName, daysLeft, currentScore, enginesFound,
}: TrialEndingEmailProps) {
  const urgency = daysLeft === 1 ? "last day" : `${daysLeft} days left`

  return (
    <Html>
      <Head />
      <Preview>{daysLeft === 1 ? "Last day" : `${daysLeft} days left`} on your Alphaa trial — keep your AI visibility</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Section style={urgencyBanner}>
              <Text style={urgencyText}>⏰ {urgency.toUpperCase()} ON YOUR FREE TRIAL</Text>
            </Section>

            <Heading style={h1}>Don't lose the progress you've built, {firstName}.</Heading>
            <Text style={paragraph}>
              Your 14-day free trial for <strong>{businessName}</strong> ends in {urgency}. Here's what you'll lose if you don't upgrade:
            </Text>

            <Section style={loseBox}>
              {[
                `Your visibility score of ${currentScore}/100 — reset to zero`,
                `Presence on ${enginesFound} of 6 AI engines — gone`,
                "Weekly content publishing — stops immediately",
                "AI citation profile we built — unpublished",
                "Keyword tracking and mention alerts — disabled",
              ].map((item) => (
                <Text key={item} style={loseItem}>✗ {item}</Text>
              ))}
            </Section>

            <Text style={paragraph}>
              Upgrading takes 60 seconds. Your progress is saved and continues without interruption.
            </Text>

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`}>
              Upgrade now — from $99/mo →
            </Button>
            <Text style={trialNote}>Cancel anytime. 7-day refund on first charge.</Text>

            <Hr style={hr} />

            <Text style={smallText}>
              Not ready yet? <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`} style={link}>Extend your trial</Link> — just reply to this email and tell us what's holding you back. We'll help.
            </Text>
          </Section>

          <Section style={footer}>
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

TrialEndingEmail.PreviewProps = {
  firstName: "James",
  businessName: "CoolAir Pro",
  daysLeft: 3,
  currentScore: 61,
  enginesFound: 4,
} satisfies TrialEndingEmailProps

const body = { backgroundColor: "#0a0a0a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }
const container = { maxWidth: "560px", margin: "0 auto" }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #1a1a1a" }
const logoText = { color: "#ff6b1a", fontSize: "20px", fontWeight: "700", margin: "0" }
const content = { padding: "32px 40px 0" }
const urgencyBanner = { backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 16px", margin: "0 0 24px" }
const urgencyText = { color: "#ef4444", fontSize: "12px", fontWeight: "700", letterSpacing: "1px", margin: "0", textAlign: "center" as const }
const h1 = { color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: "0 0 16px", lineHeight: "1.3" }
const paragraph = { color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const loseBox = { backgroundColor: "#110505", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const loseItem = { color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.5" }
const button = { backgroundColor: "#ff6b1a", color: "#ffffff", borderRadius: "8px", fontSize: "16px", fontWeight: "600", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const trialNote = { color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "0 0 24px" }
const hr = { borderColor: "#1a1a1a", margin: "24px 0" }
const smallText = { color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.6", margin: "0 0 24px" }
const link = { color: "#ff6b1a", textDecoration: "none" }
const footer = { padding: "20px 40px", borderTop: "1px solid #1a1a1a" }
const footerText = { color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "rgba(255,255,255,0.3)", textDecoration: "none" }
