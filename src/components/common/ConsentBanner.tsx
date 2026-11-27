"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

// Cookie choices by region. The region and the Consent Mode defaults are set before anything
// loads by the inline script in the root layout (lib/consent-script.ts -> window.__cc).
//  - Opt-in regions (EU/EEA, UK, CH, UAE, Quebec, unknown): the Accept / Reject banner, shown
//    until the visitor chooses. Reject is as easy as Accept.
//  - Canada outside Quebec: a small, dismissible, non-blocking notice on the first visit. Where
//    the province can't be told (America/Toronto), ads stay off until the visitor dismisses it
//    or moves to another page.
//  - United States: nothing on screen. Ads honour Global Privacy Control.
// Footer links: "Cookie settings" (OPEN_EVENT) reopens the Accept / Reject banner anywhere;
// "Your privacy choices" (PRIVACY_EVENT) opens the ad-cookie opt-out (CCPA/CPRA "sale/sharing").
// Accept loads GA and the Meta Pixel (window.__alphaaGA / __alphaaPixel from the root layout).
export const OPEN_EVENT = "alphaa:cookie-settings"
export const PRIVACY_EVENT = "alphaa:privacy-choices"

const COPY: Record<string, { text: string; accept: string; reject: string; more: string }> = {
  en: { text: "We use cookies to measure visits and our ads. Nothing is set until you choose.", accept: "Accept", reject: "Reject", more: "Privacy" },
  de: { text: "Wir verwenden Cookies, um Besuche und unsere Anzeigen zu messen. Erst nach Ihrer Wahl wird etwas gespeichert.", accept: "Akzeptieren", reject: "Ablehnen", more: "Datenschutz" },
  fr: { text: "Nous utilisons des cookies pour mesurer les visites et nos publicités. Rien n’est déposé avant votre choix.", accept: "Accepter", reject: "Refuser", more: "Confidentialité" },
  it: { text: "Usiamo i cookie per misurare le visite e i nostri annunci. Nulla viene salvato prima della tua scelta.", accept: "Accetta", reject: "Rifiuta", more: "Privacy" },
  ar: { text: "نستخدم ملفات تعريف الارتباط لقياس الزيارات وإعلاناتنا. لا يُحفظ أي شيء قبل أن تختار.", accept: "قبول", reject: "رفض", more: "سياسة الخصوصية (بالإنجليزية)" },
}

type CC = { region: string; a: boolean; ad: boolean; gpc: boolean; optout: boolean; need: boolean; notice: boolean }
type W = Window & {
  __cc?: CC
  dataLayer?: unknown[]
  fbq?: (...a: unknown[]) => void
  __alphaaPixel?: () => void
  __alphaaGA?: () => void
}

const put = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    // storage blocked: the choice holds for this page view only
  }
}
// Mirror of the visitor's choice the server can read (a preference cookie, strictly necessary).
const mirror = (v: "granted" | "denied" | "optout" | null) => {
  document.cookie = v ? `alphaa_consent=${v}; path=/; max-age=31536000; samesite=lax` : "alphaa_consent=; path=/; max-age=0; samesite=lax"
}

function gtagConsent(update: Record<string, "granted" | "denied">) {
  const w = window as W
  w.dataLayer = w.dataLayer || []
  // gtag reads Arguments objects; push the same shape gtag() would.
  ;(function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  })("consent", "update", update)
}

/** Turn ad cookies on or off for this page (GPC and the opt-out always win). */
function setAds(on: boolean) {
  const w = window as W
  const cc = w.__cc
  const allowed = on && !cc?.gpc && !cc?.optout
  if (cc) cc.ad = allowed
  const v = allowed ? "granted" : "denied"
  gtagConsent({ ad_storage: v, ad_user_data: v, ad_personalization: v })
  if (allowed) w.__alphaaPixel?.()
  else w.fbq?.("consent", "revoke")
}

function pageLang(region?: string): string {
  const parts = window.location.pathname.split("/")
  if (parts[1] === "ae" && parts[2] === "ar") return "ar"
  if (COPY[parts[1]]) return parts[1]
  // Quebec visitors with a French browser get the banner in French on the English pages.
  if (region === "qc" && /^fr/i.test(navigator.language || "")) return "fr"
  return "en"
}

export function ConsentBanner() {
  const [show, setShow] = useState(false)
  const [notice, setNotice] = useState(false)
  const [choices, setChoices] = useState(false)
  const [optedOut, setOptedOut] = useState(false)
  const [gpc, setGpc] = useState(false)
  const [lang, setLang] = useState("en")
  const path = usePathname()
  const firstPath = useRef<string | null>(null)

  useEffect(() => {
    const w = window as W
    const cc = w.__cc
    const open = () => {
      setLang(pageLang(w.__cc?.region))
      setNotice(false)
      setShow(true)
    }
    const openChoices = () => {
      setOptedOut(!!w.__cc?.optout)
      setGpc(!!w.__cc?.gpc)
      setChoices(true)
    }
    if (cc?.need) open()
    else if (cc?.notice) setNotice(true)
    window.addEventListener(OPEN_EVENT, open)
    window.addEventListener(PRIVACY_EVENT, openChoices)
    return () => {
      window.removeEventListener(OPEN_EVENT, open)
      window.removeEventListener(PRIVACY_EVENT, openChoices)
    }
  }, [])

  // Canada, province unknown: moving to another page counts as continuing to browse.
  useEffect(() => {
    if (firstPath.current === null) { firstPath.current = path; return }
    const cc = (window as W).__cc
    if (path !== firstPath.current && cc?.region === "ca-east" && cc.notice && !cc.ad) {
      cc.notice = false
      put("alphaa.notice", "1")
      setAds(true)
    }
  }, [path])

  function choose(granted: boolean) {
    const w = window as W
    put("alphaa.consent", granted ? "granted" : "denied")
    if (granted) put("alphaa.adOptOut", null)
    mirror(granted ? "granted" : "denied")
    if (w.__cc) { w.__cc.need = false; w.__cc.a = granted; if (granted) w.__cc.optout = false }
    gtagConsent({ analytics_storage: granted ? "granted" : "denied" })
    if (granted) w.__alphaaGA?.()
    setAds(granted)
    setShow(false)
  }

  function dismissNotice() {
    const cc = (window as W).__cc
    put("alphaa.notice", "1")
    if (cc) cc.notice = false
    // Canada: dismissing the notice is the go-ahead for ads where we held them back.
    if (cc && !cc.ad) setAds(true)
    setNotice(false)
  }

  function setOptOut(out: boolean) {
    const w = window as W
    put("alphaa.adOptOut", out ? "1" : null)
    mirror(out ? "optout" : null)
    if (w.__cc) w.__cc.optout = out
    setOptedOut(out)
    if (out) setAds(false)
    else {
      // Back on only where ads would be on for this visitor anyway.
      const cc = w.__cc
      let stored: string | null = null
      try { stored = localStorage.getItem("alphaa.consent") } catch {}
      const base = stored === "granted" || (stored !== "denied" && (cc?.region === "us" || cc?.region === "ca" || (cc?.region === "ca-east" && !cc.notice)))
      if (base) setAds(true)
    }
  }

  return (
    <>
      {show && (() => {
        const t = COPY[lang]
        const rtl = lang === "ar"
        return (
          <div className="cc" role="dialog" aria-live="polite" aria-label="Cookies" dir={rtl ? "rtl" : undefined} lang={rtl ? "ar" : lang}>
            <p>
              {t.text} <Link href="/privacy#cookies" hrefLang="en">{t.more}</Link>
            </p>
            <div className="cc__btns">
              <button type="button" onClick={() => choose(false)}>{t.reject}</button>
              <button type="button" onClick={() => choose(true)}>{t.accept}</button>
            </div>
          </div>
        )
      })()}

      {notice && !show && (
        <div className="cc cc--notice" role="region" aria-label="Cookie notice">
          <p>
            We use cookies for analytics and ads.{" "}
            <button type="button" className="cc__link" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>Choices</button>
            {" · "}
            <Link href="/privacy#cookies">Privacy</Link>
          </p>
          <button type="button" className="cc__x" aria-label="Dismiss cookie notice" onClick={dismissNotice}>✕</button>
        </div>
      )}

      {choices && (
        <div className="cc cc--choices" role="dialog" aria-modal="false" aria-labelledby="cc-choices-h">
          <div>
            <p id="cc-choices-h" className="cc__h">Your privacy choices</p>
            {gpc ? (
              <p>Your browser’s Global Privacy Control signal is on, so ad cookies (Google Ads and the Meta Pixel) are off for you. We don’t sell your personal information.</p>
            ) : optedOut ? (
              <p>You’ve opted out of ad cookies. We won’t use the Meta Pixel or Google ad cookies on this browser. Analytics still counts visits.</p>
            ) : (
              <p>We use Google and Meta ad cookies to measure and show our ads, which some US state laws call “sharing”. You can opt out here; we also honour a browser’s Global Privacy Control signal. <Link href="/privacy#cookies">Details</Link></p>
            )}
          </div>
          <div className="cc__btns">
            <button type="button" onClick={() => setChoices(false)}>Close</button>
            {!gpc && (optedOut
              ? <button type="button" onClick={() => setOptOut(false)}>Allow ad cookies</button>
              : <button type="button" onClick={() => setOptOut(true)}>Opt out of ad cookies</button>)}
          </div>
        </div>
      )}
    </>
  )
}
