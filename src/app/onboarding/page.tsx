"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Check, Sparkles, Loader2, Wand2, ChevronDown } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ConversionTracker } from "@/components/common/ConversionTracker"
import { GlassCard } from "@/components/common/GlassCard"
import { BUSINESS_TYPES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingData {
  businessName: string
  businessType: string
  city: string
  state: string
  zip: string
  websiteUrl: string
  hasWebsite: boolean
  voiceDescription: string
  topicsToAvoid: string
}

interface GoogleProperties {
  gaProperties: { id: string; name: string }[]
  gscSites: string[]
  gmbLocations: {
    accountId: string
    locationId: string
    locationName: string
    address: string
  }[]
}

type GoogleStatus = "idle" | "connecting" | "finalizing" | "picker" | "done"

interface ProgressProfile {
  businessName: string
  businessType: string
  city: string
  state: string
  zip: string
  websiteUrl: string
  voiceDescription: string
  topicsToAvoid: string
}

interface MatchedNames {
  gbp?: string
  gsc?: string
  ga?: string
}

const TOTAL_STEPS = 4

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDomain(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
}

function siteMatchesDomain(site: string, domain: string): boolean {
  if (!domain) return false
  if (site.toLowerCase().startsWith("sc-domain:")) {
    const d = site.slice("sc-domain:".length).toLowerCase().replace(/^www\./, "")
    return d === domain || domain.endsWith(`.${d}`) || d.endsWith(`.${domain}`)
  }
  return normalizeDomain(site) === domain
}

const inputClass =
  "w-full bg-bg-tertiary border border-line/10 rounded-xl px-4 py-3 text-fg placeholder:text-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiPrefilled, setAiPrefilled] = useState(false)
  const analyzeCalledRef = useRef(false)
  const kickoffRef = useRef(false)

  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    businessType: "",
    city: "",
    state: "",
    zip: "",
    websiteUrl: "",
    hasWebsite: true,
    voiceDescription: "",
    topicsToAvoid: "",
  })

  // Google connect state (step 3)
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>("idle")
  const [matched, setMatched] = useState<MatchedNames>({})
  const [properties, setProperties] = useState<GoogleProperties | null>(null)
  const [ambiguous, setAmbiguous] = useState({ gbp: false, gsc: false, ga: false })
  const [pickGmb, setPickGmb] = useState("")
  const [pickGsc, setPickGsc] = useState("")
  const [pickGa, setPickGa] = useState("")
  const [savingPicks, setSavingPicks] = useState(false)

  // First-value screen checklist (step 4)
  const [checkedCount, setCheckedCount] = useState(0)

  function update(patch: Partial<OnboardingData>) {
    setData((d) => ({ ...d, ...patch }))
  }

  // ── Persist progress server-side (survives the Google redirect) ────────────
  function saveProgress(snapshot: OnboardingData, stepNum: number) {
    return fetch("/api/user/onboarding-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: snapshot.businessName,
        businessType: snapshot.businessType,
        city: snapshot.city,
        state: snapshot.state,
        zip: snapshot.zip,
        websiteUrl: snapshot.hasWebsite ? snapshot.websiteUrl : "",
        voiceDescription: snapshot.voiceDescription,
        topicsToAvoid: snapshot.topicsToAvoid,
        onboardingStep: stepNum,
      }),
    })
  }

  // ── Auto-select Google properties after OAuth return ───────────────────────
  const autoSelectProperties = useCallback(
    async (websiteUrl: string, businessName: string) => {
      try {
        const res = await fetch("/api/integrations/google/properties")
        if (!res.ok) throw new Error("props")
        const props = (await res.json()) as GoogleProperties

        const domain = normalizeDomain(websiteUrl || "")
        const bizName = businessName.toLowerCase().trim()

        // Google search data — match by website domain
        let gsc: string | undefined
        const gscMatches = props.gscSites.filter((s) => siteMatchesDomain(s, domain))
        if (gscMatches.length >= 1) gsc = gscMatches[0]
        else if (props.gscSites.length === 1) gsc = props.gscSites[0]

        // Website stats — exactly one, or a unique business-name match
        let ga: { id: string; name: string } | undefined
        if (props.gaProperties.length === 1) ga = props.gaProperties[0]
        else if (bizName) {
          const m = props.gaProperties.filter((p) => p.name.toLowerCase().includes(bizName))
          if (m.length === 1) ga = m[0]
        }

        // Business Profile — exactly one, or a unique business-name match
        let gmb: GoogleProperties["gmbLocations"][number] | undefined
        if (props.gmbLocations.length === 1) gmb = props.gmbLocations[0]
        else if (bizName) {
          const m = props.gmbLocations.filter((l) => l.locationName.toLowerCase().includes(bizName))
          if (m.length === 1) gmb = m[0]
        }

        if (gsc || ga || gmb) {
          await fetch("/api/integrations/google/save-properties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gscSiteUrl: gsc,
              gaPropertyId: ga?.id,
              gaPropertyName: ga?.name,
              gmbAccountId: gmb?.accountId,
              gmbLocationId: gmb?.locationId,
              gmbLocationName: gmb?.locationName,
            }),
          }).catch(() => {})
        }

        setMatched({ gsc, ga: ga?.name, gbp: gmb?.locationName })

        const amb = {
          gsc: !gsc && props.gscSites.length >= 2,
          ga: !ga && props.gaProperties.length >= 2,
          gbp: !gmb && props.gmbLocations.length >= 2,
        }
        if (amb.gsc || amb.ga || amb.gbp) {
          setProperties(props)
          setAmbiguous(amb)
          setGoogleStatus("picker")
        } else {
          setGoogleStatus("done")
        }
      } catch {
        // Connection itself succeeded — alphaa can finish matching later.
        setMatched({})
        setGoogleStatus("done")
      }
    },
    [],
  )

  // ── Mount: rehydrate saved progress + handle OAuth return ──────────────────
  useEffect(() => {
    let cancelled = false
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const justConnected = params.get("connected") === "true"
      const oauthError = params.get("error")

      let profile: ProgressProfile | null = null

      try {
        const res = await fetch("/api/user/onboarding-progress")
        if (res.ok) profile = ((await res.json()) as { profile: ProgressProfile | null }).profile
      } catch {
        // no saved progress — start fresh
      }
      if (cancelled) return

      if (profile) {
        const p = profile
        setData((d) => ({
          ...d,
          businessName: p.businessName || d.businessName,
          businessType: p.businessType || d.businessType,
          city: p.city || d.city,
          state: p.state || d.state,
          zip: p.zip || d.zip,
          websiteUrl: p.websiteUrl || d.websiteUrl,
          hasWebsite: p.websiteUrl ? true : d.hasWebsite,
          voiceDescription: p.voiceDescription || d.voiceDescription,
          topicsToAvoid: p.topicsToAvoid || d.topicsToAvoid,
        }))
      }

      if (justConnected || oauthError) {
        setStep(3)
        window.history.replaceState({}, "", "/onboarding")
      }
      if (oauthError) {
        toast.error("The Google connection did not finish. No problem — just try again below.")
      }
      if (justConnected) {
        setGoogleStatus("finalizing")
        autoSelectProperties(profile?.websiteUrl ?? "", profile?.businessName ?? "")
      }
    }
    init()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Website analysis (fires when leaving step 1 with a URL) ────────────────
  async function analyzeWebsite(url: string) {
    if (!url || analyzeCalledRef.current) return
    analyzeCalledRef.current = true
    setAiAnalyzing(true)
    try {
      const res = await fetch("/api/onboarding/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: url }),
      })
      if (!res.ok) return
      const { analysis } = (await res.json()) as {
        analysis?: {
          businessName?: string
          businessType?: string
          city?: string
          state?: string
          voiceDescription?: string
          topicsToAvoid?: string
        }
      }
      if (!analysis) return

      // Only fill fields the user has not already typed into
      setData((d) => ({
        ...d,
        businessName: d.businessName || analysis.businessName || "",
        businessType: d.businessType || analysis.businessType || "",
        city: d.city || analysis.city || "",
        state: d.state || analysis.state || "",
        voiceDescription: d.voiceDescription || analysis.voiceDescription || "",
        topicsToAvoid: d.topicsToAvoid || analysis.topicsToAvoid || "",
      }))
      setAiPrefilled(true)
    } catch {
      // Silent fail — user can fill everything in by hand
    } finally {
      setAiAnalyzing(false)
    }
  }

  // ── Step navigation ─────────────────────────────────────────────────────────
  function handleContinueStep1() {
    if (data.hasWebsite) {
      if (!data.websiteUrl.trim() || !data.websiteUrl.includes(".")) {
        toast.error("Enter your website address, or check the box if you do not have one yet.")
        return
      }
      analyzeWebsite(data.websiteUrl)
    } else if (!data.businessType) {
      toast.error("Pick the option that best describes your business.")
      return
    }
    setStep(2)
    saveProgress(data, 2).catch(() => {})
  }

  function handleContinueStep2() {
    if (!data.businessType) {
      toast.error("Pick the option that best describes your business.")
      return
    }
    setStep(3)
    saveProgress(data, 3).catch(() => {})
  }

  // ── Google connect ──────────────────────────────────────────────────────────
  async function handleConnectGoogle() {
    setGoogleStatus("connecting")
    try {
      // Persist everything first — this page reloads when Google sends us back.
      await saveProgress(data, 3)
      const res = await fetch("/api/integrations/google/connect?returnTo=onboarding")
      if (!res.ok) throw new Error("connect")
      const { authUrl } = (await res.json()) as { authUrl: string }
      window.location.href = authUrl
    } catch {
      toast.error("We could not open the Google sign-in screen. Please try again in a moment.")
      setGoogleStatus("idle")
    }
  }

  function handleSkipGoogle() {
    setStep(4)
    saveProgress(data, 4).catch(() => {})
  }

  async function handleSavePicks() {
    setSavingPicks(true)
    try {
      const gmb = properties?.gmbLocations.find((l) => l.locationId === pickGmb)
      const ga = properties?.gaProperties.find((p) => p.id === pickGa)
      await fetch("/api/integrations/google/save-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gscSiteUrl: pickGsc || undefined,
          gaPropertyId: ga?.id,
          gaPropertyName: ga?.name,
          gmbAccountId: gmb?.accountId,
          gmbLocationId: gmb?.locationId,
          gmbLocationName: gmb?.locationName,
        }),
      })
      setMatched((m) => ({
        gbp: m.gbp ?? gmb?.locationName,
        gsc: m.gsc ?? (pickGsc || undefined),
        ga: m.ga ?? ga?.name,
      }))
      setGoogleStatus("done")
    } catch {
      toast.error("We could not save that just now. Please try again.")
    } finally {
      setSavingPicks(false)
    }
  }

  // ── Step 4: kick off first work + animated checklist ───────────────────────
  useEffect(() => {
    if (step !== 4 || kickoffRef.current) return
    kickoffRef.current = true

    // Fire-and-forget: alphaa starts working immediately
    fetch("/api/dashboard/scan", { method: "POST" }).catch(() => {})
    if (data.hasWebsite && data.websiteUrl) {
      fetch("/api/crawl", { method: "POST" }).catch(() => {})
    }

    const timers = [1, 2, 3, 4].map((i) => setTimeout(() => setCheckedCount(i), i * 1800))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  async function finish() {
    setLoading(true)
    try {
      const res = await fetch("/api/user/onboarding-complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: data.businessType,
          city: data.city,
          state: data.state,
          zip: data.zip,
          websiteUrl: data.hasWebsite ? data.websiteUrl : "",
          voiceDescription: data.voiceDescription,
          topicsToAvoid: data.topicsToAvoid,
          snippetAdded: false,
        }),
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
      {/* GA4: onboarding mount = a completed signup */}
      <ConversionTracker event="sign_up" />
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-brand-orange" />
        <span className="text-fg font-semibold text-xl">alphaa</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted text-xs">Step {step} of {TOTAL_STEPS}</span>
          <span className="text-muted text-xs">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1 bg-fg/5 rounded-full">
          <div
            className="h-full bg-brand-orange rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        {step === 1 && <StepWebsite data={data} update={update} />}
        {step === 2 && (
          <StepConfirm data={data} update={update} aiAnalyzing={aiAnalyzing} aiPrefilled={aiPrefilled} />
        )}
        {step === 3 && (
          <StepGoogle
            status={googleStatus}
            matched={matched}
            properties={properties}
            ambiguous={ambiguous}
            pickGmb={pickGmb}
            pickGsc={pickGsc}
            pickGa={pickGa}
            setPickGmb={setPickGmb}
            setPickGsc={setPickGsc}
            setPickGa={setPickGa}
            savingPicks={savingPicks}
            onConnect={handleConnectGoogle}
            onSkip={handleSkipGoogle}
            onSavePicks={handleSavePicks}
          />
        )}
        {step === 4 && <StepWorking checkedCount={checkedCount} googleConnected={googleStatus === "done"} />}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-4 mt-8">
        {(step === 2 || step === 3) && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="btn-ghost px-5 py-2.5 text-sm flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step === 1 && (
          <OrangePillButton onClick={handleContinueStep1} size="md">
            Continue <ChevronRight className="w-4 h-4" />
          </OrangePillButton>
        )}
        {step === 2 && (
          <OrangePillButton onClick={handleContinueStep2} size="md">
            Continue <ChevronRight className="w-4 h-4" />
          </OrangePillButton>
        )}
        {step === 3 && googleStatus === "done" && (
          <OrangePillButton onClick={handleSkipGoogle} size="md">
            Continue <ChevronRight className="w-4 h-4" />
          </OrangePillButton>
        )}
        {step === 4 && (
          <OrangePillButton onClick={finish} loading={loading} size="md">
            Go to my dashboard →
          </OrangePillButton>
        )}
      </div>
    </div>
  )
}

// ─── Shared: compact business type grid ─────────────────────────────────────

function BusinessTypeGrid({
  value,
  onChange,
  compact = false,
}: {
  value: string
  onChange: (type: string) => void
  compact?: boolean
}) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2")}>
      {BUSINESS_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={cn(
            "rounded-xl text-left transition-all border",
            compact ? "px-2.5 py-2 text-xs" : "p-3 text-sm",
            value === type
              ? "bg-brand-orange/20 border-brand-orange text-fg"
              : "bg-fg/[0.03] border-line/[0.08] text-muted hover:text-fg hover:border-line/20",
          )}
        >
          {type}
        </button>
      ))}
    </div>
  )
}

// ─── Step 1: What's your website? ────────────────────────────────────────────

function StepWebsite({
  data,
  update,
}: {
  data: OnboardingData
  update: (p: Partial<OnboardingData>) => void
}) {
  return (
    <GlassCard>
      <h2 className="text-fg font-semibold text-xl mb-1">What&apos;s your website?</h2>
      <p className="text-muted text-sm mb-5">
        alphaa reads it and fills in the rest for you — no forms to slog through.
      </p>
      <div className="space-y-3">
        <input
          placeholder="yourbusiness.com"
          value={data.websiteUrl}
          onChange={(e) => update({ websiteUrl: e.target.value, hasWebsite: true })}
          disabled={!data.hasWebsite}
          autoFocus
          className={cn(inputClass, "disabled:opacity-50")}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => update({ hasWebsite: !data.hasWebsite, websiteUrl: "" })}
            className={cn(
              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
              !data.hasWebsite ? "bg-brand-orange border-brand-orange" : "border-line/20",
            )}
          >
            {!data.hasWebsite && <Check className="w-3 h-3 text-fg" />}
          </div>
          <span className="text-muted text-sm">I don&apos;t have a website yet</span>
        </label>

        {!data.hasWebsite && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-fg text-sm font-medium mb-2">
                No problem — what kind of business do you run?
              </label>
              <BusinessTypeGrid
                compact
                value={data.businessType}
                onChange={(businessType) => update({ businessType })}
              />
            </div>
            <div>
              <label className="block text-fg text-sm font-medium mb-1.5">
                Where do you serve customers?{" "}
                <span className="text-muted font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="City"
                  value={data.city}
                  onChange={(e) => update({ city: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="State"
                  value={data.state}
                  onChange={(e) => update({ state: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

// ─── Step 2: Here's what we learned ──────────────────────────────────────────

function StepConfirm({
  data,
  update,
  aiAnalyzing,
  aiPrefilled,
}: {
  data: OnboardingData
  update: (p: Partial<OnboardingData>) => void
  aiAnalyzing: boolean
  aiPrefilled: boolean
}) {
  return (
    <GlassCard>
      <h2 className="text-fg font-semibold text-xl mb-1">
        {data.hasWebsite ? "Here’s what we learned — is this right?" : "Tell us about your business"}
      </h2>
      <p className="text-muted text-sm mb-4">
        alphaa uses this to write in your voice — not generic AI copy. Edit anything.
      </p>

      {aiAnalyzing && (
        <div className="flex items-center gap-2.5 bg-brand-orange/10 border border-brand-orange/20 rounded-xl px-4 py-3 mb-4">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin flex-shrink-0" />
          <p className="text-brand-orange text-xs font-medium">Reading your website and filling this in for you…</p>
        </div>
      )}
      {aiPrefilled && !aiAnalyzing && (
        <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
          <Wand2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <p className="text-green-400 text-xs font-medium">
            alphaa read your website and filled this in. Fix anything that&apos;s not quite right.
          </p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-fg text-sm font-medium mb-2">What kind of business is it?</label>
          <BusinessTypeGrid
            compact
            value={data.businessType}
            onChange={(businessType) => update({ businessType })}
          />
        </div>

        <div>
          <label className="block text-fg text-sm font-medium mb-1.5">What makes your business different?</label>
          <textarea
            value={data.voiceDescription}
            onChange={(e) => update({ voiceDescription: e.target.value })}
            placeholder={
              aiAnalyzing
                ? "Filling in from your website…"
                : "We're a family-owned practice focused on gentle, judgment-free care. 15 years in Austin. Patients often mention our friendly staff and no-wait appointments."
            }
            rows={4}
            disabled={aiAnalyzing}
            className={cn(inputClass, "resize-none disabled:opacity-50")}
          />
        </div>

        <div>
          <label className="block text-fg text-sm font-medium mb-1.5">
            Any topics to avoid? <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={data.topicsToAvoid}
            onChange={(e) => update({ topicsToAvoid: e.target.value })}
            placeholder={
              aiAnalyzing
                ? "Filling in from your website…"
                : "Don't mention pricing. Avoid comparing us to specific competitors by name."
            }
            rows={2}
            disabled={aiAnalyzing}
            className={cn(inputClass, "resize-none disabled:opacity-50")}
          />
        </div>

        <div>
          <label className="block text-fg text-sm font-medium mb-1.5">
            Serve customers in a specific area?{" "}
            <span className="text-muted font-normal">Add it — otherwise leave blank. (optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="City" value={data.city} onChange={(e) => update({ city: e.target.value })} className={inputClass} />
            <input placeholder="State" value={data.state} onChange={(e) => update({ state: e.target.value })} className={inputClass} />
            <input placeholder="ZIP" value={data.zip} onChange={(e) => update({ zip: e.target.value })} className={inputClass} />
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// ─── Step 3: Connect Google ──────────────────────────────────────────────────

function StepGoogle({
  status,
  matched,
  properties,
  ambiguous,
  pickGmb,
  pickGsc,
  pickGa,
  setPickGmb,
  setPickGsc,
  setPickGa,
  savingPicks,
  onConnect,
  onSkip,
  onSavePicks,
}: {
  status: GoogleStatus
  matched: MatchedNames
  properties: GoogleProperties | null
  ambiguous: { gbp: boolean; gsc: boolean; ga: boolean }
  pickGmb: string
  pickGsc: string
  pickGa: string
  setPickGmb: (v: string) => void
  setPickGsc: (v: string) => void
  setPickGa: (v: string) => void
  savingPicks: boolean
  onConnect: () => void
  onSkip: () => void
  onSavePicks: () => void
}) {
  const foundNames = [matched.gbp, matched.gsc, matched.ga].filter(Boolean) as string[]

  const selectClass =
    "w-full appearance-none bg-bg-tertiary border border-line/10 rounded-xl px-4 py-3 pr-10 text-fg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"

  if (status === "finalizing") {
    return (
      <GlassCard className="text-center py-10">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto mb-4" />
        <h2 className="text-fg font-semibold text-xl mb-2">Google is connected!</h2>
        <p className="text-muted text-sm">Finding your business in your Google account…</p>
      </GlassCard>
    )
  }

  if (status === "picker" && properties) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-5">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-green-400 text-xs font-medium">Google is connected. One quick question:</p>
        </div>

        <h2 className="text-fg font-semibold text-xl mb-1">Which one is yours?</h2>
        <p className="text-muted text-sm mb-5">
          Your Google account has more than one — pick the right one and alphaa handles the rest.
        </p>

        <div className="space-y-4">
          {ambiguous.gbp && (
            <div>
              <label className="block text-fg text-sm font-medium mb-1.5">Your business listing on Google</label>
              <div className="relative">
                <select value={pickGmb} onChange={(e) => setPickGmb(e.target.value)} className={selectClass}>
                  <option value="">Choose your business…</option>
                  {properties.gmbLocations.map((l) => (
                    <option key={l.locationId} value={l.locationId}>
                      {l.locationName} — {l.address}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>
          )}

          {ambiguous.gsc && (
            <div>
              <label className="block text-fg text-sm font-medium mb-1.5">Your website in Google&apos;s search data</label>
              <div className="relative">
                <select value={pickGsc} onChange={(e) => setPickGsc(e.target.value)} className={selectClass}>
                  <option value="">Choose your website…</option>
                  {properties.gscSites.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/^sc-domain:/, "")}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>
          )}

          {ambiguous.ga && (
            <div>
              <label className="block text-fg text-sm font-medium mb-1.5">Your website&apos;s visitor stats</label>
              <div className="relative">
                <select value={pickGa} onChange={(e) => setPickGa(e.target.value)} className={selectClass}>
                  <option value="">Choose one…</option>
                  {properties.gaProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>
          )}

          <OrangePillButton onClick={onSavePicks} loading={savingPicks} size="md" className="w-full">
            That&apos;s the one <ChevronRight className="w-4 h-4" />
          </OrangePillButton>
        </div>
      </GlassCard>
    )
  }

  if (status === "done") {
    return (
      <GlassCard className="text-center py-8">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7 text-green-400" />
        </div>
        <h2 className="text-fg font-semibold text-xl mb-2">Connected ✓</h2>
        {foundNames.length > 0 ? (
          <p className="text-muted text-sm">
            alphaa found{" "}
            <span className="text-fg font-medium">{foundNames.join(", ")}</span> in your Google
            account and is ready to work.
          </p>
        ) : (
          <p className="text-muted text-sm">
            Your Google account is linked. alphaa will finish matching your business automatically.
          </p>
        )}
        <p className="text-muted/60 text-xs mt-3">Hit Continue below — the fun part is next.</p>
      </GlassCard>
    )
  }

  // idle / connecting
  return (
    <GlassCard>
      <h2 className="text-fg font-semibold text-xl mb-1">Connect your Google account</h2>
      <p className="text-muted text-sm mb-5">
        This is the step that lets alphaa actually do the work for you.
      </p>

      <div className="space-y-3 mb-6">
        {[
          "Post updates to your Google Business Profile for you",
          "Track the exact searches people use to find you",
          "Reply to your reviews for you",
        ].map((line) => (
          <div key={line} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-brand-orange/15 flex items-center justify-center flex-shrink-0 mt-px">
              <Check className="w-3 h-3 text-brand-orange" />
            </div>
            <p className="text-fg/85 text-sm">{line}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onConnect}
        disabled={status === "connecting"}
        className="btn-orange w-full py-3 text-sm font-medium flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "connecting" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span className="bg-white rounded-full p-0.5 flex items-center justify-center">
            <GoogleLogo size={14} />
          </span>
        )}
        {status === "connecting" ? "Opening Google…" : "Connect Google — takes 30 seconds"}
      </button>

      <p className="text-muted/60 text-[11px] text-center mt-3 mb-4">
        You&apos;ll sign in with Google on Google&apos;s own page. alphaa never sees your password.
      </p>

      <button onClick={onSkip} className="text-muted text-sm hover:text-fg transition-colors block text-center w-full">
        Skip for now →
      </button>
      <p className="text-muted/50 text-[11px] text-center mt-1.5">
        alphaa can&apos;t post to Google or track your rankings until this is connected — you can do
        it later in Settings.
      </p>
    </GlassCard>
  )
}

// ─── Step 4: alphaa is now working for you ───────────────────────────────────

const CHECKLIST = [
  "Auditing your website",
  "Checking ChatGPT, Gemini & Perplexity for your business",
  "Drafting your first Google post",
  "Setting up your weekly schedule",
]

function StepWorking({
  checkedCount,
  googleConnected,
}: {
  checkedCount: number
  googleConnected: boolean
}) {
  return (
    <GlassCard className="py-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-brand-orange/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-brand-orange" />
        </div>
        <h2 className="text-fg font-semibold text-2xl mb-1">alphaa is now working for you</h2>
        <p className="text-muted text-sm">
          {googleConnected
            ? "Sit back — your first results land on your dashboard."
            : "Sit back — your first results land on your dashboard shortly."}
        </p>
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        {CHECKLIST.map((item, i) => {
          const isDone = i < checkedCount
          const isActive = i === checkedCount
          return (
            <div key={item} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                  isDone ? "bg-green-500/20" : "bg-fg/[0.05]",
                )}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-brand-orange animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-fg/20" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors duration-300",
                  isDone ? "text-fg" : isActive ? "text-fg/70" : "text-muted/50",
                )}
              >
                {item}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-muted/60 text-xs text-center mt-6">
        Your first Google Business Profile post goes out within 24 hours.
      </p>
    </GlassCard>
  )
}
