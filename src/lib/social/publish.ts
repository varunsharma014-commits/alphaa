// Publish one queued post to every account it targets, record each result, and log it.
import { db } from "@/lib/db"
import { imageUrl } from "@/lib/images"
import { countUsage } from "@/lib/usage"
import { getPost, listAccounts, patchAccount, savePost } from "./store"
import { meta } from "./providers/meta"
import { linkedin } from "./providers/linkedin"
import { tiktok } from "./providers/tiktok"
import { x } from "./providers/x"
import { PLATFORM_NAME, type Provider, type PostResult, type SocialPlatform, type SocialPost } from "./types"

export const providerFor = (p: SocialPlatform): Provider => (p === "facebook" || p === "instagram" ? meta : p === "linkedin" ? linkedin : p === "tiktok" ? tiktok : x)

export async function publishPost(userId: string, postId: string): Promise<SocialPost | null> {
  const post = await getPost(userId, postId)
  if (!post || post.status === "publishing" || post.status === "published") return post
  post.status = "publishing"
  await savePost(userId, post)

  let bytes: Buffer | null = null
  if (post.imageId) {
    const img = await db.mockActivity.findFirst({ where: { id: post.imageId, userId, type: "post_image" }, select: { metadata: true } })
    const b64 = (img?.metadata as { b64?: string } | null)?.b64
    bytes = b64 ? Buffer.from(b64, "base64") : null
  }
  const input = { text: post.text, imageUrl: bytes && post.imageId ? imageUrl(post.imageId) : null, imageBytes: bytes, title: post.title ?? null }
  const accounts = await listAccounts(userId)
  const done = new Map((post.results ?? []).filter((r) => r.ok).map((r) => [r.accountId, r]))
  const results: PostResult[] = []
  for (const id of post.accountIds) {
    if (done.has(id)) { results.push(done.get(id)!); continue } // retry only what failed
    const acc = accounts.find((a) => a.id === id)
    if (!acc) { results.push({ accountId: id, platform: "facebook", ok: false, error: "That account was disconnected." }); continue }
    try {
      const r = await providerFor(acc.platform).publish(acc, input, (patch) => patchAccount(userId, acc.id, patch))
      results.push({ accountId: id, platform: acc.platform, ok: true, url: r.url, externalId: r.externalId })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/expired|reconnect|invalid.*token|OAuthException/i.test(msg)) await patchAccount(userId, acc.id, { status: "expired" })
      results.push({ accountId: id, platform: acc.platform, ok: false, error: msg.slice(0, 240) })
    }
  }
  const ok = results.filter((r) => r.ok).length
  post.results = results
  post.status = ok === results.length && ok > 0 ? "published" : ok > 0 ? "partial" : "failed"
  if (ok) post.publishedAt = new Date().toISOString()
  await savePost(userId, post)
  for (const r of results) if (r.ok) countUsage(userId, `posted_${r.platform}`)
  if (ok) {
    const where = Array.from(new Set(results.filter((r) => r.ok).map((r) => PLATFORM_NAME[r.platform])))
    await db.mockActivity.create({ data: { userId, type: "social_published", title: `Posted to ${where.join(", ")}`, metadata: { postId, url: results.find((r) => r.ok && r.url)?.url ?? null, platforms: where } } })
  }
  return post
}
