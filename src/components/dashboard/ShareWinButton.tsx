"use client"

// Small share actions for a win: copy the public /w/[id] link, share to X or
// LinkedIn, and the native share sheet where available. Rendered on win rows
// in the dashboard activity feed and on the public win page itself.

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Copy, Share2 } from "lucide-react"

interface ShareWinButtonProps {
  winId: string
  headline: string
  align?: "left" | "center"
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://alphaa.app"

const pillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-line/15 px-3 py-1.5 text-xs font-medium text-fg/60 transition-all duration-200 hover:border-brand-orange/50 hover:text-brand-orange"

export function ShareWinButton({ winId, headline, align = "left" }: ShareWinButtonProps) {
  // navigator.share only exists in some browsers — detect after mount so the
  // server and client render the same initial markup.
  const [canNativeShare, setCanNativeShare] = useState(false)
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true)
    }
  }, [])

  const winUrl = `${APP_URL}/w/${winId}`
  const shareText = `${headline} — verified by alphaa`
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(winUrl)}`
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(winUrl)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(winUrl)
      toast.success("Win link copied — paste it anywhere")
    } catch {
      toast.error("Couldn't copy the link — copy it from the address bar instead")
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: headline, text: shareText, url: winUrl })
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${align === "center" ? "justify-center" : ""}`}
    >
      <button type="button" onClick={copyLink} className={pillClass}>
        <Copy size={12} />
        Copy link
      </button>
      <a href={xHref} target="_blank" rel="noopener noreferrer" className={pillClass}>
        Share on X
      </a>
      <a href={linkedInHref} target="_blank" rel="noopener noreferrer" className={pillClass}>
        LinkedIn
      </a>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={pillClass}>
          <Share2 size={12} />
          Share
        </button>
      )}
    </div>
  )
}
