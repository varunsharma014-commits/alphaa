import {
  Body, Button, Container, Head, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"
import { appUrl, hi, inCity, orYou } from "@/emails/copy"

interface WinEmailProps {
  firstName?: string | null
  businessName?: string | null
  /** Engine that newly named the business ("ChatGPT"), or null for a score-only win. */
  engine?: string | null
  city?: string | null
  /** Set when the score rose on this scan (shown alone or alongside an engine win). */
  scoreRise?: { from: number; to: number } | null
  /** Human-readable date of the scan that measured the win (not the send date). */
  measuredOn: string
  /** Public shareable win page (/w/[id]). Not shown since the 2026-10 rewrite; kept for callers. */
  winUrl?: string
}

export default function WinEmail({
  firstName, businessName, engine, city, scoreRise, measuredOn,
}: WinEmailProps) {
  const base = appUrl()
  const preview = engine
    ? `A customer asking ${engine} now sees ${orYou(businessName)} in the answer.`
    : scoreRise
      ? `Your AI visibility score rose from ${scoreRise.from} to ${scoreRise.to}.`
      : "Measured on your latest visibility scan."
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>{hi(firstName)}</Text>
            <Text style={paragraph}>Good news.</Text>

            {!engine && scoreRise && (
              <Text style={paragraph}>
                Your AI visibility score rose from {scoreRise.from} to {scoreRise.to}.
              </Text>
            )}

            {engine && (
              <Text style={paragraph}>
                A customer asking {engine} about businesses like yours{inCity(city)} now sees you in the answer.
              </Text>
            )}

            <Text style={paragraph}>
              I measured this on your latest visibility scan, on {measuredOn}.{" "}
              {engine
                ? "This is a real answer from a live AI engine, not an estimate."
                : "This is a real measurement, not an estimate."}
            </Text>

            {scoreRise && engine && (
              <Text style={paragraph}>
                Your AI visibility score also rose from {scoreRise.from} to {scoreRise.to} on that scan.
              </Text>
            )}

            <Button style={button} href={`${base}/dashboard`}>
              {engine ? "See the exact answer in your dashboard →" : "See it in your dashboard →"}
            </Button>

            <Text style={paragraph}>
              I will keep checking all four AIs every week and tell you the moment your name comes up again.
            </Text>
            <Text style={paragraph}>— Your AI Agent</Text>
          </Section>

          <Section style={footer}>
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

WinEmail.PreviewProps = {
  firstName: "James",
  businessName: "CoolAir Pro",
  engine: "ChatGPT",
  city: "Austin",
  scoreRise: { from: 40, to: 52 },
  measuredOn: "July 14, 2026",
} satisfies WinEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#000000", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 20px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "#86868b", textDecoration: "none" }
