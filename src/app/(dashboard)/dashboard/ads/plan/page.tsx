export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth, hasPro } from "@/lib/billing"
import { imageUrl } from "@/lib/images"
import { lastReadyStrategy } from "@/lib/ad-strategy/generate"
import { planHtml, strategyMd } from "@/lib/ad-strategy/markdown"
import { getAgentSettings } from "@/lib/agent/settings"
import { getAccess } from "@/lib/metaads/store"
import { pageTitle } from "@/lib/page-title"
import { AdPlanView } from "@/components/ad-plan/AdPlanView"
import { AdsTabs } from "@/components/workspace/AdsTabs"
import { Button, EmptyState, PageHeader, Pill, PlanGate } from "@/components/workspace/ui"
import { AI_RULES, LEGAL, MUSIC, SPECS, THRESHOLDS } from "@/lib/ad-strategy/playbook"
import { PrintButton } from "./PrintButton"

export const metadata = { title: pageTitle("Your ad plan") }

// The ad plan under Ads (was /dashboard/ad-strategy). ?print=1 = the whole plan on one page,
// made to print or save as a PDF (browser print).
export default async function AdPlanPage({ searchParams }: { searchParams: Promise<{ print?: string }> }) {
  const { print } = await searchParams
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const growth = hasGrowth(user)
  const head = (sub: string) => (
    <PageHeader
      title={growth ? "Ads" : "Your ad plan"}
      sub={sub}
      pill={growth ? <Pill tone="info">Growth · early access</Pill> : undefined}
      tabs={growth ? <AdsTabs value="plan" /> : undefined}
    />
  )
  if (!hasPro(user)) {
    return <>{head("Video scripts, opening lines and static ads written from what your competitors run.")}<PlanGate plan="Pro" title="Your ad plan comes with the Pro plan" text="I read your competitors’ live ads, then write your video scripts, opening lines and static ads, every line checked against your own facts." /></>
  }
  const s = await lastReadyStrategy(user.id)
  if (!s) {
    return (
      <>
        {head("Video scripts, opening lines and static ads written from what your competitors run.")}
        <EmptyState
          hero
          title="No ad plan yet"
          text="I read your competitors’ live ads first, then write yours. It takes a few minutes."
          bullets={["12 short video scripts, scene by scene", "Opening lines to test, by type", "Facebook, Instagram and Google ads with their pictures"]}
          actions={<Button variant="primary" href="/dashboard/ads/plan?ask=adplan">Write my ad plan</Button>}
        />
      </>
    )
  }
  const images = Object.fromEntries((s.statics?.meta ?? []).filter((m) => m.imageId).map((m) => [m.imageId!, imageUrl(m.imageId!)]))
  if (print !== "1") {
    const [settings, access] = await Promise.all([getAgentSettings(user.id), getAccess(user.id).catch(() => null)])
    const page = access?.picks?.pageName?.trim() || s.business?.name?.trim() || user.businessName?.trim() || "Your business"
    return (
      <>
        {head("Your scripts, opening lines and ads, written from what your competitors run.")}
        <AdPlanView s={s} images={images} page={page} site={user.websiteUrl ?? null}
          budget={settings.autopilot?.adBudget ?? null}
          inputs={{ b2b: !!s.business?.b2b, local: s.business?.local ?? true, currency: s.testing?.currency ?? "USD" }}
          rules={{
            specs: [["Size", SPECS.master], ["Length", SPECS.length], ["Brand", SPECS.brand], ["Safe area", SPECS.safeBox], ["Captions", SPECS.captions], ["Pacing", SPECS.pacing], ["Voice", SPECS.voice], ["Sound", `${SPECS.sound} ${SPECS.loudness}`]],
            music: [`Use: ${MUSIC.yes.join("; ")}.`, `Never: ${MUSIC.never.join(", ")}.`, MUSIC.why, MUSIC.log],
            ai: [...AI_RULES], legal: [...LEGAL], thresholds: [...THRESHOLDS.rows], testRules: [...THRESHOLDS.rules],
          }} />
      </>
    )
  }
  const when = new Date(s.at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const shots = (s.statics?.meta ?? []).filter((m) => m.imageId)
  return (
    <main className="x3-print">
      <style>{`
        .x3-print{max-width:880px;margin:0 auto;padding:24px 0 60px;font-size:15px;line-height:1.6;color:var(--x-ink)}
        .x3-print h1{font-size:var(--x-fs-2xl);font-weight:650;letter-spacing:-.02em;margin:0}
        .x3-print h2{font-size:var(--x-fs-xl);font-weight:650;margin:2.2rem 0 .8rem;padding-top:1rem;border-top:1px solid var(--x-line)}
        .x3-print h3{font-size:var(--x-fs-lg);font-weight:600;margin:1.4rem 0 .4rem}
        .x3-print p{margin:.5rem 0}
        .x3-print ul{list-style:disc;padding-left:1.3rem;margin:.4rem 0}
        .x3-print a{text-decoration:underline}
        .x3-print .ag-plan-t{width:100%;border-collapse:collapse;font-size:13px;margin:.6rem 0}
        .x3-print .ag-plan-t th,.x3-print .ag-plan-t td{border:1px solid var(--x-line);padding:6px 8px;text-align:left;vertical-align:top}
        .x3-print .ag-plan-t th{background:var(--x-soft);font-weight:600}
        .x3-print .x3-print__head{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;justify-content:space-between}
        .x3-print .x3-print__imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
        .x3-print .x3-print__imgs img{width:100%;border-radius:12px;border:1px solid var(--x-line)}
        @media print{.no-print{display:none}.x3-print{max-width:none;padding:0}.x3-print h2{break-after:avoid}.x3-print table{break-inside:avoid}}
      `}</style>
      <div className="x3-print__head">
        <div>
          <h1>Your ad plan</h1>
          <p className="ax-t11">{s.business?.name}{s.business?.markets ? ` · ${s.business.markets}` : ""} · written {when}</p>
        </div>
        <div className="no-print x3-acts">
          <Button href="/dashboard/ads/plan">Back</Button>
          <PrintButton auto />
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: planHtml(strategyMd(s)) }} />
      {shots.length > 0 && (
        <section>
          <h2>Your static ad images</h2>
          <div className="x3-print__imgs">
            {shots.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.imageId!} src={imageUrl(m.imageId!)} alt={m.imageHeadline} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
