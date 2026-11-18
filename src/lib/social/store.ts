// Storage for connected accounts and the post queue. Same pattern as the rest of the agent:
// MockActivity rows (type "social_account" / "social_post"), no schema change. Tokens are
// encrypted with the connector key (AES-256-GCM, lib/checks/bing-webmaster encryptSecret).
import { db } from "@/lib/db"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"
import type { SocialAccount, SocialPost } from "./types"

const ACC = "social_account"
const POST = "social_post"

export const enc = (s: string) => encryptSecret(s)
export const dec = (s: string) => decryptSecret(s)

export async function listAccounts(userId: string): Promise<SocialAccount[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: ACC }, orderBy: { createdAt: "asc" } })
  return rows.map((r) => ({ ...(r.metadata as Omit<SocialAccount, "id">), id: r.id }))
}

export async function getAccount(userId: string, id: string): Promise<SocialAccount | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: ACC } })
  return r ? { ...(r.metadata as Omit<SocialAccount, "id">), id: r.id } : null
}

/** Insert or refresh an account (same platform + external id = same account). */
export async function upsertAccount(userId: string, a: Omit<SocialAccount, "id" | "connectedAt" | "status">): Promise<SocialAccount> {
  const existing = (await listAccounts(userId)).find((x) => x.platform === a.platform && x.externalId === a.externalId)
  const meta = { ...a, status: "active" as const, connectedAt: existing?.connectedAt ?? new Date().toISOString() }
  if (existing) {
    await db.mockActivity.update({ where: { id: existing.id }, data: { metadata: meta as object, title: `${a.platform}: ${a.name}` } })
    return { ...meta, id: existing.id }
  }
  const row = await db.mockActivity.create({ data: { userId, type: ACC, title: `${a.platform}: ${a.name}`, metadata: meta as object } })
  return { ...meta, id: row.id }
}

export async function patchAccount(userId: string, id: string, patch: Partial<SocialAccount>): Promise<void> {
  const cur = await getAccount(userId, id)
  if (!cur) return
  const { id: _id, ...rest } = { ...cur, ...patch }
  void _id
  await db.mockActivity.update({ where: { id }, data: { metadata: rest as object } })
}

export async function removeAccount(userId: string, id: string): Promise<boolean> {
  const r = await db.mockActivity.deleteMany({ where: { id, userId, type: ACC } })
  return r.count > 0
}

export async function listPosts(userId: string, take = 30): Promise<SocialPost[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: POST }, orderBy: { createdAt: "desc" }, take })
  return rows.map((r) => ({ ...(r.metadata as Omit<SocialPost, "id">), id: r.id }))
}

export async function getPost(userId: string, id: string): Promise<SocialPost | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: POST } })
  return r ? { ...(r.metadata as Omit<SocialPost, "id">), id: r.id } : null
}

export async function createPost(userId: string, p: Omit<SocialPost, "id">): Promise<SocialPost> {
  // "Use this next" on a brand library video: the next post to Facebook / Instagram carries it.
  if (p.videoAssetId === undefined && p.accountIds.length) {
    const accs = await listAccounts(userId)
    if (accs.some((a) => p.accountIds.includes(a.id) && (a.platform === "facebook" || a.platform === "instagram"))) {
      const { takeNextVideo } = await import("@/lib/library/pick")
      const v = await takeNextVideo(userId).catch(() => null)
      if (v) p = { ...p, videoAssetId: v }
    }
  }
  const row = await db.mockActivity.create({ data: { userId, type: POST, title: p.title ? `Social post: “${p.title}”` : "Social post", metadata: p as object } })
  return { ...p, id: row.id }
}

export async function savePost(userId: string, p: SocialPost): Promise<void> {
  const { id, ...rest } = p
  await db.mockActivity.updateMany({ where: { id, userId, type: POST }, data: { metadata: rest as object } })
}

export async function deletePost(userId: string, id: string): Promise<boolean> {
  const r = await db.mockActivity.deleteMany({ where: { id, userId, type: POST } })
  return r.count > 0
}

/** Every scheduled post that's due, across all accounts (the publisher cron). */
export async function duePosts(now = new Date()): Promise<{ userId: string; post: SocialPost }[]> {
  const rows = await db.mockActivity.findMany({ where: { type: POST, metadata: { path: ["status"], equals: "scheduled" } }, take: 500 })
  return rows
    .map((r) => ({ userId: r.userId, post: { ...(r.metadata as Omit<SocialPost, "id">), id: r.id } }))
    .filter((x) => x.post.scheduledFor && Date.parse(x.post.scheduledFor) <= now.getTime())
}
