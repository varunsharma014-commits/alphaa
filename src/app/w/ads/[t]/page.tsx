// Public, read-only ad report: /w/ads/<signed token>. The token names one brand + one report link
// (lib/ad-report/token.ts); the link must still be live in the brand's settings (not revoked, not
// expired). Shows only ad numbers for the date range, the per-campaign table, top ads, what I
// changed and a summary written in code from those numbers. No email, no contact details, no
// lead data. noindex. Printable ("Save as PDF").
import type { Metadata } from "next"
import { db } from "@/lib/db"
import type { AgentSettings } from "@/lib/agent/settings"
import { fmtDay, liveLink, readReportToken } from "@/lib/ad-report/token"
import { adReportFor } from "@/lib/ad-report/data"
import { fmtMoney } from "@/lib/ad-rules/engine"
import { kpisOf } from "@/lib/ads-kpis"
import { PrintButton } from "./PrintButton"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Ad report", robots: { index: false, follow: false, nocache: true } }

async function load(t: string) {
  const claim = readReportToken(t)
  if (!claim) return null
  const row = await db.mockActivity.findFirst({ where: { userId: claim.u, type: "agent_settings" }, orderBy: { createdAt: "desc" }, select: { metadata: true } })
  const link = liveLink((row?.metadata as AgentSettings | null)?.adReports, claim)
  if (!link) return null
  return { link, report: await adReportFor(claim.u, link) }
}

const n = (x: number) => Math.round(x).toLocaleString("en-US")
const pct = (x: number | null) => (x === null ? "—" : `${x.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`)

export default async function AdReportPage({ params }: { params: Promise<{ t: string }> }) {
  const { t } = await params
  const data = await load(decodeURIComponent(t)).catch(() => null)
  if (!data) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 text-neutral-900">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-semibold">This report link isn’t active.</h1>
          <p className="mt-3 text-neutral-600">It may have expired or been turned off by the business. Ask them for a new link.</p>
        </div>
      </main>
    )
  }
  const { report: r } = data
  const cur = r.currencies[0] ?? "USD"
  const m = (x: number | null, c = cur) => (x === null ? "—" : fmtMoney(x, c))
  const tiles = r.totals && r.kpis ? [
    { k: "Spent", v: m(r.totals.spend) },
    { k: "Leads", v: n(r.totals.conversions) },
    { k: "Cost per lead", v: m(r.kpis.costPerConversion) },
    { k: "Click rate (CTR)", v: pct(r.kpis.ctr) },
    { k: "Cost per click", v: m(r.kpis.cpc) },
    { k: "Return on ad spend", v: r.kpis.roas === null ? "—" : `${r.kpis.roas}x` },
  ] : []

  return (
    <main className="ad-report min-h-screen bg-white px-4 py-10 text-[15px] leading-relaxed text-neutral-900">
      <style>{`
        .ad-report table{width:100%;border-collapse:collapse;font-size:13.5px}
        .ad-report th,.ad-report td{border-bottom:1px solid #ececec;padding:8px 6px;text-align:left;vertical-align:top}
        .ad-report th{font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
        .ad-report td.num,.ad-report th.num{text-align:right;white-space:nowrap}
        .ad-report h2{font-size:1.1rem;font-weight:600;margin:2rem 0 .7rem}
        .ad-report .scroll{overflow-x:auto}
        @media print{.no-print{display:none}.ad-report{padding:0}.ad-report h2{break-after:avoid}.ad-report table,.ad-report .tile{break-inside:avoid}}
      `}</style>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">Ad report</p>
            <h1 className="text-2xl font-semibold">{r.business}</h1>
            <p className="text-sm text-neutral-500">{fmtDay(r.range.from)} to {fmtDay(r.range.to)}</p>
          </div>
          <div className="no-print"><PrintButton /></div>
        </div>

        <section className="mt-6 rounded-2xl border border-neutral-200 p-5">
          {r.summary.map((s, i) => <p key={i} className={i ? "mt-2" : ""}>{s}</p>)}
          {r.gaps.map((g, i) => <p key={`g${i}`} className="mt-2 text-sm text-amber-700">{g}</p>)}
        </section>

        {tiles.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((x) => (
              <div key={x.k} className="tile rounded-xl border border-neutral-200 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500">{x.k}</div>
                <div className="mt-1 text-xl font-semibold">{x.v}</div>
              </div>
            ))}
          </div>
        )}
        {r.kpis && r.kpis.roas === null && r.rows.length > 0 && <p className="mt-2 text-xs text-neutral-500">Return on ad spend shows once sales values are tracked.</p>}

        <h2>Campaigns</h2>
        {r.rows.length ? (
          <div className="scroll">
            <table>
              <thead><tr><th>Campaign</th><th>Where</th><th className="num">Spent</th><th className="num">Leads</th><th className="num">Per lead</th><th className="num">CTR</th><th className="num">CPC</th></tr></thead>
              <tbody>
                {r.rows.map((x, i) => {
                  const k = kpisOf(x)
                  return <tr key={i}><td>{x.name}<div className="text-xs text-neutral-500">{x.status}</div></td><td>{x.platform}</td><td className="num">{m(x.spend, x.currency)}</td><td className="num">{n(x.conversions)}</td><td className="num">{m(k.costPerConversion, x.currency)}</td><td className="num">{pct(k.ctr)}</td><td className="num">{m(k.cpc, x.currency)}</td></tr>
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="text-neutral-600">No campaign spent anything in this period.</p>}

        {r.topAds.length > 0 && (
          <>
            <h2>Top ads</h2>
            <div className="scroll">
              <table>
                <thead><tr><th>Ad</th><th>Campaign</th><th className="num">Spent</th><th className="num">Clicks</th><th className="num">Leads</th></tr></thead>
                <tbody>{r.topAds.map((a, i) => <tr key={i}><td>{a.label}<div className="text-xs text-neutral-500">{a.platform}</div></td><td>{a.campaign}</td><td className="num">{m(a.spend, a.currency)}</td><td className="num">{n(a.clicks)}</td><td className="num">{n(a.conversions)}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}

        <h2>What changed</h2>
        {r.changes.length ? (
          <ul className="space-y-2">
            {r.changes.map((c, i) => <li key={i} className="border-b border-neutral-100 pb-2"><div>{c.text}</div><div className="text-xs text-neutral-500">{c.by === "Me" ? "Alphaa" : "The business"} · {fmtDay(c.at.slice(0, 10))}</div></li>)}
          </ul>
        ) : <p className="text-neutral-600">No changes in this period.</p>}

        <p className="mt-10 text-xs text-neutral-500">Numbers come straight from the ad platforms ({Array.from(new Set(r.rows.map((x) => x.platform))).join(", ") || "none connected"}) and can change by a day while the platforms finish counting. Made {fmtDay(r.at.slice(0, 10))} by Alphaa.</p>
      </div>
    </main>
  )
}
