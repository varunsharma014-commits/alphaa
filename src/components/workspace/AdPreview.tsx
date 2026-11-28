"use client"

import type { ReactNode } from "react"
import "./p3.css"

// How an ad will look where it runs: a Facebook & Instagram feed frame, a Google search result
// and a LinkedIn feed frame. Simple app-style frames, no copied logos. The page name and avatar
// come from the connected Facebook Page (else the business name): never a placeholder brand.

export type AdFrame = "meta" | "google" | "linkedin"

export function AdPreview({ frame, page, headline, primary, image, site, cta = "Learn more", footer }: {
  frame: AdFrame
  /** The advertiser name shown on the ad: the connected Page, else the business name. */
  page: string
  headline: string
  primary: string
  image?: string | null
  /** Display URL for the Google frame. */
  site?: string | null
  cta?: string
  footer?: ReactNode
}) {
  const initial = (page.match(/[A-Za-z0-9]/)?.[0] ?? "?").toUpperCase()
  if (frame === "google") {
    const host = (site ?? "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
    return (
      <div className="x3-ad x3-ad--g" aria-label="Google search ad preview">
        <div className="x3-ad__spon">Sponsored</div>
        <div className="x3-ad__gsite"><span className="x3-ad__fav" aria-hidden="true">{initial}</span><span><b>{page}</b>{host && <small>{host}</small>}</span></div>
        <div className="x3-ad__gt">{headline}</div>
        <p className="x3-ad__gd">{primary}</p>
        {footer && <div className="x3-ad__foot">{footer}</div>}
      </div>
    )
  }
  return (
    <div className={`x3-ad x3-ad--${frame}`} aria-label={frame === "meta" ? "Facebook and Instagram ad preview" : "LinkedIn ad preview"}>
      <div className="x3-ad__who">
        <span className="x3-ad__av" aria-hidden="true">{initial}</span>
        <span><b>{page}</b><small>{frame === "meta" ? "Sponsored" : "Promoted"}</small></span>
      </div>
      <p className="x3-ad__p">{primary}</p>
      {image ? <img className="x3-ad__img" src={image} alt="" loading="lazy" /> : null}
      <div className="x3-ad__bar">
        <b>{headline}</b>
        <span className="x3-ad__cta">{cta}</span>
      </div>
      {footer && <div className="x3-ad__foot">{footer}</div>}
    </div>
  )
}
