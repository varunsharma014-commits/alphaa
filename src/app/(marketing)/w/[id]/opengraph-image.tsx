import { ImageResponse } from "next/og"
import { db } from "@/lib/db"

// The picture people see when an owner shares their win on LinkedIn, Facebook
// or in a text: black and white, the business name and the win, verified date.
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const win = await db.mockActivity.findUnique({ where: { id }, include: { user: { select: { businessName: true } } } }).catch(() => null)
  const ok = win?.type === "win"
  const headline = ok ? win!.title.replace(/^🎉\s*/u, "") : "Verified AI-visibility win"
  const business = ok ? win!.user?.businessName ?? "" : ""
  const date = ok ? win!.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#000", color: "#fff", padding: "72px 80px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600 }}>✦ alphaa</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {business && <div style={{ fontSize: 34, color: "#a1a1a6" }}>{business}</div>}
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{headline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: "#a1a1a6" }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: "#1f9d55", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✓</div>
          {date ? `Verified by alphaa on ${date}` : "Verified by alphaa"}
        </div>
      </div>
    ),
    size,
  )
}
