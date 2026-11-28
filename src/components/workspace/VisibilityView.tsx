"use client"

import type { ReactNode } from "react"
import type { VisibilityData } from "@/lib/workspace/visibility"
import { VisibilityTrend } from "@/components/dashboard/VisibilityTrend"
import { EngineCard } from "./EngineCard"
import { ShareOfVoiceChart } from "./ShareOfVoiceChart"
import { Button, EmptyState, Glyph, PageHeader, SectionHeader, StatRow, StatTile, When } from "./ui"
import "./detail.css"

// "AI search": what ChatGPT, Claude, Perplexity and Gemini say when customers ask. Four engine cards
// with the real question and answer, a few honest numbers, and the trend. No promises, no timelines.
export function VisibilityView({ data, action }: { data: VisibilityData; action: ReactNode }) {
  const never = data.checked === 0
  const naming = data.naming
  const delta = data.prevNaming != null && data.prevNaming !== naming
    ? { text: `${Math.abs(naming - data.prevNaming)} since last week`, dir: naming > data.prevNaming ? "up" as const : "down" as const }
    : data.prevNaming != null ? { text: "same as last week", dir: "flat" as const } : null
  const shareDelta = data.share.last != null && data.share.prev != null
    ? data.share.last === data.share.prev ? { text: "no change", dir: "flat" as const } : { text: `${Math.abs(data.share.last - data.share.prev)} pts`, dir: data.share.last > data.share.prev ? "up" as const : "down" as const }
    : null

  return (
    <>
      <PageHeader
        title="AI search"
        sub="What ChatGPT, Claude, Perplexity and Gemini tell customers who ask for a business like yours."
        meta={data.lastAt ? <span><When at={data.lastAt} mode="ago" prefix="Last checked " fallback="" /> · I check again every week</span> : undefined}
        actions={never ? undefined : action}
      />

      {never ? (
        <EmptyState
          hero
          icon={<Glyph name="spark" size={26} />}
          title="I haven’t asked the AIs about you yet"
          text="I ask all four the questions your customers type and show you exactly what each one answers."
          bullets={["Whether each AI names you", "Who it names instead", "The pages it cites"]}
          actions={action}
        />
      ) : (
        <>
          <StatRow>
            <StatTile label="AIs that name you" value={`${naming} of 4`} delta={delta} hint={`${data.checked} of 4 checked`} />
            <StatTile label="Answers that name you" value={data.share.last != null ? `${data.share.last}%` : null} delta={shareDelta} hint={data.share.answers ? `Latest week, ${data.share.answers} answers` : "Shown after two weekly checks"} empty="Not measured yet" />
            <StatTile label="Your site as a source" value={data.totalCitations ? `${data.ownCited} of ${data.totalCitations}` : null} hint={data.totalCitations ? "Pages the AIs cited in my latest check" : "Saved from my next weekly check"} href={data.totalCitations ? "/dashboard/citations" : undefined} />
          </StatRow>

          <SectionHeader title="Each AI" sub="Tap one to see every question I asked it." />
          <div className="xp-eng-grid">
            {data.cards.map((c) => <EngineCard key={c.engine} card={c} href={`/dashboard/visibility/${c.engine}`} />)}
          </div>
        </>
      )}

      <SectionHeader
        title="Share of voice"
        sub={data.sov ? "How often the AIs name you, next to the competitors they name most." : "How many of the four AIs named you at each weekly check."}
        end={<Button size="sm" href="/dashboard/citations">Where AI gets its answers</Button>}
      />
      {data.sov ? (
        <section className="xp-card">
          <ShareOfVoiceChart data={data.sov} />
          {data.share.last === 0 && <p className="xp-note">No answer named you yet, so your line sits at 0%. It moves as soon as one AI names you.</p>}
        </section>
      ) : data.trend.length >= 2 ? (
        <section className="xp-card">
          <VisibilityTrend points={data.trend} />
          <p className="xp-note">Your comparison with competitors starts after two weekly question checks ({data.sovWeeks} so far).</p>
        </section>
      ) : (
        <EmptyState title="Your trend starts after two weekly checks" text={`I have ${Math.max(data.sovWeeks, data.trend.length)} so far. I ask again every week.`} />
      )}
    </>
  )
}
