export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { anthropic } from "@/lib/claude"

// Public (under /api/scan/** in the middleware allowlist). The /start
// conversation asks for ONE thing — the website — and this works out the
// rest: business name, what it does, and where. Nothing is stored; the scan
// itself is created by POST /api/scan with what we return here.

const schema = z.object({ websiteUrl: z.string().min(3).max(200) })

function normalize(raw: string): string | null {
  let s = raw.trim().replace(/\s+/g, "")
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`
  try {
    const u = new URL(s)
    if (!u.hostname.includes(".")) return null
    return u.toString()
  } catch {
    return null
  }
}

export interface IdentifyResult {
  websiteUrl: string
  domain: string
  businessName: string
  businessType: string
  city: string
  state: string
  oneLiner: string
}

export async function POST(req: NextRequest) {
  let websiteUrl: string | null
  try {
    websiteUrl = normalize(schema.parse(await req.json()).websiteUrl)
  } catch {
    websiteUrl = null
  }
  if (!websiteUrl) return NextResponse.json({ error: "That doesn’t look like a website address." }, { status: 400 })

  const domain = new URL(websiteUrl).hostname.replace(/^www\./, "")

  let title = ""
  let description = ""
  let text = ""
  try {
    const res = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", Accept: "text/html,application/xhtml+xml,*/*" },
      redirect: "follow",
    })
    const html = await res.text()
    const { load } = await import("cheerio")
    const $ = load(html)
    title = $('meta[property="og:title"]').attr("content") || $("title").text().trim() || ""
    description =
      $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || ""
    $("script, style, noscript, svg, nav, footer").remove()
    text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000)
  } catch {
    // fall through — Haiku can still make a guess from the domain alone
  }

  if (!title && !description && text.length < 80) {
    return NextResponse.json({ error: "unreadable", domain }, { status: 422 })
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 250,
      messages: [
        {
          role: "user",
          content:
            `Identify the business behind this website.\n\n` +
            `URL: ${websiteUrl}\nTitle: ${title.slice(0, 200)}\nDescription: ${description.slice(0, 300)}\n` +
            `Page text: ${text.slice(0, 2500)}\n\n` +
            `Return ONLY JSON, no fences:\n` +
            `{"businessName":"<official name, no taglines>","businessType":"<2-4 plain words, e.g. dental practice, plumber, family law firm>",` +
            `"city":"<city or empty>","state":"<2-letter state/region code or empty>",` +
            `"oneLiner":"<one short sentence a receptionist would say about what they do, no adjectives>"}`,
        },
      ],
    })
    const raw = msg.content[0].type === "text" ? msg.content[0].text : ""
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim())
    const out: IdentifyResult = {
      websiteUrl,
      domain,
      businessName: String(parsed.businessName ?? "").trim().slice(0, 80),
      businessType: String(parsed.businessType ?? "").trim().slice(0, 60),
      city: String(parsed.city ?? "").trim().slice(0, 60),
      state: String(parsed.state ?? "").trim().slice(0, 12),
      oneLiner: String(parsed.oneLiner ?? "").trim().slice(0, 160),
    }
    if (out.businessName.length < 2) return NextResponse.json({ error: "unclear", domain }, { status: 422 })
    return NextResponse.json(out)
  } catch (err) {
    console.error("[scan/identify]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "unclear", domain }, { status: 422 })
  }
}
