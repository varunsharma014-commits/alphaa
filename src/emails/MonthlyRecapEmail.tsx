import { Body, Button, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components"
import { hi } from "@/emails/copy"
import type { Recap } from "@/lib/agent/recap"

// "Your October with Alphaa": the month in a few big numbers, firsts, and what
// one new customer is worth. Sent on the 1st (api/cron/monthly-recap).

export interface MonthlyRecapEmailProps {
  firstName?: string | null
  recap: Recap
  paysFor: number | null
  dashboardUrl: string
  footer?: { address?: string | null; unsubscribeUrl?: string | null }
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`

export default function MonthlyRecapEmail({ firstName, recap: r, paysFor, dashboardUrl, footer: foot }: MonthlyRecapEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your ${r.month} with Alphaa: ${r.jobs} jobs done for you.`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ padding: "36px 32px 8px" }}>
            <Text style={muted}>{hi(firstName)}</Text>
            <Text style={title}>Your {r.month} with Alphaa</Text>
          </Section>
          <Section style={{ padding: "8px 32px" }}>
            {r.visitors !== null && (
              <Section style={stat}>
                <Text style={big}>{r.visitors}</Text>
                <Text style={label}>{r.visitors === 1 ? "person found you through AI" : "people found you through AI"}</Text>
              </Section>
            )}
            <Section style={stat}>
              <Text style={big}>{r.jobs}</Text>
              <Text style={label}>jobs I did for you</Text>
            </Section>
            <Section style={stat}>
              <Text style={big}>{r.recommending.length} of 4</Text>
              <Text style={label}>AIs recommending you{r.recommending.length ? `: ${r.recommending.join(", ")}` : ""}</Text>
            </Section>
          </Section>
          {r.firsts.length > 0 && (
            <Section style={{ padding: "8px 32px" }}>
              {r.firsts.map((f) => <Text key={f} style={first}>★ {f} this month.</Text>)}
            </Section>
          )}
          {r.highlights.length > 0 && (
            <Section style={{ padding: "8px 32px" }}>
              <Text style={lead}>Some of what I did:</Text>
              {r.highlights.map((h) => <Text key={h} style={row}><span style={{ color: "#1f9d55", fontWeight: 700 }}>✓</span>&nbsp; {h}</Text>)}
            </Section>
          )}
          {r.value && paysFor !== null && paysFor >= 1 && (
            <Section style={{ padding: "8px 32px" }}>
              <Text style={para}>One new customer is worth about {money(r.value)} to you. Just one of them pays for {paysFor > 24 ? "Alphaa for years" : paysFor === 1 ? "a month of Alphaa" : `${paysFor} months of Alphaa`}.</Text>
            </Section>
          )}
          <Section style={{ padding: "16px 32px 32px" }}>
            <Button style={button} href={dashboardUrl}>Open Alphaa</Button>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>You’re receiving this because you have an Alphaa plan. — Your AI agent</Text>
            <Text style={footerText}>Alphaa{foot?.address ? ` · ${foot.address}` : ""}</Text>
            {foot?.unsubscribeUrl && <Text style={footerText}><Link href={foot.unsubscribeUrl} style={{ color: "#86868b", textDecoration: "underline" }}>Unsubscribe</Link></Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

MonthlyRecapEmail.PreviewProps = {
  firstName: "Maria",
  recap: { month: "October", visitors: 37, jobs: 41, highlights: ["Published “When to replace your furnace” on your website", "Replied to a Google review", "Added the behind-the-scenes code AI uses to confirm who you are and where you are"], firsts: ["Claude recommended you for the first time"], recommending: ["ChatGPT", "Claude"], value: 850 },
  paysFor: 8,
  dashboardUrl: "https://alphaa.app/briefing",
} satisfies MonthlyRecapEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const muted = { color: "#86868b", fontSize: "14px", margin: "0 0 6px" }
const title = { color: "#1d1d1f", fontSize: "28px", fontWeight: "700", lineHeight: "1.2", margin: "0" }
const stat = { backgroundColor: "#f5f5f7", borderRadius: "14px", padding: "14px 18px", margin: "0 0 10px" }
const big = { color: "#000000", fontSize: "36px", fontWeight: "700", lineHeight: "1.1", margin: "0" }
const label = { color: "#424245", fontSize: "15px", margin: "2px 0 0" }
const first = { color: "#1d1d1f", fontSize: "16px", fontWeight: "600", margin: "0 0 8px" }
const lead = { color: "#1d1d1f", fontSize: "16px", fontWeight: "600", margin: "8px 0 10px" }
const row = { color: "#1d1d1f", fontSize: "15px", lineHeight: "1.45", margin: "0 0 8px" }
const para = { color: "#1d1d1f", fontSize: "16px", lineHeight: "1.5", margin: "0" }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "600", padding: "14px 26px", textDecoration: "none", display: "inline-block" }
const footer = { padding: "18px 32px", borderTop: "1px solid #e5e5ea" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0 0 4px" }
