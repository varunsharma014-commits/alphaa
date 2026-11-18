import type { User } from "@prisma/client"
import { hasPro } from "@/lib/billing"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { listAccounts, listPosts } from "./store"
import { socialMessages } from "@/lib/agent/social-narration"

export async function socialThread(user: User, note?: string | null) {
  const [accounts, posts] = await Promise.all([listAccounts(user.id), listPosts(user.id)])
  return socialMessages({ growth: hasPro(user), accounts, posts, note })
}

/** The thread as opened from the menu: shows (and clears) the result of the last connect. */
export async function socialThreadFor(user: User) {
  const s = await getAgentSettings(user.id)
  if (s.socialNote) await saveAgentSettings(user.id, { socialNote: undefined })
  return socialThread(user, s.socialNote ?? null)
}
