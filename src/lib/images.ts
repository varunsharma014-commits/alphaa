// Signed public URLs for post images (MockActivity "post_image" rows, served by /api/img/[id]),
// so WordPress, Shopify, Webflow and Wix can fetch them. Blog covers are made by lib/blog-cover.ts
// in the owner's image style.
import { createHmac } from "crypto"

function secret(): string {
  return process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"
}
export const imageSig = (id: string) => createHmac("sha256", secret()).update(`img:${id}`).digest("hex").slice(0, 24)
export const imageUrl = (id: string) => `${process.env.NEXT_PUBLIC_APP_URL ?? "https://alphaa.app"}/api/img/${id}.jpg?s=${imageSig(id)}` // ".jpg": WordPress only sideloads URLs that look like images

/**
 * Deprecated name kept for callers in other branches: a blog cover now follows the owner's image
 * style (lib/blog-cover.ts; text card by default, an AI picture only when they opted in).
 */
export async function generatePostImage(userId: string, input: { title: string; businessType?: string | null; city?: string | null; topic?: string | null }): Promise<{ id: string; url: string; alt: string } | null> {
  const { blogCoverFor } = await import("@/lib/blog-cover")
  return blogCoverFor(userId, { title: input.title, topic: input.topic }).catch((err) => {
    console.error("[images]", err instanceof Error ? err.message : err)
    return null
  })
}
