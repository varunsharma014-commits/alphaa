export const dynamic = "force-dynamic"
export const maxDuration = 180

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { agent, type Message } from "@/lib/agent/types"
import { CanvaError, canvaConfigured, designFromAsset, disconnectCanva, exportDesignJpeg, getDesign, listBrandTemplates, listDesigns, uploadAsset } from "@/lib/canva/client"
import { getCanvaAccount, saveCanvaAccount } from "@/lib/canva/store"
import { canvaMessages, designsMessage, editingMessage, pickedMessage, templatesMessage } from "@/lib/canva/narration"
import { imageSettings, saveImageSettings, storePostImage, styleSample } from "@/lib/post-images"
import { imageInfo, normalizePhoto } from "@/lib/photo-render"
import { imageUrl } from "@/lib/images"
import { getPost, listPosts, savePost } from "@/lib/social/store"

// "Use my Canva designs", "Edit in Canva" / "Bring it back", brand templates, disconnect.
// Every answer is { messages }; the Canva panel ("vc-canva") redraws in place.
const id = z.string().trim().min(3).max(80).regex(/^[\w-]+$/)
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("designs") }),
  z.object({ op: z.literal("use"), id }),
  z.object({ op: z.literal("attach"), imageId: id, postId: id }),
  z.object({ op: z.literal("next"), imageId: id }),
  z.object({ op: z.literal("edit"), postId: id.optional() }),
  z.object({ op: z.literal("back") }),
  z.object({ op: z.literal("templates") }),
  z.object({ op: z.literal("template"), id }),
  z.object({ op: z.literal("disconnect") }),
])

async function panel(userId: string, note?: string): Promise<Message[]> {
  const [acc, s] = await Promise.all([getCanvaAccount(userId), imageSettings(userId)])
  return canvaMessages(acc, { growth: true, templates: !!acc?.templates, template: s.canvaTemplate?.title ?? null, note: note ?? null })
}
const said = (text: string) => agent([{ kind: "text", text }])
const draftPosts = async (userId: string) => (await listPosts(userId)).filter((p) => p.status === "draft" || p.status === "scheduled").map((p) => ({ id: p.id, title: p.title || p.text.slice(0, 50), imageId: p.imageId ?? null }))

async function postImageBytes(userId: string, imageId: string): Promise<Buffer | null> {
  const r = await db.mockActivity.findFirst({ where: { id: imageId, userId, type: "post_image" }, select: { metadata: true } })
  const m = r?.metadata as { b64?: string } | null
  return m?.b64 ? Buffer.from(m.b64, "base64") : null
}

/** Export a Canva design and keep it as a post image. */
async function keepDesign(userId: string, designId: string, title: string) {
  const raw = await exportDesignJpeg(userId, designId)
  const clean = await normalizePhoto(raw, 1350)
  if (!clean) throw new CanvaError("bad_image", "Canva sent a picture I couldn’t read. Try again.")
  return { ...(await storePostImage(userId, clean.jpeg, title, "canva_design")), title }
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canvaConfigured()) return NextResponse.json({ messages: [] })
  return NextResponse.json({ messages: canvaMessages(await getCanvaAccount(user.id), { growth: hasPro(user), templates: false, template: null }) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canvaConfigured()) return NextResponse.json({ error: "Canva is coming soon." }, { status: 404 })
  if (!hasPro(user)) return NextResponse.json({ error: "Canva comes with the Pro plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const uid = user.id

  if (input.op === "disconnect") {
    await disconnectCanva(uid)
    const s = await imageSettings(uid)
    if (s.style === "canva") await saveImageSettings(uid, { style: "card", canvaTemplate: null })
    return NextResponse.json({ messages: [said("Disconnected. I won’t touch your Canva any more."), ...(await panel(uid))] })
  }
  const acc = await getCanvaAccount(uid)
  if (!acc) return NextResponse.json({ messages: await panel(uid) })

  try {
    if (input.op === "designs") {
      return NextResponse.json({ messages: [designsMessage(await listDesigns(uid))] })
    }
    if (input.op === "use") {
      const d = await getDesign(uid, input.id)
      const img = await keepDesign(uid, input.id, d?.title ?? "Your Canva design")
      const drafts = await draftPosts(uid)
      return NextResponse.json({ messages: [pickedMessage(img, drafts, drafts.length ? "Here it is. Which post should it go on?" : "Here it is. I’ll use it on your next social post.")] })
    }
    if (input.op === "attach") {
      const [p, ok] = await Promise.all([getPost(uid, input.postId), db.mockActivity.count({ where: { id: input.imageId, userId: uid, type: "post_image" } })])
      if (!p || !ok) return NextResponse.json({ error: "That post or picture isn’t here any more." }, { status: 404 })
      if (p.status !== "draft" && p.status !== "scheduled") return NextResponse.json({ error: "That post already went out." }, { status: 409 })
      await savePost(uid, { ...p, imageId: input.imageId })
      return NextResponse.json({ messages: [agent([{ kind: "text", text: `Done. “${p.title || "Your post"}” uses your Canva picture now.` }, { kind: "doc", title: p.title || "Your post", text: p.text, image: imageUrl(input.imageId) }], "cv-picked")] })
    }
    if (input.op === "next") {
      const ok = await db.mockActivity.count({ where: { id: input.imageId, userId: uid, type: "post_image" } })
      if (!ok) return NextResponse.json({ error: "That picture isn’t here any more." }, { status: 404 })
      const s = await imageSettings(uid)
      await saveImageSettings(uid, { canvaNext: Array.from(new Set([...(s.canvaNext ?? []), input.imageId])).slice(-10) })
      return NextResponse.json({ messages: [agent([{ kind: "text", text: "Saved. Your next social post uses it." }], "cv-picked")] })
    }
    if (input.op === "edit") {
      // The picture to edit: that post's, else the next draft's, else a sample in their style.
      const drafts = await draftPosts(uid)
      const post = input.postId ? drafts.find((p) => p.id === input.postId) : drafts.find((p) => p.imageId)
      const s = await imageSettings(uid)
      const imageId = post?.imageId ?? (await styleSample(uid, s.style === "canva" ? "card" : s.style).catch(() => null)) ?? (await styleSample(uid, "card"))
      const bytes = imageId ? await postImageBytes(uid, imageId) : null
      if (!bytes) return NextResponse.json({ error: "I don’t have an image to send yet. Run your week first, or pick a style above." }, { status: 409 })
      const info = imageInfo(bytes)
      const title = (post?.title || "Social post").slice(0, 50)
      const asset = await uploadAsset(uid, bytes, title)
      const d = await designFromAsset(uid, asset, title, { w: info.w || 1080, h: info.h || 1080 })
      if (!d.editUrl) throw new CanvaError("no_url", "Canva didn’t give me a link to open it.")
      await saveCanvaAccount(uid, { editing: { designId: d.id, editUrl: d.editUrl, title, at: new Date().toISOString(), postId: post?.id ?? null } })
      return NextResponse.json({ messages: [editingMessage({ title, editUrl: d.editUrl }), ...(await panel(uid))] })
    }
    if (input.op === "back") {
      const e = acc.editing
      if (!e) return NextResponse.json({ error: "There’s nothing open in Canva right now." }, { status: 409 })
      const img = await keepDesign(uid, e.designId, e.title)
      await saveCanvaAccount(uid, { editing: null })
      const post = e.postId ? await getPost(uid, e.postId) : null
      if (post && (post.status === "draft" || post.status === "scheduled")) {
        await savePost(uid, { ...post, imageId: img.id })
        return NextResponse.json({ messages: [agent([{ kind: "text", text: `Got it back from Canva. “${post.title || "Your post"}” uses your edited picture now.` }, { kind: "doc", title: post.title || "Your post", text: post.text, image: img.url }], "cv-editing"), ...(await panel(uid))] })
      }
      const drafts = await draftPosts(uid)
      return NextResponse.json({ messages: [pickedMessage(img, drafts, "Got it back from Canva. Where should it go?"), ...(await panel(uid))] })
    }
    if (input.op === "templates") {
      const s = await imageSettings(uid)
      return NextResponse.json({ messages: [templatesMessage(await listBrandTemplates(uid), s.canvaTemplate?.id ?? null)] })
    }
    // template
    const t = (await listBrandTemplates(uid, 20)).find((x) => x.id === input.id)
    if (!t?.textField) return NextResponse.json({ error: "I can’t fill that template any more." }, { status: 404 })
    const s = await imageSettings(uid)
    await saveImageSettings(uid, { style: "canva", canvaTemplate: { id: t.id, title: t.title, textField: t.textField, imageField: t.imageField }, samples: { ...(s.samples ?? {}), canva: null } })
    const sample = await styleSample(uid, "canva", { force: true })
    const { imagesMessages } = await import("@/lib/agent/images-panel")
    return NextResponse.json({ messages: [said(sample ? `Done. Your posts use “${t.title}” from now on.` : `Saved “${t.title}”. Canva didn’t fill it just now; I’ll try again on your next post and use your text card if it still can’t.`), ...(await imagesMessages(uid, { growth: true }))] })
  } catch (err) {
    const msg = err instanceof CanvaError ? err.message : "Canva didn’t answer. Try again in a minute."
    console.error("[agent/canva]", input.op, err instanceof Error ? err.message : err)
    if (err instanceof CanvaError && err.code === "expired") return NextResponse.json({ messages: [said(msg), ...(await panel(uid))] })
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
