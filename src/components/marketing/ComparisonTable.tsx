import { SectionLabel } from "@/components/common/SectionLabel"
import { Check, X, Minus } from "lucide-react"

const rows = [
  {
    feature: "Monthly cost",
    alphaa: "$99–$199",
    agency: "$500–$2,000",
    diy: "Your time",
  },
  {
    feature: "Contract required",
    alphaa: false,
    agency: true,
    diy: false,
  },
  {
    feature: "Shows up on ChatGPT & AI search",
    alphaa: true,
    agency: "maybe",
    diy: "maybe",
  },
  {
    feature: "Google Business Profile posting",
    alphaa: "4x/week",
    agency: "varies",
    diy: "if you remember",
  },
  {
    feature: "Time to set up",
    alphaa: "2 minutes",
    agency: "2–4 weeks",
    diy: "ongoing",
  },
  {
    feature: "Transparent reporting",
    alphaa: true,
    agency: false,
    diy: true,
  },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-green-400 mx-auto" />
  if (value === false) return <X className="w-4 h-4 text-red-400 mx-auto" />
  if (value === "maybe") return <Minus className="w-4 h-4 text-muted mx-auto" />
  return <span className="text-white text-sm">{value}</span>
}

export function ComparisonTable() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel className="mb-3 block">Why Alphaa</SectionLabel>
          <h2 className="text-section-mobile md:text-section font-semibold text-white text-balance">
            Alphaa vs.{" "}
            <span className="serif-italic text-brand-orange">the alternatives</span>
          </h2>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left p-4 text-muted text-sm font-medium">Feature</th>
                <th className="p-4 text-center">
                  <span className="text-brand-orange font-semibold text-sm">Alphaa</span>
                </th>
                <th className="p-4 text-center text-muted text-sm font-medium">SEO Agency</th>
                <th className="p-4 text-center text-muted text-sm font-medium">DIY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-white/[0.06] last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                >
                  <td className="p-4 text-white/80 text-sm">{row.feature}</td>
                  <td className="p-4 text-center bg-brand-orange/5">
                    <Cell value={row.alphaa} />
                  </td>
                  <td className="p-4 text-center">
                    <Cell value={row.agency} />
                  </td>
                  <td className="p-4 text-center">
                    <Cell value={row.diy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
