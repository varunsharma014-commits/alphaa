"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

// GDPR / UK GDPR cookie choice. Shown only when the inline script in the root
// layout set window.__ccNeed (a visitor in Europe, or on /uk /de /fr /it, who
// hasn't chosen yet). Reject is as easy as Accept.
const COPY: Record<string, { text: string; accept: string; reject: string; more: string }> = {
  en: { text: "We use cookies to measure visits and our ads. Nothing is set until you choose.", accept: "Accept", reject: "Reject", more: "Privacy" },
  de: { text: "Wir verwenden Cookies, um Besuche und unsere Anzeigen zu messen. Erst nach Ihrer Wahl wird etwas gespeichert.", accept: "Akzeptieren", reject: "Ablehnen", more: "Datenschutz" },
  fr: { text: "Nous utilisons des cookies pour mesurer les visites et nos publicités. Rien n’est déposé avant votre choix.", accept: "Accepter", reject: "Refuser", more: "Confidentialité" },
  it: { text: "Usiamo i cookie per misurare le visite e i nostri annunci. Nulla viene salvato prima della tua scelta.", accept: "Accetta", reject: "Rifiuta", more: "Privacy" },
}

type W = Window & {
  __ccNeed?: boolean
  __ccDenied?: boolean
  dataLayer?: unknown[]
  fbq?: (...a: unknown[]) => void
}

export function ConsentBanner() {
  const [show, setShow] = useState(false)
  const [lang, setLang] = useState("en")

  useEffect(() => {
    const w = window as W
    if (!w.__ccNeed) return
    const seg = window.location.pathname.split("/")[1]
    setLang(COPY[seg] ? seg : "en")
    setShow(true)
  }, [])

  function choose(granted: boolean) {
    const w = window as W
    try {
      localStorage.setItem("alphaa.consent", granted ? "granted" : "denied")
    } catch {
      // storage blocked: the choice holds for this page view only
    }
    if (granted) {
      w.__ccDenied = false
      w.dataLayer = w.dataLayer || []
      // gtag reads Arguments objects; push the same shape gtag() would.
      ;(function gtag(..._args: unknown[]) {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments)
      })("consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" })
      if (typeof w.fbq === "function") w.fbq("consent", "grant")
    }
    setShow(false)
  }

  if (!show) return null
  const t = COPY[lang]
  return (
    <div className="cc" role="dialog" aria-live="polite" aria-label="Cookies">
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
