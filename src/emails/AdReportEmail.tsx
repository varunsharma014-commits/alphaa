import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components"

// The monthly ad report link (lib/ad-report/mail.ts). Goes to the owner, and to one extra address
// only when the owner typed it. The summary lines are the report's own (written in code from the
// ad platforms' numbers).
export default function AdReportEmail({ businessName, period, summary, url, expires }: { businessName: string; period: string; summary: string[]; url: string; expires: string }) {
  return (
    <Html>
      <Head />
      <Preview>{`Your ad report for ${period}`}</Preview>
      <Body style={{ backgroundColor: "#f6f6f7", fontFamily: "Inter, -apple-system, Segoe UI, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: 16, maxWidth: 560, padding: "28px 32px" }}>
          <Text style={{ fontSize: 13, color: "#6b6b73", margin: 0 }}>alphaa · {businessName}</Text>
          <Text style={{ fontSize: 20, fontWeight: 600, color: "#111114", margin: "10px 0 14px" }}>Your ad report for {period}</Text>
          {summary.map((s, i) => <Text key={i} style={{ fontSize: 15, lineHeight: "23px", color: "#111114", margin: "0 0 10px" }}>{s}</Text>)}
          <Section style={{ margin: "18px 0" }}>
            <Button href={url} style={{ backgroundColor: "#111114", color: "#ffffff", borderRadius: 999, padding: "11px 20px", fontSize: 14, textDecoration: "none" }}>Open the report</Button>
          </Section>
          <Text style={{ fontSize: 12.5, color: "#6b6b73", margin: 0 }}>Anyone with this link can see the report until {expires}. You can turn it off any time on the Ads page in Alphaa.</Text>
        </Container>
      </Body>
    </Html>
  )
}
