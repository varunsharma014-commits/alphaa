import { ImageResponse } from "next/og"

// The preview card for every marketing page (LinkedIn, X, Slack, iMessage and
// AI answer cards): black and white, the page's own title on it.
export const runtime = "edge"

export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get("title") || "Get customers from ChatGPT. Your AI Agent does the work.").slice(0, 140)
  const eyebrow = (searchParams.get("eyebrow") || "").slice(0, 40)
  const size = title.length > 90 ? 58 : title.length > 60 ? 66 : 76
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#000", color: "#fff", padding: "72px 80px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600 }}>
          <div style={{ width: 22, height: 22, background: "#fff", transform: "rotate(45deg)", borderRadius: 4 }} />
          alphaa
          {eyebrow && <div style={{ marginLeft: 18, fontSize: 24, fontWeight: 500, color: "#a1a1a6" }}>{eyebrow}</div>}
        </div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 26, color: "#a1a1a6" }}>The AI Agent for ChatGPT, Gemini, Claude and Perplexity · alphaa.app</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
    },
  )
}
