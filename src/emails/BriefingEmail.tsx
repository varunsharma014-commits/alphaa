import { Body, Button, Column, Container, Head, Html, Link, Preview, Row, Section, Text } from "@react-email/components"
import { hi } from "@/emails/copy"

// The weekly briefing, delivered: am I winning, what's waiting for my OK
// (with one-tap Approve links that work without logging in), what you did.
// Same three answers as the dashboard (lib/agent/briefing.ts).

export type BriefingEmailItem = { title: string; quote?: string | null; text?: string | null; approveUrl?: string | null; openUrl: string; openLabel: string }

export interface BriefingEmailProps {
  firstName?: string | null
  headline: string
  lights: { name: string; light: "yes" | "no" | "unknown" }[]
  plan?: string | null
  result?: string | null
  asOf?: string | null
  inbox: BriefingEmailItem[]
  ledger: { day: string; text: string }[]
  dashboardUrl: string
  footer?: { address?: string | null; unsubscribeUrl?: string | null }
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s)

export default function BriefingEmail({ firstName, headline, lights, plan, result, asOf, inbox, ledger, dashboardUrl, footer: foot }: BriefingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{headline}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={content}>
            <Text style={muted}>{hi(firstName)}</Text>
            <Text style={headlineStyle}>{headline}</Text>
            <Row style={{ margin: "14px 0 12px" }}>
              {lights.map((l) => (
                <Column key={l.name} style={{ ...light, ...(l.light === "yes" ? lightYes : {}) }}>
                  <Text style={{ ...lightMark, color: l.light === "yes" ? "#1f9d55" : "#86868b" }}>{l.light === "yes" ? "✓" : l.light === "no" ? "✕" : "?"}</Text>
                  <Text style={{ ...lightName, color: l.light === "yes" ? "#1d1d1f" : "#86868b" }}>{l.name}</Text>
                </Column>
              ))}
            </Row>
            {plan && <Text style={para}>{plan}</Text>}
            {result && <Text style={{ ...para, fontWeight: 600 }}>{result}</Text>}
            {asOf && <Text style={muted}>{asOf}</Text>}
          </Section>

          <Section style={sec}>
            <Text style={lead}>{inbox.length === 0 ? "Nothing is waiting for you. I’ve got it from here." : inbox.length === 1 ? "I have one thing waiting for your OK:" : `I have ${inbox.length} things waiting for your OK:`}</Text>
            {inbox.slice(0, 3).map((it, i) => (
              <Section key={i} style={card}>
                <Text style={{ ...para, fontWeight: 600, margin: "0 0 8px" }}>{it.title}</Text>
                {it.quote && <Text style={quote}>“{clip(it.quote, 220)}”</Text>}
                {it.text && <Text style={draft}>{clip(it.text, 600)}</Text>}
                {it.approveUrl ? (
                  <>
                    <Button style={button} href={it.approveUrl}>Approve &amp; publish</Button>
                    <Text style={{ ...muted, margin: "10px 0 0" }}>
                      <Link href={it.openUrl} style={link}>Edit it first</Link>
                    </Text>
                  </>
                ) : (
                  <Button style={button} href={it.openUrl}>{it.openLabel}</Button>
                )}
              </Section>
            ))}
            {inbox.length > 3 && <Text style={muted}><Link href={dashboardUrl} style={link}>{inbox.length - 3} more in Alphaa</Link></Text>}
          </Section>

          <Section style={sec}>
            <Text style={lead}>{ledger.length ? "Here’s what I did for you this week:" : "My first full pass is running. Next week this lists everything I did."}</Text>
            {ledger.slice(0, 12).map((l, i) => (
              <Text key={i} style={row}>
                <span style={{ color: "#1f9d55", fontWeight: 700 }}>✓</span>&nbsp; <span style={{ color: "#86868b" }}>{l.day}:</span> {l.text}
              </Text>
            ))}
            <Text style={{ ...muted, margin: "16px 0 0" }}>
              <Link href={dashboardUrl} style={link}>Open Alphaa</Link>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>You’re receiving this because you have an Alphaa plan. — Your AI agent</Text>
            <Text style={footerText}>Alphaa{foot?.address ? ` · ${foot.address}` : ""}</Text>
            {foot?.unsubscribeUrl && (
              <Text style={footerText}>
                <Link href={foot.unsubscribeUrl} style={{ color: "#86868b", textDecoration: "underline" }}>Unsubscribe</Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

BriefingEmail.PreviewProps = {
  firstName: "Maria",
  headline: "ChatGPT and Claude are recommending you. Gemini and Perplexity aren’t yet.",
  lights: [
    { name: "ChatGPT", light: "yes" },
    { name: "Gemini", light: "no" },
    { name: "Claude", light: "yes" },
    { name: "Perplexity", light: "no" },
  ],
  plan: "When they don’t name you, they name Smith Heating instead. I’m writing pages that answer the questions your customers ask them.",
  result: "6 people came to your site from ChatGPT this week.",
  asOf: "As of Wednesday’s check.",
  inbox: [{ title: "Dan left you a 5-star review. Here’s my reply:", quote: "Fast and friendly, fixed our furnace same day.", text: "Thank you, Dan! We’re glad we could get your heat back the same day.", approveUrl: "https://alphaa.app/approve?t=x", openUrl: "https://alphaa.app/dashboard", openLabel: "Open Alphaa" }],
  ledger: [{ day: "Tuesday", text: "Posted an update to your Google listing" }, { day: "Monday", text: "Wrote the background file AI assistants read about you (llms.txt) and added it to your site" }],
  dashboardUrl: "https://alphaa.app/dashboard",
} satisfies BriefingEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const content = { padding: "32px 32px 12px" }
const sec = { padding: "18px 32px", borderTop: "1px solid #e5e5ea" }
const para = { color: "#1d1d1f", fontSize: "16px", lineHeight: "1.5", margin: "0 0 10px" }
const muted = { color: "#86868b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 6px" }
const headlineStyle = { color: "#1d1d1f", fontSize: "24px", lineHeight: "1.25", fontWeight: "700", margin: "4px 0 0" }
const lead = { color: "#1d1d1f", fontSize: "17px", fontWeight: "600", margin: "0 0 12px" }
const light = { width: "25%", border: "1px solid #e5e5ea", borderRadius: "12px", textAlign: "center" as const, padding: "8px 2px" }
const lightYes = { borderColor: "#a6dcbc", backgroundColor: "#f0faf4" }
const lightMark = { fontSize: "18px", fontWeight: "700", margin: "0" }
const lightName = { fontSize: "12px", fontWeight: "600", margin: "2px 0 0" }
const card = { border: "1px solid #e5e5ea", borderRadius: "14px", padding: "16px", margin: "0 0 12px" }
const quote = { color: "#6e6e73", fontSize: "14px", fontStyle: "italic" as const, margin: "0 0 10px" }
const draft = { color: "#1d1d1f", fontSize: "15px", lineHeight: "1.5", backgroundColor: "#f5f5f7", borderRadius: "10px", padding: "12px", margin: "0 0 14px", whiteSpace: "pre-wrap" as const }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "600", padding: "14px 26px", textDecoration: "none", display: "inline-block" }
const link = { color: "#1d1d1f", textDecoration: "underline" }
const row = { color: "#1d1d1f", fontSize: "15px", lineHeight: "1.45", margin: "0 0 8px" }
const footer = { padding: "18px 32px", borderTop: "1px solid #e5e5ea" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0 0 4px" }
