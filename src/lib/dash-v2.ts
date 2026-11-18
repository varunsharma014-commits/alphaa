// Dashboard v2 (grouped, colour-coded rail + one focus card at a time) is behind a flag
// until it has been reviewed on prod. On for: founders / comp-access logins, everyone when
// DASH_V2=1, or one brand with agent setting `dashV2: true`. Everyone else keeps v1.
import { isComped } from "@/lib/billing"
import type { AgentSettings } from "@/lib/agent/settings"

export function dashV2Enabled(user: { email: string | null }, settings?: Pick<AgentSettings, "dashV2"> | null): boolean {
  return isComped(user.email) || process.env.DASH_V2 === "1" || settings?.dashV2 === true
}
