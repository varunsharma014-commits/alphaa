import { cn } from "@/lib/utils"
import type { AuditResult } from "@/types/audit"

const engines = [
  { key: "chatgpt", label: "ChatGPT", icon: "🤖" },
  { key: "perplexity", label: "Perplexity", icon: "🔍" },
  { key: "google_ai", label: "Google AI", icon: "🌐" },
  { key: "gemini", label: "Gemini", icon: "✨" },
] as const

const statusConfig = {
  not_appearing: { label: "Not appearing", color: "text-fg/50", bg: "bg-transparent" },
  occasionally: { label: "Occasionally", color: "text-fg/70", bg: "bg-fg/[0.06]" },
  frequently: { label: "Frequently", color: "text-fg", bg: "bg-fg/10" },
}

export function AiStatusGrid({ status }: { status: AuditResult["ai_search_status"] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {engines.map((engine) => {
        const s = status[engine.key]
        const cfg = statusConfig[s]
        return (
          <div key={engine.key} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{engine.icon}</span>
            <div>
              <p className="text-fg text-sm font-medium">{engine.label}</p>
              <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
