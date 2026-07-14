// Public shareable win page — /w/[id]. This is the page owners post on their
// socials. It exposes ONLY: the business name, the win headline, the date it
// was verified, and an engine icon. Never the owner's email, location, or any
// private metric beyond what the win headline itself states.

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { ShareWinButton } from "@/components/dashboard/ShareWinButton"
import { OrangePillButton } from "@/components/common/OrangePillButton"
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
    <div className="pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Celebratory win card */}
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center shadow-glow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center mx-auto mb-6">
            <Icon size={30} className="text-brand-orange" />
          </div>

          <p className="text-xs uppercase tracking-[0.18em] text-brand-orange mb-4">
            Verified AI-visibility win
          </p>

          <p className="text-white/80 text-lg font-medium mb-2">{businessName}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-6">
            {headline}
          </h1>

          <div className="flex items-center justify-center gap-1.5 text-white/40 text-sm mb-8">
            <CheckCircle2 size={15} className="text-green-500" />
            <span>Verified by alphaa on {verifiedDate}</span>
          </div>

          <ShareWinButton winId={win.id} headline={headline} align="center" />
        </div>

        {/* Subtle viral hook */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center mt-8">
          <p className="text-white/70 text-sm sm:text-base mb-4">
            Get found on AI too &mdash; see whether ChatGPT, Claude, Gemini and Perplexity
            recommend your business.
          </p>
          <OrangePillButton href="/scan" size="md">
            Run your free scan
          </OrangePillButton>
        </div>

      </div>
    </div>
  )
}
