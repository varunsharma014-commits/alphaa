"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Sparkles, ChevronRight, ChevronLeft, Check, Mail, Send } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { GlassCard } from "@/components/common/GlassCard"
import { BUSINESS_TYPES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface OnboardingData {
  businessType: string
  city: string
  state: string
  zip: string
  websiteUrl: string
  hasWebsite: boolean
  voiceDescription: string
  topicsToAvoid: string
  snippetAdded: boolean
}

const TOTAL_STEPS = 6

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    businessType: "",
    city: "",
    state: "",
    zip: "",
    websiteUrl: "",
    hasWebsite: true,
    voiceDescription: "",
    topicsToAvoid: "",
    snippetAdded: false,
  })

  function update(patch: Partial<OnboardingData>) {
    setData((d) => ({ ...d, ...patch }))
  }

  async function finish() {
    setLoading(true)
    try {
      const res = await fetch("/api/user/onboarding-complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      router.push("/dashboard")
    } catch {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const progress = ((step - 1) / TOTAL_STEPS) * 100

  return (
    <div className="radial-bg min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-brand-orange" />
        <span className="text-white font-semibold text-xl">alphaa</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted text-xs">Step {step} of {TOTAL_STEPS}</span>
          <span className="text-muted text-xs">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full">
          <div className="h-full bg-brand-orange rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        {step === 1 && <Step1 data={data} update={update} />}
        {step === 2 && <Step2 data={data} update={update} />}
        {step === 3 && <Step3 data={data} update={update} />}
        {step === 4 && <Step4 data={data} update={update} />}
        {step === 5 && <Step5 data={data} update={update} />}
        {step === 6 && <Step6 />}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-4 mt-8">
        {step > 1 && step < 6 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn-ghost px-5 py-2.5 text-sm flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step < TOTAL_STEPS && (
          <OrangePillButton onClick={() => setStep((s) => s + 1)} size="md">
            Continue <ChevronRight className="w-4 h-4" />
          </OrangePillButton>
        )}
        {step === TOTAL_STEPS && (
          <OrangePillButton onClick={finish} loading={loading} size="md">
            Go to my dashboard →
          </OrangePillButton>
        )}
      </div>
    </div>
  )
}

function Step1({ data, update }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void }) {
  return (
    <GlassCard>
      <h2 className="text-white font-semibold text-xl mb-1">What kind of business do you run?</h2>
      <p className="text-muted text-sm mb-5">We use this to customize your content and audit.</p>
      <div className="grid grid-cols-2 gap-2">
        {BUSINESS_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => update({ businessType: type })}
            className={cn(
              "p-3 rounded-xl text-sm text-left transition-all border",
              data.businessType === type
                ? "bg-brand-orange/20 border-brand-orange text-white"
                : "bg-white/[0.03] border-white/[0.08] text-muted hover:text-white hover:border-white/20"
            )}
          >
            {type}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

function Step2({ data, update }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void }) {
  return (
    <GlassCard>
      <h2 className="text-white font-semibold text-xl mb-1">Where is your business located?</h2>
      <p className="text-muted text-sm mb-5">We use this to target local searches in your area.</p>
      <div className="space-y-4">
        <input placeholder="City" value={data.city} onChange={(e) => update({ city: e.target.value })} className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="State" value={data.state} onChange={(e) => update({ state: e.target.value })} className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
          <input placeholder="ZIP" value={data.zip} onChange={(e) => update({ zip: e.target.value })} className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
        </div>
      </div>
    </GlassCard>
  )
}

function Step3({ data, update }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void }) {
  return (
    <GlassCard>
      <h2 className="text-white font-semibold text-xl mb-1">What's your website?</h2>
      <p className="text-muted text-sm mb-5">We'll audit it and use it to generate content.</p>
      <div className="space-y-3">
        <input
          placeholder="https://yoursite.com"
          value={data.websiteUrl}
          onChange={(e) => update({ websiteUrl: e.target.value, hasWebsite: true })}
          disabled={!data.hasWebsite}
          className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange disabled:opacity-50"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => update({ hasWebsite: !data.hasWebsite, websiteUrl: "" })}
            className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", !data.hasWebsite ? "bg-brand-orange border-brand-orange" : "border-white/20")}
          >
            {!data.hasWebsite && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-muted text-sm">I don't have a website yet</span>
        </label>
      </div>
    </GlassCard>
  )
}

function Step4({ data, update }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void }) {
  const { user } = useUser()
  const [showEmail, setShowEmail] = useState(false)
  const [devEmail, setDevEmail] = useState("")
  const snippet = `<script async src="https://cdn.alphaa.app/tag.js?id=${user?.id ?? ''}"></script>`

  function sendTodev() {
    if (!devEmail) return
    const subject = encodeURIComponent("Quick task: Add one snippet to our website (2 min)")
    const body = encodeURIComponent(
      `Hi,\n\nCan you add this snippet to our website before the </head> tag? It takes about 2 minutes.\n\n${snippet}\n\nJust paste it before the closing </head> tag on every page (or in the site-wide header template).\n\nThanks!`
    )
    window.open(`mailto:${devEmail}?subject=${subject}&body=${body}`)
    toast.success("Email client opened!")
    update({ snippetAdded: true })
  }

  return (
    <GlassCard>
      <h2 className="text-white font-semibold text-xl mb-1">Add Alphaa to your website</h2>
      <p className="text-muted text-sm mb-5">
        Paste this one snippet before your &lt;/head&gt; tag. Works on any website — or forward it to your developer in one click.
      </p>

      {/* Snippet block */}
      <div className="bg-bg-primary rounded-xl p-4 border border-white/[0.08] mb-4">
        <code className="text-brand-orange text-xs font-mono break-all">{snippet}</code>
      </div>

      {/* Primary: copy */}
      <button
        onClick={() => { navigator.clipboard.writeText(snippet); update({ snippetAdded: true }); toast.success("Copied to clipboard!") }}
        className="btn-ghost w-full py-2.5 text-sm mb-3"
      >
        Copy snippet
      </button>

      {/* Secondary: email to developer */}
      {!showEmail ? (
        <button
          onClick={() => setShowEmail(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted hover:text-white border border-white/[0.08] hover:border-white/20 rounded-full transition-colors mb-3"
        >
          <Mail className="w-4 h-4" />
          Email to my developer
        </button>
      ) : (
        <div className="mb-3 space-y-2">
          <p className="text-muted text-xs text-center">Enter your developer&apos;s email — we&apos;ll pre-write the whole message.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="developer@yourcompany.com"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTodev()}
              autoFocus
              className="flex-1 bg-bg-tertiary border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
            <button
              onClick={sendTodev}
              disabled={!devEmail}
              className="bg-brand-orange hover:bg-brand-orange-light disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
          <button onClick={() => setShowEmail(false)} className="text-muted/50 text-xs hover:text-muted transition-colors block text-center w-full">
            Cancel
          </button>
        </div>
      )}

      {/* Skip */}
      <button
        onClick={() => update({ snippetAdded: true })}
        className="text-muted text-sm hover:text-white transition-colors block text-center w-full"
      >
        I&apos;ll add this later →
      </button>
    </GlassCard>
  )
}

function Step5({ data, update }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void }) {
  return (
    <GlassCard>
      <h2 className="text-white font-semibold text-xl mb-1">Tell us about your business</h2>
      <p className="text-muted text-sm mb-5">We use this to write content in your voice, not generic AI copy.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-white text-sm font-medium mb-1.5">What makes your business different?</label>
          <textarea
            value={data.voiceDescription}
            onChange={(e) => update({ voiceDescription: e.target.value })}
            placeholder="We're a family-owned practice focused on gentle, judgment-free care. 15 years in Austin. Patients often mention our friendly staff and no-wait appointments."
            rows={4}
            className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
          />
        </div>
        <div>
          <label className="block text-white text-sm font-medium mb-1.5">Any topics to avoid? <span className="text-muted font-normal">(optional)</span></label>
          <textarea
            value={data.topicsToAvoid}
            onChange={(e) => update({ topicsToAvoid: e.target.value })}
            placeholder="Don't mention pricing. Avoid comparing us to specific competitors by name."
            rows={2}
            className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
          />
        </div>
      </div>
    </GlassCard>
  )
}

function Step6() {
  return (
    <GlassCard className="text-center py-10">
      <div className="w-16 h-16 rounded-full bg-brand-orange/20 flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-brand-orange" />
      </div>
      <h2 className="text-white font-semibold text-2xl mb-3">You're all set.</h2>
      <p className="text-muted text-base mb-2">We're running your first audit and preparing your dashboard.</p>
      <p className="text-muted/60 text-sm">Your first Google Business Profile post goes out within 24 hours.</p>
    </GlassCard>
  )
}
