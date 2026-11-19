// Public shareable win page — /w/[id]. This is the page owners post on their
// socials. It exposes ONLY: the business name, the win headline, the date it
// was verified, and an engine icon. Never the owner's email, location, or any
// private metric beyond what the win headline itself states.

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { ShareWinButton } from "@/components/dashboard/ShareWinButton"
import Link from "next/link"
import { V3Page, Frame } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/scan.css"
import {
  Bot, Globe, Sparkles, Search, TrendingUp, PartyPopper, CheckCircle2,
  type LucideIcon,
} from "lucide-react"

export const dynamic = "force-dynamic"

const OG_DESCRIPTION = "Verified AI-visibility win, tracked by alphaa"

// Same engine → icon mapping the dashboard uses.
const ENGINE_ICONS: Record<string, LucideIcon> = {
  chatgpt: Bot,
  claude: Globe,
  gemini: Sparkles,
  perplexity: Search,
}

async function getWin(id: string) {
  try {
    const row = await db.mockActivity.findUnique({
      where: { id },
      include: { user: { select: { businessName: true } } },
    })
    if (!row || row.type !== "win") return null
    return row
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const win = await getWin(id)
  if (!win) return { title: "Not found" }
  return {
    title: win.title,
    description: OG_DESCRIPTION,
    openGraph: { title: win.title, description: OG_DESCRIPTION, type: "website" },
  }
}

export default async function PublicWinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const win = await getWin(id)
  if (!win) notFound()

  const meta =
    typeof win.metadata === "object" && win.metadata !== null && !Array.isArray(win.metadata)
      ? (win.metadata as Record<string, unknown>)
      : {}
  const kind = typeof meta.kind === "string" ? meta.kind : null
  const engine = typeof meta.engine === "string" ? meta.engine : null

  const Icon =
    (engine ? ENGINE_ICONS[engine] : undefined) ??
    (kind === "score_jump" ? TrendingUp : PartyPopper)

  const businessName = win.user?.businessName ?? "This business"
  const headline = win.title.replace(/^🎉\s*/u, "")
  const verifiedDate = win.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <V3Page>
      <Frame top>
        <div className="wn3">

          {/* Celebratory win card */}
          <div className="wn3-card">
            <div className="wn3-icon">
              <Icon size={30} />
            </div>

            <p className="wn3-eyebrow">
              Verified AI-visibility win
            </p>

            <p className="wn3-biz">{businessName}</p>
            <h1>
              {headline}
            </h1>

            <div className="wn3-verified">
              <CheckCircle2 size={15} />
              <span>Verified by alphaa on {verifiedDate}</span>
            </div>

            <div className="wn3-share"><ShareWinButton winId={win.id} headline={headline} align="center" /></div>
          </div>

          {/* Subtle viral hook */}
          <div className="wn3-hook">
            <p>
              Want an AI agent running your marketing too? Start with a free check of whether
              ChatGPT, Claude, Gemini and Perplexity recommend your business.
            </p>
            <div className="v3-btns">
              <Link className="v3-btn" href="/start">
                Get started
              </Link>
            </div>
          </div>

        </div>
      </Frame>
    </V3Page>
  )
}
