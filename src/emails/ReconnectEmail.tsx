import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"

interface ReconnectEmailProps {
  firstName?: string
  businessName: string
}

export default function ReconnectEmail({
  firstName, businessName,
}: ReconnectEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>alphaa lost access to your Google account — reconnect in 30 seconds to keep autopilot running</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Section style={urgencyBanner}>
              <Text style={urgencyText}>⚠ AUTOPILOT PAUSED — ACTION NEEDED</Text>
            </Section>

            <Heading style={h1}>alphaa lost access to your Google account{firstName ? `, ${firstName}` : ""}.</Heading>
            <Text style={paragraph}>
              Google disconnected us from <strong>{businessName}</strong> — this usually happens
              when you change your Google password or security settings. Nothing is broken on
              your end, but until you reconnect, autopilot is paused:
            </Text>

            <Section style={pauseBox}>
              {[
                "Google Business Profile posting — paused",
                "Google ranking tracking — paused",
                "New review monitoring — paused",
              ].map((item) => (
                <Text key={item} style={pauseItem}>⏸ {item}</Text>
              ))}
            </Section>

            <Text style={paragraph}>
              Reconnecting takes about 30 seconds — one click, sign in with Google, done.
              Everything picks up right where it left off.
            </Text>

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations`}>
              Reconnect Google →
            </Button>
            <Text style={reassureNote}>Your data and settings are safe. Nothing was lost.</Text>

            <Hr style={hr} />

            <Text style={smallText}>
              Stuck? Just reply to this email and we&apos;ll walk you through it.
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

ReconnectEmail.PreviewProps = {
  firstName: "James",
  businessName: "CoolAir Pro",
} satisfies ReconnectEmailProps

const body = { backgroundColor: "#0a0a0a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }
const container = { maxWidth: "560px", margin: "0 auto" }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #1a1a1a" }
const logoText = { color: "#ff6b1a", fontSize: "20px", fontWeight: "700", margin: "0" }
const content = { padding: "32px 40px 0" }
const urgencyBanner = { backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "10px 16px", margin: "0 0 24px" }
const urgencyText = { color: "#f59e0b", fontSize: "12px", fontWeight: "700", letterSpacing: "1px", margin: "0", textAlign: "center" as const }
const h1 = { color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: "0 0 16px", lineHeight: "1.3" }
const paragraph = { color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const pauseBox = { backgroundColor: "#110b05", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const pauseItem = { color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.5" }
const button = { backgroundColor: "#ff6b1a", color: "#ffffff", borderRadius: "8px", fontSize: "16px", fontWeight: "600", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const reassureNote = { color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "0 0 24px" }
const hr = { borderColor: "#1a1a1a", margin: "24px 0" }
const smallText = { color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.6", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #1a1a1a" }
const footerText = { color: "rgba(255,255,255,0.2)", fontSize: "12px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "rgba(255,255,255,0.3)", textDecoration: "none" }
