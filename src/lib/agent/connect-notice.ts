import { agent, type Message } from "@/lib/agent/types"
import { PLATFORM_NAME as NAMES, platformPickerBlocks } from "@/lib/connector/platforms"
import { platformAvailability } from "@/lib/connector/availability"

const PLATFORM_NAME: Record<string, string> = NAMES

// Result of a website-connect round trip (?connected=… / ?connect_error=… / ?connect=<platform>-unavailable),
// or a request to start one (?connect=pick from Settings → Website connection).
export function connectMessage(q: Record<string, string | string[] | undefined>): Message | null {
  const one = (k: string) => (Array.isArray(q[k]) ? q[k]![0] : q[k]) as string | undefined
  const ok = one("connected"), err = one("connect_error"), na = one("connect")
  if (ok) return agent([{ kind: "text", text: `I’m connected to your ${PLATFORM_NAME[ok] ?? ok} site. ✓`, big: true }, { kind: "text", text: "From now on, when you approve a post or page, I publish it there myself — and every change has an Undo." }], "connect-result")
  if (err) return agent([{ kind: "text", text: `That didn’t connect: ${err.slice(0, 300)}` }, { kind: "chips", items: [{ label: "Try again", action: { type: "wp-connect" }, primary: true }] }], "connect-result")
  if (na === "pick") return agent(platformPickerBlocks(platformAvailability(), "Which website builder is your site on? Pick it and I’ll connect it."), "connect-result")
  if (na === "wordpress") return agent([{ kind: "text", text: "Let’s connect your WordPress site." }, { kind: "chips", items: [{ label: "Show me how", action: { type: "wp-connect", direct: true }, primary: true }] }], "connect-result")
  if (na?.endsWith("-unavailable")) return agent([{ kind: "text", text: `Connecting ${PLATFORM_NAME[na.replace("-unavailable", "")] ?? "that platform"} is coming soon. In the meantime I’ll email your web person exactly what to change, or our team can do it.` }], "connect-result")
  return null
}

