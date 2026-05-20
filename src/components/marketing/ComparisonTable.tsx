import { Check, X, Minus } from "lucide-react"

const rows = [
  { feature: "Monthly cost",              alphaa: "$99–$199",   agency: "$500–$2,000",  diy: "Your time" },
  { feature: "Optimizes for ChatGPT",     alphaa: true,         agency: false,          diy: false },
  { feature: "Optimizes for Claude",      alphaa: true,         agency: false,          diy: false },
  { feature: "Optimizes for Gemini",      alphaa: true,         agency: false,          diy: false },
  { feature: "Optimizes for Perplexity",  alphaa: true,         agency: false,          diy: false },
  { feature: "Google Business posting",   alphaa: "4x/week",    agency: "varies",       diy: "if you remember" },
  { feature: "Long-term contract",        alphaa: false,        agency: true,           diy: false },
  { feature: "PDF reports you can't read",alphaa: false,        agency: true,           diy: false },
  { feature: "Transparent results",       alphaa: true,         agency: false,          diy: true },
  { feature: "Setup time",                alphaa: "2 minutes",  agency: "2–4 weeks",    diy: "ongoing" },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-green-400 mx-auto" />
  if (value === false) return <X className="w-4 h-4 text-red-400/60 mx-auto" />
  if (value === "maybe") return <Minus className="w-4 h-4 text-white/30 mx-auto" />
  return <span className="text-white/80 text-sm">{value}</span>
}

export function ComparisonTable() {
  return (
    <section className="py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-6 text-center">
          The honest comparison
        </p>
        <h2 className="text-[36px] sm:text-[52px] font-semibold text-white leading-[1.1] tracking-tight text-center mb-16 text-balance">
          Alphaa vs. an SEO agency
          <br />
          <span className="text-white/40">vs. doing it yourself</span>
        </h2>

        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wide">Feature</th>
                <th className="p-4 text-center bg-brand-orange/5 border-x border-brand-orange/10">
                  <span className="text-brand-orange font-bold text-sm">Alphaa</span>
                </th>
                <th className="p-4 text-center text-white/40 text-xs font-medium uppercase tracking-wide">SEO Agency</th>
                <th className="p-4 text-center text-white/40 text-xs font-medium uppercase tracking-wide">DIY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} className={`border-b border-white/[0.05] last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                  <td className="p-4 text-white/60 text-sm">{row.feature}</td>
                  <td className="p-4 text-center bg-brand-orange/[0.03] border-x border-brand-orange/10">
                    <Cell value={row.alphaa} />
                  </td>
                  <td className="p-4 text-center"><Cell value={row.agency} /></td>
                  <td className="p-4 text-center"><Cell value={row.diy} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
