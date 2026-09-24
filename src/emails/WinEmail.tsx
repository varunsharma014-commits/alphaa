import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"

interface WinEmailProps {
  firstName?: string
  businessName: string
  /** Win headline without the leading emoji, e.g. "ChatGPT now mentions CoolAir Pro". */
  headline: string
  /** Honest one-liner describing exactly what the scan measured. */
  detail: string
  /** Public shareable win page (/w/[id]). */
  winUrl: string
  /** Human-readable date the scan measured this win. */
  measuredOn: string
}

export default function WinEmail({
  firstName, businessName, headline, detail, winUrl, measuredOn,
}: WinEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{headline} — measured on your latest alphaa visibility scan</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Section style={winBanner}>
              <Text style={winBannerText}>🎉 NEW WIN — MEASURED ON YOUR LATEST SCAN</Text>
            </Section>

            <Heading style={h1}>{headline}{firstName ? `, ${firstName}` : ""}.</Heading>
            <Text style={paragraph}>{detail}</Text>

            <Section style={winBox}>
              {[
                `Found on alphaa's latest scan of ${businessName}`,
                `Verified ${measuredOn}`,
                "Real scan data — not a projection or an estimate",
              ].map((item) => (
                <Text key={item} style={winItem}>✓ {item}</Text>
              ))}
            </Section>

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
              See it on your dashboard →
            </Button>

            <Text style={shareNote}>
              Worth showing off? There&apos;s a public page for this win you can post anywhere:{" "}
              <Link href={winUrl} style={link}>{winUrl}</Link>
            </Text>

            <Hr style={hr} />

            <Text style={smallText}>
              alphaa keeps checking your AI visibility every week. When the next win lands,
              you&apos;ll see it here and on your dashboard.
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

WinEmail.PreviewProps = {
  firstName: "James",
  businessName: "CoolAir Pro",
  headline: "ChatGPT now mentions CoolAir Pro",
  detail: "A customer asking ChatGPT about HVAC services in Austin now sees YOUR business. alphaa measured this on your latest visibility scan — real answer data, not a projection.",
  winUrl: "https://alphaa.app/w/win_abc123",
  measuredOn: "July 14, 2026",
} satisfies WinEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#0066cc", fontSize: "22px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const winBanner = { backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "10px 16px", margin: "0 0 24px" }
const winBannerText = { color: "#1d8a4e", fontSize: "13.2px", fontWeight: "600", letterSpacing: "1px", margin: "0", textAlign: "center" as const }
const h1 = { color: "#1d1d1f", fontSize: "26.4px", fontWeight: "600", margin: "0 0 16px", lineHeight: "1.3" }
const paragraph = { color: "#424245", fontSize: "16.5px", lineHeight: "1.6", margin: "0 0 20px" }
const winBox = { backgroundColor: "#edfaf1", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const winItem = { color: "#424245", fontSize: "15.4px", margin: "0 0 8px", lineHeight: "1.5" }
const button = { backgroundColor: "#0071e3", color: "#ffffff", borderRadius: "980px", fontSize: "17.6px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const shareNote = { color: "#6e6e73", fontSize: "14.3px", lineHeight: "1.6", margin: "0 0 24px" }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const smallText = { color: "#6e6e73", fontSize: "14.3px", lineHeight: "1.6", margin: "0 0 24px" }
const link = { color: "#0066cc", textDecoration: "none" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "13.2px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "#86868b", textDecoration: "none" }
