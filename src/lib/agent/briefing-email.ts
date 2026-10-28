import { buildBriefing } from "@/lib/agent/briefing"
import { approveUrl } from "@/lib/approve-token"
import { getRoi, roiLines } from "@/lib/roi"
import type { BriefingEmailProps } from "@/emails/BriefingEmail"

// Turns the dashboard briefing into the weekly email: each item waiting for the
// owner gets a signed no-login "Approve & publish" link (lib/approve-token.ts).

const base = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
const weekday = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })

export async function briefingEmailProps(userId: string, firstName: string | null): Promise<Omit<BriefingEmailProps, "footer"> | null> {
  const b = await buildBriefing(userId)
  if (!b) return null
  const dashboardUrl = `${base()}/dashboard`
  const result = await Promise.race([getRoi(userId).then((r) => roiLines(r)[0] ?? null).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 15_000))])
  return {
    firstName: firstName ?? b.firstName,
    headline: b.headline,
    lights: b.lights.map((l) => ({ name: l.name, light: l.light })),
    plan: [b.rivalLine, b.planLine].filter(Boolean).join(" ") || null,
    result,
    asOf: `${b.asOf ? `As of ${weekday(b.asOf)}’s check. ` : ""}I check all four again ${weekday(b.nextCheck)}.`,
    inbox: b.inbox.map((it) => {
      if (it.kind === "review" || it.kind === "gbp" || it.kind === "post") {
        return {
          title: it.title,
          quote: it.kind === "review" ? it.quote : null,
          text: it.text,
          approveUrl: it.text ? approveUrl(userId, it.kind, it.id) : null,
          openUrl: dashboardUrl,
          openLabel: "Open Alphaa",
        }
      }
      if (it.kind === "connect") return { title: it.title, text: it.text, openUrl: `${base()}${it.href}`, openLabel: it.cta }
      return { title: it.title, text: it.text, openUrl: `${dashboardUrl}?ask=${it.topic}`, openLabel: "Show me the fix" }
    }),
    ledger: b.ledger.map((l) => ({ day: weekday(l.at), text: l.text })),
    dashboardUrl,
  }
}
