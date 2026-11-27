import { ImageResponse } from "next/og"
import { ORB_PNG } from "./orb"

// The preview card for every marketing page (LinkedIn, X, Slack, iMessage and
// AI answer cards): the site's colour system (soft pastel blocks, ink type, the orb
// mark + "alphaa"), the page's own title on it. Text only.
export const runtime = "edge"

export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get("title") || "Your entire marketing, run by an AI agent.").slice(0, 140)
  const eyebrow = (searchParams.get("eyebrow") || "").slice(0, 40)
  const size = title.length > 90 ? 58 : title.length > 60 ? 66 : 76
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#111114", padding: "72px 80px", fontFamily: "sans-serif",
        backgroundImage: "linear-gradient(135deg, #ffe6ee 0%, #f3ecff 50%, #e4edff 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ORB_PNG} width={34} height={34} alt="" />
          alphaa
          {eyebrow && <div style={{ marginLeft: 18, fontSize: 22, fontWeight: 700, letterSpacing: 0, color: "#7a4fd6", background: "#e1d4ff", borderRadius: 999, padding: "6px 16px" }}>{eyebrow}</div>}
        </div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 26, color: "#3a3a40" }}>The AI Agent for ChatGPT, Gemini, Claude and Perplexity · alphaa.app</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
    },
  )
}
