// One service page (/services/[slug]): the dream, the pain, the before and after, how it works,
// the savings (with sources), the honest availability note, FAQs, related services.
import Link from "next/link"
import "./home-v2.css"
import { FeatureVideo } from "./HomeV2Client"
import { SERVICE_BY_SLUG, type Service } from "@/content/services"
import { GUARANTEE_LINE } from "@/lib/offer-copy"
import { GROWTH_ON_SALE } from "@/lib/growth"

const Tick = () => (
  <span className="hv-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
)

export function ServicePage({ s }: { s: Service }) {
  const growth = s.plan === "growth"
  // One CTA everywhere: /start, where the agent writes the visitor's first week behind their email.
  const cta = { href: "/start", label: "Get started" }
  return (
    <div className="hv">
      <section className="hv-hero" style={{ paddingBottom: 48 }}>
        <div className="hv-wrap">
          <nav className="hv-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> › <Link href="/services">Services</Link> › <span>{s.name}</span></nav>
          <span className="hv-tag" style={{ ["--c" as string]: s.color, marginTop: 18 }}>{s.kicker}</span>
          <h1 style={{ fontSize: "clamp(40px, 6.6vw, 76px)" }}>{s.h1}</h1>
          <p className="hv-lede">{s.sub}</p>
          <Link className="hv-cta" href={cta.href}>{cta.label}</Link>
          <p className="hv-fine">{growth ? `Part of the Growth plan, $499 a month${GROWTH_ON_SALE ? "" : " (early access)"}.` : `From $${s.plan === "starter" ? 99 : 499} a month.`} Month to month. Cancel online in a minute.</p>
        </div>
      </section>

      <section className="hv-wrap">
        <div className="hv-dream" style={{ ["--c" as string]: s.color }}><p>{s.dream}</p></div>
      </section>

      <section className="hv-band">
        <div className="hv-wrap">
          <div className="hv-feat" style={{ paddingBlock: 0 }}>
            <FeatureVideo color={s.color} label={s.feature.label} scenes={s.feature.scenes} />
            <div className="hv-feat__txt">
              <h2 className="hv-h2" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>What you get</h2>
              <ul>{s.gets.map((g) => <li key={g}><Tick /><span>{g}</span></li>)}</ul>
              <p className="hv-fine" style={{ marginTop: 16 }}><span className="hv-example">Example screens</span></p>
            </div>
          </div>
        </div>
      </section>

      <section className="hv-band hv-band--grey">
        <div className="hv-wrap hv-center">
          <h2 className="hv-h2">Sound familiar?</h2>
          <div className="hv-pains">
            {s.pains.map((p) => <div key={p.t}><h3>{p.t}</h3><p>{p.p}</p></div>)}
          </div>
        </div>
      </section>

      <section className="hv-band">
        <div className="hv-wrap hv-center">
          <h2 className="hv-h2">Your week, before and after.</h2>
          <div className="hv-ba" role="table" aria-label="Before and after Alphaa">
            <div className="hv-ba__head" role="row"><span role="columnheader">Before</span><span role="columnheader">With your AI agent</span></div>
            {s.beforeAfter.map(([b, a]) => (
              <div key={b} className="hv-ba__row" role="row"><span role="cell">{b}</span><span role="cell"><Tick />{a}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-band hv-band--grey">
        <div className="hv-wrap hv-center">
          <h2 className="hv-h2">How it works</h2>
          <ol className="hv-steps3">
            {s.how.map((h, i) => <li key={h.t}><span className="hv-steps3__n">{i + 1}</span><h3>{h.t}</h3><p>{h.p}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="hv-band">
        <div className="hv-wrap hv-center">
          <h2 className="hv-h2">What you save</h2>
          <div className="hv-savings">
            <div className="hv-savings__them"><span>An agency or freelancer</span><b>{s.savings.them}</b><p>{s.savings.themWhat}</p></div>
            <div className="hv-savings__us"><span>Your AI agent</span><b>{s.savings.us}</b><p>{s.savings.usWhat}</p></div>
          </div>
          <p className="hv-fine">Sources: {s.savings.sources.map((x, i) => <span key={x.url}>{i ? " · " : ""}<a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a></span>)}</p>
          {s.plan === "starter" && <p className="hv-guar">{GUARANTEE_LINE}</p>}
          {s.availability && <p className="hv-avail">{s.availability}</p>}
        </div>
      </section>

      <section className="hv-band hv-band--grey">
        <div className="hv-wrap">
          <h2 className="hv-h2 hv-center">Questions</h2>
          <div className="hv-faq">
            {s.faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="hv-band">
        <div className="hv-wrap hv-center">
          <h2 className="hv-h2" style={{ fontSize: "clamp(28px, 3.6vw, 40px)" }}>Your agent does all of this too</h2>
          <div className="hv-related">
            {s.related.map((r) => {
              const o = SERVICE_BY_SLUG[r]
              return <Link key={r} href={`/services/${r}`} style={{ ["--c" as string]: o.color }}><span className="hv-tag">{o.name}</span><b>{o.h1}</b><span className="hv-related__more">Learn more ›</span></Link>
            })}
          </div>
        </div>
      </section>

      <section className="hv-final" style={{ paddingTop: 40 }}>
        <div className="hv-wrap">
          <h2>Run the business.<br /><span>I’ll run the marketing.</span></h2>
          <Link className="hv-cta" href="/start">Get started</Link>
        </div>
      </section>
    </div>
  )
}
