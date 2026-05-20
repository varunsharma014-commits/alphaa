"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { GlassCard } from "@/components/common/GlassCard"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { cn } from "@/lib/utils"

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
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    type = "text"
  ) {
    return (
      <div>
        <label className="block text-white text-sm font-medium mb-1.5">{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })) }}
          placeholder={placeholder}
          className={cn(
            "w-full bg-bg-tertiary border rounded-xl px-4 py-3 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-colors",
            errors[key] ? "border-red-500" : "border-white/10 focus:border-brand-orange"
          )}
        />
        {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
      </div>
    )
  }

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        {field("Business name", "businessName", "Downtown Dental, ABC Plumbing…")}
        {field("City", "city", "Austin, TX")}
        {field("Website URL", "websiteUrl", "yoursite.com (optional)")}
        {field("Your email", "email", "you@yourbusiness.com", "email")}
        <OrangePillButton
          type="submit"
          loading={loading}
          className="w-full justify-center mt-2"
          size="lg"
        >
          Scan my business →
        </OrangePillButton>
      </form>
    </GlassCard>
  )
}
