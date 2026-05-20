import { GlassCard } from "@/components/common/GlassCard"

export const metadata = { title: "AI Visibility" }

const engines = [
  { name: "ChatGPT", icon: "🤖", status: "Tracking", queries: 12, citations: 1 },
  { name: "Perplexity", icon: "🔍", status: "Not appearing", queries: 8, citations: 0 },
  { name: "Google AI", icon: "🌐", status: "Occasionally", queries: 24, citations: 3 },
  { name: "Gemini", icon: "✨", status: "Not appearing", queries: 6, citations: 0 },
]

export default function VisibilityPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-white font-semibold text-2xl">AI Visibility</h1>
        <p className="text-muted text-sm mt-0.5">Where your business shows up when people search on AI tools.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {engines.map((e) => (
          <GlassCard key={e.name}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{e.icon}</span>
              <div>
                <h3 className="text-white font-medium">{e.name}</h3>
                <span className={`text-xs font-medium ${e.citations > 0 ? "text-green-400" : "text-red-400"}`}>{e.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-tertiary rounded-xl p-3">
                <p className="text-white font-medium text-lg mono">{e.queries}</p>
                <p className="text-muted text-xs">Queries tracked</p>
              </div>
              <div className="bg-bg-tertiary rounded-xl p-3">
                <p className={`font-medium text-lg mono ${e.citations > 0 ? "text-green-400" : "text-white"}`}>{e.citations}</p>
                <p className="text-muted text-xs">Citations found</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h2 className="text-white font-medium mb-3">What we&apos;re tracking</h2>
        <p className="text-muted text-sm leading-relaxed">
          Alphaa queries ChatGPT, Perplexity, Google AI, and Gemini weekly with searches relevant to your business and city. We track whether your business appears in responses.
        </p>
      </GlassCard>
    </div>
  )
}
