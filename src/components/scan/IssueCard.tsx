import { AlertCircle, AlertTriangle, Info, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuditIssue } from "@/types/audit"

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Critical" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Warning" },
  improvement: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Improvement" },
}

export function IssueCard({ issue }: { issue: AuditIssue }) {
  const cfg = severityConfig[issue.severity]
  const Icon = cfg.icon

  return (
    <div className={cn("glass-card rounded-xl p-5 border", cfg.border)}>
      <div className="flex items-start gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
          <Icon className={cn("w-4 h-4", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-medium uppercase tracking-wide", cfg.color)}>{cfg.label}</span>
          </div>
          <h3 className="text-white font-medium text-sm mb-1">{issue.headline}</h3>
          <p className="text-muted text-sm leading-relaxed mb-3">{issue.explanation}</p>
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Sparkles className="w-3 h-3" />
            <span>{issue.fix_summary}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
