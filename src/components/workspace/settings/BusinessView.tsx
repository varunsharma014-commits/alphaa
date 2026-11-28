"use client"

import { useEffect, useRef, useState } from "react"
import { Field, FieldGrid, PageHeader, SaveBar, SettingsSection, Skeleton, TextArea, TextInput } from "@/components/workspace/ui"
import { RemoveWebsite } from "@/components/agent/RemoveWebsite"
import { BrandRulesCard } from "@/components/dashboard/BrandRulesCard"
import { TeamCard } from "@/components/dashboard/TeamCard"
import { useCan, useRole } from "@/components/workspace/role"
import { toast } from "@/lib/workspace/events"
import { SettingsTabs } from "./SettingsTabs"
import "./settings.css"

// Your business: what I know about the business (GET/PATCH /api/user/onboarding-progress, partial
// updates are safe), then Team and Brand rules. One floating Save bar while anything is unsaved.
type Form = { businessName: string; websiteUrl: string; city: string; state: string; zip: string; voiceDescription: string; topicsToAvoid: string }
const EMPTY: Form = { businessName: "", websiteUrl: "", city: "", state: "", zip: "", voiceDescription: "", topicsToAvoid: "" }
const KEYS = Object.keys(EMPTY) as (keyof Form)[]

export function BusinessView() {
  const [form, setForm] = useState<Form>(EMPTY)
  const saved = useRef<Form>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canEdit = useCan("settings")
  const owner = useRole() === "owner"

  useEffect(() => {
    let off = false
    fetch("/api/user/onboarding-progress")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then(({ profile }: { profile: Partial<Form> | null }) => {
        if (off) return
        const next = { ...EMPTY }
        for (const k of KEYS) next[k] = profile?.[k] ?? ""
        saved.current = next
        setForm(next)
      })
      .catch(() => { if (!off) setError("I couldn’t load your details just now. Refresh the page to try again.") })
      .finally(() => { if (!off) setLoading(false) })
    return () => { off = true }
  }, [])

  const dirty = !loading && KEYS.some((k) => form[k] !== saved.current[k])
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/user/onboarding-progress", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error("save")
      saved.current = form
      toast("Saved. I’ll use these from now on.")
    } catch {
      setError("That didn’t save. Try again in a moment.")
    } finally {
      setSaving(false)
    }
  }

  const ro = !canEdit
  return (
    <>
      <PageHeader title="Your business" sub="What I know about your business. I use it in every post, page and answer." tabs={<SettingsTabs />} />
      <div className="xs-stack">
        {error && <div className="xs-banner bad" role="alert">{error}</div>}
        {!canEdit && <div className="xs-banner warn">Only the owner or an admin can change these. You can still read them.</div>}

        <SettingsSection title="About your business" text="Keep this accurate. I check your website every week and write in your area.">
          {loading ? (
            <><Skeleton kind="line" width="40%" /><Skeleton kind="line" height={40} /><Skeleton kind="line" width="40%" /><Skeleton kind="line" height={40} /></>
          ) : (
            <>
              <Field label="Business name"><TextInput value={form.businessName} onChange={set("businessName")} placeholder="Bright Smile Dental" readOnly={ro} autoComplete="organization" /></Field>
              <Field label="Website address" hint="I check this site every week for anything hurting how you show up."><TextInput value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="yourbusiness.com" readOnly={ro} inputMode="url" autoComplete="url" /></Field>
              <Field label="City"><TextInput value={form.city} onChange={set("city")} placeholder="Austin or Ottawa" readOnly={ro} autoComplete="address-level2" /></Field>
              <FieldGrid min={140}>
                <Field label="State or province"><TextInput value={form.state} onChange={set("state")} placeholder="TX or ON" readOnly={ro} autoComplete="address-level1" /></Field>
                <Field label="ZIP or postal code"><TextInput value={form.zip} onChange={set("zip")} placeholder="78701 or K1A 0A6" readOnly={ro} autoComplete="postal-code" /></Field>
              </FieldGrid>
            </>
          )}
        </SettingsSection>

        <SettingsSection title="How I write" text="What sets you apart, and anything I should stay away from.">
          {loading ? (
            <><Skeleton kind="line" width="50%" /><Skeleton kind="line" height={72} /></>
          ) : (
            <>
              <Field label="What makes your business different?" hint="I write your posts around this, so they sound like you and not generic AI."><TextArea value={form.voiceDescription} onChange={set("voiceDescription")} placeholder="Family owned, gentle care, no-wait appointments" readOnly={ro} /></Field>
              <Field label="Topics to avoid" optional><TextArea rows={2} value={form.topicsToAvoid} onChange={set("topicsToAvoid")} placeholder="Don’t mention pricing" readOnly={ro} /></Field>
            </>
          )}
        </SettingsSection>

        <TeamCard />
        <BrandRulesCard />
        {owner && <RemoveWebsite />}
      </div>
      {canEdit && <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={() => setForm(saved.current)} />}
    </>
  )
}
