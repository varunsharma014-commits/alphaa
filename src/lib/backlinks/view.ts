// Research → "Who links to you vs competitors": the newest snapshot (lib/backlinks/run.ts) shaped
// for the page, plus suggested actions from the link gap. Actions are suggestions only: "Help me
// ask" opens the chat with the facts; Alphaa never emails anyone.
import type { User } from "@prisma/client"
import { latestBacklinks, backlinksFor, type BacklinkSnapshot } from "./run"

export type LinkAction = { domain: string; kindLabel: string; linksTo: string[]; text: string; ask: string }
export type BacklinksView = {
  scope: "own" | "full" | null
  snapshot: BacklinkSnapshot | null
  actions: LinkAction[]
  canRefresh: boolean
}

const list = (xs: string[]) => (xs.length <= 1 ? xs[0] ?? "" : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)

export function actionsFrom(s: BacklinkSnapshot | null, max = 5): LinkAction[] {
  return (s?.gap ?? []).slice(0, max).map((g) => ({
    domain: g.domain,
    kindLabel: g.kindLabel,
    linksTo: g.linksTo,
    text: `${g.domain} links to ${list(g.linksTo)}, not to you.`,
    ask: `${g.domain} links to ${list(g.linksTo)} but not to my site. Look at what kind of site it is and help me work out what I could offer them so they’d link to me too. Don’t contact them, just give me the plan and a short note I could send myself.`,
  }))
}

export async function backlinksView(user: User): Promise<BacklinksView> {
  const snap = await latestBacklinks(user.id).catch(() => null)
  const scope = backlinksFor(user)
  const last = snap ? Date.parse(snap.at) : 0
  return { scope, snapshot: snap, actions: scope === "full" ? actionsFrom(snap) : [], canRefresh: !!scope && Date.now() - last > 20 * 3_600_000 }
}
