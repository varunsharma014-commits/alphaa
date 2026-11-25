export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { imageUrl } from "@/lib/images"
import { lastReadyStrategy } from "@/lib/ad-strategy/generate"
import { planHtml, strategyMd } from "@/lib/ad-strategy/markdown"
import { PrintButton } from "./PrintButton"
import { AdPlanView } from "@/components/ad-plan/AdPlanView"
import { AI_RULES, LEGAL, MUSIC, SPECS, THRESHOLDS } from "@/lib/ad-strategy/playbook"

export const metadata = { title: "Your ad plan" }

// The whole ad plan on one page, made to print or save as a PDF (browser print).
export default async function AdStrategyPage({ searchParams }: { searchParams: Promise<{ print?: string }> }) {
  const { print } = await searchParams
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const s = hasPro(user) ? await lastReadyStrategy(user.id) : null
  if (!s) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-semibold">Your ad plan</h1>
        <p className="mt-3 text-sm text-neutral-600">{hasPro(user) ? "You don’t have an ad plan yet." : "Your ad plan comes with the Pro plan."}</p>
        <Link href="/dashboard?ask=adplan" className="mt-4 inline-block rounded-full bg-black px-4 py-2 text-sm text-white">{hasPro(user) ? "Write my ad plan" : "See the Pro plan"}</Link>
      </main>
    )
  }
  const images = Object.fromEntries((s.statics?.meta ?? []).filter((m) => m.imageId).map((m) => [m.imageId!, imageUrl(m.imageId!)]))
  if (print !== "1") {
    return <AdPlanView s={s} images={images} rules={{
      specs: [["Size", SPECS.master], ["Length", SPECS.length], ["Brand", SPECS.brand], ["Safe area", SPECS.safeBox], ["Captions", SPECS.captions], ["Pacing", SPECS.pacing], ["Voice", SPECS.voice], ["Sound", `${SPECS.sound} ${SPECS.loudness}`]],
      music: [`Use: ${MUSIC.yes.join("; ")}.`, `Never: ${MUSIC.never.join(", ")}.`, MUSIC.why, MUSIC.log],
      ai: [...AI_RULES], legal: [...LEGAL], thresholds: [...THRESHOLDS.rows], testRules: [...THRESHOLDS.rules],
    }} />
  }
  const when = new Date(s.at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const shots = (s.statics?.meta ?? []).filter((m) => m.imageId)
  return (
    <main className="ad-plan mx-auto max-w-4xl px-4 py-10 text-[15px] leading-relaxed text-neutral-900">
      <style>{`
        .ad-plan h2{font-size:1.25rem;font-weight:600;margin:2.2rem 0 .8rem;padding-top:1rem;border-top:1px solid #e5e5e5}
        .ad-plan h3{font-size:1rem;font-weight:600;margin:1.4rem 0 .4rem}
        .ad-plan p{margin:.5rem 0}
        .ad-plan ul{list-style:disc;padding-left:1.3rem;margin:.4rem 0}
        .ad-plan a{text-decoration:underline}
        .ad-plan .ag-plan-t{width:100%;border-collapse:collapse;font-size:13px;margin:.6rem 0}
        .ad-plan .ag-plan-t th,.ad-plan .ag-plan-t td{border:1px solid #e5e5e5;padding:6px 8px;text-align:left;vertical-align:top}
        .ad-plan .ag-plan-t th{background:#f7f7f7;font-weight:600}
        @media print{.no-print{display:none}.ad-plan{max-width:none;padding:0}.ad-plan h2{break-after:avoid}.ad-plan table{break-inside:avoid}}
      `}</style>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Your ad plan</h1>
          <p className="text-sm text-neutral-500">{s.business?.name}{s.business?.markets ? ` · ${s.business.markets}` : ""} · written {when}</p>
        </div>
        <div className="no-print flex gap-2">
          <Link href="/dashboard/ad-strategy" className="rounded-full border px-4 py-2 text-sm">Back</Link>
          <PrintButton auto />
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: planHtml(strategyMd(s)) }} />
      {shots.length > 0 && (
        <section>
          <h2>Your static ad images</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shots.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.imageId!} src={imageUrl(m.imageId!)} alt={m.imageHeadline} className="w-full rounded border" />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
