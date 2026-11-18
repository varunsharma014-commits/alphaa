// One service page (/services/[slug]), v3 design: hero panel in the service's colour, the dream,
// what you get (with the looping example screens), the pain, before and after, how it works,
// the savings (with sources), the honest availability note, FAQs, related services.
import Link from "next/link"
import "./home-v2.css"
import { FeatureVideo } from "./HomeV2Client"
import { SERVICE_BY_SLUG, type Service } from "@/content/services"
import { GUARANTEE_LINE } from "@/lib/offer-copy"
import { GROWTH_ON_SALE } from "@/lib/growth"
import { PLAN_PRICES } from "@/lib/constants"
import { V3Page, Frame, Section, Eyebrow, Points, Faq, FinalCta, ProofMosaic, HeroShapes, SVC } from "@/components/marketing/v3"

export function ServicePage({ s }: { s: Service }) {
  const growth = s.plan === "growth"
  const v = SVC[s.slug]
  const pro = s.plan === "pro"
  const priceLine = growth
    ? `Part of the Growth plan, $${PLAN_PRICES.growth.monthly} a month${GROWTH_ON_SALE ? "" : " (early access)"}.`
    : pro ? `Part of the Pro plan, $${PLAN_PRICES.pro.monthly} a month, and Growth.` : `From $${PLAN_PRICES.starter.monthly} a month.`
  return (
    <V3Page tone={v.key}>
      <Frame top>
        <Section tight>
          <div className="v3-chapter">
            <div>
              <nav className="v3-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> › <Link href="/services">Services</Link> › <span>{s.name}</span></nav>
              <Eyebrow small={growth ? (GROWTH_ON_SALE ? "Growth plan" : "Growth plan · early access") : pro ? "Pro and Growth plans" : "Every plan"}>{s.kicker}</Eyebrow>
              <h1 className="v3-h1 v3-h1--md">{s.h1}</h1>
              <p className="v3-lede">{s.sub}</p>
              <div className="v3-btns"><Link className="v3-btn" href="/start">Get started →</Link><a className="v3-btn v3-btn--ghost" href="#how">How it works</a></div>
              <p className="v3-fine">{priceLine} Month to month. Cancel online in a minute.</p>
            </div>
            <HeroShapes cards={v.cards} tones={[v.key, v.key, v.key, v.key]} />
          </div>
        </Section>

        <Section center tight>
          <p className="v3-h2 v3-h2--sm v3-narrow" style={{ fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            <span className="v3-em">“</span>{s.dream}<span className="v3-em">”</span>
          </p>
        </Section>

        <Section>
          <div className="v3-split">
            <FeatureVideo color={`var(--${v.key}-2)`} label={s.feature.label} scenes={s.feature.scenes} />
            <div>
              <Eyebrow>What you get</Eyebrow>
              <h2 className="v3-h2">{v.a}<br /><span className="v3-em">{v.b}</span></h2>
              <Points items={s.gets} />
              <div className="v3-proof"><span className="n">{v.proof.n}</span><span>{v.proof.t}</span></div>
              <p className="v3-fine"><span className="v3-example">Example screens</span></p>
            </div>
          </div>
        </Section>

        <Section center>
          <h2 className="v3-h2">Sound familiar?</h2>
          <div className="v3-grid v3-grid--3">
            {s.pains.map((p) => <div key={p.t} className="v3-card v3-card--tint"><h3 className="v3-h3">{p.t}</h3><p>{p.p}</p></div>)}
          </div>
        </Section>

        <Section center>
          <h2 className="v3-h2">Your week, before and after.</h2>
          <div className="v3-table v3-narrow" style={{ marginInline: "auto" }}>
            <table>
              <thead><tr><th scope="col">Before</th><th scope="col">With your AI agent</th></tr></thead>
              <tbody>
                {s.beforeAfter.map(([b, a]) => <tr key={b}><td>{b}</td><td style={{ color: "var(--v-fg)", fontWeight: 600 }}>{a}</td></tr>)}
              </tbody>
            </table>
          </div>
        </Section>

        <Section center id="how">
          <h2 className="v3-h2">How it works</h2>
          <ol className="v3-steps">
            {s.how.map((h) => <li key={h.t}><h3>{h.t}</h3><p>{h.p}</p></li>)}
          </ol>
        </Section>

        <Section center>
          <h2 className="v3-h2">What you save</h2>
          <ProofMosaic tiles={[
            { big: s.savings.them, small: <>An agency or freelancer: {s.savings.themWhat}</>, wide: true },
            { big: s.savings.us, small: <>Your AI agent: {s.savings.usWhat}</>, wide: true, ink: true },
          ]} />
          <p className="v3-fine">Sources: {s.savings.sources.map((x, i) => <span key={x.url}>{i ? " · " : ""}<a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a></span>)}</p>
          {s.plan === "starter" && <p className="v3-lede" style={{ fontSize: 16 }}>{GUARANTEE_LINE}</p>}
          {s.availability && <p className="v3-note" style={{ marginInline: "auto" }}>{s.availability}</p>}
        </Section>

        <Section center>
          <h2 className="v3-h2">Questions</h2>
          <Faq items={s.faqs} />
        </Section>

        <Section center>
          <h2 className="v3-h2 v3-h2--sm">Your agent does all of this too</h2>
          <div className="v3-grid v3-grid--3">
            {s.related.map((r) => {
              const o = SERVICE_BY_SLUG[r]
              const ov = SVC[r]
              return (
                <Link key={r} href={`/services/${r}`} className={`v3-card v3-card--tint v3-c-${ov.key}`}>
                  <span className="v3-pill" style={{ alignSelf: "flex-start" }}>{o.name}</span>
                  <b className="v3-h3" style={{ marginTop: 12 }}>{o.h1}</b>
                  <span className="v3-link" style={{ marginTop: "auto", paddingTop: 14 }}>Learn more ›</span>
                </Link>
              )
            })}
          </div>
        </Section>

        <FinalCta title={<>Run the business.<br /><span>I’ll run the marketing.</span></>} sub="Month to month. Cancel online in a minute." />
      </Frame>
    </V3Page>
  )
}
