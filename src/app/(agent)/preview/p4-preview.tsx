"use client"
// Dev-only (page.tsx 404s in production): package 4 screens (plans, billing, settings tabs,
// admin usage) with SAMPLE data. The settings pages that load their own data get a stubbed fetch
// for a few endpoints, in this preview only. Never rendered for a real account.
import { useState } from "react"
import { PlansView, type PlansData } from "@/components/workspace/settings/PlansView"
import { BillingView } from "@/components/workspace/settings/BillingView"
import { BusinessView } from "@/components/workspace/settings/BusinessView"
import { GoogleView } from "@/components/workspace/settings/GoogleView"
import { WebsiteView } from "@/components/workspace/settings/WebsiteView"
import { AdminUsageView, type UsageData } from "@/components/workspace/settings/AdminUsageView"
import { PageHeader } from "@/components/workspace/ui"
import { SettingsTabs } from "@/components/workspace/settings/SettingsTabs"
import "@/components/workspace/settings/settings.css"


const STUB: Record<string, (empty: boolean) => unknown> = {
  "/api/user/onboarding-progress": () => ({ profile: { businessName: "Sample Dental", websiteUrl: "example.com", city: "Sampleton", state: "ON", zip: "K2K 0A1", voiceDescription: "Sample description (preview only).", topicsToAvoid: "" } }),
  "/api/team": (e) => ({ role: "owner", manage: true, seats: e ? 0 : 3, used: e ? 0 : 1, me: null, members: e ? [] : [{ id: "m1", email: "sample.person@example.com", name: "Sample Person", role: "publisher", status: "active", briefing: true }] }),
  "/api/agent/guardrails": () => ({ guardrails: { banned: ["sample"], alwaysSay: [], hashtags: ["#Sample"], platformHashtags: {}, disclaimers: {} } }),
  "/api/sites": () => ({ sites: [], activeId: null }),
  "/api/usage": () => ({ since: "2026-11-27T00:00:00Z", lines: [{ label: "Blog posts", used: 1, included: 4, per: "a month" }, { label: "Social posts", used: 7, included: 12, per: "a month" }, { label: "AI checks", used: 180, included: 200, per: "a month" }, { label: "Live questions", used: 4, included: null, per: "today" }] }),
  "/api/credits": () => ({ balance: 12, autoUse: true, comped: false, shopifyUrl: null }),
  "/api/integrations/google/status": (e) => ({ connected: !e, gaPropertyId: e ? null : "123", gaPropertyName: e ? null : "Sample property", gscSiteUrl: e ? null : "sc-domain:example.com", gmbLocationName: null, lastSyncedAt: new Date(Date.now() - 2 * 3_600_000).toISOString() }),
  "/api/connect/status": (e) => ({ platform: e ? "none" : "webflow", siteUrl: e ? null : "https://example.com", label: e ? null : "example.com", connectedAt: "2026-11-02T10:00:00Z", health: "ok", available: { wordpress: true, shopify: true, webflow: true, wix: false } }),
}
let patched = false
function stubFetch(empty: boolean) {
  if (patched || typeof window === "undefined") return
  patched = true
  const orig = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.href)
    const s = STUB[url.pathname] as ((e: boolean) => unknown) | undefined
    if (s && (!init?.method || init.method === "GET")) return new Response(JSON.stringify(s(empty)), { status: 200, headers: { "Content-Type": "application/json" } })
    if (s) return new Response(JSON.stringify({ ok: true, said: "Saved (preview)." }), { status: 200, headers: { "Content-Type": "application/json" } })
    return orig(input, init)
  }
}

const plan = (key: "starter" | "pro" | "growth", name: string, m: number, a: number, inc: string | null, f: string[]) => ({ key, name, tagline: `Sample tagline for ${name}.`, monthly: m, annual: a, annualTotal: a * 12, includes: inc, features: f })
function plansSample(empty: boolean, asked: string | null): PlansData {
  return {
    plans: [plan("growth", "Growth", 799, 679, "Everything in Pro", ["Sample ads feature", "Sample feature"]), plan("pro", "Pro", 499, 424, "Everything in Starter", ["Sample social feature", "Sample Google feature", "Sample email feature"]), plan("starter", "Starter", 99, 84, null, ["Sample AI search feature", "Sample blog feature", "Sample support"])],
    current: empty ? null : "starter", comped: empty, billedYearly: empty ? null : false, shopifyUrl: null, growthOnSale: false, growthHref: "mailto:hi@alphaa.app", growthCta: "Join early access",
    extraAd: { monthly: 200, annual: 170 }, extraAdsNow: 0, discount: 15, asked: asked === "pro" || asked === "growth" || asked === "starter" ? asked : null,
    compare: [
      { label: "Sample row with a check", values: { growth: true, pro: true, starter: true } },
      { label: "Sample row with values", sub: "Sample sub line", values: { growth: "3", pro: "3", starter: "1" } },
      { label: "Sample row, Pro and up", values: { growth: "4 a week", pro: "4 a week", starter: false } },
      { label: "Sample ads row", values: { growth: "1 ad account", pro: false, starter: false } },
    ],
  }
}
const ADMIN: UsageData = {
  total: 1.23, brands: 2, platformToday: 0.31, budget: 20, hotBrands: 1, types: [{ key: "post_draft", label: "Blog posts" }],
  quotas: [{ id: "u1", name: "Sample Brand A", email: "a@example.com", plan: "pro", aiDay: 0.12, aiDayCap: 4, aiMonth: 33, aiMonthCap: 40, flags: [{ text: "AI spend · $33.00 of $40.00 this month", pct: 0.83 }] }],
  work: [{ id: "u1", name: "Sample Brand A", email: "a@example.com", plan: "pro", brandsOnLogin: 1, counts: { post_draft: 3 }, gbp: 4, calls: 120, tin: 340000, tout: 52000, searches: 9, cost: 1.02, unpriced: false }],
  credits: [], features: [{ id: "sample_feature", calls: 40, tin: 100000, tout: 9000, searches: 2, cost: 0.4, unpriced: false }],
}

export function P4Preview({ page, empty, asked }: { page: string; empty: boolean; asked: string | null }) {
  useState(() => stubFetch(empty))
  if (page === "plans") return <PlansView data={plansSample(empty, asked)} />
  if (page === "admin") return <AdminUsageView data={ADMIN} />
  const body = page === "billing" ? (
    <BillingView data={{ summary: empty ? { source: "comped", plan: null, status: "active", interval: null, amount: null, currency: null, nextChargeAt: null, endsAt: null, card: null, extraAdAccounts: 0, discounted: false } : { source: "stripe", plan: "pro", status: "active", interval: "month", amount: 499, currency: "USD", nextChargeAt: "2026-12-26T00:00:00Z", endsAt: null, card: { brand: "visa", last4: "4242" }, extraAdAccounts: 0, discounted: false }, planName: empty ? null : "Pro", shopifyUrl: null, adAccounts: null }} />
  ) : page === "business" ? <BusinessView /> : page === "google" ? <GoogleView /> : page === "website" ? <WebsiteView /> : (
    <PageHeader title="Your account" sub="Clerk’s profile renders here when signed in (preview has no session)." tabs={<SettingsTabs />} />
  )
  return <div className="xs-page">{body}</div>
}
