"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

// GDPR / UK GDPR / UAE PDPL cookie choice. Shown when the inline script in
// the root layout set window.__ccNeed (a visitor in Europe or the UAE, or on
// /uk /de /fr /it /ae, who hasn't chosen yet), and whenever the footer's
// "Cookie settings" link fires OPEN_EVENT. Reject is as easy as Accept.
// Accept loads GA and the Meta Pixel (window.__alphaaGA / __alphaaPixel from
// the root layout). Reject stores "denied", which keeps both unloaded on every
// later page load (for any visitor), and revokes them for the current page.
export const OPEN_EVENT = "alphaa:cookie-settings"

const COPY: Record<string, { text: string; accept: string; reject: string; more: string }> = {
  en: { text: "We use cookies to measure visits and our ads. Nothing is set until you choose.", accept: "Accept", reject: "Reject", more: "Privacy" },
  de: { text: "Wir verwenden Cookies, um Besuche und unsere Anzeigen zu messen. Erst nach Ihrer Wahl wird etwas gespeichert.", accept: "Akzeptieren", reject: "Ablehnen", more: "Datenschutz" },
  fr: { text: "Nous utilisons des cookies pour mesurer les visites et nos publicités. Rien n’est déposé avant votre choix.", accept: "Accepter", reject: "Refuser", more: "Confidentialité" },
  it: { text: "Usiamo i cookie per misurare le visite e i nostri annunci. Nulla viene salvato prima della tua scelta.", accept: "Accetta", reject: "Rifiuta", more: "Privacy" },
  ar: { text: "نستخدم ملفات تعريف الارتباط لقياس الزيارات وإعلاناتنا. لا يُحفظ أي شيء قبل أن تختار.", accept: "قبول", reject: "رفض", more: "الخصوصية" },
}

type W = Window & {
  __ccNeed?: boolean
  __ccDenied?: boolean
  dataLayer?: unknown[]
  fbq?: (...a: unknown[]) => void
  __alphaaPixel?: () => void
  __alphaaGA?: () => void
}

function pageLang(): string {
  const parts = window.location.pathname.split("/")
  if (parts[1] === "ae" && parts[2] === "ar") return "ar"
  return COPY[parts[1]] ? parts[1] : "en"
}

export function ConsentBanner() {
  const [show, setShow] = useState(false)
  const [lang, setLang] = useState("en")

  useEffect(() => {
    const w = window as W
    const open = () => {
      setLang(pageLang())
      setShow(true)
    }
    if (w.__ccNeed) open()
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  function choose(granted: boolean) {
    const w = window as W
    try {
      localStorage.setItem("alphaa.consent", granted ? "granted" : "denied")
    } catch {
      // storage blocked: the choice holds for this page view only
    }
    w.__ccNeed = false
    w.__ccDenied = !granted
    w.dataLayer = w.dataLayer || []
    const v = granted ? "granted" : "denied"
    // gtag reads Arguments objects; push the same shape gtag() would.
    ;(function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments)
    })("consent", "update", { ad_storage: v, analytics_storage: v, ad_user_data: v, ad_personalization: v })
    if (granted) {
      // GA and the Meta Pixel load only now (see the root layout).
      if (typeof w.__alphaaGA === "function") w.__alphaaGA()
      if (typeof w.__alphaaPixel === "function") w.__alphaaPixel()
    } else if (typeof w.fbq === "function") {
      // Already loaded earlier on this page: stop it sending anything more.
      w.fbq("consent", "revoke")
    }
    setShow(false)
  }

  if (!show) return null
  const t = COPY[lang]
  const rtl = lang === "ar"
  return (
    <div className="cc" role="dialog" aria-live="polite" aria-label="Cookies" dir={rtl ? "rtl" : undefined} lang={rtl ? "ar" : undefined}>
      <p>
        {t.text} <Link href="/privacy">{t.more}</Link>
      </p>
      <div className="cc__btns">
        <button type="button" onClick={() => choose(false)}>{t.reject}</button>
        <button type="button" onClick={() => choose(true)}>{t.accept}</button>
      </div>
    </div>
  )
}
