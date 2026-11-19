"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { track } from "@/lib/gtag"
import { fbTrack } from "@/lib/pixel"
import { NURTURE_EU_FINE, NURTURE_NOTICE, NURTURE_OPTIN_LABEL, visitorConsentRegion } from "@/lib/nurture-consent"

interface FormData {
  businessName: string
  city: string
  websiteUrl: string
  email: string
}

export function ScanForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ businessName: "", city: "", websiteUrl: "", email: "" })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [region, setRegion] = useState({ eu: false, de: false })
  const [optIn, setOptIn] = useState(false)
  useEffect(() => setRegion(visitorConsentRegion()), [])

  // Prefill the website URL when arriving from the hero scan field (/scan?url=…).
  // Read from window.location to avoid a useSearchParams Suspense boundary.
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get("url")
    if (url) setForm((f) => (f.websiteUrl ? f : { ...f, websiteUrl: url }))
  }, [])

  function validate() {
    const e: Partial<FormData> = {}
    if (!form.businessName.trim()) e.businessName = "Business name is required"
    if (!form.city.trim()) e.city = "City is required"
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required"
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    track("scan_started")
    // Email is captured at this submit — this is the lead moment Meta optimizes on.
    fbTrack("Lead")
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, nurture: { ...visitorConsentRegion(), optIn } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Scan failed")
      router.push(`/scan/results?id=${data.scanId}`)
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  function field(
    label: string,
    key: keyof FormData,
    placeholder: string,
    type = "text",
    hint?: string
  ) {
    return (
      <div className="sc3-field">
        <div className="sc3-field__top">
          <label>{label}</label>
          {hint && <span className="sc3-field__hint">{hint}</span>}
        </div>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })) }}
          placeholder={placeholder}
          className={cn("sc3-input", errors[key] && "sc3-input--bad")}
        />
        {errors[key] && <p className="sc3-err">{errors[key]}</p>}
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="sc3-form">
        {field("Business name", "businessName", "Downtown Dental, ABC Plumbing…")}
        {field("City", "city", "Austin, TX")}
        {field("Your email", "email", "you@yourbusiness.com", "email")}
        {field("Website URL", "websiteUrl", "yoursite.com", "text", "optional")}
        <button type="submit" disabled={loading} className="v3-btn">
          {loading ? <Spinner /> : "Get my free visibility score →"}
        </button>
        {region.eu && !region.de && (
          <label className="sc3-optin">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            <span>{NURTURE_OPTIN_LABEL}</span>
          </label>
        )}
        <p className="sc3-notice">
          {region.de ? "We’ll email your report. Unsubscribe anytime." : region.eu ? NURTURE_EU_FINE : NURTURE_NOTICE}
        </p>
      </form>
    </div>
  )
}

// Same spinner the old pill button showed while loading.
function Spinner() {
  return (
    <svg className="sc3-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
