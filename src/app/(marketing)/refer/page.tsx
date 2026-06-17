"use client"

import { useState } from "react"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ChevronDown, ChevronUp } from "lucide-react"

// ─── Earnings Calculator ───────────────────────────────────────────────────────
function EarningsCalculator() {
  const [referrals, setReferrals] = useState(5)
  const [plan, setPlan] = useState<"starter" | "pro">("starter")

  const planPrice = plan === "starter" ? 99 : 199
  const planLabel = plan === "starter" ? "Starter ($99)" : "Pro ($199)"
  const commission = 0.3

  const monthly = referrals * planPrice * commission
  const annual = monthly * 12
  const threeYear = monthly * 36

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })

  const presets = [
    { label: "Freelancer", refs: 5 },
    { label: "Agency", refs: 20 },
    { label: "Influencer", refs: 50 },
  ]

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-8">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setReferrals(p.refs)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              referrals === p.refs
                ? "bg-brand-orange/20 border-brand-orange/50 text-brand-orange"
                : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
            }`}
          >
            {p.label} ({p.refs} refs)
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-white/60 text-sm font-medium">Referrals per month</label>
            <span className="text-brand-orange font-bold text-2xl">{referrals}</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={referrals}
            onChange={(e) => setReferrals(Number(e.target.value))}
            className="w-full accent-[#ff6b1a] h-2 cursor-pointer"
          />
          <div className="flex justify-between text-white/25 text-xs mt-1">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        {/* Plan Toggle */}
        <div>
          <label className="text-white/60 text-sm font-medium block mb-3">Plan</label>
          <div className="flex rounded-xl border border-white/[0.08] overflow-hidden">
            {(["starter", "pro"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  plan === p
                    ? "bg-brand-orange text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {p === "starter" ? "Starter · $99/mo" : "Pro · $199/mo"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Math formula */}
      <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-xl px-5 py-3 mb-6 text-center">
        <span className="text-white/60 text-sm">
          {referrals} referrals × ${planPrice} × 30% ={" "}
          <span className="text-brand-orange font-bold text-base">{fmt(monthly)}/mo</span>
        </span>
      </div>

      {/* Earnings grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Monthly earnings", value: fmt(monthly) },
          { label: "Annual earnings", value: fmt(annual) },
          { label: "3-year earnings", value: fmt(threeYear) },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white/[0.04] rounded-xl p-4 text-center border border-white/[0.06]"
          >
            <div className="text-brand-orange font-bold text-xl sm:text-2xl leading-tight">
              {item.value}
            </div>
            <div className="text-white/40 text-xs mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/[0.07]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-white font-medium">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
        )}
      </button>
      {open && <p className="text-white/50 text-sm pb-5 leading-relaxed">{a}</p>}
    </div>
  )
}

// ─── Apply Form ────────────────────────────────────────────────────────────────
function ApplyForm() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    window.location.href = `mailto:partners@alphaa.ai?subject=Partner Application — ${encodeURIComponent(name)}&body=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}`
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-white font-semibold text-xl mb-2">Application sent!</h3>
        <p className="text-white/50 text-sm">We'll send your partner link within 24 hours. Check your inbox.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
      <input
        required
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-white/[0.05] border border-white/[0.10] rounded-full px-5 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
      />
      <input
        required
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-white/[0.05] border border-white/[0.10] rounded-full px-5 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
      />
      <OrangePillButton type="submit" size="md">
        Apply now →
      </OrangePillButton>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReferPage() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen text-white">

      {/* ── 1. Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden text-center">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center bottom, rgba(255,107,26,0.18) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            Partner Program · Open now
          </div>

          <h1 className="text-[42px] sm:text-[64px] font-semibold leading-[1.05] tracking-[-0.02em] text-white mb-6 text-balance">
            Get paid every month.{" "}
            <span className="italic text-brand-orange" style={{ fontFamily: "Georgia, serif" }}>
              Forever.
            </span>
          </h1>

          <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Refer a business to Alphaa and earn{" "}
            <span className="text-white font-semibold">30% recurring commission</span> for as long as
            they're a customer.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            {[
              { value: "30% recurring", sub: "commission rate" },
              { value: "Up to $716/year", sub: "per Pro referral" },
            ].map((s) => (
              <div
                key={s.value}
                className="bg-brand-orange/10 border border-brand-orange/25 rounded-2xl px-7 py-4 text-center"
              >
                <div className="text-brand-orange font-bold text-2xl sm:text-3xl leading-none">
                  {s.value}
                </div>
                <div className="text-white/40 text-xs mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          <OrangePillButton href="#apply" size="lg">
            Apply to be a partner →
          </OrangePillButton>

          <p className="text-white/30 text-xs mt-4">
            Instant access · No approval wait · 47 partners already earning
          </p>
        </div>
      </section>

      {/* ── 2. Earnings Calculator ──────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              How much will you earn?
            </h2>
            <p className="text-white/50">Drag the slider and see your numbers in real time.</p>
          </div>
          <EarningsCalculator />
        </div>
      </section>

      {/* ── 3. How It Works ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Three steps. That's it.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Apply",
                desc: "Takes 2 minutes. No approval wait — you get instant access to your partner dashboard the moment you apply.",
              },
              {
                step: "02",
                title: "Share your link",
                desc: "Custom tracking link, real-time referral dashboard, and all marketing materials provided. We make it easy to share.",
              },
              {
                step: "03",
                title: "Get paid",
                desc: "Monthly payouts via Stripe. 60-day cookie window. Commissions stack on annual plans. No minimums beyond $50.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 text-[80px] font-black leading-none text-white/[0.03] select-none pointer-events-none"
                  aria-hidden="true"
                >
                  {s.step}
                </div>
                <div className="text-brand-orange font-bold text-xs uppercase tracking-widest mb-3">
                  Step {s.step}
                </div>
                <h3 className="text-white font-semibold text-xl mb-3">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. What You Earn ────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Exact numbers, no guessing
            </h2>
            <p className="text-white/50">30% on everything. Every month.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/[0.08]">
                  {["Plan", "Price", "Your cut/mo", "Your cut/year"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-white/40 font-medium text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { plan: "Starter Monthly", price: "$99/mo", cut: "$29.70/mo", year: "$356.40/yr" },
                  { plan: "Starter Annual", price: "$990/yr", cut: "$297 one-time", year: "—" },
                  { plan: "Pro Monthly", price: "$199/mo", cut: "$59.70/mo", year: "$716.40/yr", highlight: true },
                  { plan: "Pro Annual", price: "$1,990/yr", cut: "$597 one-time", year: "—" },
                ].map((row, i) => (
                  <tr
                    key={row.plan}
                    className={`border-b border-white/[0.05] last:border-0 ${
                      row.highlight ? "bg-brand-orange/[0.04]" : i % 2 === 0 ? "" : "bg-white/[0.01]"
                    }`}
                  >
                    <td className="px-5 py-4 text-white/80 font-medium">{row.plan}</td>
                    <td className="px-5 py-4 text-white/50">{row.price}</td>
                    <td className="px-5 py-4 text-brand-orange font-semibold">{row.cut}</td>
                    <td className="px-5 py-4 text-brand-orange font-semibold">{row.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-white/30 text-xs text-center mt-4">
            Annual plan commissions are paid upfront in full — no waiting 12 months.
          </p>
        </div>
      </section>

      {/* ── 5. Who This Is For ──────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Built for people with the right audience
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "💻",
                title: "Web designers & freelancers",
                desc: "You build the site, we make it visible on AI. Perfect upsell — add Alphaa to every project and earn recurring revenue on work you've already done.",
              },
              {
                icon: "📊",
                title: "Marketing consultants",
                desc: "Add AI visibility to your service stack. White-label available. Offer it as a premium add-on to every client — local shop or online brand.",
              },
              {
                icon: "🎙️",
                title: "Content creators & bloggers",
                desc: "If your audience includes business owners — local or online — this converts. Write one honest review and earn for months.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7"
              >
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-3">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Requirements ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold mb-6">What you need</h2>
              <ul className="space-y-3 text-white/60 text-sm">
                {[
                  "An audience that includes business owners (local or online) OR direct relationships with companies that want to be found",
                  "A Stripe-connected account (US, Canada, UK, EU supported)",
                  "Minimum payout balance of $50",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-6">What we handle</h2>
              <ul className="space-y-3 text-white/60 text-sm">
                {[
                  "No upfront costs, no inventory, no hassle",
                  "Billing and subscription management",
                  "Customer onboarding and support",
                  "All customer success — you never touch a support ticket",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Social Proof ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-14 text-center">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="text-brand-orange font-bold text-4xl">47</div>
              <div className="text-white/40 text-xs mt-1">active partners</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="text-brand-orange font-bold text-4xl">$840</div>
              <div className="text-white/40 text-xs mt-1">avg. partner earnings/mo after 6 months</div>
            </div>
          </div>

          {/* Quote */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 max-w-2xl mx-auto text-center">
            <p className="text-white/80 text-lg leading-relaxed italic mb-6">
              "I added Alphaa as an upsell to every new website I build. Made{" "}
              <span className="text-brand-orange font-semibold not-italic">$2,400 last month</span>{" "}
              without doing anything extra."
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-semibold text-sm">
                J
              </div>
              <div className="text-left">
                <div className="text-white text-sm font-medium">Jason M.</div>
                <div className="text-white/40 text-xs">Web designer · Partner since Jan 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-semibold tracking-tight mb-10 text-center">
            Common questions
          </h2>
          <div>
            {[
              {
                q: "When do I get paid?",
                a: "Payouts are monthly, NET-30, via Stripe. So commissions earned in May are paid out by the end of June. You'll get an email when a payout lands.",
              },
              {
                q: "What if a customer cancels?",
                a: "Your commission stops when they cancel — no recurring payments for lapsed customers. But there are no clawbacks either. If they paid, you earned it.",
              },
              {
                q: "Is there a cap on earnings?",
                a: "No cap, ever. Refer 5 customers or 500 — the 30% rate applies to every single one for as long as they stay subscribed.",
              },
              {
                q: "Can I refer myself?",
                a: "No. Self-referrals are not eligible and will be removed from the program. The program is for genuine third-party referrals only.",
              },
              {
                q: "Do commissions stack on upgrades?",
                a: "Yes. If a referral upgrades from Starter to Pro, your commission automatically adjusts to 30% of the new, higher amount. No action needed on your end.",
              },
            ].map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Bottom CTA ───────────────────────────────────────── */}
      <section
        id="apply"
        className="py-24 px-4 sm:px-6 border-t border-white/[0.06] relative overflow-hidden"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(255,107,26,0.14) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
            Start earning today
          </h2>
          <p className="text-white/50 mb-8">
            Apply in 2 minutes. Get your link the same day.
          </p>

          <ApplyForm />

          <p className="text-white/25 text-xs mt-5">
            Instant access · No approval wait · 47 partners already earning
          </p>
        </div>
      </section>
    </main>
  )
}
