import { GlassCard } from "@/components/common/GlassCard"
import { Check, Link2 } from "lucide-react"

const integrations = [
  { name: "Google Business Profile", description: "Post updates, respond to reviews, track performance.", icon: "🗺️", connected: true },
  { name: "Google Search Console", description: "Track keyword rankings and crawl status.", icon: "📊", connected: false },
  { name: "Google Analytics", description: "Monitor traffic from your content and profile.", icon: "📈", connected: false },
  { name: "Website snippet", description: "Inject structured data and tracking on any website.", icon: "🔧", connected: false },
]

export const metadata = { title: "Integrations" }

export default function IntegrationsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-white font-semibold text-2xl">Integrations</h1>
      <div className="space-y-3">
        {integrations.map((intg) => (
          <GlassCard key={intg.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{intg.icon}</span>
              <div>
                <h3 className="text-white font-medium text-sm">{intg.name}</h3>
                <p className="text-muted text-xs">{intg.description}</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {intg.connected ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs font-medium">Connected</span>
                </div>
              ) : (
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-muted hover:text-white hover:border-white/30 text-xs font-medium transition-colors">
                  <Link2 className="w-3 h-3" />
                  Connect
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
